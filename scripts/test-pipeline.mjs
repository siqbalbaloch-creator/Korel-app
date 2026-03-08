/**
 * Pipeline smoke test — runs in plain Node (no server needed).
 * Usage: node scripts/test-pipeline.mjs
 *
 * Tests each step independently with a single video and logs
 * the full response so you can verify before deploying.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ───────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = resolve(__dirname, "../.env.local");
  let raw;
  try {
    raw = readFileSync(envPath, "utf-8");
  } catch {
    console.error("❌ Could not read .env.local");
    process.exit(1);
  }
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv();

// ── Config ────────────────────────────────────────────────────────────────────

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const HUNTER_API_KEY = process.env.HUNTER_API_KEY;
const SEARCH_QUERY = process.env.PIPELINE_SEARCH_QUERY ?? "founder interview startup bootstrapped SaaS";

function check(key, value) {
  if (!value) {
    console.warn(`  ⚠️  ${key} not set — step that needs it will be skipped`);
    return false;
  }
  console.log(`  ✅ ${key} present`);
  return true;
}

// ── YouTube helpers ───────────────────────────────────────────────────────────

async function searchYouTube(query, maxResults = 3) {
  const publishedAfter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("publishedAfter", publishedAfter);
  url.searchParams.set("videoDuration", "long");
  url.searchParams.set("order", "relevance");
  url.searchParams.set("relevanceLanguage", "en");
  url.searchParams.set("key", YOUTUBE_API_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube search HTTP ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  return (data.items ?? []).map((item) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
  }));
}

// InnerTube transcript fetch (same approach as packGenerationService.ts)
const ANDROID_CLIENT = {
  clientName: "ANDROID",
  clientVersion: "19.35.36",
  androidSdkVersion: 33,
  userAgent: "com.google.android.youtube/19.35.36(Linux; U; Android 13; en_US; SM-S908E Build/TP1A.220624.014) gzip",
  hl: "en",
  gl: "US",
  osName: "Android",
  osVersion: "13",
  platform: "MOBILE",
  deviceMake: "Samsung",
  deviceModel: "SM-S908E",
};

const INNERTUBE_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";

function extractCaptionText(xml) {
  const pMatches = [...xml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)];
  const textMatches = [...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)];
  const raw = (pMatches.length ? pMatches : textMatches).map((m) => m[1] ?? "");
  return raw.map((s) =>
    s
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\n/g, " ")
      .replace(/<br\s*\/?>/g, " ")
      .replace(/<[^>]+>/g, " ")
  );
}

async function fetchTranscript(videoId) {
  const playerRes = await fetch(
    `https://www.youtube.com/youtubei/v1/player?key=${INNERTUBE_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": ANDROID_CLIENT.userAgent,
        "Accept-Language": "en-US,en;q=0.9",
      },
      body: JSON.stringify({ context: { client: ANDROID_CLIENT }, videoId }),
    }
  );
  if (!playerRes.ok) return null;
  const data = await playerRes.json();
  const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!tracks?.length) return null;

  const track =
    tracks.find((t) => t.languageCode === "en" || t.languageCode.startsWith("en")) ??
    tracks[0];

  const captionRes = await fetch(track.baseUrl, {
    headers: {
      "User-Agent": ANDROID_CLIENT.userAgent,
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!captionRes.ok) return null;
  const xml = await captionRes.text();
  const texts = extractCaptionText(xml);
  const transcript = texts.join(" ").replace(/\s+/g, " ").trim();
  return transcript.length >= 300 ? transcript.slice(0, 15000) : null;
}

// ── OpenAI extraction ─────────────────────────────────────────────────────────

async function extractFounderInfo(transcript, videoTitle, channelName) {
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  const prompt = `You are analysing a YouTube interview transcript.

Video title: ${videoTitle}
Channel: ${channelName}

Transcript (first 6000 chars):
${transcript.slice(0, 6000)}

Return ONLY a JSON object:
{
  "firstName": "founder's first name",
  "lastName": "founder's last name or empty string",
  "company": "company name",
  "interviewTopic": "one sentence about what this interview is mainly about (max 15 words)",
  "specificMoment": "the most interesting thing they said, written as 'you talked about X' (max 20 words)",
  "isFounderInterview": true or false
}`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 400,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
  });

  return JSON.parse(res.choices[0].message.content ?? "{}");
}

// ── Hunter.io email lookup ────────────────────────────────────────────────────

async function findEmail(firstName, lastName, company) {
  const domainRes = await fetch(
    `https://api.hunter.io/v2/domain-search?company=${encodeURIComponent(company)}&api_key=${HUNTER_API_KEY}&limit=1`
  );
  const domainData = await domainRes.json();
  const domain = domainData.data?.domain;
  if (!domain) return { email: null, confidence: 0 };

  await new Promise((r) => setTimeout(r, 1000));

  const params = new URLSearchParams({ domain, first_name: firstName, last_name: lastName, api_key: HUNTER_API_KEY });
  const emailRes = await fetch(`https://api.hunter.io/v2/email-finder?${params}`);
  const emailData = await emailRes.json();
  return {
    email: emailData.data?.email ?? null,
    confidence: emailData.data?.score ?? 0,
  };
}

// ── Sleep ─────────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("   Korel Pipeline Smoke Test");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // ── Check env ─────────────────────────────────────────────────────────────
  console.log("🔑 Environment variables:");
  const hasYouTube = check("YOUTUBE_API_KEY", YOUTUBE_API_KEY);
  const hasOpenAI = check("OPENAI_API_KEY", OPENAI_API_KEY);
  const hasHunter = check("HUNTER_API_KEY", HUNTER_API_KEY);
  console.log(`  📝 PIPELINE_SEARCH_QUERY = "${SEARCH_QUERY}"\n`);

  // ── Step 1: YouTube search ─────────────────────────────────────────────────
  if (!hasYouTube) {
    console.log("⏭️  Skipping YouTube search (no YOUTUBE_API_KEY).\n");
    console.log("  ➡️  Add YOUTUBE_API_KEY to .env.local and re-run.\n");
    process.exit(0);
  }

  console.log(`\n🔍 STEP 1 — Searching YouTube for: "${SEARCH_QUERY}"`);
  let videos;
  try {
    videos = await searchYouTube(SEARCH_QUERY, 3);
    console.log(`  ✅ Found ${videos.length} video(s):\n`);
    videos.forEach((v, i) => {
      console.log(`  [${i + 1}] ${v.title}`);
      console.log(`      Channel: ${v.channelTitle}`);
      console.log(`      ID: ${v.videoId}`);
      console.log(`      Published: ${v.publishedAt}`);
      console.log(`      URL: https://www.youtube.com/watch?v=${v.videoId}\n`);
    });
  } catch (err) {
    console.error(`  ❌ YouTube search failed: ${err.message}`);
    process.exit(1);
  }

  if (!videos.length) {
    console.log("  ⚠️  No videos found — try a different search query.");
    process.exit(0);
  }

  // ── Step 2: Transcript for first video ────────────────────────────────────
  const video = videos[0];
  console.log(`\n📜 STEP 2 — Fetching transcript for: "${video.title}"`);
  let transcript;
  try {
    transcript = await fetchTranscript(video.videoId);
    if (transcript) {
      console.log(`  ✅ Got transcript (${transcript.length} chars)`);
      console.log(`  Preview: "${transcript.slice(0, 200)}…"\n`);
    } else {
      console.log("  ⚠️  No transcript available (captions disabled or non-English).");
      console.log("  Pipeline will mark this as SKIPPED and move to next video.\n");
      transcript = null;
    }
  } catch (err) {
    console.error(`  ❌ Transcript fetch failed: ${err.message}`);
    transcript = null;
  }

  // ── Step 3: Extract founder info ─────────────────────────────────────────
  if (!transcript) {
    console.log("⏭️  Skipping founder extraction (no transcript).\n");
  } else if (!hasOpenAI) {
    console.log("⏭️  Skipping founder extraction (no OPENAI_API_KEY).\n");
  } else {
    console.log("\n🤖 STEP 3 — Extracting founder info via GPT-4o-mini…");
    let founderInfo;
    try {
      founderInfo = await extractFounderInfo(transcript, video.title, video.channelTitle);
      console.log("\n  ✅ Extracted:\n");
      console.log(JSON.stringify(founderInfo, null, 4).replace(/^/gm, "  "));

      if (!founderInfo.isFounderInterview) {
        console.log("\n  ⚠️  isFounderInterview = false — pipeline would SKIP this video.");
        console.log("  Try a different search query to find more founder-specific content.\n");
      } else {
        console.log("\n  ✅ isFounderInterview = true — pipeline would process this lead.\n");

        // ── Step 4: Email lookup ─────────────────────────────────────────
        if (!hasHunter) {
          console.log("⏭️  Skipping email lookup (no HUNTER_API_KEY).");
          console.log("  The pipeline still creates a lead with status NO_EMAIL — you can add the email manually.\n");
        } else {
          console.log(
            `\n📧 STEP 4 — Looking up email for ${founderInfo.firstName} ${founderInfo.lastName} @ ${founderInfo.company}…`
          );
          try {
            const emailResult = await findEmail(
              founderInfo.firstName,
              founderInfo.lastName ?? "",
              founderInfo.company
            );
            if (emailResult.email) {
              console.log(`  ✅ Email found: ${emailResult.email} (confidence: ${emailResult.confidence}%)`);
              if (emailResult.confidence < 70) {
                console.log("  ⚠️  Confidence < 70% — will show warning in pipeline UI.");
              }
            } else {
              console.log("  ⚠️  No email found for this company. Lead created with status NO_EMAIL.");
            }
          } catch (err) {
            console.error(`  ❌ Hunter.io lookup failed: ${err.message}`);
          }
        }
      }
    } catch (err) {
      console.error(`  ❌ GPT-4o-mini extraction failed: ${err.message}`);
    }
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("   Test complete.");
  console.log("\n   ⚡ Note: Content pack generation (GPT-4o-mini → LinkedIn/X/newsletter)");
  console.log("   runs via Korel's existing generateAuthorityPack — it works exactly the");
  console.log("   same as the regular Korel flow and was not re-tested here to save API calls.");
  console.log("\n   When ready, start the dev server and hit 'Run Now' on /admin/pipeline");
  console.log("   to run the full end-to-end pipeline with DB writes.");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch((err) => {
  console.error("\n❌ Unhandled error:", err);
  process.exit(1);
});
