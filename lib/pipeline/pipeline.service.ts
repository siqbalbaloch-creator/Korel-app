import "server-only";
import { prisma } from "@/lib/prisma";
import { openai } from "@/lib/openai";
import { logger } from "@/lib/logger";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PipelineRunSummary = {
  retried: number;
  emailsFound: number;
};

export type CreateLeadFromPackOptions = {
  transcript: string;
  packId: string;
  videoTitle?: string;
  youtubeUrl?: string;
  linkedinPost: string;
  twitterPost: string;
  newsletter: string;
};

type RevenueStage = "pre-revenue" | "early" | "growing" | "scaled";

type FounderInfo = {
  firstName: string;
  lastName: string;
  company: string;
  interviewTopic: string;
  specificMoment: string;
  isFounderInterview: boolean;
  monthlyRevenue: number | null;
  revenueStage: RevenueStage;
};

type EmailResult = {
  email: string | null;
  confidence: number;
  source: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const YOUTUBE_VIDEO_ID_RE =
  /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

// ─── Source 1: YouTube channel description ────────────────────────────────────

async function scrapeYouTubeChannelEmail(videoId: string): Promise<string | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  try {
    const videoRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${apiKey}`,
    );
    if (!videoRes.ok) return null;
    const videoData = (await videoRes.json()) as {
      items?: { snippet?: { channelId?: string } }[];
    };
    const channelId = videoData.items?.[0]?.snippet?.channelId;
    if (!channelId) return null;

    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?id=${channelId}&part=snippet&key=${apiKey}`,
    );
    if (!channelRes.ok) return null;
    const channelData = (await channelRes.json()) as {
      items?: { snippet?: { description?: string } }[];
    };
    const description = channelData.items?.[0]?.snippet?.description ?? "";

    const match = description.match(EMAIL_RE);
    return match ? match[0] : null;
  } catch {
    return null;
  }
}

// ─── Source 2a: Infer website URL from company name ──────────────────────────

async function inferWebsiteUrl(company: string): Promise<string | null> {
  // If company looks like a domain (contains a dot), try it directly first
  const looksLikeDomain = /^[a-z0-9]([a-z0-9\-]*\.)+[a-z]{2,}$/i.test(company.trim());
  if (looksLikeDomain) {
    const directUrl = `https://${company.trim().toLowerCase()}`;
    try {
      const res = await fetch(directUrl, {
        method: "HEAD",
        signal: AbortSignal.timeout(3000),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Korel/1.0)" },
      });
      if (res.ok || res.status === 405) return directUrl;
    } catch {
      // fall through to slug candidates
    }
  }

  const slug = company.toLowerCase().replace(/[^a-z0-9]/g, "");
  const candidates = [
    `https://${slug}.com`,
    `https://${slug}.io`,
    `https://${slug}.co`,
    `https://www.${slug}.com`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: "HEAD",
        signal: AbortSignal.timeout(3000),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Korel/1.0)" },
      });
      if (res.ok || res.status === 405) return url;
    } catch {
      // try next
    }
  }
  return null;
}

// ─── Source 2b: Scrape website contact/about pages ───────────────────────────

const INVALID_EMAIL_FRAGMENTS = [
  "noreply",
  "no-reply",
  "@example.com",
  "test@",
  "@sentry.io",
  "support@github",
  "@wixpress",
];

async function scrapeWebsiteEmail(websiteUrl: string): Promise<string | null> {
  const base = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`;
  const pagesToCheck = [
    base,
    `${base}/contact`,
    `${base}/about`,
    `${base}/contact-us`,
    `${base}/about-us`,
  ];

  const isValidEmail = (email: string) =>
    !INVALID_EMAIL_FRAGMENTS.some((f) => email.toLowerCase().includes(f));

  for (const url of pagesToCheck) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Korel/1.0)" },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) continue;
      const html = await res.text();
      const cleaned = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
      const emails = cleaned.match(EMAIL_RE) ?? [];
      const valid = emails.filter(isValidEmail);
      if (valid.length > 0) return valid[0];
    } catch {
      // timeout or error — try next page
    }
  }
  return null;
}

// ─── Source 3: Apollo.io ─────────────────────────────────────────────────────

async function findEmailApollo(
  firstName: string,
  lastName: string,
  company: string,
): Promise<{ email: string | null; confidence: number }> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) return { email: null, confidence: 0 };

  try {
    const res = await fetch("https://api.apollo.io/v1/people/match", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName || "",
        organization_name: company,
        api_key: apiKey,
        reveal_personal_emails: true,
      }),
    });
    if (!res.ok) return { email: null, confidence: 0 };
    const data = (await res.json()) as { person?: { email?: string } };
    const email = data.person?.email ?? null;
    return { email, confidence: email ? 85 : 0 };
  } catch {
    return { email: null, confidence: 0 };
  }
}

// ─── Source 4: Hunter.io ─────────────────────────────────────────────────────

async function findEmailHunter(
  firstName: string,
  lastName: string,
  company: string,
): Promise<{ email: string | null; confidence: number }> {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) return { email: null, confidence: 0 };

  try {
    const domainRes = await fetch(
      `https://api.hunter.io/v2/domain-search?company=${encodeURIComponent(company)}&api_key=${apiKey}&limit=1`,
    );
    if (!domainRes.ok) return { email: null, confidence: 0 };
    const domainData = (await domainRes.json()) as { data?: { domain?: string } };
    const domain = domainData.data?.domain;
    if (!domain) return { email: null, confidence: 0 };

    await sleep(1000);

    const params = new URLSearchParams({
      domain,
      first_name: firstName,
      last_name: lastName,
      api_key: apiKey,
    });
    const emailRes = await fetch(`https://api.hunter.io/v2/email-finder?${params}`);
    if (!emailRes.ok) return { email: null, confidence: 0 };
    const emailData = (await emailRes.json()) as {
      data?: { email?: string; score?: number };
    };
    return {
      email: emailData.data?.email ?? null,
      confidence: emailData.data?.score ?? 0,
    };
  } catch {
    return { email: null, confidence: 0 };
  }
}

// ─── Waterfall findEmail ──────────────────────────────────────────────────────

async function findEmail(
  firstName: string,
  lastName: string,
  company: string,
  youtubeVideoId?: string,
  websiteUrl?: string,
): Promise<EmailResult> {
  console.log(`[findEmail] called for: ${firstName} ${lastName} | company: ${company} | videoId: ${youtubeVideoId ?? "none"}`);

  // Source 1: YouTube channel description
  if (youtubeVideoId) {
    const email = await scrapeYouTubeChannelEmail(youtubeVideoId);
    console.log(`[findEmail] youtube_channel → ${email ?? "null"}`);
    if (email) return { email, confidence: 95, source: "youtube_channel" };
    await sleep(500);
  } else {
    console.log(`[findEmail] youtube_channel → skipped (no videoId)`);
  }

  // Source 2: Website (infer URL if not provided)
  const effectiveWebsite = websiteUrl || (await inferWebsiteUrl(company));
  console.log(`[findEmail] inferWebsiteUrl → ${effectiveWebsite ?? "null"}`);
  if (effectiveWebsite) {
    const email = await scrapeWebsiteEmail(effectiveWebsite);
    console.log(`[findEmail] website scrape → ${email ?? "null"}`);
    if (email) return { email, confidence: 90, source: "website" };
    await sleep(500);
  }

  // Source 3: Apollo.io
  if (process.env.APOLLO_API_KEY) {
    const result = await findEmailApollo(firstName, lastName, company);
    console.log(`[findEmail] apollo → ${result.email ?? "null"} (confidence: ${result.confidence})`);
    if (result.email) return { email: result.email, confidence: result.confidence, source: "apollo" };
    await sleep(500);
  } else {
    console.log(`[findEmail] apollo → skipped (no APOLLO_API_KEY)`);
  }

  // Source 4: Hunter.io
  if (process.env.HUNTER_API_KEY) {
    const result = await findEmailHunter(firstName, lastName, company);
    console.log(`[findEmail] hunter → ${result.email ?? "null"} (confidence: ${result.confidence})`);
    if (result.email) return { email: result.email, confidence: result.confidence, source: "hunter" };
  } else {
    console.log(`[findEmail] hunter → skipped (no HUNTER_API_KEY)`);
  }

  console.log(`[findEmail] all sources exhausted → no email found`);
  return { email: null, confidence: 0, source: "none" };
}

// ─── Extract founder info via GPT-4o-mini ─────────────────────────────────────

async function extractFounderInfo(
  transcript: string,
  videoTitle: string,
  channelName: string,
): Promise<FounderInfo> {
  const prompt = `You are analysing a YouTube interview transcript to extract information about the founder being interviewed.

Video title: ${videoTitle}
Channel: ${channelName}

Transcript (first 8000 chars):
${transcript.slice(0, 8000)}

Extract and return ONLY a JSON object with these fields:
{
  "firstName": "founder's first name (string)",
  "lastName": "founder's last name or empty string",
  "company": "their company name (string)",
  "interviewTopic": "one sentence describing what this interview is mainly about — their journey, product, or key insight (max 15 words)",
  "specificMoment": "the single most interesting or surprising thing they said — write it as 'you talked about X' or 'you mentioned Y' (max 20 words)",
  "isFounderInterview": true or false,
  "monthlyRevenue": estimated monthly recurring revenue in USD as a plain integer (e.g. 5000 for $5k/mo), or null if not mentioned anywhere in the transcript,
  "revenueStage": one of exactly: "pre-revenue" (no revenue / $0), "early" ($1-$5000/mo), "growing" ($5001-$50000/mo), "scaled" ($50001+/mo) — derive from monthlyRevenue if provided, otherwise infer from context clues (e.g. "just launched" = pre-revenue, "profitable" or "7 figures" = scaled)
}

Return ONLY the JSON object. No explanation. No markdown.`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 400,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
  });

  const text = res.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(text) as Partial<FounderInfo> & { monthlyRevenue?: number | null; revenueStage?: string };

  const rawRevenue = typeof parsed.monthlyRevenue === "number" ? parsed.monthlyRevenue : null;
  const validStages: RevenueStage[] = ["pre-revenue", "early", "growing", "scaled"];
  const rawStage = parsed.revenueStage as RevenueStage | undefined;
  const revenueStage: RevenueStage =
    rawStage && validStages.includes(rawStage)
      ? rawStage
      : rawRevenue === null
        ? "pre-revenue"
        : rawRevenue === 0
          ? "pre-revenue"
          : rawRevenue <= 5000
            ? "early"
            : rawRevenue <= 50000
              ? "growing"
              : "scaled";

  return {
    firstName: parsed.firstName ?? "Founder",
    lastName: parsed.lastName ?? "",
    company: parsed.company ?? "Unknown",
    interviewTopic: parsed.interviewTopic ?? "their entrepreneurial journey",
    specificMoment: parsed.specificMoment ?? "your insights on building a business",
    isFounderInterview: parsed.isFounderInterview ?? false,
    monthlyRevenue: rawRevenue,
    revenueStage,
  };
}

// ─── Create lead from a manually generated pack ───────────────────────────────

export async function createLeadFromPack(
  options: CreateLeadFromPackOptions,
): Promise<void> {
  try {
    const { transcript, packId, videoTitle, youtubeUrl, linkedinPost, twitterPost, newsletter } =
      options;

    const matchedVideoId = youtubeUrl ? YOUTUBE_VIDEO_ID_RE.exec(youtubeUrl)?.[1] : null;
    const youtubeVideoId = matchedVideoId ?? `pack_${packId}`;

    // Skip if already processed (e.g. pack regeneration)
    const existing = await prisma.pipelineVideo.findUnique({
      where: { youtubeVideoId },
    });
    if (existing) return;

    // Extract founder info from the transcript
    const founderInfo = await extractFounderInfo(transcript, videoTitle ?? "", "");
    if (!founderInfo.isFounderInterview) return;

    // Create PipelineVideo record
    const pv = await prisma.pipelineVideo.create({
      data: {
        youtubeVideoId,
        youtubeUrl: youtubeUrl ?? "",
        title: videoTitle ?? founderInfo.company,
        channelName: "",
        publishedAt: new Date(),
        transcript: transcript.slice(0, 15000),
        transcriptFetched: true,
        status: "PACK_GENERATED",
        processedAt: new Date(),
      },
    });

    // Find email via waterfall
    const emailResult = await findEmail(
      founderInfo.firstName,
      founderInfo.lastName,
      founderInfo.company,
      matchedVideoId ?? undefined,
    );

    const leadStatus = emailResult.email ? "EMAIL_FOUND" : "NO_EMAIL";

    await prisma.outreachLead.create({
      data: {
        pipelineVideoId: pv.id,
        firstName: founderInfo.firstName,
        lastName: founderInfo.lastName || null,
        email: emailResult.email ?? null,
        emailConfidence: emailResult.confidence > 0 ? emailResult.confidence : null,
        emailSource: emailResult.email ? emailResult.source : null,
        company: founderInfo.company,
        interviewSource: youtubeUrl ? "YouTube" : "Manual",
        interviewTopic: founderInfo.interviewTopic,
        specificMoment: founderInfo.specificMoment,
        linkedinPost,
        twitterPost,
        newsletter,
        monthlyRevenue: founderInfo.monthlyRevenue,
        revenueStage: founderInfo.revenueStage,
        status: leadStatus,
      },
    });

    await prisma.pipelineVideo.update({
      where: { id: pv.id },
      data: { status: "READY" },
    });
  } catch (err) {
    logger.error("pipeline.createLeadFromPack.failed", {
      packId: options.packId,
      err: String(err),
    });
  }
}

// ─── Cron: retry email lookup for NO_EMAIL / PENDING_EMAIL leads ──────────────

export async function runPipeline(): Promise<PipelineRunSummary> {
  const pendingLeads = await prisma.outreachLead.findMany({
    where: { status: { in: ["PENDING_EMAIL", "NO_EMAIL"] } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      company: true,
      pipelineVideo: { select: { youtubeVideoId: true } },
    },
    take: 20,
  });

  let retried = 0;
  let emailsFound = 0;

  for (const lead of pendingLeads) {
    retried++;
    const videoId = lead.pipelineVideo.youtubeVideoId;
    const realVideoId = videoId.startsWith("pack_") ? undefined : videoId;
    const result = await findEmail(
      lead.firstName,
      lead.lastName ?? "",
      lead.company,
      realVideoId,
    );

    if (result.email) {
      await prisma.outreachLead.update({
        where: { id: lead.id },
        data: {
          email: result.email,
          emailConfidence: result.confidence > 0 ? result.confidence : null,
          emailSource: result.source,
          status: "EMAIL_FOUND",
        },
      });
      emailsFound++;
    } else {
      await prisma.outreachLead.update({
        where: { id: lead.id },
        data: { status: "NO_EMAIL" },
      });
    }
    await sleep(1200);
  }

  return { retried, emailsFound };
}
