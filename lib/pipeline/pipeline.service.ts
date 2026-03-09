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
  linkedinUrl?: string;
  linkedinPost: string;
  twitterPost: string;
  newsletter: string;
  llmUsed?: string;
};

type RevenueStage = "pre-revenue" | "early" | "growing" | "scaled";

type FounderInfo = {
  firstName: string;
  lastName: string;
  company: string;
  linkedinUrl: string | null;
  interviewTopic: string;
  specificMoment: string;
  isFounderInterview: boolean;
  monthlyRevenue: number | null;
  revenueStage: RevenueStage;
};

export type AttemptLogEntry = {
  source: string;
  result: "found" | "skipped" | "failed";
  detail: string;
};

type SourceResult = {
  email: string | null;
  confidence: number;
  reason: string;
};

type EmailResult = {
  email: string | null;
  confidence: number;
  source: string;
  attemptLog: AttemptLogEntry[];
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

// ─── Source 3: Snov.io ───────────────────────────────────────────────────────

// In-memory token cache — refreshed after 55 minutes (token TTL is 1 hour)
let snovToken: string | null = null;
let snovTokenExpiresAt = 0;

async function getSnovToken(): Promise<string | null> {
  const clientId = process.env.SNOVIO_CLIENT_ID;
  const clientSecret = process.env.SNOVIO_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  if (snovToken && Date.now() < snovTokenExpiresAt) return snovToken;

  try {
    const res = await fetch("https://api.snov.io/v1/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token?: string };
    if (!data.access_token) return null;
    snovToken = data.access_token;
    snovTokenExpiresAt = Date.now() + 55 * 60 * 1000; // 55 min
    return snovToken;
  } catch {
    return null;
  }
}

async function findEmailSnov(
  firstName: string,
  lastName: string,
  websiteUrl: string | null,
): Promise<SourceResult> {
  if (!process.env.SNOVIO_CLIENT_ID) return { email: null, confidence: 0, reason: "no API key" };
  // websiteUrl is pre-resolved by findEmail() — don't call inferWebsiteUrl again
  if (!websiteUrl) return { email: null, confidence: 0, reason: "no domain resolved" };

  const domain = websiteUrl.replace(/^https?:\/\//, "").split("/")[0];

  const token = await getSnovToken();
  if (!token) return { email: null, confidence: 0, reason: "auth failed" };

  // v2 async two-step API (v1 get-emails-from-name removed)
  try {
    const startRes = await fetch("https://api.snov.io/v2/emails-by-domain-by-name/start", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ rows: [{ first_name: firstName, last_name: lastName || "", domain }] }),
    });
    if (!startRes.ok) {
      const errText = await startRes.text().catch(() => "");
      console.log(`[findEmailSnov] start HTTP ${startRes.status}: ${errText.slice(0, 200)}`);
      return { email: null, confidence: 0, reason: `API error ${startRes.status}` };
    }
    const startData = (await startRes.json()) as { data?: { task_hash?: string } };
    const taskHash = startData.data?.task_hash;
    if (!taskHash) return { email: null, confidence: 0, reason: "no task hash returned" };

    // Poll up to 4 times with 5s intervals (~20s max)
    for (let attempt = 0; attempt < 4; attempt++) {
      await sleep(5000);
      const pollRes = await fetch(
        `https://api.snov.io/v2/emails-by-domain-by-name/result?task_hash=${taskHash}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!pollRes.ok) continue;
      const pollData = (await pollRes.json()) as {
        status?: string;
        data?: Array<{ result?: Array<{ email?: string; smtp_status?: string }> }>;
      };
      if (pollData.status !== "completed") continue;
      const email = pollData.data?.[0]?.result?.[0]?.email ?? null;
      const smtpStatus = pollData.data?.[0]?.result?.[0]?.smtp_status ?? "unknown";
      if (!email) return { email: null, confidence: 0, reason: `${domain} found, 0 emails indexed` };
      const confidence = smtpStatus === "valid" ? 85 : 65;
      return { email, confidence, reason: `found (smtp: ${smtpStatus})` };
    }
    return { email: null, confidence: 0, reason: "lookup timed out" };
  } catch {
    return { email: null, confidence: 0, reason: "request failed" };
  }
}

// ─── Source 3: Prospeo.io (LinkedIn → email) ─────────────────────────────────
// Endpoint: POST /enrich-person (new API; /linkedin-email-finder was deprecated Mar 2025)

async function findEmailProspeo(linkedinUrl: string): Promise<SourceResult> {
  const apiKey = process.env.PROSPEO_API_KEY;
  if (!apiKey) return { email: null, confidence: 0, reason: "no API key" };

  try {
    const res = await fetch("https://api.prospeo.io/enrich-person", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-KEY": apiKey,
      },
      body: JSON.stringify({ data: { linkedin_url: linkedinUrl } }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.log(`[findEmailProspeo] HTTP ${res.status}: ${errText.slice(0, 200)}`);
      return { email: null, confidence: 0, reason: `API error ${res.status}` };
    }
    const data = (await res.json()) as {
      error?: boolean;
      person?: { email?: { email?: string; status?: string; revealed?: boolean } };
    };
    if (data.error) return { email: null, confidence: 0, reason: "LinkedIn profile not found" };
    const emailEntry = data.person?.email;
    const email = emailEntry?.revealed ? (emailEntry.email ?? null) : null;
    const confidence = emailEntry?.status === "VERIFIED" ? 95 : email ? 80 : 0;
    return { email, confidence, reason: email ? `found (${emailEntry?.status ?? "unknown"})` : "no email on LinkedIn profile" };
  } catch {
    return { email: null, confidence: 0, reason: "request failed" };
  }
}

// ─── Source 4: Apollo.io ─────────────────────────────────────────────────────

async function findEmailApollo(
  firstName: string,
  lastName: string,
  company: string,
): Promise<SourceResult> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) return { email: null, confidence: 0, reason: "no API key" };

  try {
    const res = await fetch("https://api.apollo.io/v1/people/match", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName || "",
        organization_name: company,
        reveal_personal_emails: true,
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.log(`[findEmailApollo] HTTP ${res.status}: ${errText.slice(0, 200)}`);
      const reason = res.status === 403 ? "paid plan required" : `API error ${res.status}`;
      return { email: null, confidence: 0, reason };
    }
    const data = (await res.json()) as { person?: { email?: string } };
    const email = data.person?.email ?? null;
    return { email, confidence: email ? 85 : 0, reason: email ? "found" : "no match found" };
  } catch {
    return { email: null, confidence: 0, reason: "request failed" };
  }
}

// ─── Source 5: Hunter.io ─────────────────────────────────────────────────────

async function findEmailHunter(
  firstName: string,
  lastName: string,
  company: string,
): Promise<SourceResult> {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) return { email: null, confidence: 0, reason: "no API key" };

  try {
    const domainRes = await fetch(
      `https://api.hunter.io/v2/domain-search?company=${encodeURIComponent(company)}&api_key=${apiKey}&limit=1`,
    );
    if (!domainRes.ok) return { email: null, confidence: 0, reason: `domain lookup error ${domainRes.status}` };
    const domainData = (await domainRes.json()) as { data?: { domain?: string } };
    const domain = domainData.data?.domain;
    if (!domain) return { email: null, confidence: 0, reason: "company domain not found" };

    await sleep(1000);

    const params = new URLSearchParams({
      domain,
      first_name: firstName,
      last_name: lastName,
      api_key: apiKey,
    });
    const emailRes = await fetch(`https://api.hunter.io/v2/email-finder?${params}`);
    if (!emailRes.ok) return { email: null, confidence: 0, reason: `email finder error ${emailRes.status}` };
    const emailData = (await emailRes.json()) as {
      data?: { email?: string; score?: number };
    };
    const email = emailData.data?.email ?? null;
    return {
      email,
      confidence: emailData.data?.score ?? 0,
      reason: email ? "found" : `${domain} found, 0 emails indexed`,
    };
  } catch {
    return { email: null, confidence: 0, reason: "request failed" };
  }
}

// ─── Source 7: Twitter/X bio via Nitter ──────────────────────────────────────

async function inferTwitterHandle(
  firstName: string,
  lastName: string,
  company: string,
): Promise<string | null> {
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 50,
      messages: [
        {
          role: "user",
          content: `What is the most likely Twitter/X handle for a founder named ${firstName}${lastName ? " " + lastName : ""} who runs a company called "${company}"? Reply with ONLY the handle (no @), or "unknown" if you cannot reasonably guess.`,
        },
      ],
    });
    const raw = res.choices[0]?.message?.content?.trim().replace(/^@/, "").toLowerCase() ?? "";
    if (!raw || raw === "unknown" || raw.length < 2 || raw.length > 50 || /\s/.test(raw)) return null;
    return raw;
  } catch {
    return null;
  }
}

// Nitter instances to try in order (public Twitter mirrors, no API key needed)
const NITTER_INSTANCES = ["nitter.net", "nitter.privacydev.net", "nitter.1d4.us"];

async function scrapeTwitterBioEmail(
  firstName: string,
  lastName: string,
  company: string,
): Promise<SourceResult> {
  const handle = await inferTwitterHandle(firstName, lastName, company);
  if (!handle) return { email: null, confidence: 0, reason: "could not infer Twitter handle" };

  for (const instance of NITTER_INSTANCES) {
    try {
      const res = await fetch(`https://${instance}/${handle}`, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Korel/1.0)" },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) continue;
      const html = await res.text();

      // Nitter renders bio in .profile-bio or .profile-card-desc
      const bioMatch =
        html.match(/class="[^"]*(?:profile-bio|profile-card-desc)[^"]*"[^>]*>([\s\S]*?)<\/p>/i) ??
        html.match(/class="[^"]*bio[^"]*"[^>]*>([\s\S]*?)<\/(?:p|div)>/i);
      const bioText = bioMatch ? bioMatch[1].replace(/<[^>]+>/g, " ") : html.slice(0, 8000);

      const emails = bioText.match(EMAIL_RE) ?? [];
      const email = emails[0] ?? null;
      if (email) {
        return { email, confidence: 70, reason: `found in @${handle} bio via ${instance}` };
      }
      return { email: null, confidence: 0, reason: `@${handle} found on ${instance}, no email in bio` };
    } catch {
      // instance unreachable — try next
    }
  }
  return { email: null, confidence: 0, reason: "Nitter unavailable (all instances timed out)" };
}

// ─── Waterfall findEmail ──────────────────────────────────────────────────────

async function findEmail(
  firstName: string,
  lastName: string,
  company: string,
  youtubeVideoId?: string,
  websiteUrl?: string,
  linkedinUrl?: string,
): Promise<EmailResult> {
  console.log(`[findEmail] called for: ${firstName} ${lastName} | company: ${company} | videoId: ${youtubeVideoId ?? "none"}`);
  const log: AttemptLogEntry[] = [];

  // Source 1: YouTube channel description
  if (youtubeVideoId) {
    const email = await scrapeYouTubeChannelEmail(youtubeVideoId);
    console.log(`[findEmail] youtube_channel → ${email ?? "null"}`);
    if (email) {
      log.push({ source: "youtube_channel", result: "found", detail: "email in channel description" });
      return { email, confidence: 95, source: "youtube_channel", attemptLog: log };
    }
    log.push({ source: "youtube_channel", result: "failed", detail: "no email in channel description" });
    await sleep(500);
  } else {
    log.push({ source: "youtube_channel", result: "skipped", detail: "no video URL provided" });
  }

  // Source 2: Website scrape (URL inferred once and reused by Snov below)
  const effectiveWebsite = websiteUrl || (await inferWebsiteUrl(company));
  console.log(`[findEmail] inferWebsiteUrl → ${effectiveWebsite ?? "null"}`);
  if (effectiveWebsite) {
    const domain = effectiveWebsite.replace(/^https?:\/\//, "").split("/")[0];
    const email = await scrapeWebsiteEmail(effectiveWebsite);
    console.log(`[findEmail] website scrape → ${email ?? "null"}`);
    if (email) {
      log.push({ source: "website", result: "found", detail: `found on ${domain}` });
      return { email, confidence: 90, source: "website", attemptLog: log };
    }
    log.push({ source: "website", result: "failed", detail: `${domain} found, no email on page` });
    await sleep(500);
  } else {
    log.push({ source: "website", result: "skipped", detail: "no domain resolved for company" });
  }

  // Source 3: Prospeo (LinkedIn → email) — most reliable for indie founders
  if (!process.env.PROSPEO_API_KEY) {
    log.push({ source: "prospeo", result: "skipped", detail: "no API key" });
  } else if (!linkedinUrl) {
    log.push({ source: "prospeo", result: "skipped", detail: "no LinkedIn URL found in transcript" });
  } else {
    const result = await findEmailProspeo(linkedinUrl);
    console.log(`[findEmail] prospeo → ${result.email ?? "null"} (${result.reason})`);
    if (result.email) {
      log.push({ source: "prospeo", result: "found", detail: "found via LinkedIn profile" });
      return { email: result.email, confidence: result.confidence, source: "prospeo", attemptLog: log };
    }
    log.push({ source: "prospeo", result: "failed", detail: result.reason });
    await sleep(500);
  }

  // Source 4: Snov.io (reuses effectiveWebsite — no second inferWebsiteUrl call)
  if (!process.env.SNOVIO_CLIENT_ID) {
    log.push({ source: "snov", result: "skipped", detail: "no API key" });
  } else {
    const result = await findEmailSnov(firstName, lastName, effectiveWebsite ?? null);
    console.log(`[findEmail] snov → ${result.email ?? "null"} (${result.reason})`);
    if (result.email) {
      log.push({ source: "snov", result: "found", detail: "found" });
      return { email: result.email, confidence: result.confidence, source: "snov", attemptLog: log };
    }
    log.push({ source: "snov", result: "failed", detail: result.reason });
    await sleep(500);
  }

  // Source 5: Apollo.io
  if (!process.env.APOLLO_API_KEY) {
    log.push({ source: "apollo", result: "skipped", detail: "no API key" });
  } else {
    const result = await findEmailApollo(firstName, lastName, company);
    console.log(`[findEmail] apollo → ${result.email ?? "null"} (${result.reason})`);
    if (result.email) {
      log.push({ source: "apollo", result: "found", detail: "found" });
      return { email: result.email, confidence: result.confidence, source: "apollo", attemptLog: log };
    }
    log.push({ source: "apollo", result: "failed", detail: result.reason });
    await sleep(500);
  }

  // Source 6: Hunter.io
  if (!process.env.HUNTER_API_KEY) {
    log.push({ source: "hunter", result: "skipped", detail: "no API key" });
  } else {
    const result = await findEmailHunter(firstName, lastName, company);
    console.log(`[findEmail] hunter → ${result.email ?? "null"} (${result.reason})`);
    if (result.email) {
      log.push({ source: "hunter", result: "found", detail: "found" });
      return { email: result.email, confidence: result.confidence, source: "hunter", attemptLog: log };
    }
    log.push({ source: "hunter", result: "failed", detail: result.reason });
  }

  // Source 7: Twitter/X bio via Nitter (no API key — public mirror, last resort)
  {
    const result = await scrapeTwitterBioEmail(firstName, lastName, company);
    console.log(`[findEmail] twitter_bio → ${result.email ?? "null"} (${result.reason})`);
    if (result.email) {
      log.push({ source: "twitter_bio", result: "found", detail: result.reason });
      return { email: result.email, confidence: result.confidence, source: "twitter_bio", attemptLog: log };
    }
    log.push({ source: "twitter_bio", result: "failed", detail: result.reason });
  }

  console.log(`[findEmail] all sources exhausted → no email found`);
  return { email: null, confidence: 0, source: "none", attemptLog: log };
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
  "linkedinUrl": "LinkedIn profile URL. For well-known public figures provide with high confidence (e.g. Alex Hormozi → 'linkedin.com/in/alexhormozi', Sam Altman → 'linkedin.com/in/sama'). For all others make your best guess using 'linkedin.com/in/firstname-lastname' or 'linkedin.com/in/firstname-lastname-company' patterns. Only return null if you have absolutely no basis to guess.",
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
    max_tokens: 500,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
  });

  const text = res.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(text) as Partial<FounderInfo> & { monthlyRevenue?: number | null; revenueStage?: string; linkedinUrl?: string | null };

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

  const rawFirstName = parsed.firstName?.trim();
  const firstName =
    !rawFirstName || rawFirstName.toLowerCase() === "unknown" ? "Founder" : rawFirstName;

  const rawLinkedinUrl = parsed.linkedinUrl?.trim() ?? null;
  const linkedinUrl = rawLinkedinUrl
    ? rawLinkedinUrl.startsWith("http")
      ? rawLinkedinUrl
      : `https://${rawLinkedinUrl}`
    : null;

  const rawCompany = (parsed.company ?? "").trim();

  // Validate extraction quality — reject obvious GPT failures
  const INVALID_FIRST_NAMES = new Set([
    "lots", "unknown", "founder", "guest", "host", "speaker",
    "interviewee", "person", "someone", "name", "n/a",
  ]);
  const INVALID_COMPANIES = new Set([
    "n/a", "unknown", "none", "not mentioned", "not specified", "",
  ]);
  const firstNameInvalid = INVALID_FIRST_NAMES.has(firstName.toLowerCase());
  const companyInvalid = INVALID_COMPANIES.has(rawCompany.toLowerCase());
  if (firstNameInvalid || companyInvalid) {
    console.log(
      `[extractFounderInfo] Skipping lead — invalid extraction: firstName="${firstName}" company="${rawCompany}"`,
    );
    return {
      firstName,
      lastName: parsed.lastName ?? "",
      company: rawCompany || "Unknown",
      linkedinUrl,
      interviewTopic: parsed.interviewTopic ?? "their entrepreneurial journey",
      specificMoment: parsed.specificMoment ?? "your insights on building a business",
      isFounderInterview: false,
      monthlyRevenue: rawRevenue,
      revenueStage,
    };
  }

  return {
    firstName,
    lastName: parsed.lastName ?? "",
    company: rawCompany || "Unknown",
    linkedinUrl,
    interviewTopic: parsed.interviewTopic ?? "their entrepreneurial journey",
    specificMoment: parsed.specificMoment ?? "your insights on building a business",
    isFounderInterview: parsed.isFounderInterview ?? false,
    monthlyRevenue: rawRevenue,
    revenueStage,
  };
}

// ─── Create lead from a manually generated pack ───────────────────────────────
// Runs fire-and-forget (void) from packs/route.ts. Creates the lead immediately
// as PENDING_EMAIL so data is never lost, then runs the email waterfall inline
// while Vercel still has execution budget. If Vercel kills the function before
// the waterfall finishes, the lead stays PENDING_EMAIL and the cron retries it.

export async function createLeadFromPack(
  options: CreateLeadFromPackOptions,
): Promise<void> {
  let pvId: string | null = null;
  try {
    const { transcript, packId, videoTitle, youtubeUrl, linkedinUrl: explicitLinkedinUrl, linkedinPost, twitterPost, newsletter, llmUsed } =
      options;

    console.log(`[createLeadFromPack] start packId=${packId}`);

    const matchedVideoId = youtubeUrl ? YOUTUBE_VIDEO_ID_RE.exec(youtubeUrl)?.[1] : null;
    const youtubeVideoId = matchedVideoId ?? `pack_${packId}`;

    // Skip if already processed (e.g. pack regeneration)
    const existing = await prisma.pipelineVideo.findUnique({
      where: { youtubeVideoId },
    });
    if (existing) {
      console.log(`[createLeadFromPack] already processed, skip`);
      return;
    }

    // Extract founder info from the transcript
    const founderInfo = await extractFounderInfo(transcript, videoTitle ?? "", "");
    console.log(`[createLeadFromPack] isFounderInterview=${founderInfo.isFounderInterview} company=${founderInfo.company}`);
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
    pvId = pv.id;

    const resolvedLinkedinUrl = explicitLinkedinUrl || founderInfo.linkedinUrl;

    // Create the OutreachLead immediately as PENDING_EMAIL — safe even if Vercel
    // kills us mid-waterfall below.
    const newLead = await prisma.outreachLead.create({
      data: {
        pipelineVideoId: pv.id,
        firstName: founderInfo.firstName,
        lastName: founderInfo.lastName || null,
        email: null,
        emailConfidence: null,
        emailSource: null,
        linkedinUrl: resolvedLinkedinUrl,
        company: founderInfo.company,
        interviewSource: youtubeUrl ? "YouTube" : "Manual",
        interviewTopic: founderInfo.interviewTopic,
        specificMoment: founderInfo.specificMoment,
        linkedinPost,
        twitterPost,
        newsletter,
        monthlyRevenue: founderInfo.monthlyRevenue,
        revenueStage: founderInfo.revenueStage,
        llmUsed: llmUsed ?? "openai-gpt4o",
        status: "PENDING_EMAIL",
      },
      select: { id: true },
    });

    await prisma.pipelineVideo.update({
      where: { id: pv.id },
      data: { status: "READY" },
    });

    // Run email waterfall inline — Vercel keeps the execution context alive for
    // a window after the HTTP response. Fast sources (YouTube, website, Prospeo)
    // typically finish in <10s. If killed mid-way, the lead stays PENDING_EMAIL
    // and the cron retries. The attempt log captures what was tried either way.
    console.log(`[createLeadFromPack] lead created, starting email waterfall for ${founderInfo.firstName}`);
    const emailResult = await findEmail(
      founderInfo.firstName,
      founderInfo.lastName,
      founderInfo.company,
      matchedVideoId ?? undefined,
      undefined,
      resolvedLinkedinUrl ?? undefined,
    );

    await prisma.outreachLead.update({
      where: { id: newLead.id },
      data: {
        email: emailResult.email,
        emailConfidence: emailResult.email && emailResult.confidence > 0 ? emailResult.confidence : null,
        emailSource: emailResult.email ? emailResult.source : null,
        emailAttemptLog: emailResult.attemptLog,
        status: emailResult.email ? "EMAIL_FOUND" : "NO_EMAIL",
      },
    });

    console.log(`[createLeadFromPack] done — ${founderInfo.firstName} ${founderInfo.lastName} email=${emailResult.email ?? "not found"} source=${emailResult.source}`);
  } catch (err) {
    console.error(`[createLeadFromPack] FAILED packId=${options.packId}:`, err);
    logger.error("pipeline.createLeadFromPack.failed", {
      packId: options.packId,
      err: String(err),
    });
    // Mark the PipelineVideo as FAILED so it's visible in the admin log
    if (pvId) {
      await prisma.pipelineVideo
        .update({
          where: { id: pvId },
          data: { status: "FAILED", errorMessage: String(err) },
        })
        .catch(() => {}); // best-effort, don't throw again
    }
  }
}

// ─── Repair stuck PACK_GENERATED records ─────────────────────────────────────
// Finds PipelineVideo rows stuck in PACK_GENERATED with no OutreachLead and
// creates the missing lead records so the cron can retry email finding.

export async function repairStuckLeads(): Promise<{ repaired: number; skipped: number }> {
  // PipelineVideo records in PACK_GENERATED with no associated OutreachLead
  const stuckVideos = await prisma.pipelineVideo.findMany({
    where: {
      status: "PACK_GENERATED",
      lead: null,
    },
    select: {
      id: true,
      youtubeVideoId: true,
      title: true,
      youtubeUrl: true,
      transcript: true,
    },
  });

  console.log(`[repairStuckLeads] found ${stuckVideos.length} stuck records`);

  let repaired = 0;
  let skipped = 0;

  for (const pv of stuckVideos) {
    try {
      const transcript = pv.transcript ?? "";

      // Derive packId if this was a manual pack (pack_<packId>)
      const isManualPack = pv.youtubeVideoId.startsWith("pack_");
      const packId = isManualPack ? pv.youtubeVideoId.slice(5) : null;

      // Load content from AuthorityPack if available
      let linkedinPost = "";
      let twitterPost = "";
      let newsletter = "";

      if (packId) {
        const pack = await prisma.authorityPack.findUnique({
          where: { id: packId },
          select: { highLeveragePosts: true },
        });
        if (pack?.highLeveragePosts) {
          const posts = pack.highLeveragePosts as {
            linkedinPosts?: string[];
            twitterThread?: string[];
            newsletterSummary?: string;
          };
          linkedinPost = posts.linkedinPosts?.[0] ?? "";
          twitterPost = posts.twitterThread?.join("\n\n") ?? "";
          newsletter = posts.newsletterSummary ?? "";
        }
      }

      // Re-extract founder info from the stored transcript
      const founderInfo = await extractFounderInfo(transcript, pv.title, "");
      if (!founderInfo.isFounderInterview) {
        console.log(`[repairStuckLeads] ${pv.id} — not a founder interview, marking FAILED`);
        await prisma.pipelineVideo.update({
          where: { id: pv.id },
          data: { status: "FAILED", errorMessage: "Not identified as founder interview" },
        });
        skipped++;
        continue;
      }

      await prisma.outreachLead.create({
        data: {
          pipelineVideoId: pv.id,
          firstName: founderInfo.firstName,
          lastName: founderInfo.lastName || null,
          email: null,
          emailConfidence: null,
          emailSource: null,
          linkedinUrl: founderInfo.linkedinUrl,
          company: founderInfo.company,
          interviewSource: pv.youtubeUrl ? "YouTube" : "Manual",
          interviewTopic: founderInfo.interviewTopic,
          specificMoment: founderInfo.specificMoment,
          linkedinPost,
          twitterPost,
          newsletter,
          monthlyRevenue: founderInfo.monthlyRevenue,
          revenueStage: founderInfo.revenueStage,
          status: "PENDING_EMAIL",
        },
      });

      await prisma.pipelineVideo.update({
        where: { id: pv.id },
        data: { status: "READY" },
      });

      console.log(`[repairStuckLeads] repaired ${pv.id} — ${founderInfo.firstName} ${founderInfo.lastName}`);
      repaired++;
    } catch (err) {
      console.error(`[repairStuckLeads] failed for ${pv.id}:`, err);
      skipped++;
    }
  }

  return { repaired, skipped };
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
      linkedinUrl: true,
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
      undefined,
      lead.linkedinUrl ?? undefined,
    );

    if (result.email) {
      await prisma.outreachLead.update({
        where: { id: lead.id },
        data: {
          email: result.email,
          emailConfidence: result.confidence > 0 ? result.confidence : null,
          emailSource: result.source,
          emailAttemptLog: result.attemptLog,
          status: "EMAIL_FOUND",
        },
      });
      emailsFound++;
    } else {
      await prisma.outreachLead.update({
        where: { id: lead.id },
        data: { status: "NO_EMAIL", emailAttemptLog: result.attemptLog },
      });
    }
    await sleep(1200);
  }

  return { retried, emailsFound };
}
