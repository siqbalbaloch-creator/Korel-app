import "server-only";
import { prisma } from "@/lib/prisma";
import { openai } from "@/lib/openai";
import { generateAuthorityPack, fetchYouTubeTranscriptDebug } from "@/lib/packGenerationService";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PipelineRunOptions = {
  query?: string;
  maxResults?: number;
  daysBack?: number;
  /** Delete SKIPPED records matching the search so they get reprocessed */
  reprocessSkipped?: boolean;
};

export type PipelineRunSummary = {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  alreadySeen: number;
};

type YouTubeVideo = {
  videoId: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
};

type FounderInfo = {
  firstName: string;
  lastName: string;
  company: string;
  interviewTopic: string;
  specificMoment: string;
  isFounderInterview: boolean;
};

type ContentPack = {
  linkedinPost: string;
  twitterPost: string;
  newsletter: string;
};

type EmailResult = {
  email: string | null;
  confidence: number;
  skipped?: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── 4a — YouTube search ──────────────────────────────────────────────────────

async function searchYouTube(
  query: string,
  maxResults: number,
  publishedAfter: string,
): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY not configured");

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", String(Math.min(maxResults, 50)));
  url.searchParams.set("publishedAfter", publishedAfter);
  url.searchParams.set("videoDuration", "long"); // >20 min
  url.searchParams.set("order", "relevance");
  url.searchParams.set("relevanceLanguage", "en");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube search failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    items?: {
      id: { videoId: string };
      snippet: { title: string; channelTitle: string; publishedAt: string };
    }[];
  };

  return (data.items ?? []).map((item) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
  }));
}

// ─── 4b — Fetch transcript ────────────────────────────────────────────────────

async function fetchTranscriptForVideo(videoId: string): Promise<string | null> {
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const transcript = await fetchYouTubeTranscriptDebug(url);
    if (!transcript || transcript.trim().length < 300) return null;
    // Limit to first 15000 chars — enough context for AI extraction
    return transcript.slice(0, 15000);
  } catch {
    return null;
  }
}

// ─── 4c — Extract founder info ───────────────────────────────────────────────

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

// ─── 4d — Generate content pack ───────────────────────────────────────────────

async function generateContentPack(transcript: string): Promise<ContentPack> {
  const pack = await generateAuthorityPack(transcript, {
    inputType: "INTERVIEW",
    angle: "THOUGHT_LEADERSHIP",
    profile: null,
  });

  const linkedinPost = pack.highLeveragePosts.linkedinPosts[0] ?? "";
  const twitterPost = pack.highLeveragePosts.twitterThread.join("\n\n");
  const newsletter = pack.highLeveragePosts.newsletterSummary;

  return { linkedinPost, twitterPost, newsletter };
}

// ─── 4e — Find email via Hunter.io ───────────────────────────────────────────

async function findEmail(
  firstName: string,
  lastName: string,
  company: string,
): Promise<EmailResult> {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) return { email: null, confidence: 0, skipped: true };

  try {
    // Step 1: domain search
    const domainRes = await fetch(
      `https://api.hunter.io/v2/domain-search?company=${encodeURIComponent(company)}&api_key=${apiKey}&limit=1`,
    );
    if (!domainRes.ok) return { email: null, confidence: 0 };
    const domainData = (await domainRes.json()) as { data?: { domain?: string } };
    const domain = domainData.data?.domain;
    if (!domain) return { email: null, confidence: 0 };

    await sleep(1000);

    // Step 2: email finder
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

// ─── 4f — Main orchestrator ───────────────────────────────────────────────────

export async function runPipeline(
  options?: PipelineRunOptions,
): Promise<PipelineRunSummary> {
  const startTime = Date.now();
  const MAX_RUNTIME_MS = 50_000; // 50s — Vercel hobby limit is 60s

  const batchSize = options?.maxResults ?? parseInt(process.env.PIPELINE_BATCH_SIZE ?? "10", 10);
  const query = options?.query ?? process.env.PIPELINE_SEARCH_QUERY ?? "founder interview startup bootstrapped SaaS";
  const daysBack = options?.daysBack ?? 7;
  const reprocessSkipped = options?.reprocessSkipped ?? false;

  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;
  let alreadySeen = 0;

  // 1. Search YouTube
  const publishedAfter = new Date(
    Date.now() - daysBack * 24 * 60 * 60 * 1000,
  ).toISOString();

  let videos: YouTubeVideo[];
  try {
    videos = await searchYouTube(query, batchSize, publishedAfter);
  } catch (err) {
    throw new Error(`YouTube search failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // 2. Filter already-processed videos (optionally clearing SKIPPED ones)
  if (reprocessSkipped) {
    await prisma.pipelineVideo.deleteMany({
      where: {
        youtubeVideoId: { in: videos.map((v) => v.videoId) },
        status: "SKIPPED",
      },
    });
  }
  const existingRows = await prisma.pipelineVideo.findMany({
    where: { youtubeVideoId: { in: videos.map((v) => v.videoId) } },
    select: { youtubeVideoId: true },
  });
  const existingSet = new Set(existingRows.map((r) => r.youtubeVideoId));
  const newVideos = videos.filter((v) => !existingSet.has(v.videoId));
  alreadySeen = videos.length - newVideos.length;

  // 3. Process each video
  for (const video of newVideos) {
    if (Date.now() - startTime > MAX_RUNTIME_MS) break;

    processed++;

    const pv = await prisma.pipelineVideo.create({
      data: {
        youtubeVideoId: video.videoId,
        youtubeUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
        title: video.title,
        channelName: video.channelTitle,
        publishedAt: new Date(video.publishedAt),
        status: "DISCOVERED",
      },
    });

    try {
      // Fetch transcript
      const transcript = await fetchTranscriptForVideo(video.videoId);
      await sleep(2000);

      if (!transcript) {
        await prisma.pipelineVideo.update({
          where: { id: pv.id },
          data: { status: "SKIPPED", errorMessage: "Transcript unavailable or too short" },
        });
        skipped++;
        continue;
      }

      await prisma.pipelineVideo.update({
        where: { id: pv.id },
        data: { transcript, transcriptFetched: true, status: "TRANSCRIPT_FETCHED" },
      });

      // Extract founder info
      const founderInfo = await extractFounderInfo(transcript, video.title, video.channelTitle);
      await sleep(2000);

      if (!founderInfo.isFounderInterview) {
        await prisma.pipelineVideo.update({
          where: { id: pv.id },
          data: { status: "SKIPPED", errorMessage: "Not identified as a founder interview" },
        });
        skipped++;
        continue;
      }

      // Generate content pack
      const pack = await generateContentPack(transcript);
      await sleep(2000);

      await prisma.pipelineVideo.update({
        where: { id: pv.id },
        data: { status: "PACK_GENERATED", processedAt: new Date() },
      });

      // Find email
      const emailResult = await findEmail(
        founderInfo.firstName,
        founderInfo.lastName,
        founderInfo.company,
      );
      if (process.env.HUNTER_API_KEY) await sleep(1000);

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
          interviewSource: video.channelTitle,
          interviewTopic: founderInfo.interviewTopic,
          specificMoment: founderInfo.specificMoment,
          linkedinPost: pack.linkedinPost,
          twitterPost: pack.twitterPost,
          newsletter: pack.newsletter,
          status: leadStatus,
        },
      });

      await prisma.pipelineVideo.update({
        where: { id: pv.id },
        data: { status: "READY" },
      });

      succeeded++;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      await prisma.pipelineVideo.update({
        where: { id: pv.id },
        data: { status: "FAILED", errorMessage: errorMessage.slice(0, 500) },
      });
      failed++;
      await sleep(2000);
    }
  }

  return { processed, succeeded, failed, skipped, alreadySeen };
}
