import { openai } from "./openai";

type CoreThesis = {
  primaryThesis: string;
  supportingThemes: string[];
  targetPersona: string;
};

export type StrategicHooks = {
  linkedin: string[];
  twitter: string[];
  contrarian: string[];
};

type HighLeveragePosts = {
  linkedinPosts: string[];
  twitterThread: string[];
  newsletterSummary: string;
};

type InsightBreakdown = {
  strongClaims: string[];
  dataBackedAngles: string[];
  frameworks: string[];
};

type RepurposingMatrix = {
  entries: {
    asset: string;
    platform: string;
    format: string;
    angle: string;
  }[];
};

type ExecutiveSummary = {
  headline: string;
  positioningSentence: string;
  keyInsights: string[];
};

export type AuthorityPackStructure = {
  title: string;
  coreThesis: CoreThesis;
  strategicHooks: StrategicHooks;
  highLeveragePosts: HighLeveragePosts;
  insightBreakdown: InsightBreakdown;
  repurposingMatrix: RepurposingMatrix;
  executiveSummary: ExecutiveSummary;
};

type PartialPack = Partial<AuthorityPackStructure>;

const MODEL = "gpt-4o-mini";

// AUDIT FINDINGS (2026-02-18):
// - Authority Pack content is generated in generateAuthorityPack via a single prompt + JSON schema.
// - LinkedIn and X Threads are both produced inside highLeveragePosts by the same prompt.
// - LinkedIn is currently stored as an array of plain strings (no title/body object).
// - X threads are stored as an array of strings (one string per segment).

// strict mode requires additionalProperties: false on every object
const AUTHORITY_PACK_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "coreThesis",
    "strategicHooks",
    "highLeveragePosts",
    "insightBreakdown",
    "repurposingMatrix",
    "executiveSummary",
  ],
  properties: {
    title: { type: "string" },
    coreThesis: {
      type: "object",
      additionalProperties: false,
      required: ["primaryThesis", "supportingThemes", "targetPersona"],
      properties: {
        primaryThesis: { type: "string" },
        supportingThemes: { type: "array", items: { type: "string" } },
        targetPersona: { type: "string" },
      },
    },
    strategicHooks: {
      type: "object",
      additionalProperties: false,
      required: ["linkedin", "twitter", "contrarian"],
      properties: {
        linkedin: { type: "array", items: { type: "string" } },
        twitter: { type: "array", items: { type: "string" } },
        contrarian: { type: "array", items: { type: "string" } },
      },
    },
    highLeveragePosts: {
      type: "object",
      additionalProperties: false,
      required: ["linkedinPosts", "twitterThread", "newsletterSummary"],
      properties: {
        linkedinPosts: { type: "array", items: { type: "string" } },
        twitterThread: { type: "array", items: { type: "string" } },
        newsletterSummary: { type: "string" },
      },
    },
    insightBreakdown: {
      type: "object",
      additionalProperties: false,
      required: ["strongClaims", "dataBackedAngles", "frameworks"],
      properties: {
        strongClaims: { type: "array", items: { type: "string" } },
        dataBackedAngles: { type: "array", items: { type: "string" } },
        frameworks: { type: "array", items: { type: "string" } },
      },
    },
    repurposingMatrix: {
      type: "object",
      additionalProperties: false,
      required: ["entries"],
      properties: {
        entries: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["asset", "platform", "format", "angle"],
            properties: {
              asset: { type: "string" },
              platform: { type: "string" },
              format: { type: "string" },
              angle: { type: "string" },
            },
          },
        },
      },
    },
    executiveSummary: {
      type: "object",
      additionalProperties: false,
      required: ["headline", "positioningSentence", "keyInsights"],
      properties: {
        headline: { type: "string" },
        positioningSentence: { type: "string" },
        keyInsights: { type: "array", items: { type: "string" } },
      },
    },
  },
} as const;

const XTHREAD_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["tweets"],
  properties: {
    tweets: { type: "array", items: { type: "string" } },
  },
} as const;

const HOOKS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["linkedin", "twitter", "contrarian"],
  properties: {
    linkedin: { type: "array", items: { type: "string" } },
    twitter: { type: "array", items: { type: "string" } },
    contrarian: { type: "array", items: { type: "string" } },
  },
} as const;

const YOUTUBE_URL_REGEX =
  /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

const AUTHORITY_PACK_CONTENT_RULES = `Content constraints for Authority Pack generation:

CRITICAL — Grounding rules (highest priority):
- Every claim, statistic, insight, and hook MUST be derived directly from the provided input.
- NEVER invent, infer, or add external facts, statistics, or claims not explicitly stated in the input.
- If the input is short or thin, produce fewer but accurate items rather than padding with hallucinated content.
- It is better to leave a point concise and grounded than to fill space with invented data.

Required array sizes (you MUST produce exactly these counts):
- strategicHooks.linkedin: exactly 5 strings
- strategicHooks.twitter: exactly 3 strings
- strategicHooks.contrarian: exactly 3 strings
- highLeveragePosts.linkedinPosts: exactly 3 strings
- executiveSummary.keyInsights: exactly 5 strings
- insightBreakdown.strongClaims: at least 3 strings
- insightBreakdown.dataBackedAngles: at least 3 strings
- insightBreakdown.frameworks: at least 3 strings
If the source material is thin, derive items from different angles of the same content rather than hallucinating new ones.

- X thread (highLeveragePosts.twitterThread):
  - Output 4-8 tweets as an array of strings.
  - Each tweet should be 1-2 sentences max.
  - Tweet 1 must be scroll-stopping (strong claim or contrarian take drawn from the input).
  - Tweets 2-4 are insight bullets, short and sharp.
  - Final tweet is a closing takeaway.
  - Use numbered format inside each string (e.g., "1/ ...", "2/ ...").
  - No filler, no corporate tone, no unnecessary hashtags, max 1 emoji if essential.

- Global tone:
  - Analytical, operator-level, no fluff or motivational language.
  - Prefer declarative statements and short paragraphs.`;

const isYouTubeUrl = (value: string): boolean =>
  YOUTUBE_URL_REGEX.test(value.trim());

const extractVideoId = (url: string): string | null => {
  const match = url.trim().match(YOUTUBE_URL_REGEX);
  return match ? (match[1] ?? null) : null;
};

const decodeHtmlEntities = (text: string): string =>
  text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n/g, " ");



const YOUTUBE_ANDROID_CLIENT = {
  clientName: "ANDROID",
  clientVersion: "19.35.36",
  androidSdkVersion: 33,
  userAgent:
    "com.google.android.youtube/19.35.36(Linux; U; Android 13; en_US; SM-S908E Build/TP1A.220624.014) gzip",
  hl: "en",
  gl: "US",
  osName: "Android",
  osVersion: "13",
  platform: "MOBILE",
  deviceMake: "Samsung",
  deviceModel: "SM-S908E",
};

const YOUTUBE_INNERTUBE_API_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";

const extractCaptionText = (captionXml: string): string[] => {
  const pMatches = [...captionXml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)];
  const textMatches = [...captionXml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)];
  const rawSegments = (pMatches.length ? pMatches : textMatches).map((m) => m[1] ?? "");

  return rawSegments.map((raw) =>
    decodeHtmlEntities(
      raw.replace(/<br\s*\/?>/g, " ").replace(/<[^>]+>/g, " "),
    ),
  );
};
const fetchYouTubeTranscript = async (url: string): Promise<string> => {
  const videoId = extractVideoId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  const playerRes = await fetch(
    `https://www.youtube.com/youtubei/v1/player?key=${YOUTUBE_INNERTUBE_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": YOUTUBE_ANDROID_CLIENT.userAgent,
        "Accept-Language": "en-US,en;q=0.9",
      },
      body: JSON.stringify({
        context: { client: YOUTUBE_ANDROID_CLIENT },
        videoId,
      }),
    },
  );

  if (!playerRes.ok) {
    throw new Error(`YouTube player fetch failed: ${playerRes.status}`);
  }

  const playerResponse = (await playerRes.json()) as {
    captions?: {
      playerCaptionsTracklistRenderer?: {
        captionTracks?: { baseUrl: string; languageCode: string }[];
      };
    };
  };

  const captionTracks =
    playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (!captionTracks || captionTracks.length === 0) {
    throw new Error("No captions available for this video");
  }

  const track =
    captionTracks.find(
      (t) => t.languageCode === "en" || t.languageCode.startsWith("en"),
    ) ?? captionTracks[0];

  const captionRes = await fetch(track.baseUrl, {
    headers: {
      "User-Agent": YOUTUBE_ANDROID_CLIENT.userAgent,
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!captionRes.ok) throw new Error(`Caption fetch failed: ${captionRes.status}`);
  const captionXml = await captionRes.text();

  const texts = extractCaptionText(captionXml);

  return texts.join(" ").replace(/\s+/g, " ").trim();
};

export const fetchYouTubeTranscriptDebug = fetchYouTubeTranscript;

const fetchYouTubeTitle = async (url: string): Promise<string | null> => {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url.trim())}&format=json`;
    const response = await fetch(oembedUrl);
    if (!response.ok) return null;
    const data = (await response.json()) as { title?: string };
    return typeof data.title === "string" && data.title.trim() ? data.title.trim() : null;
  } catch {
    return null;
  }
};

const resolveToTranscript = async (originalInput: string): Promise<string> => {
  if (!isYouTubeUrl(originalInput)) return originalInput;
  const transcript = await fetchYouTubeTranscript(originalInput);
  if (transcript.trim().length <= 50) {
    throw new Error("Could not fetch transcript for this video — captions may be disabled.");
  }
  return transcript;
};

const normalizeInput = (value: string) =>
  value.replace(/\s+/g, " ").replace(/[^\w\s-]/g, "").trim();

const toTitleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const extractTopic = (value: string) => {
  const cleaned = normalizeInput(value);
  if (!cleaned) {
    return "Authority Engine";
  }
  const words = cleaned.split(" ");
  return words.slice(0, 6).join(" ");
};

const toString = (value: unknown) => (typeof value === "string" ? value : "");

const toStringArray = (value: unknown) =>
  Array.isArray(value) ? value.map((item) => toString(item)) : [];

const sanitizeErrorMessage = (message: string) =>
  message.replace(/sk-[A-Za-z0-9_-]{10,}/g, "sk-***");

const LINKEDIN_GLOBAL_RULES = `You are writing for Korel: a B2B Founder Authority Engine.

Audience:
- SaaS founders
- B2B operators
- Angel investors
- Early-stage VCs
- Technical builders

Tone:
- Analytical, high-signal, concise, strategic, founder-level
- No fluff, no motivational tone, no generic storytelling
- No emojis or hashtags
- No "Meet X..." intros

CRITICAL — Grounding rules:
- Every claim, statistic, and insight MUST come directly from the transcript provided.
- NEVER invent statistics, market sizes, percentages, or facts not stated in the transcript.
- If the transcript is short, write a tighter post using only what is there. Do not pad with invented data.
- Violating this rule produces content the founder cannot publish. Stay grounded.

Global rules:
- Remove filler and corporate language.
- Prefer short sentences and clean spacing.
- Extract operator-level lessons from the transcript; do not summarize the story.
- No thread formatting. No 1/, 2/, 3/ numbering.
- Return only the post body. No headers. No commentary.

Length:
- Target 120-220 words. Never exceed 250 words.`;

const LINKEDIN_VARIANT_ANALYTICAL = `${LINKEDIN_GLOBAL_RULES}

Variant: Analytical (Strategic Breakdown)

Structure (hard constraint):
A) Opening: strong metric-based signal (ARR, margin, leverage).
B) Context: 1-2 short lines max explaining the business or opportunity.
C) Strategic breakdown: 3-5 sharp bullets.
D) Closing: clean insight line. No motivational CTA.

Transcript:
[TRANSCRIPT]`;

const LINKEDIN_VARIANT_CONTRARIAN = `${LINKEDIN_GLOBAL_RULES}

Variant: Contrarian Angle

Structure (hard constraint):
A) Opening: bold statement that reframes a common assumption.
B) Reframe: 1-2 short lines explaining the misread.
C) 3 insight bullets.
D) Sharp closing line.

Transcript:
[TRANSCRIPT]`;

const LINKEDIN_VARIANT_TACTICAL = `${LINKEDIN_GLOBAL_RULES}

Variant: Tactical Execution Blueprint

Structure (hard constraint):
A) Short performance summary.
B) Numbered framework (3-5 steps).
C) Minimal explanation.
D) Clean conclusion.

Transcript:
[TRANSCRIPT]`;

const LINKEDIN_VARIANTS = [
  {
    id: "analytical",
    label: "LinkedIn — Analytical",
    prompt: LINKEDIN_VARIANT_ANALYTICAL,
    requireBullets: true,
  },
  {
    id: "contrarian",
    label: "LinkedIn — Contrarian",
    prompt: LINKEDIN_VARIANT_CONTRARIAN,
    requireBullets: true,
  },
  {
    id: "tactical",
    label: "LinkedIn — Tactical",
    prompt: LINKEDIN_VARIANT_TACTICAL,
    requireNumbered: true,
  },
] as const;

const toUserFacingError = (message: string, status?: number) => {
  if (
    status === 401 ||
    /incorrect api key|invalid api key|no api key/i.test(message)
  ) {
    return "OpenAI API key is invalid or missing. Update OPENAI_API_KEY and restart the server.";
  }
  return sanitizeErrorMessage(message);
};

const ensureExactLength = (items: string[], length: number) => {
  const next = items.slice(0, length);
  while (next.length < length) {
    next.push("");
  }
  return next;
};

const ensureMinLength = (items: string[], minLength: number) => {
  const next = items.slice();
  while (next.length < minLength) {
    next.push("");
  }
  return next;
};

const ensureMaxLength = (items: string[], maxLength: number) =>
  items.slice(0, maxLength);

const countWords = (value: string) =>
  value.trim().split(/\s+/).filter(Boolean).length;

const hasParagraphBreaks = (value: string) => /\n\s*\n/.test(value);
const hasBullets = (value: string) => /^[-*•]\s+/m.test(value);
const hasNumberedSteps = (value: string) => /^\s*\d+\.\s+/m.test(value);
const hasThreadNumbering = (value: string) => /\b\d+\//.test(value);
const containsBannedIntro = (value: string) =>
  /\b(meet|ever wondered|welcome to|inspiring)\b/i.test(value);
const containsEmoji = (value: string) =>
  /[\u{1F300}-\u{1FAFF}]/u.test(value);

const looksLikeTitleOnly = (value: string) => {
  const trimmed = value.trim();
  const wordCount = countWords(trimmed);
  const singleLine = trimmed.split("\n").length === 1;
  return wordCount < 40 || (singleLine && wordCount < 80);
};

const shouldRegenerateLinkedIn = (
  value: string,
  rules?: { requireBullets?: boolean; requireNumbered?: boolean },
) => {
  if (!value.trim()) {
    return true;
  }
  const wordCount = countWords(value);
  if (wordCount < 120 || wordCount > 250) {
    return true;
  }
  if (!hasParagraphBreaks(value) && !hasBullets(value) && !hasNumberedSteps(value)) {
    return true;
  }
  if (rules?.requireBullets && !hasBullets(value)) {
    return true;
  }
  if (rules?.requireNumbered && !hasNumberedSteps(value)) {
    return true;
  }
  if (hasThreadNumbering(value)) {
    return true;
  }
  if (containsBannedIntro(value)) {
    return true;
  }
  if (containsEmoji(value)) {
    return true;
  }
  return looksLikeTitleOnly(value);
};

const normalizeLinkedInPost = (value: string) =>
  value.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

const generateLinkedInPostOnce = async (
  transcript: string,
  promptTemplate: string,
  systemMessage?: string,
): Promise<string> => {
  const prompt = promptTemplate.replace("[TRANSCRIPT]", transcript);
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          systemMessage ??
          "You are a B2B founder authority editor. Output only a concise LinkedIn post.",
      },
      { role: "user", content: prompt },
    ],
  });

  const text = response.choices[0]?.message?.content;
  if (typeof text !== "string" || !text) {
    throw new Error("OpenAI returned no LinkedIn content");
  }
  return normalizeLinkedInPost(text);
};

const generateLinkedInVariant = async (
  transcript: string,
  variant: (typeof LINKEDIN_VARIANTS)[number],
): Promise<string> => {
  const initial = await generateLinkedInPostOnce(
    transcript,
    variant.prompt,
  );
  const v = variant as { requireBullets?: boolean; requireNumbered?: boolean };
  if (!shouldRegenerateLinkedIn(initial, {
    requireBullets: v.requireBullets,
    requireNumbered: v.requireNumbered,
  })) {
    return `${variant.label}\n\n${initial}`;
  }
  const regenerated = await generateLinkedInPostOnce(
    transcript,
    variant.prompt,
    "Your previous response was too short or off-structure. Generate a complete LinkedIn post that follows the required format.",
  );
  return `${variant.label}\n\n${regenerated}`;
};

const generateLinkedInPosts = async (transcript: string): Promise<string[]> => {
  const posts = await Promise.all(
    LINKEDIN_VARIANTS.map((variant) => generateLinkedInVariant(transcript, variant)),
  );
  return ensureExactLength(posts, 3);
};

const normalizeEntries = (value: unknown) =>
  Array.isArray(value)
    ? value.map((entry) => {
        const record = typeof entry === "object" && entry !== null ? entry : {};
        const safe = record as Record<string, unknown>;
        return {
          asset: toString(safe.asset),
          platform: toString(safe.platform),
          format: toString(safe.format),
          angle: toString(safe.angle),
        };
      })
    : [];

const validateAndNormalizePack = (
  structuredPack: PartialPack,
): AuthorityPackStructure => {
  const coreThesis = structuredPack.coreThesis ?? {
    primaryThesis: "",
    supportingThemes: [],
    targetPersona: "",
  };

  const strategicHooks = structuredPack.strategicHooks ?? {
    linkedin: [],
    twitter: [],
    contrarian: [],
  };

  const highLeveragePosts = structuredPack.highLeveragePosts ?? {
    linkedinPosts: [],
    twitterThread: [],
    newsletterSummary: "",
  };

  const insightBreakdown = structuredPack.insightBreakdown ?? {
    strongClaims: [],
    dataBackedAngles: [],
    frameworks: [],
  };

  const repurposingMatrix = structuredPack.repurposingMatrix ?? { entries: [] };

  const executiveSummary = structuredPack.executiveSummary ?? {
    headline: "",
    positioningSentence: "",
    keyInsights: [],
  };

  return {
    title: toString(structuredPack.title) || "Authority Pack",
    coreThesis: {
      primaryThesis: toString(coreThesis.primaryThesis),
      supportingThemes: toStringArray(coreThesis.supportingThemes),
      targetPersona: toString(coreThesis.targetPersona),
    },
    strategicHooks: {
      linkedin: ensureExactLength(
        toStringArray(strategicHooks.linkedin),
        5,
      ),
      twitter: ensureExactLength(toStringArray(strategicHooks.twitter), 3),
      contrarian: ensureExactLength(
        toStringArray(strategicHooks.contrarian),
        3,
      ),
    },
    highLeveragePosts: {
      linkedinPosts: ensureExactLength(
        toStringArray(highLeveragePosts.linkedinPosts),
        3,
      ),
      twitterThread: ensureMaxLength(
        toStringArray(highLeveragePosts.twitterThread),
        8,
      ),
      newsletterSummary: toString(highLeveragePosts.newsletterSummary),
    },
    insightBreakdown: {
      strongClaims: ensureMinLength(
        toStringArray(insightBreakdown.strongClaims),
        3,
      ),
      dataBackedAngles: ensureMinLength(
        toStringArray(insightBreakdown.dataBackedAngles),
        3,
      ),
      frameworks: ensureMinLength(
        toStringArray(insightBreakdown.frameworks),
        3,
      ),
    },
    repurposingMatrix: {
      entries: normalizeEntries(repurposingMatrix.entries),
    },
    executiveSummary: {
      headline: toString(executiveSummary.headline),
      positioningSentence: toString(executiveSummary.positioningSentence),
      keyInsights: ensureExactLength(
        toStringArray(executiveSummary.keyInsights),
        5,
      ),
    },
  };
};

export const generateAuthorityPack = async (
  originalInput: string,
): Promise<AuthorityPackStructure> => {
  // If the user pasted a YouTube URL, fetch transcript and video title in parallel
  let aiContent = originalInput;
  let videoTitle: string | null = null;
  if (isYouTubeUrl(originalInput)) {
    const [transcriptResult, titleResult] = await Promise.allSettled([
      fetchYouTubeTranscript(originalInput),
      fetchYouTubeTitle(originalInput),
    ]);

    videoTitle =
      titleResult.status === "fulfilled" ? titleResult.value : null;

    if (transcriptResult.status === "fulfilled" && transcriptResult.value.trim().length > 50) {
      aiContent = transcriptResult.value;
      console.log(
        `YouTube data fetched — title: "${videoTitle ?? "n/a"}", transcript: ${aiContent.length} chars`,
      );
    } else {
      if (transcriptResult.status === "rejected") {
        const errMsg =
          transcriptResult.reason instanceof Error
            ? transcriptResult.reason.message
            : String(transcriptResult.reason);
        console.error("YouTube transcript fetch failed:", errMsg);
      } else {
        console.error(
          `YouTube transcript returned empty (${transcriptResult.value.trim().length} chars)`,
        );
      }
      throw new Error(
        `Could not fetch transcript for this video — captions may be disabled. ` +
          `Please copy the transcript from YouTube (More > Transcript) and paste it directly.`,
      );
    }
  }

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You generate structured Authority Packs. Output must be valid JSON that matches the provided schema exactly.",
      },
      {
        role: "user",
        content: `Create a structured Authority Pack from the following input.\n\n${AUTHORITY_PACK_CONTENT_RULES}\n\nInput:\n${aiContent}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "authority_pack",
        strict: true,
        schema: AUTHORITY_PACK_SCHEMA as Record<string, unknown>,
      },
    },
  });

  const text = response.choices[0]?.message?.content;

  if (typeof text !== "string" || !text) {
    throw new Error("OpenAI returned no text content");
  }

  let aiJson: unknown;
  try {
    aiJson = JSON.parse(text);
  } catch {
    throw new Error("OpenAI response was not valid JSON");
  }

  const basePack = validateAndNormalizePack(aiJson as PartialPack);
  // YouTube video title takes priority over the AI-derived title
  const resolvedPack = videoTitle ? { ...basePack, title: videoTitle } : basePack;

  try {
    const linkedinPosts = await generateLinkedInPosts(aiContent);
    return {
      ...resolvedPack,
      highLeveragePosts: {
        ...resolvedPack.highLeveragePosts,
        linkedinPosts,
      },
    };
  } catch (err) {
    console.error("LinkedIn generation failed, using base pack:", err);
    return resolvedPack;
  }
}

const TRANSCRIPT_UNAVAILABLE_MARKER = "Could not fetch transcript for this video";

export const generateAuthorityPackSafe = async (
  originalInput: string,
): Promise<{ pack: AuthorityPackStructure; error?: string; transcriptUnavailable?: boolean }> => {
  try {
    const pack = await generateAuthorityPack(originalInput);
    return { pack };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (message.startsWith(TRANSCRIPT_UNAVAILABLE_MARKER)) {
      const topic = extractTopic(
        originalInput.replace(/\s+/g, " ").replace(/[^\w\s-]/g, "").trim(),
      );
      const title = toTitleCase(topic) || "Authority Pack";
      return {
        pack: validateAndNormalizePack({ title }),
        error: message,
        transcriptUnavailable: true,
      };
    }

    const status =
      typeof err === "object" && err !== null && "status" in err
        ? (err as { status?: number }).status
        : undefined;
    const safeMessage = toUserFacingError(message, status);
    console.error("Authority pack generation failed:", safeMessage);
    const topic = extractTopic(
      originalInput.replace(/\s+/g, " ").replace(/[^\w\s-]/g, "").trim(),
    );
    const title = toTitleCase(topic) || "Authority Pack";
    return {
      pack: validateAndNormalizePack({ title }),
      error: safeMessage,
    };
  }
};

// ─── Section-level regeneration ───────────────────────────────────────────────

const generateXThreadContent = async (transcript: string): Promise<string[]> => {
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "Generate an X (Twitter) thread for B2B founders. Output valid JSON matching the schema exactly. Only use information from the provided content.",
      },
      {
        role: "user",
        content: `Create an X thread from this content.\n\n${AUTHORITY_PACK_CONTENT_RULES}\n\nContent:\n${transcript}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "xthread",
        strict: true,
        schema: XTHREAD_SCHEMA as Record<string, unknown>,
      },
    },
  });
  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error("OpenAI returned no content for X thread");
  const parsed = JSON.parse(text) as { tweets?: unknown };
  return ensureMinLength(ensureMaxLength(toStringArray(parsed.tweets), 8), 4);
};

const HOOKS_RULES = `Generate strategic hooks for a B2B founder authority pack.

CRITICAL — Only use information explicitly present in the provided content. No invented facts.
Required counts:
- linkedin: exactly 5 hook strings
- twitter: exactly 3 hook strings
- contrarian: exactly 3 contrarian angle strings`;

const generateHooksContent = async (transcript: string): Promise<StrategicHooks> => {
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "Generate strategic hooks for B2B founders. Output valid JSON matching the schema exactly.",
      },
      {
        role: "user",
        content: `Create strategic hooks from this content.\n\n${HOOKS_RULES}\n\nContent:\n${transcript}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "strategic_hooks",
        strict: true,
        schema: HOOKS_SCHEMA as Record<string, unknown>,
      },
    },
  });
  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error("OpenAI returned no content for hooks");
  const parsed = JSON.parse(text) as {
    linkedin?: unknown;
    twitter?: unknown;
    contrarian?: unknown;
  };
  return {
    linkedin: ensureExactLength(toStringArray(parsed.linkedin), 5),
    twitter: ensureExactLength(toStringArray(parsed.twitter), 3),
    contrarian: ensureExactLength(toStringArray(parsed.contrarian), 3),
  };
};

export const regenerateLinkedInVariantSafe = async (
  originalInput: string,
  variantIndex: 0 | 1 | 2,
): Promise<{ post: string; error?: string }> => {
  try {
    const transcript = await resolveToTranscript(originalInput);
    const variant = LINKEDIN_VARIANTS[variantIndex];
    const post = await generateLinkedInVariant(transcript, variant);
    return { post };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { post: "", error: sanitizeErrorMessage(message) };
  }
};

export const regenerateXThreadSafe = async (
  originalInput: string,
): Promise<{ thread: string[]; error?: string }> => {
  try {
    const transcript = await resolveToTranscript(originalInput);
    const thread = await generateXThreadContent(transcript);
    return { thread };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { thread: [], error: sanitizeErrorMessage(message) };
  }
};

export const regenerateHooksSafe = async (
  originalInput: string,
): Promise<{ hooks: StrategicHooks; error?: string }> => {
  try {
    const transcript = await resolveToTranscript(originalInput);
    const hooks = await generateHooksContent(transcript);
    return { hooks };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      hooks: { linkedin: [], twitter: [], contrarian: [] },
      error: sanitizeErrorMessage(message),
    };
  }
};
