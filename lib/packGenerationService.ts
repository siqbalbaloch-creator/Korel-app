import { openai } from "./openai";
import {
  ExtractedInsights,
  InputType,
  AngleType,
  AuthorityProfileContext,
  StrategicAuthorityMap,
  StrategicClaim,
  EvidencePoint,
  HookCategory,
  EXTRACTION_SYSTEM_PROMPT,
  EXTRACTION_JSON_RETRY_INSTRUCTION,
  PLATFORM_SYSTEM_PROMPT,
  SAM_EXTRACTION_SYSTEM_PROMPT,
  SAM_PLATFORM_SYSTEM_PROMPT,
  SAM_JSON_SCHEMA,
  buildExtractionUserPrompt,
  buildSAMExtractionPrompt,
  buildLinkedInFromSAMPrompt,
  buildLinkedInFromSAMWithContextPrompt,
  buildXThreadFromSAMPrompt,
  buildNewsletterFromSAMPrompt,
  buildLinkedInVariantAPrompt,
  buildLinkedInVariantBPrompt,
  buildXThreadPrompt,
  buildNewsletterPrompt,
  buildLinkedInVariantAWithContextPrompt,
  buildLinkedInVariantBWithContextPrompt,
  buildXThreadWithContextPrompt,
} from "@/ai/prompts";
import { logger } from "@/lib/logger";
import type { ErrorCode } from "@/lib/apiError";
import type { QualityBreakdown } from "@/lib/calculateQualityScore";

type CoreThesis = {
  primaryThesis: string;
  supportingThemes: string[];
  targetPersona: string;
};

type StrategicContext = {
  thesis: string;
  themes: string[];
  mechanisms: string[];
  evidence: string[];
  contrarian: string;
  qualitySignals: {
    themeCount: number;
    mechanismCount: number;
    evidenceCount: number;
  };
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

type PlatformAssets = {
  linkedinA: string;
  linkedinB: string;
  xThread: string;
  newsletter: string;
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
  /** Phase 16: SAM attached alongside pack for DB storage. Not a displayed section. */
  strategicMap?: StrategicAuthorityMap;
};

export class PackGenerationError extends Error {
  code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = "PackGenerationError";
    this.code = code;
  }
}

export const isPackGenerationError = (err: unknown): err is PackGenerationError =>
  err instanceof PackGenerationError;

const createPackError = (code: ErrorCode, message: string) =>
  new PackGenerationError(code, message);

const MODEL = "gpt-4o-mini";
const TEMPERATURE = 0.4;

const MAX_TOKENS = {
  extraction: { min: 450, max: 900 },
  sam: { min: 900, max: 2400 }, // Phase 16: SAM is substantially larger than insights
  linkedin: 650,
  xthread: 700,
  newsletter: 900,
} as const;

const MAX_TRANSCRIPT_CHARS = 150_000;
const TRANSCRIPT_UNAVAILABLE_MESSAGE =
  "Could not fetch transcript for this video -- captions may be disabled.";

const INSIGHTS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "primaryThesis",
    "supportingThemes",
    "contrarianAngle",
    "keyPoints",
    "notableStatsOrClaims",
  ],
  properties: {
    primaryThesis: { type: "string" },
    supportingThemes: { type: "array", items: { type: "string" } },
    contrarianAngle: { type: "string" },
    keyPoints: { type: "array", items: { type: "string" } },
    notableStatsOrClaims: { type: "array", items: { type: "string" } },
  },
} as const;

const YOUTUBE_URL_REGEX =
  /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

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

const fetchWithNetworkRetry = async (
  label: string,
  url: string,
  options: RequestInit,
): Promise<Response> => {
  try {
    return await fetch(url, options);
  } catch (err) {
    logger.warn("transcript.fetch_retry", { label });
  }

  try {
    return await fetch(url, options);
  } catch (err) {
    logger.error("transcript.fetch_failed", { label });
    throw createPackError("TRANSCRIPT_UNAVAILABLE", TRANSCRIPT_UNAVAILABLE_MESSAGE);
  }
};

const fetchYouTubeTranscript = async (url: string): Promise<string> => {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw createPackError("INPUT_INVALID_URL", "Invalid YouTube URL");
  }

  const playerRes = await fetchWithNetworkRetry(
    "player",
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

  const captionRes = await fetchWithNetworkRetry("caption", track.baseUrl, {
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
    throw createPackError(
      "TRANSCRIPT_UNAVAILABLE",
      TRANSCRIPT_UNAVAILABLE_MESSAGE,
    );
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

const normalizeLinkedInPost = (value: string) =>
  value.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

const normalizeThreadLines = (value: string) =>
  value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const normalizeForOverlap = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const toTokenSet = (value: string) =>
  new Set(normalizeForOverlap(value).split(" ").filter(Boolean));

const jaccardSimilarity = (a: Set<string>, b: Set<string>) => {
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  a.forEach((token) => {
    if (b.has(token)) intersection += 1;
  });
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
};

const stringSimilarity = (a: string, b: string) => {
  const normalizedA = normalizeForOverlap(a);
  const normalizedB = normalizeForOverlap(b);
  if (!normalizedA || !normalizedB) return 0;
  if (normalizedA === normalizedB) return 1;
  if (normalizedA.includes(normalizedB) || normalizedB.includes(normalizedA)) {
    return 0.9;
  }
  return jaccardSimilarity(toTokenSet(normalizedA), toTokenSet(normalizedB));
};

const hasStrategicOverlap = (a: string, b: string) =>
  stringSimilarity(a, b) >= 0.7;

const estimateMaxTokens = (input: string, min: number, max: number) => {
  const scaled = Math.ceil(input.length / 30);
  return Math.min(max, Math.max(min, scaled));
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

class ExtractionParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractionParseError";
  }
}

const tryParseJson = (raw: string): unknown | null => {
  try {
    return JSON.parse(raw);
  } catch {
    // continue to recovery attempts
  }

  const fenced =
    raw.match(/```json\s*([\s\S]*?)```/i) ??
    raw.match(/```\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      // continue
    }
  }

  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first >= 0 && last > first) {
    const slice = raw.slice(first, last + 1);
    try {
      return JSON.parse(slice);
    } catch {
      // final fallback
    }
  }

  return null;
};

const validateInsightsPayload = (value: unknown): value is ExtractedInsights => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.primaryThesis === "string" &&
    typeof record.contrarianAngle === "string" &&
    isStringArray(record.supportingThemes) &&
    isStringArray(record.keyPoints) &&
    isStringArray(record.notableStatsOrClaims)
  );
};

const validateInsightStructure = (value: unknown): value is ExtractedInsights =>
  validateInsightsPayload(value);

const validateStrategicCoherence = (insights: ExtractedInsights): { ok: boolean; reason?: string } => {
  const thesis = insights.primaryThesis;
  const themes = insights.supportingThemes.filter(Boolean);
  const contrarian = insights.contrarianAngle;

  if (thesis) {
    if (themes.some((theme) => hasStrategicOverlap(thesis, theme))) {
      return { ok: false, reason: "thesis_theme_overlap" };
    }
    if (contrarian && hasStrategicOverlap(thesis, contrarian)) {
      return { ok: false, reason: "thesis_contrarian_overlap" };
    }
  }

  for (let i = 0; i < themes.length; i += 1) {
    for (let j = i + 1; j < themes.length; j += 1) {
      if (hasStrategicOverlap(themes[i] ?? "", themes[j] ?? "")) {
        return { ok: false, reason: "themes_overlap" };
      }
    }
  }

  return { ok: true };
};

const normalizeInsights = (value: ExtractedInsights): ExtractedInsights => ({
  primaryThesis: value.primaryThesis.trim(),
  supportingThemes: value.supportingThemes.map((item) => item.trim()).filter(Boolean),
  contrarianAngle: value.contrarianAngle.trim(),
  keyPoints: value.keyPoints.map((item) => item.trim()).filter(Boolean),
  notableStatsOrClaims: value.notableStatsOrClaims.map((item) => item.trim()).filter(Boolean),
});

const buildStrategicContext = (insights: ExtractedInsights): StrategicContext => ({
  thesis: insights.primaryThesis,
  themes: insights.supportingThemes,
  mechanisms: insights.keyPoints,
  evidence: insights.notableStatsOrClaims,
  contrarian: insights.contrarianAngle,
  qualitySignals: {
    themeCount: insights.supportingThemes.length,
    mechanismCount: insights.keyPoints.length,
    evidenceCount: insights.notableStatsOrClaims.length,
  },
});

const toInsightsFromContext = (context: StrategicContext): ExtractedInsights => ({
  primaryThesis: context.thesis,
  supportingThemes: context.themes,
  contrarianAngle: context.contrarian,
  keyPoints: context.mechanisms,
  notableStatsOrClaims: context.evidence,
});

const buildInsightPhrases = (context: StrategicContext): string[] =>
  [
    context.thesis,
    context.contrarian,
    ...context.themes,
    ...context.mechanisms,
    ...context.evidence,
  ].map((item) => item.trim()).filter(Boolean);

const exceedsInsightOverlap = (assetText: string, phrases: string[]): boolean => {
  if (phrases.length < 2) return false;
  const normalizedAsset = normalizeForOverlap(assetText);
  if (!normalizedAsset) return false;
  const matchCount = phrases.reduce((count, phrase) => {
    const normalizedPhrase = normalizeForOverlap(phrase);
    if (!normalizedPhrase) return count;
    return normalizedAsset.includes(normalizedPhrase) ? count + 1 : count;
  }, 0);
  return matchCount / phrases.length > 0.5;
};

const enforceOverlapGuard = async (
  label: string,
  userPrompt: string,
  maxTokens: number,
  context: StrategicContext,
  normalize: (value: string) => string,
  systemPrompt: string = PLATFORM_SYSTEM_PROMPT,
): Promise<string> => {
  const phrases = buildInsightPhrases(context);

  const run = async (prompt: string, applyGuard: boolean): Promise<string> => {
    const text = await generatePlainText(label, prompt, maxTokens, systemPrompt);
    const normalized = normalize(text);
    if (!applyGuard) return normalized;
    if (exceedsInsightOverlap(normalized, phrases)) {
      const retryPrompt = `${prompt}\n\nInstruction: Rephrase and expand strategically without repeating the insight wording.`;
      return run(retryPrompt, false);
    }
    return normalized;
  };

  return run(userPrompt, true);
};

const enforceInsightGuard = <T>(assets: T): T => assets;

const emptyAuthorityPack = (title: string): AuthorityPackStructure => ({
  title,
  coreThesis: { primaryThesis: "", supportingThemes: [], targetPersona: "" },
  strategicHooks: { linkedin: [], twitter: [], contrarian: [] },
  highLeveragePosts: { linkedinPosts: ["", "", ""], twitterThread: [], newsletterSummary: "" },
  insightBreakdown: { strongClaims: [], dataBackedAngles: [], frameworks: [] },
  repurposingMatrix: { entries: [] },
  executiveSummary: { headline: "", positioningSentence: "", keyInsights: [] },
});

const extractStructuredInsights = async (
  transcript: string,
  inputType: InputType = "INTERVIEW",
  angle: AngleType = "THOUGHT_LEADERSHIP",
  profile?: AuthorityProfileContext | null,
): Promise<ExtractedInsights> => {
  const runExtraction = async (extraInstruction?: string) => {
    const userPrompt = extraInstruction
      ? `${buildExtractionUserPrompt(transcript, inputType, angle, profile)}\n\nAdditional instruction: ${extraInstruction}`
      : buildExtractionUserPrompt(transcript, inputType, angle, profile);
    const response = await openai.chat.completions.create({
      model: MODEL,
      temperature: TEMPERATURE,
      max_tokens: estimateMaxTokens(transcript, MAX_TOKENS.extraction.min, MAX_TOKENS.extraction.max),
      messages: [
        { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "extracted_insights",
          strict: true,
          schema: INSIGHTS_SCHEMA as Record<string, unknown>,
        },
      },
    });

    const text = response.choices[0]?.message?.content;
    if (typeof text !== "string" || !text) {
      throw new ExtractionParseError("OpenAI returned no text content for insights");
    }

    let aiJson: unknown;
    try {
      aiJson = JSON.parse(text);
    } catch {
      throw new ExtractionParseError("OpenAI response was not valid JSON");
    }

    if (!validateInsightStructure(aiJson)) {
      throw new ExtractionParseError("OpenAI response did not match insights schema");
    }

    return normalizeInsights(aiJson);
  };

  const extractWithParseRetry = async (extraInstruction?: string) => {
    try {
      return await runExtraction(extraInstruction);
    } catch (err) {
      if (!(err instanceof ExtractionParseError)) {
        throw err;
      }
    }

    const reinforcedInstruction = extraInstruction
      ? `${extraInstruction} ${EXTRACTION_JSON_RETRY_INSTRUCTION}`
      : EXTRACTION_JSON_RETRY_INSTRUCTION;

    try {
      return await runExtraction(reinforcedInstruction);
    } catch (err) {
      if (err instanceof ExtractionParseError) {
        throw createPackError("EXTRACTION_PARSE_FAILED", err.message);
      }
      throw err;
    }
  };

  const initial = await extractWithParseRetry();
  const coherence = validateStrategicCoherence(initial);
  if (!coherence.ok) {
    logger.debug("extraction.coherence_retry", { reason: coherence.reason });
    const refined = await extractWithParseRetry(
      "Ensure all sections are strategically distinct and non-redundant.",
    );
    logger.debug("extraction.validation_passed", { coherenceRetry: true });
    return refined;
  }

  logger.debug("extraction.validation_passed");
  return initial;
};

export const extractInsights = async (
  transcript: string,
  inputType: InputType = "INTERVIEW",
  angle: AngleType = "THOUGHT_LEADERSHIP",
  profile?: AuthorityProfileContext | null,
): Promise<ExtractedInsights> =>
  extractStructuredInsights(transcript, inputType, angle, profile);

const generatePlainText = async (
  label: string,
  userPrompt: string,
  maxTokens: number,
  systemPrompt: string = PLATFORM_SYSTEM_PROMPT,
): Promise<string> => {
  const response = await openai.chat.completions.create({
    model: MODEL,
    temperature: TEMPERATURE,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const text = response.choices[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error(`OpenAI returned no content for ${label}`);
  }
  return text.trim();
};

const generatePlainTextWithRetry = async (
  label: string,
  userPrompt: string,
  maxTokens: number,
  systemPrompt: string = PLATFORM_SYSTEM_PROMPT,
): Promise<string> => {
  try {
    return await generatePlainText(label, userPrompt, maxTokens, systemPrompt);
  } catch (err) {
    const retryMaxTokens = Math.max(200, Math.floor(maxTokens * 0.7));
    return await generatePlainText(label, userPrompt, retryMaxTokens, systemPrompt);
  }
};

const generateAssetWithRetry = async (
  label: string,
  userPrompt: string,
  maxTokens: number,
  context: StrategicContext,
  normalize: (value: string) => string,
  systemPrompt: string = PLATFORM_SYSTEM_PROMPT,
): Promise<string> => {
  const attempt = async (tokenLimit: number) =>
    enforceOverlapGuard(label, userPrompt, tokenLimit, context, normalize, systemPrompt);

  try {
    return await attempt(maxTokens);
  } catch (err) {
    const retryMaxTokens = Math.max(200, Math.floor(maxTokens * 0.7));
    try {
      return await attempt(retryMaxTokens);
    } catch (retryErr) {
      const message = retryErr instanceof Error ? retryErr.message : String(retryErr);
      throw createPackError(
        "ASSET_GEN_FAILED",
        `${label} generation failed: ${sanitizeErrorMessage(message)}`,
      );
    }
  }
};

const generatePlatformAssets = async (
  context: StrategicContext,
  inputType: InputType = "INTERVIEW",
  angle: AngleType = "THOUGHT_LEADERSHIP",
  profile?: AuthorityProfileContext | null,
): Promise<PlatformAssets> => {
  const insights = toInsightsFromContext(context);

  const linkedinA = await generateAssetWithRetry(
    "LinkedIn variant A",
    buildLinkedInVariantAPrompt(insights, inputType, angle, profile),
    MAX_TOKENS.linkedin,
    context,
    normalizeLinkedInPost,
  );
  const linkedinB = await generateAssetWithRetry(
    "LinkedIn variant B",
    buildLinkedInVariantBPrompt(insights, inputType, angle, profile),
    MAX_TOKENS.linkedin,
    context,
    normalizeLinkedInPost,
  );
  const xThread = await generateAssetWithRetry(
    "X thread",
    buildXThreadPrompt(insights, inputType, angle, profile),
    MAX_TOKENS.xthread,
    context,
    (text) => text.replace(/\r\n/g, "\n").trim(),
  );
  const newsletter = await generateAssetWithRetry(
    "Newsletter",
    buildNewsletterPrompt(insights, inputType, angle, profile),
    MAX_TOKENS.newsletter,
    context,
    (text) => text.replace(/\r\n/g, "\n").trim(),
  );

  return enforceInsightGuard({ linkedinA, linkedinB, xThread, newsletter });
};

const finalizeAuthorityPack = (
  title: string,
  context: StrategicContext,
  assets: PlatformAssets,
): AuthorityPackStructure =>
  buildAuthorityPackFromInsights(title, toInsightsFromContext(context), assets);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNonEmptyStringArray = (value: unknown, minLength = 1): value is string[] =>
  isStringArray(value) && value.filter((item) => item.trim().length > 0).length >= minLength;

export const validatePackCompleteness = (
  pack: AuthorityPackStructure,
  qualityScore: number,
  qualityBreakdown: QualityBreakdown,
): { ok: boolean; reason?: string } => {
  if (!pack || typeof pack !== "object") return { ok: false, reason: "pack_missing" };
  if (!isNonEmptyString(pack.title)) return { ok: false, reason: "title_missing" };

  if (!pack.coreThesis || typeof pack.coreThesis !== "object") {
    return { ok: false, reason: "core_thesis_missing" };
  }
  if (!isNonEmptyString(pack.coreThesis.primaryThesis)) {
    return { ok: false, reason: "primary_thesis_missing" };
  }
  if (!isNonEmptyStringArray(pack.coreThesis.supportingThemes)) {
    return { ok: false, reason: "supporting_themes_missing" };
  }

  if (!pack.strategicHooks || typeof pack.strategicHooks !== "object") {
    return { ok: false, reason: "strategic_hooks_missing" };
  }
  if (!isNonEmptyStringArray(pack.strategicHooks.linkedin, 2)) {
    return { ok: false, reason: "hooks_linkedin_missing" };
  }
  if (!isNonEmptyStringArray(pack.strategicHooks.twitter, 1)) {
    return { ok: false, reason: "hooks_twitter_missing" };
  }
  if (!isNonEmptyStringArray(pack.strategicHooks.contrarian, 1)) {
    return { ok: false, reason: "hooks_contrarian_missing" };
  }

  if (!pack.highLeveragePosts || typeof pack.highLeveragePosts !== "object") {
    return { ok: false, reason: "posts_missing" };
  }
  if (!isNonEmptyStringArray(pack.highLeveragePosts.linkedinPosts, 2)) {
    return { ok: false, reason: "linkedin_posts_missing" };
  }
  if (!isNonEmptyStringArray(pack.highLeveragePosts.twitterThread, 1)) {
    return { ok: false, reason: "x_thread_missing" };
  }
  if (!isNonEmptyString(pack.highLeveragePosts.newsletterSummary)) {
    return { ok: false, reason: "newsletter_missing" };
  }

  if (!pack.insightBreakdown || typeof pack.insightBreakdown !== "object") {
    return { ok: false, reason: "insight_breakdown_missing" };
  }
  if (!isNonEmptyStringArray(pack.insightBreakdown.strongClaims, 1)) {
    return { ok: false, reason: "insight_strong_claims_missing" };
  }
  if (!isNonEmptyStringArray(pack.insightBreakdown.dataBackedAngles, 1)) {
    return { ok: false, reason: "insight_data_backed_missing" };
  }
  if (!isNonEmptyStringArray(pack.insightBreakdown.frameworks, 1)) {
    return { ok: false, reason: "insight_frameworks_missing" };
  }

  if (!pack.repurposingMatrix || typeof pack.repurposingMatrix !== "object") {
    return { ok: false, reason: "repurposing_matrix_missing" };
  }
  if (!Array.isArray(pack.repurposingMatrix.entries)) {
    return { ok: false, reason: "repurposing_entries_missing" };
  }

  if (!pack.executiveSummary || typeof pack.executiveSummary !== "object") {
    return { ok: false, reason: "executive_summary_missing" };
  }
  if (!isNonEmptyString(pack.executiveSummary.headline)) {
    return { ok: false, reason: "executive_headline_missing" };
  }
  if (!isNonEmptyString(pack.executiveSummary.positioningSentence)) {
    return { ok: false, reason: "executive_positioning_missing" };
  }
  if (!isNonEmptyStringArray(pack.executiveSummary.keyInsights, 1)) {
    return { ok: false, reason: "executive_key_insights_missing" };
  }

  if (!pack.strategicMap || !validateSAM(pack.strategicMap)) {
    return { ok: false, reason: "strategic_map_missing" };
  }

  if (!Number.isFinite(qualityScore)) {
    return { ok: false, reason: "quality_score_missing" };
  }
  if (!qualityBreakdown || typeof qualityBreakdown !== "object") {
    return { ok: false, reason: "quality_breakdown_missing" };
  }
  const breakdown = qualityBreakdown as Record<string, unknown>;
  const breakdownKeys = ["coreThesis", "hooks", "posts", "insights", "summary"];
  if (!breakdownKeys.every((key) => Number.isFinite(breakdown[key] as number))) {
    return { ok: false, reason: "quality_breakdown_invalid" };
  }

  return { ok: true };
};

export const generateLinkedInVariantA = async (
  insights: ExtractedInsights,
  inputType: InputType = "INTERVIEW",
  angle: AngleType = "THOUGHT_LEADERSHIP",
  profile?: AuthorityProfileContext | null,
): Promise<string> => {
  const context = buildStrategicContext(insights);
  const promptInsights = toInsightsFromContext(context);
  const text = await generatePlainText(
    "LinkedIn variant A",
    buildLinkedInVariantAPrompt(promptInsights, inputType, angle, profile),
    MAX_TOKENS.linkedin,
  );
  return normalizeLinkedInPost(text);
};

export const generateLinkedInVariantB = async (
  insights: ExtractedInsights,
  inputType: InputType = "INTERVIEW",
  angle: AngleType = "THOUGHT_LEADERSHIP",
  profile?: AuthorityProfileContext | null,
): Promise<string> => {
  const context = buildStrategicContext(insights);
  const promptInsights = toInsightsFromContext(context);
  const text = await generatePlainText(
    "LinkedIn variant B",
    buildLinkedInVariantBPrompt(promptInsights, inputType, angle, profile),
    MAX_TOKENS.linkedin,
  );
  return normalizeLinkedInPost(text);
};

export const generateXThread = async (
  insights: ExtractedInsights,
  inputType: InputType = "INTERVIEW",
  angle: AngleType = "THOUGHT_LEADERSHIP",
  profile?: AuthorityProfileContext | null,
): Promise<string> => {
  const context = buildStrategicContext(insights);
  const promptInsights = toInsightsFromContext(context);
  const text = await generatePlainText(
    "X thread",
    buildXThreadPrompt(promptInsights, inputType, angle, profile),
    MAX_TOKENS.xthread,
  );
  return text.replace(/\r\n/g, "\n").trim();
};

export const generateNewsletter = async (
  insights: ExtractedInsights,
  inputType: InputType = "INTERVIEW",
  angle: AngleType = "THOUGHT_LEADERSHIP",
  profile?: AuthorityProfileContext | null,
): Promise<string> => {
  const context = buildStrategicContext(insights);
  const promptInsights = toInsightsFromContext(context);
  const text = await generatePlainText(
    "newsletter",
    buildNewsletterPrompt(promptInsights, inputType, angle, profile),
    MAX_TOKENS.newsletter,
  );
  return text.replace(/\r\n/g, "\n").trim();
};

/** Strip weak lead-in phrases that dilute hook strength. */
const toLinkedInHook = (text: string): string => {
  if (!text.trim()) return text;
  return text.trim().replace(
    /^(the fact that|it is important to|there is a|this is|you should|one of the key|one of the|in order to|we need to)\s+/i,
    "",
  );
};

/** Reframe raw insight as a contrarian hook if it doesn't already read like one. */
const toContrarianHook = (text: string): string => {
  const t = text.trim();
  if (!t) return t;
  if (/^(most|stop|not |don't|never|the problem|wrong|forget|the real|ignore|what if)/i.test(t)) {
    return t;
  }
  return `The real issue: ${t.charAt(0).toLowerCase()}${t.slice(1)}`;
};

const deriveStrategicHooks = (insights: ExtractedInsights): StrategicHooks => {
  const linkedinCandidates = [
    ...insights.keyPoints,
    ...insights.supportingThemes,
    insights.primaryThesis,
  ].filter(Boolean).map(toLinkedInHook);

  const twitterCandidates = [
    ...insights.notableStatsOrClaims,
    ...insights.keyPoints,
  ].filter(Boolean);

  const contrarianCandidates = [
    insights.contrarianAngle,
    ...insights.supportingThemes,
  ].filter(Boolean).map(toContrarianHook);

  return {
    linkedin: ensureExactLength(linkedinCandidates, 5),
    twitter: ensureExactLength(twitterCandidates, 3),
    contrarian: ensureExactLength(contrarianCandidates, 3),
  };
};

const buildLinkedInVariantC = (context: StrategicContext): string => {
  const insights = toInsightsFromContext(context);
  const steps = ensureMaxLength(
    [...insights.keyPoints, ...insights.supportingThemes],
    5,
  ).filter(Boolean);
  const lines: string[] = [];

  if (insights.primaryThesis) {
    lines.push(insights.primaryThesis);
  }
  if (insights.supportingThemes[0]) {
    lines.push(`Context: ${insights.supportingThemes[0]}`);
  }
  if (steps.length) {
    lines.push("");
    steps.forEach((step, index) => {
      lines.push(`${index + 1}. ${step}`);
    });
  }
  if (insights.contrarianAngle) {
    lines.push("");
    lines.push(insights.contrarianAngle);
  }

  return normalizeLinkedInPost(lines.join("\n").trim());
};

const deriveInsightBreakdown = (insights: ExtractedInsights): InsightBreakdown => ({
  strongClaims: ensureMinLength(insights.keyPoints, 3),
  dataBackedAngles: ensureMinLength(insights.notableStatsOrClaims, 3),
  frameworks: ensureMinLength(insights.supportingThemes, 3),
});

const deriveExecutiveSummary = (insights: ExtractedInsights): ExecutiveSummary => ({
  headline: insights.primaryThesis,
  positioningSentence: insights.contrarianAngle,
  keyInsights: ensureExactLength(
    [...insights.keyPoints, ...insights.supportingThemes],
    5,
  ),
});

const deriveRepurposingMatrix = (insights: ExtractedInsights): RepurposingMatrix => {
  const angles = [
    ...insights.supportingThemes,
    insights.contrarianAngle,
    insights.primaryThesis,
  ].filter(Boolean);

  return {
    entries: [
      {
        asset: "LinkedIn Post A",
        platform: "LinkedIn",
        format: "Post",
        angle: angles[0] ?? insights.primaryThesis,
      },
      {
        asset: "LinkedIn Post B",
        platform: "LinkedIn",
        format: "Post",
        angle: angles[1] ?? angles[0] ?? insights.primaryThesis,
      },
      {
        asset: "X Thread",
        platform: "X",
        format: "Thread",
        angle: angles[2] ?? insights.contrarianAngle ?? insights.primaryThesis,
      },
      {
        asset: "Newsletter",
        platform: "Email",
        format: "Newsletter",
        angle: angles[0] ?? insights.primaryThesis,
      },
    ],
  };
};

const buildAuthorityPackFromInsights = (
  title: string,
  insights: ExtractedInsights,
  assets: {
    linkedinA: string;
    linkedinB: string;
    xThread: string;
    newsletter: string;
  },
): AuthorityPackStructure => {
  const twitterThread = normalizeThreadLines(assets.xThread);
  if (!twitterThread.length) {
    throw new Error("X thread output was empty");
  }
  const linkedinC = buildLinkedInVariantC(buildStrategicContext(insights));

  return {
    title: title || "Authority Pack",
    coreThesis: {
      primaryThesis: insights.primaryThesis,
      supportingThemes: insights.supportingThemes,
      targetPersona: "",
    },
    strategicHooks: deriveStrategicHooks(insights),
    highLeveragePosts: {
      linkedinPosts: ensureExactLength(
        [assets.linkedinA, assets.linkedinB, linkedinC],
        3,
      ),
      twitterThread: ensureMaxLength(twitterThread, 8),
      newsletterSummary: assets.newsletter,
    },
    insightBreakdown: deriveInsightBreakdown(insights),
    repurposingMatrix: deriveRepurposingMatrix(insights),
    executiveSummary: deriveExecutiveSummary(insights),
  };
};

// ---------------------------------------------------------------------------
// Phase 16 — StrategicAuthorityMap extraction + SAM-based generation
// ---------------------------------------------------------------------------

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const validateSAM = (value: unknown): value is StrategicAuthorityMap => {
  if (!isObject(value)) return false;

  const isNonEmptyStringArrayWithin = (
    v: unknown,
    min: number,
    max?: number,
  ): v is string[] =>
    Array.isArray(v) &&
    v.length >= min &&
    (max === undefined || v.length <= max) &&
    v.every((item) => isNonEmptyString(item));

  const requiredClaimIds = new Set<StrategicClaim["id"]>(["C1", "C2", "C3"]);
  const requiredHookCategories = new Set<HookCategory["category"]>([
    "Contrarian",
    "Data",
    "Story",
    "Tactical",
    "Vision",
  ]);
  const validEvidenceTypes = new Set<EvidencePoint["type"]>([
    "metric",
    "example",
    "comparison",
    "principle",
  ]);

  // coreThesis
  if (!isObject(value.coreThesis)) return false;
  const ct = value.coreThesis;
  if (!isNonEmptyString(ct.statement)) return false;
  if (!isNonEmptyString(ct.audience)) return false;
  if (!isNonEmptyString(ct.angle)) return false;
  if (!isNonEmptyString(ct.inputType)) return false;

  // strategicClaims (exactly 3)
  if (!Array.isArray(value.strategicClaims) || value.strategicClaims.length !== 3) return false;
  const seenClaimIds = new Set<string>();
  for (const c of value.strategicClaims) {
    if (!isObject(c)) return false;
    if (!isNonEmptyString(c.id)) return false;
    if (!requiredClaimIds.has(c.id as StrategicClaim["id"])) return false;
    if (seenClaimIds.has(c.id)) return false;
    seenClaimIds.add(c.id);
    if (!isNonEmptyString(c.claim)) return false;
    if (!isNonEmptyString(c.whyItMatters)) return false;
    if (!isNonEmptyString(c.counterObjection)) return false;
    if (!isNonEmptyString(c.differentiation)) return false;
    if (!Array.isArray(c.evidence) || c.evidence.length < 2 || c.evidence.length > 4) return false;
    for (const ev of c.evidence) {
      if (!isObject(ev)) return false;
      if (!isNonEmptyString(ev.point)) return false;
      if (!isNonEmptyString(ev.type) || !validEvidenceTypes.has(ev.type as EvidencePoint["type"])) return false;
      if (!(ev.sourceQuote === null || isNonEmptyString(ev.sourceQuote))) return false;
      if (typeof ev.sourceQuote === "string") {
        const words = ev.sourceQuote.trim().split(/\s+/).filter(Boolean);
        if (words.length > 20) return false;
      }
    }
  }

  // narrativeArc
  if (!isObject(value.narrativeArc)) return false;
  for (const f of ["setup", "tension", "turningPoint", "resolution", "takeaway"]) {
    if (!isNonEmptyString((value.narrativeArc as Record<string, unknown>)[f])) return false;
  }

  // hookMatrix
  if (!isObject(value.hookMatrix) || !Array.isArray(value.hookMatrix.categories)) return false;
  if (value.hookMatrix.categories.length !== 5) return false;
  const seenCategories = new Set<string>();
  for (const cat of value.hookMatrix.categories) {
    if (!isObject(cat)) return false;
    if (!isNonEmptyString(cat.category)) return false;
    if (!requiredHookCategories.has(cat.category as HookCategory["category"])) return false;
    if (seenCategories.has(cat.category)) return false;
    seenCategories.add(cat.category);
    if (!isNonEmptyStringArrayWithin(cat.hooks, 3, 5)) return false;
  }

  // objections + proofAssets
  if (!isNonEmptyStringArrayWithin(value.objections, 3, 5)) return false;
  if (!isObject(value.proofAssets)) return false;
  const pa = value.proofAssets;
  if (!Array.isArray(pa.metrics) || !Array.isArray(pa.examples) || !Array.isArray(pa.comparisons)) return false;
  if (!pa.metrics.every((m) => isNonEmptyString(m))) return false;
  if (!pa.examples.every((m) => isNonEmptyString(m))) return false;
  if (!pa.comparisons.every((m) => isNonEmptyString(m))) return false;

  return true;
};

const FALLBACK_EVIDENCE_POINT = (text: string) => ({
  point: text || "See core thesis.",
  sourceQuote: null,
  type: "principle" as const,
});

const REQUIRED_HOOK_CATEGORIES: HookCategory["category"][] = ["Contrarian", "Data", "Story", "Tactical", "Vision"];
const CLAIM_IDS: StrategicClaim["id"][] = ["C1", "C2", "C3"];

/** Normalize SAM to ensure exactly 3 claims and all 5 hook categories. */
const normalizeSAM = (
  sam: StrategicAuthorityMap,
  inputType: InputType,
  angle: AngleType,
): StrategicAuthorityMap => {
  // Ensure exactly 3 claims
  const claimsMap = new Map(sam.strategicClaims.map((c) => [c.id, c]));
  const normalizedClaims: StrategicClaim[] = CLAIM_IDS.map((id) => {
    const existing = claimsMap.get(id);
    if (existing) return existing;
    // Fallback: use the first claim's data padded
    const fallback = sam.strategicClaims[0];
    return {
      id,
      claim: fallback?.claim ?? sam.coreThesis.statement,
      whyItMatters: fallback?.whyItMatters ?? "",
      evidence: fallback?.evidence.length
        ? fallback.evidence
        : [FALLBACK_EVIDENCE_POINT(sam.coreThesis.statement)],
      counterObjection: fallback?.counterObjection ?? "",
      differentiation: fallback?.differentiation ?? "",
    };
  });

  // Ensure all 5 hook categories
  const catMap = new Map(sam.hookMatrix.categories.map((c) => [c.category, c]));
  const normalizedCategories: HookCategory[] = REQUIRED_HOOK_CATEGORIES.map((category) => {
    const existing = catMap.get(category);
    if (existing && existing.hooks.filter((h) => h.trim()).length > 0) return existing;
    return { category, hooks: [sam.coreThesis.statement.slice(0, 80)] };
  });

  return {
    ...sam,
    coreThesis: {
      ...sam.coreThesis,
      angle: angle,
      inputType: inputType,
    },
    strategicClaims: normalizedClaims,
    hookMatrix: { categories: normalizedCategories },
  };
};

const extractStrategicAuthorityMap = async (
  transcript: string,
  inputType: InputType = "INTERVIEW",
  angle: AngleType = "THOUGHT_LEADERSHIP",
  profile?: AuthorityProfileContext | null,
): Promise<StrategicAuthorityMap> => {
  const runSAMExtraction = async (extraInstruction?: string): Promise<StrategicAuthorityMap> => {
    const userPrompt = extraInstruction
      ? `${buildSAMExtractionPrompt(transcript, inputType, angle, profile)}\n\nAdditional instruction: ${extraInstruction}`
      : buildSAMExtractionPrompt(transcript, inputType, angle, profile);

    const response = await openai.chat.completions.create({
      model: MODEL,
      temperature: TEMPERATURE,
      max_tokens: estimateMaxTokens(transcript, MAX_TOKENS.sam.min, MAX_TOKENS.sam.max),
      messages: [
        { role: "system", content: SAM_EXTRACTION_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "strategic_authority_map",
          strict: true,
          schema: SAM_JSON_SCHEMA as Record<string, unknown>,
        },
      },
    });

    const text = response.choices[0]?.message?.content;
    if (typeof text !== "string" || !text) {
      throw new ExtractionParseError("OpenAI returned no content for SAM extraction");
    }

    const parsed = tryParseJson(text);
    if (!parsed) {
      logger.error("sam.parse_failed", { preview: text.slice(0, 160) });
      throw new ExtractionParseError("SAM extraction response was not valid JSON");
    }

    if (!validateSAM(parsed)) {
      throw new ExtractionParseError("SAM extraction did not match expected schema");
    }

    return normalizeSAM(parsed, inputType, angle);
  };

  try {
    return await runSAMExtraction();
  } catch (err) {
    if (!(err instanceof ExtractionParseError)) throw err;
  }

  try {
    return await runSAMExtraction(EXTRACTION_JSON_RETRY_INSTRUCTION);
  } catch (err) {
    if (err instanceof ExtractionParseError) {
      throw createPackError("EXTRACTION_PARSE_FAILED", err.message);
    }
    throw err;
  }
};

/** Derive StrategicHooks from the SAM hookMatrix. */
const deriveStrategicHooksFromSAM = (sam: StrategicAuthorityMap): StrategicHooks => {
  const catMap = new Map(sam.hookMatrix.categories.map((c) => [c.category, c.hooks.filter(Boolean)]));

  const linkedinCandidates = [
    ...(catMap.get("Data") ?? []),
    ...(catMap.get("Tactical") ?? []),
    ...(catMap.get("Vision") ?? []),
    ...(catMap.get("Story") ?? []),
  ].filter(Boolean);

  const twitterCandidates = [
    ...(catMap.get("Story") ?? []),
    ...(catMap.get("Contrarian") ?? []),
    ...(catMap.get("Data") ?? []),
  ].filter(Boolean);

  const contrarianCandidates = (catMap.get("Contrarian") ?? []).filter(Boolean);

  return {
    linkedin: ensureExactLength(linkedinCandidates, 5),
    twitter: ensureExactLength(twitterCandidates, 3),
    contrarian: ensureExactLength(contrarianCandidates, 3),
  };
};

/** Build StrategicContext for the overlap guard from SAM. */
const buildStrategicContextFromSAM = (sam: StrategicAuthorityMap): StrategicContext => ({
  thesis: sam.coreThesis.statement,
  themes: sam.strategicClaims.map((c) => c.claim),
  mechanisms: sam.strategicClaims.map((c) => c.whyItMatters),
  evidence: [
    ...sam.proofAssets.metrics,
    ...sam.proofAssets.examples,
    ...sam.strategicClaims.flatMap((c) => c.evidence.map((e) => e.point)),
  ],
  contrarian:
    sam.hookMatrix.categories.find((c) => c.category === "Contrarian")?.hooks[0] ?? "",
  qualitySignals: {
    themeCount: sam.strategicClaims.length,
    mechanismCount: sam.strategicClaims.length,
    evidenceCount: sam.proofAssets.metrics.length + sam.proofAssets.examples.length,
  },
});

/** LinkedIn variant C (deterministic, no AI) — derived from SAM. */
const buildLinkedInVariantCFromSAM = (sam: StrategicAuthorityMap): string => {
  const lines: string[] = [sam.coreThesis.statement];
  if (sam.narrativeArc.setup) {
    lines.push("", sam.narrativeArc.setup);
  }
  sam.strategicClaims.forEach((claim, i) => {
    lines.push("", `${i + 1}. ${claim.claim}`);
    if (claim.evidence[0]) {
      lines.push(`   \u2192 ${claim.evidence[0].point}`);
    }
  });
  if (sam.narrativeArc.takeaway) {
    lines.push("", sam.narrativeArc.takeaway);
  }
  return normalizeLinkedInPost(lines.join("\n").trim());
};

const generatePlatformAssetsFromSAM = async (
  sam: StrategicAuthorityMap,
  inputType: InputType = "INTERVIEW",
  angle: AngleType = "THOUGHT_LEADERSHIP",
  profile?: AuthorityProfileContext | null,
): Promise<PlatformAssets> => {
  const context = buildStrategicContextFromSAM(sam);

  const linkedinA = await generateAssetWithRetry(
    "LinkedIn variant A",
    buildLinkedInFromSAMPrompt(sam, "A", inputType, angle, profile),
    MAX_TOKENS.linkedin,
    context,
    normalizeLinkedInPost,
    SAM_PLATFORM_SYSTEM_PROMPT,
  );
  const linkedinB = await generateAssetWithRetry(
    "LinkedIn variant B",
    buildLinkedInFromSAMPrompt(sam, "B", inputType, angle, profile),
    MAX_TOKENS.linkedin,
    context,
    normalizeLinkedInPost,
    SAM_PLATFORM_SYSTEM_PROMPT,
  );
  const xThread = await generateAssetWithRetry(
    "X thread",
    buildXThreadFromSAMPrompt(sam, inputType, angle, profile),
    MAX_TOKENS.xthread,
    context,
    (text) => text.replace(/\r\n/g, "\n").trim(),
    SAM_PLATFORM_SYSTEM_PROMPT,
  );
  const newsletter = await generateAssetWithRetry(
    "Newsletter",
    buildNewsletterFromSAMPrompt(sam, inputType, angle, profile),
    MAX_TOKENS.newsletter,
    context,
    (text) => text.replace(/\r\n/g, "\n").trim(),
    SAM_PLATFORM_SYSTEM_PROMPT,
  );

  return enforceInsightGuard({ linkedinA, linkedinB, xThread, newsletter });
};

/** Build AuthorityPackStructure from SAM + platform assets (maintains existing JSON contracts). */
const buildAuthorityPackFromSAM = (
  title: string,
  sam: StrategicAuthorityMap,
  assets: PlatformAssets,
): AuthorityPackStructure => {
  const twitterThread = normalizeThreadLines(assets.xThread);
  if (!twitterThread.length) {
    throw new Error("X thread output was empty");
  }

  const linkedinC = buildLinkedInVariantCFromSAM(sam);

  const dataBackedAngles = [
    ...sam.proofAssets.metrics,
    ...sam.proofAssets.comparisons,
  ].filter(Boolean).slice(0, 5);

  return {
    title,
    coreThesis: {
      primaryThesis: sam.coreThesis.statement,
      supportingThemes: sam.strategicClaims.map((c) => c.claim),
      targetPersona: sam.coreThesis.audience,
    },
    strategicHooks: deriveStrategicHooksFromSAM(sam),
    highLeveragePosts: {
      linkedinPosts: ensureExactLength([assets.linkedinA, assets.linkedinB, linkedinC], 3),
      twitterThread: ensureMaxLength(twitterThread, 8),
      newsletterSummary: assets.newsletter,
    },
    insightBreakdown: {
      strongClaims: sam.strategicClaims.map((c) => c.claim),
      dataBackedAngles: dataBackedAngles.length
        ? dataBackedAngles
        : sam.strategicClaims.flatMap((c) => c.evidence.map((e) => e.point)).slice(0, 3),
      frameworks: sam.strategicClaims.map((c) => `${c.id}: ${c.whyItMatters}`),
    },
    repurposingMatrix: {
      entries: [
        {
          asset: "LinkedIn Post A",
          platform: "LinkedIn",
          format: "Post",
          angle: sam.strategicClaims[0]?.claim ?? sam.coreThesis.statement,
        },
        {
          asset: "LinkedIn Post B",
          platform: "LinkedIn",
          format: "Post",
          angle: sam.strategicClaims[1]?.claim ?? sam.coreThesis.statement,
        },
        {
          asset: "X Thread",
          platform: "X",
          format: "Thread",
          angle: sam.coreThesis.statement,
        },
        {
          asset: "Newsletter",
          platform: "Email",
          format: "Newsletter",
          angle: sam.narrativeArc.takeaway,
        },
      ],
    },
    executiveSummary: {
      headline: sam.coreThesis.statement,
      positioningSentence: sam.narrativeArc.takeaway,
      keyInsights: [
        ...sam.strategicClaims.map((c) => c.claim),
        ...sam.objections.slice(0, 2),
      ].slice(0, 5),
    },
    strategicMap: sam,
  };
};

/**
 * Public: extract SAM from originalInput (resolves YouTube URL first).
 * Used by the regenerate route to extract a fresh SAM before section regen.
 */
export const extractSAM = async (
  originalInput: string,
  inputType: InputType = "INTERVIEW",
  angle: AngleType = "THOUGHT_LEADERSHIP",
  profile?: AuthorityProfileContext | null,
): Promise<StrategicAuthorityMap> => {
  const transcript = await resolveToTranscript(originalInput);
  return extractStrategicAuthorityMap(transcript, inputType, angle, profile);
};

/** Regenerate a LinkedIn post (A or B) from a SAM. */
export const regenerateLinkedInFromSAM = async (
  sam: StrategicAuthorityMap,
  variantIndex: 0 | 1 | 2,
  inputType: InputType = "INTERVIEW",
  angle: AngleType = "THOUGHT_LEADERSHIP",
  profile?: AuthorityProfileContext | null,
  existingContent?: string,
): Promise<{ post: string; error?: string }> => {
  try {
    if (variantIndex === 2) {
      return { post: buildLinkedInVariantCFromSAM(sam) };
    }
    const variant = variantIndex === 0 ? "A" : "B";
    const prompt = existingContent
      ? buildLinkedInFromSAMWithContextPrompt(sam, existingContent, variant, inputType, angle, profile)
      : buildLinkedInFromSAMPrompt(sam, variant, inputType, angle, profile);
    const post = await generatePlainTextWithRetry(
      "LinkedIn variant",
      prompt,
      MAX_TOKENS.linkedin,
      SAM_PLATFORM_SYSTEM_PROMPT,
    ).then(
      normalizeLinkedInPost,
    );
    return { post };
  } catch (err) {
    return { post: "", error: sanitizeErrorMessage(err instanceof Error ? err.message : String(err)) };
  }
};

/** Regenerate an X thread from a SAM. */
export const regenerateXThreadFromSAM = async (
  sam: StrategicAuthorityMap,
  inputType: InputType = "INTERVIEW",
  angle: AngleType = "THOUGHT_LEADERSHIP",
  profile?: AuthorityProfileContext | null,
  existingThread?: string,
): Promise<{ thread: string[]; error?: string }> => {
  try {
    const prompt = buildXThreadFromSAMPrompt(sam, inputType, angle, profile, existingThread);
    const threadText = await generatePlainTextWithRetry(
      "X thread",
      prompt,
      MAX_TOKENS.xthread,
      SAM_PLATFORM_SYSTEM_PROMPT,
    ).then(
      (t) => t.replace(/\r\n/g, "\n").trim(),
    );
    return { thread: normalizeThreadLines(threadText) };
  } catch (err) {
    return { thread: [], error: sanitizeErrorMessage(err instanceof Error ? err.message : String(err)) };
  }
};

/** Derive StrategicHooks from a SAM synchronously (no AI call). */
export const deriveHooksFromSAM = (sam: StrategicAuthorityMap): StrategicHooks =>
  deriveStrategicHooksFromSAM(sam);

type GenerationStage = "extraction_started" | "assets_started";

type GenerationStageCallback = (stage: GenerationStage) => void;

export const generateAuthorityPack = async (
  originalInput: string,
  options?: { onStage?: GenerationStageCallback; inputType?: InputType; angle?: AngleType; profile?: AuthorityProfileContext | null },
): Promise<AuthorityPackStructure> => {
  let transcript = originalInput;
  let videoTitle: string | null = null;
  if (isYouTubeUrl(originalInput)) {
    const [transcriptResult, titleResult] = await Promise.allSettled([
      fetchYouTubeTranscript(originalInput),
      fetchYouTubeTitle(originalInput),
    ]);

    videoTitle =
      titleResult.status === "fulfilled" ? titleResult.value : null;

    if (transcriptResult.status === "fulfilled" && transcriptResult.value.trim().length > 50) {
      transcript = transcriptResult.value;
      console.log(
        `YouTube data fetched -- title: "${videoTitle ?? "n/a"}", transcript: ${transcript.length} chars`,
      );
    } else {
      if (transcriptResult.status === "rejected") {
        if (isPackGenerationError(transcriptResult.reason)) {
          throw transcriptResult.reason;
        }
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
      throw createPackError(
        "TRANSCRIPT_UNAVAILABLE",
        `${TRANSCRIPT_UNAVAILABLE_MESSAGE} ` +
          "Please copy the transcript from YouTube (More > Transcript) and paste it directly.",
      );
    }
  }

  if (transcript.length > MAX_TRANSCRIPT_CHARS) {
    logger.warn("input.truncated", {
      originalLength: transcript.length,
      truncatedLength: MAX_TRANSCRIPT_CHARS,
    });
    transcript = transcript.slice(0, MAX_TRANSCRIPT_CHARS);
  }

  const inputType: InputType = options?.inputType ?? "INTERVIEW";
  const angle: AngleType = options?.angle ?? "THOUGHT_LEADERSHIP";
  const profile = options?.profile ?? null;

  options?.onStage?.("extraction_started");
  const sam = await extractStrategicAuthorityMap(transcript, inputType, angle, profile);
  options?.onStage?.("assets_started");
  const assets = await generatePlatformAssetsFromSAM(sam, inputType, angle, profile);

  const fallbackTitle = toTitleCase(extractTopic(originalInput)) || "Authority Pack";
  const finalTitle = videoTitle || fallbackTitle;

  return buildAuthorityPackFromSAM(finalTitle, sam, assets);
};

export const generateAuthorityPackSafe = async (
  originalInput: string,
  options?: { inputType?: InputType; angle?: AngleType; profile?: AuthorityProfileContext | null },
): Promise<{
  pack: AuthorityPackStructure;
  error?: string;
  errorCode?: ErrorCode;
  transcriptUnavailable?: boolean;
}> => {
  try {
    const pack = await generateAuthorityPack(originalInput, options);
    return { pack };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const errorCode = isPackGenerationError(err) ? err.code : "INTERNAL_ERROR";
    const safeMessage = toUserFacingError(message);
    const topic = extractTopic(
      originalInput.replace(/\s+/g, " ").replace(/[^\w\s-]/g, "").trim(),
    );
    const title = toTitleCase(topic) || "Authority Pack";
    return {
      pack: emptyAuthorityPack(title),
      error: safeMessage,
      errorCode,
      transcriptUnavailable: errorCode === "TRANSCRIPT_UNAVAILABLE",
    };
  }
};

export const regenerateLinkedInVariantSafe = async (
  originalInput: string,
  variantIndex: 0 | 1 | 2,
  existingContent?: string,
  inputType: InputType = "INTERVIEW",
  angle: AngleType = "THOUGHT_LEADERSHIP",
  profile?: AuthorityProfileContext | null,
): Promise<{ post: string; error?: string }> => {
  try {
    const transcript = await resolveToTranscript(originalInput);
    const insights = await extractInsights(transcript, inputType, angle, profile);

    if (variantIndex === 2) {
      const post = buildLinkedInVariantC(buildStrategicContext(insights));
      return { post };
    }

    const prompt = existingContent
      ? variantIndex === 0
        ? buildLinkedInVariantAWithContextPrompt(insights, existingContent, inputType, angle, profile)
        : buildLinkedInVariantBWithContextPrompt(insights, existingContent, inputType, angle, profile)
      : variantIndex === 0
        ? buildLinkedInVariantAPrompt(insights, inputType, angle, profile)
        : buildLinkedInVariantBPrompt(insights, inputType, angle, profile);

    const post = await generatePlainTextWithRetry(
      "LinkedIn variant",
      prompt,
      MAX_TOKENS.linkedin,
    ).then(normalizeLinkedInPost);

    return { post };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { post: "", error: sanitizeErrorMessage(message) };
  }
};

export const regenerateXThreadSafe = async (
  originalInput: string,
  existingContent?: string,
  inputType: InputType = "INTERVIEW",
  angle: AngleType = "THOUGHT_LEADERSHIP",
  profile?: AuthorityProfileContext | null,
): Promise<{ thread: string[]; error?: string }> => {
  try {
    const transcript = await resolveToTranscript(originalInput);
    const insights = await extractInsights(transcript, inputType, angle, profile);
    const prompt = existingContent
      ? buildXThreadWithContextPrompt(insights, existingContent, inputType, angle, profile)
      : buildXThreadPrompt(insights, inputType, angle, profile);
    const threadText = await generatePlainTextWithRetry(
      "X thread",
      prompt,
      MAX_TOKENS.xthread,
    ).then((t) => t.replace(/\r\n/g, "\n").trim());
    const thread = normalizeThreadLines(threadText);
    return { thread };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { thread: [], error: sanitizeErrorMessage(message) };
  }
};

export const regenerateHooksSafe = async (
  originalInput: string,
  inputType: InputType = "INTERVIEW",
  angle: AngleType = "THOUGHT_LEADERSHIP",
  profile?: AuthorityProfileContext | null,
): Promise<{ hooks: StrategicHooks; error?: string }> => {
  try {
    const transcript = await resolveToTranscript(originalInput);
    const insights = await extractInsights(transcript, inputType, angle, profile);
    const hooks = deriveStrategicHooks(insights);
    return { hooks };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      hooks: { linkedin: [], twitter: [], contrarian: [] },
      error: sanitizeErrorMessage(message),
    };
  }
};
