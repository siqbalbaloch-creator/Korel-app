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

type FounderInfo = {
  firstName: string;
  lastName: string;
  company: string;
  interviewTopic: string;
  specificMoment: string;
  isFounderInterview: boolean;
};

type EmailResult = {
  email: string | null;
  confidence: number;
  skipped?: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const YOUTUBE_VIDEO_ID_RE =
  /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

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
  "isFounderInterview": true or false
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
  const parsed = JSON.parse(text) as Partial<FounderInfo>;

  return {
    firstName: parsed.firstName ?? "Founder",
    lastName: parsed.lastName ?? "",
    company: parsed.company ?? "Unknown",
    interviewTopic: parsed.interviewTopic ?? "their entrepreneurial journey",
    specificMoment: parsed.specificMoment ?? "your insights on building a business",
    isFounderInterview: parsed.isFounderInterview ?? false,
  };
}

// ─── Find email via Hunter.io ─────────────────────────────────────────────────

async function findEmail(
  firstName: string,
  lastName: string,
  company: string,
): Promise<EmailResult> {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) return { email: null, confidence: 0, skipped: true };

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

// ─── Create lead from a manually generated pack ───────────────────────────────

export async function createLeadFromPack(
  options: CreateLeadFromPackOptions,
): Promise<void> {
  try {
    const { transcript, packId, videoTitle, youtubeUrl, linkedinPost, twitterPost, newsletter } =
      options;

    // Derive a stable unique ID for this pack
    const matchedVideoId = youtubeUrl ? YOUTUBE_VIDEO_ID_RE.exec(youtubeUrl)?.[1] : null;
    const youtubeVideoId = matchedVideoId ?? `pack_${packId}`;

    // Skip if already processed (e.g. pack regeneration)
    const existing = await prisma.pipelineVideo.findUnique({
      where: { youtubeVideoId },
    });
    if (existing) return;

    // Extract founder info from the transcript
    const founderInfo = await extractFounderInfo(
      transcript,
      videoTitle ?? "",
      "",
    );

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

    // Find email via Hunter.io
    const emailResult = await findEmail(
      founderInfo.firstName,
      founderInfo.lastName,
      founderInfo.company,
    );

    const leadStatus = emailResult.skipped
      ? "PENDING_EMAIL"
      : emailResult.email
        ? "EMAIL_FOUND"
        : "NO_EMAIL";

    // Create outreach lead
    await prisma.outreachLead.create({
      data: {
        pipelineVideoId: pv.id,
        firstName: founderInfo.firstName,
        lastName: founderInfo.lastName || null,
        email: emailResult.email ?? null,
        emailConfidence: emailResult.confidence > 0 ? emailResult.confidence : null,
        company: founderInfo.company,
        interviewSource: youtubeUrl ? "YouTube" : "Manual",
        interviewTopic: founderInfo.interviewTopic,
        specificMoment: founderInfo.specificMoment,
        linkedinPost,
        twitterPost,
        newsletter,
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

// ─── Cron: retry email lookup for PENDING_EMAIL leads ────────────────────────

export async function runPipeline(): Promise<PipelineRunSummary> {
  const pendingLeads = await prisma.outreachLead.findMany({
    where: { status: "PENDING_EMAIL" },
    select: { id: true, firstName: true, lastName: true, company: true },
    take: 20,
  });

  let retried = 0;
  let emailsFound = 0;

  for (const lead of pendingLeads) {
    retried++;
    const result = await findEmail(lead.firstName, lead.lastName ?? "", lead.company);
    if (result.email) {
      await prisma.outreachLead.update({
        where: { id: lead.id },
        data: {
          email: result.email,
          emailConfidence: result.confidence > 0 ? result.confidence : null,
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
