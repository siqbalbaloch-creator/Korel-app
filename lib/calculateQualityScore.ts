/**
 * Calculates a quality score (0-100) for an AuthorityPack based on
 * section completeness and content specificity.
 *
 * Base weights:
 *   hooks      25  - hook strength and contrarian specificity
 *   posts      25  - LinkedIn posts + X thread + newsletter
 *   insights   25  - data-backed angles (specificity signal)
 *   coreThesis 20  - thesis + supporting themes
 *   summary     5  - executive summary
 *
 * Phase 13: subtle per-inputType multipliers applied after base scoring.
 * Each section is capped at its QUALITY_MAX_SCORES maximum after adjustment.
 */

import type { InputType, AngleType, StrategicAuthorityMap } from "@/ai/prompts";

type ScoredPack = {
  coreThesis?: unknown;
  strategicHooks?: unknown;
  highLeveragePosts?: unknown;
  insightBreakdown?: unknown;
  repurposingMatrix?: unknown;
  executiveSummary?: unknown;
  strategicMap?: unknown;
};

export type QualityBreakdown = {
  coreThesis: number;
  hooks: number;
  posts: number;
  insights: number;
  summary: number;
};

export type QualityScoreResult = {
  totalScore: number;
  breakdown: QualityBreakdown;
};

export type MessagingStrength = {
  hookStrength: number;
  claimRobustness: number;
  evidenceDepth: number;
  differentiationClarity: number;
  objectionCoverage: number;
  total: number;
};

/** Max points per section. Must sum to 100. */
export const QUALITY_MAX_SCORES: QualityBreakdown = {
  coreThesis: 20,
  hooks: 25,
  posts: 25,
  insights: 25,
  summary: 5,
};

function isNonEmptyString(v: unknown): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

function isNonEmptyArray(v: unknown): boolean {
  return Array.isArray(v) && v.length > 0;
}

function scoreCoreThesis(ct: unknown): number {
  if (!ct || typeof ct !== "object") return 0;
  const c = ct as Record<string, unknown>;
  let pts = 0;
  if (isNonEmptyString(c.primaryThesis)) pts += 10;
  if (isNonEmptyArray(c.supportingThemes) && (c.supportingThemes as unknown[]).length >= 2) pts += 7;
  if (isNonEmptyString(c.targetPersona)) pts += 3;
  return pts; // max 20
}

function scoreStrategicHooks(sh: unknown): number {
  if (!sh || typeof sh !== "object") return 0;
  const s = sh as Record<string, unknown>;
  let pts = 0;
  if (isNonEmptyArray(s.linkedin) && (s.linkedin as unknown[]).length >= 2) pts += 7;
  if (isNonEmptyArray(s.twitter) && (s.twitter as unknown[]).length >= 2) pts += 6;
  // Contrarian hooks weighted higher â€" they require specific insight and a clear stance
  if (isNonEmptyArray(s.contrarian) && (s.contrarian as unknown[]).length >= 1) pts += 8;
  // Bonus: 3+ contrarian hooks signals strong specificity
  if (isNonEmptyArray(s.contrarian) && (s.contrarian as unknown[]).length >= 3) pts += 4;
  return pts; // max 25
}

function scoreHighLeveragePosts(hlp: unknown): number {
  if (!hlp || typeof hlp !== "object") return 0;
  const h = hlp as Record<string, unknown>;
  let pts = 0;
  if (isNonEmptyArray(h.linkedinPosts) && (h.linkedinPosts as unknown[]).length >= 2) pts += 10;
  if (isNonEmptyArray(h.twitterThread) && (h.twitterThread as unknown[]).length >= 3) pts += 7;
  if (isNonEmptyString(h.newsletterSummary)) pts += 8;
  return pts; // max 25
}

function scoreInsightBreakdown(ib: unknown): number {
  if (!ib || typeof ib !== "object") return 0;
  const i = ib as Record<string, unknown>;
  let pts = 0;
  if (isNonEmptyArray(i.strongClaims)) pts += 3;
  // Data-backed angles reward specificity â€" weighted highest within insights
  if (isNonEmptyArray(i.dataBackedAngles)) pts += 13;
  // Bonus: 3+ data-backed angles
  if (isNonEmptyArray(i.dataBackedAngles) && (i.dataBackedAngles as unknown[]).length >= 3) pts += 5;
  if (isNonEmptyArray(i.frameworks)) pts += 4;
  return pts; // max 25
}

function scoreExecutiveSummary(es: unknown): number {
  if (!es || typeof es !== "object") return 0;
  const e = es as Record<string, unknown>;
  let pts = 0;
  if (isNonEmptyString(e.headline)) pts += 2;
  if (isNonEmptyString(e.positioningSentence)) pts += 2;
  if (isNonEmptyArray(e.keyInsights) && (e.keyInsights as unknown[]).length >= 2) pts += 1;
  return pts; // max 5
}

// ---------------------------------------------------------------------------
// Messaging Strength Metrics (Phase 19) — deterministic SAM-based scoring.
// ---------------------------------------------------------------------------

const HOOK_CATEGORIES = ["Contrarian", "Data", "Story", "Tactical", "Vision"] as const;
const HOOK_BANNED_PHRASES = ["in today's world", "the future is here"];
const GENERIC_DIFFERENTIATION_PHRASES = [
  "different",
  "unique",
  "better",
  "best",
  "innovative",
  "cutting edge",
];
const GENERIC_OBJECTIONS = [
  "this won't work",
  "won't work",
  "doesn't work",
  "too hard",
  "not possible",
  "not realistic",
  "this is obvious",
];

const toWordCount = (text: string): number =>
  text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, Math.round(value)));

const hasAnyNumber = (text: string): boolean => /\d/.test(text);

const containsAnyPhrase = (text: string, phrases: string[]): boolean => {
  const lower = text.toLowerCase();
  return phrases.some((phrase) => lower.includes(phrase));
};

const hasComparativeLanguage = (text: string): boolean =>
  /(instead of|unlike|most|typical|vs\.?|versus|compared to|rather than|whereas)/i.test(
    text,
  );

const isValidSAM = (sam?: StrategicAuthorityMap | null): sam is StrategicAuthorityMap => {
  if (!sam || typeof sam !== "object") return false;
  if (!sam.coreThesis || typeof sam.coreThesis.statement !== "string") return false;
  if (!Array.isArray(sam.strategicClaims)) return false;
  if (!sam.hookMatrix || !Array.isArray(sam.hookMatrix.categories)) return false;
  if (!Array.isArray(sam.objections)) return false;
  if (!sam.proofAssets || !Array.isArray(sam.proofAssets.metrics)) return false;
  return true;
};

const scoreHookStrength = (sam: StrategicAuthorityMap): number => {
  const categories = sam.hookMatrix.categories ?? [];
  const categoryNames = new Set(categories.map((c) => c.category));
  const hasAllCategories = HOOK_CATEGORIES.every((c) => categoryNames.has(c));
  const allCatsHave3 = categories.length > 0 && categories.every((c) => c.hooks.length >= 3);

  const hooks = categories.flatMap((c) => c.hooks).filter((h) => isNonEmptyString(h));
  const avgWords = hooks.length
    ? hooks.reduce((sum, hook) => sum + toWordCount(hook), 0) / hooks.length
    : 0;
  const hasNumeric = hooks.some((hook) => hasAnyNumber(hook));
  const hasBanned = hooks.some((hook) => containsAnyPhrase(hook, HOOK_BANNED_PHRASES));

  let score = 0;
  if (hasAllCategories) score += 4;
  if (allCatsHave3) score += 4;
  if (hasNumeric) score += 4;
  if (avgWords >= 8 && avgWords <= 18) score += 4;
  if (!hasBanned) score += 4;

  return clamp(score, 0, 20);
};

const isClaimMeaningful = (text: string, minLen: number) =>
  isNonEmptyString(text) && text.trim().length >= minLen;

const scoreClaimRobustness = (sam: StrategicAuthorityMap): number => {
  const claims = sam.strategicClaims ?? [];
  let score = 0;
  if (claims.length === 3) score += 5;

  for (const claim of claims) {
    const claimOk = isClaimMeaningful(claim.claim, 50);
    const whyOk = isClaimMeaningful(claim.whyItMatters, 25);
    const counterOk = isClaimMeaningful(claim.counterObjection, 25);
    const diffOk =
      isClaimMeaningful(claim.differentiation, 25) &&
      !containsAnyPhrase(claim.differentiation, GENERIC_DIFFERENTIATION_PHRASES);
    if (claimOk && whyOk && counterOk && diffOk) score += 5;
  }

  return clamp(score, 0, 20);
};

const scoreEvidenceDepth = (sam: StrategicAuthorityMap): number => {
  const claims = sam.strategicClaims ?? [];
  let score = 0;

  // Evidence count per claim (2-4)
  for (const claim of claims) {
    const count = Array.isArray(claim.evidence) ? claim.evidence.length : 0;
    if (count >= 2 && count <= 4) score += 3;
  }

  // Evidence type diversity
  const types = new Set(
    claims.flatMap((c) =>
      Array.isArray(c.evidence) ? c.evidence.map((e) => e.type) : [],
    ),
  );
  if (types.size >= 2) score += 4;

  // Metrics presence if numeric signal exists
  const numericSignal =
    claims.some((c) => hasAnyNumber(c.claim)) ||
    claims.some((c) =>
      Array.isArray(c.evidence) ? c.evidence.some((e) => hasAnyNumber(e.point)) : false,
    ) ||
    sam.hookMatrix.categories.some((c) => c.hooks.some((h) => hasAnyNumber(h))) ||
    sam.proofAssets.comparisons.some((c) => hasAnyNumber(c)) ||
    sam.proofAssets.metrics.some((m) => hasAnyNumber(m));

  if (!numericSignal) {
    score += 4;
  } else if (sam.proofAssets.metrics.length > 0) {
    score += 4;
  }

  // No short evidence strings
  const allEvidence = claims.flatMap((c) => (Array.isArray(c.evidence) ? c.evidence : []));
  const totalEvidence = allEvidence.length;
  const longEvidence = allEvidence.filter((e) => isClaimMeaningful(e.point, 20)).length;
  if (totalEvidence > 0 && longEvidence === totalEvidence) score += 3;
  else if (totalEvidence > 0 && longEvidence / totalEvidence >= 0.7) score += 1;

  return clamp(score, 0, 20);
};

const scoreDifferentiationClarity = (sam: StrategicAuthorityMap): number => {
  const claims = sam.strategicClaims ?? [];
  let score = 0;
  let nonEmptyCount = 0;

  for (const claim of claims) {
    const diff = claim.differentiation ?? "";
    const hasContent = isClaimMeaningful(diff, 20);
    if (hasContent) nonEmptyCount += 1;
    const hasCompare = hasComparativeLanguage(diff);
    const notGeneric = hasContent && !containsAnyPhrase(diff, GENERIC_DIFFERENTIATION_PHRASES);

    if (hasContent) score += 2;
    if (hasCompare) score += 2;
    if (notGeneric) score += 2;
  }

  if (nonEmptyCount === 3) score += 2;
  return clamp(score, 0, 20);
};

const scoreObjectionCoverage = (sam: StrategicAuthorityMap): number => {
  const objections = sam.objections ?? [];
  let score = 0;

  score += clamp(objections.length * 2, 0, 6);

  const longObjections = objections.filter((o) => isClaimMeaningful(o, 20)).length;
  if (objections.length >= 3 && longObjections === objections.length) score += 6;
  else if (objections.length >= 3 && longObjections / objections.length >= 0.5) score += 3;

  const counterCount = sam.strategicClaims.filter((c) =>
    isClaimMeaningful(c.counterObjection, 20),
  ).length;
  if (counterCount === 3) score += 4;
  else if (counterCount >= 2) score += 2;

  const hasGeneric = objections.some((o) => containsAnyPhrase(o, GENERIC_OBJECTIONS));
  if (!hasGeneric) score += 4;

  return clamp(score, 0, 20);
};

export const calculateMessagingStrength = (
  sam?: StrategicAuthorityMap | null,
): MessagingStrength | null => {
  if (!isValidSAM(sam)) return null;

  const hookStrength = scoreHookStrength(sam);
  const claimRobustness = scoreClaimRobustness(sam);
  const evidenceDepth = scoreEvidenceDepth(sam);
  const differentiationClarity = scoreDifferentiationClarity(sam);
  const objectionCoverage = scoreObjectionCoverage(sam);

  const total = clamp(
    hookStrength +
      claimRobustness +
      evidenceDepth +
      differentiationClarity +
      objectionCoverage,
    0,
    100,
  );

  return {
    hookStrength,
    claimRobustness,
    evidenceDepth,
    differentiationClarity,
    objectionCoverage,
    total,
  };
};

// ---------------------------------------------------------------------------
// StrategicAuthorityMap signals (Phase 16)
// Modest, deterministic adjustments; clamped to max scores.
// ---------------------------------------------------------------------------

const isShortClaim = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return true;
  const words = trimmed.split(/\s+/).filter(Boolean);
  return trimmed.length < 25 || words.length < 4;
};

const scoreSAMSignals = (
  sam?: StrategicAuthorityMap | null,
): Partial<QualityBreakdown> => {
  if (!sam) return {};

  let insights = 0;
  let hooks = 0;
  let coreThesis = 0;

  const claims = Array.isArray(sam.strategicClaims) ? sam.strategicClaims : [];
  const allClaimsHaveEvidence =
    claims.length === 3 &&
    claims.every(
      (c) =>
        Array.isArray(c.evidence) &&
        c.evidence.filter((e) => isNonEmptyString(e.point)).length >= 2,
    );
  if (allClaimsHaveEvidence) insights += 3;

  const objectionsCount = Array.isArray(sam.objections)
    ? sam.objections.filter((o) => isNonEmptyString(o)).length
    : 0;
  if (objectionsCount >= 3) coreThesis += 2;

  const categories = sam.hookMatrix?.categories;
  const hooksReady =
    Array.isArray(categories) &&
    categories.length >= 5 &&
    categories.every(
      (c) => Array.isArray(c.hooks) && c.hooks.filter((h) => isNonEmptyString(h)).length >= 3,
    );
  if (hooksReady) hooks += 2;

  const shortClaims = claims.filter((c) => !isNonEmptyString(c.claim) || isShortClaim(c.claim));
  if (shortClaims.length >= 2) insights -= 2;
  else if (shortClaims.length === 1) insights -= 1;

  return { insights, hooks, coreThesis };
};

const applySAMSignals = (
  base: QualityBreakdown,
  sam?: StrategicAuthorityMap | null,
): QualityBreakdown => {
  const delta = scoreSAMSignals(sam);
  const next = { ...base };
  for (const key of Object.keys(delta) as (keyof QualityBreakdown)[]) {
    const adjustment = delta[key] ?? 0;
    const adjusted = next[key] + adjustment;
    next[key] = Math.min(
      QUALITY_MAX_SCORES[key],
      Math.max(0, Math.round(adjusted)),
    );
  }
  return next;
};

/**
 * Per-inputType score multipliers.
 * Values > 1.0 increase section importance; < 1.0 reduce it.
 * Adjustments are intentionally subtle (max ±15%).
 * Each adjusted section is capped at its QUALITY_MAX_SCORES max.
 */
const INPUT_TYPE_MULTIPLIERS: Partial<Record<InputType, Partial<QualityBreakdown>>> = {
  // Investor Update: evidence and specificity matter most; emotional hooks matter less
  INVESTOR_UPDATE: { insights: 1.15, hooks: 0.88, coreThesis: 1.05 },
  // Strategy Memo: frameworks and thesis clarity matter most; emotional hooks matter less
  STRATEGY_MEMO: { coreThesis: 1.1, insights: 1.05, hooks: 0.9 },
  // Customer Story: narrative posts and transformation arc matter most
  CUSTOMER_STORY: { posts: 1.1, hooks: 1.05 },
  // Product Update: concrete insights and strong thesis matter more
  PRODUCT_UPDATE: { insights: 1.1, coreThesis: 1.05 },
  // INTERVIEW and CUSTOM: use base weights unchanged
};

function applyMultipliers(
  base: QualityBreakdown,
  multipliers: Partial<QualityBreakdown>,
): QualityBreakdown {
  const result = { ...base };
  for (const key of Object.keys(multipliers) as (keyof QualityBreakdown)[]) {
    const m = multipliers[key];
    if (m !== undefined) {
      result[key] = Math.min(
        QUALITY_MAX_SCORES[key],
        Math.round(result[key] * m),
      );
    }
  }
  return result;
}

function applyInputTypeMultipliers(
  base: QualityBreakdown,
  inputType?: InputType,
): QualityBreakdown {
  if (!inputType) return base;
  const multipliers = INPUT_TYPE_MULTIPLIERS[inputType];
  if (!multipliers) return base;
  return applyMultipliers(base, multipliers);
}

/**
 * Per-angle score multipliers.
 * Contrarian and Tactical angles reward insight specificity over polish.
 * Story-Driven rewards posts (narrative arc). Visionary rewards thesis clarity.
 * Execution-Focused rewards data-backed angles and tactical posts.
 * Adjustments intentionally subtle (max ±12%).
 */
const ANGLE_MULTIPLIERS: Partial<Record<AngleType, Partial<QualityBreakdown>>> = {
  CONTRARIAN: { hooks: 1.12, insights: 1.08, coreThesis: 0.95 },
  TACTICAL: { insights: 1.1, posts: 1.05, hooks: 0.92 },
  STORY_DRIVEN: { posts: 1.12, hooks: 1.05, insights: 0.92 },
  VISIONARY: { coreThesis: 1.1, hooks: 1.05, insights: 0.95 },
  EXECUTION_FOCUSED: { insights: 1.1, posts: 1.05, coreThesis: 0.95 },
  // THOUGHT_LEADERSHIP: base weights unchanged
};

function applyAngleMultipliers(
  base: QualityBreakdown,
  angle?: AngleType,
): QualityBreakdown {
  if (!angle) return base;
  const multipliers = ANGLE_MULTIPLIERS[angle];
  if (!multipliers) return base;
  return applyMultipliers(base, multipliers);
}

// ---------------------------------------------------------------------------
// Profile consistency nudge (Phase 15) — deterministic token overlap check.
// Max 5 bonus points; cannot push score above 100.
// Only applied if profileThesis is substantial (≥ 20 chars, ≥ 2 meaningful tokens).
// ---------------------------------------------------------------------------

const toMeaningfulTokenSet = (text: string): Set<string> => {
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  return new Set(normalized.split(" ").filter((t) => t.length > 3));
};

function scoreProfileConsistency(pack: ScoredPack, profileThesis?: string): number {
  if (!profileThesis || profileThesis.trim().length < 20) return 0;
  const thesisTokens = toMeaningfulTokenSet(profileThesis);
  if (thesisTokens.size < 2) return 0;

  const parts: string[] = [];
  const hlp = pack.highLeveragePosts;
  const hooks = pack.strategicHooks;
  if (hlp && typeof hlp === "object") {
    const h = hlp as Record<string, unknown>;
    if (Array.isArray(h.linkedinPosts) && typeof (h.linkedinPosts as unknown[])[0] === "string") {
      parts.push(((h.linkedinPosts as string[])[0] ?? "").slice(0, 300));
    }
    if (typeof h.newsletterSummary === "string") {
      parts.push((h.newsletterSummary as string).slice(0, 200));
    }
  }
  if (hooks && typeof hooks === "object") {
    const s = hooks as Record<string, unknown>;
    if (Array.isArray(s.linkedin)) {
      parts.push(...(s.linkedin as string[]).slice(0, 2));
    }
  }
  if (!parts.length) return 0;

  const packTokens = toMeaningfulTokenSet(parts.join(" "));
  let matches = 0;
  thesisTokens.forEach((t) => { if (packTokens.has(t)) matches++; });
  const overlap = matches / thesisTokens.size;

  if (overlap >= 0.4) return 5;
  if (overlap >= 0.25) return 3;
  if (overlap >= 0.1) return 1;
  return 0;
}

export function calculateQualityScore(
  pack: ScoredPack,
  inputType?: InputType,
  angle?: AngleType,
  profileThesis?: string,
  strategicMap?: StrategicAuthorityMap | null,
): QualityScoreResult {
  const base: QualityBreakdown = {
    coreThesis: scoreCoreThesis(pack.coreThesis),
    hooks: scoreStrategicHooks(pack.strategicHooks),
    posts: scoreHighLeveragePosts(pack.highLeveragePosts),
    insights: scoreInsightBreakdown(pack.insightBreakdown),
    summary: scoreExecutiveSummary(pack.executiveSummary),
  };
  const afterInputType = applyInputTypeMultipliers(base, inputType);
  const afterAngle = applyAngleMultipliers(afterInputType, angle);
  const breakdown = applySAMSignals(afterAngle, strategicMap);
  const subtotal = breakdown.coreThesis + breakdown.hooks + breakdown.posts + breakdown.insights + breakdown.summary;
  const consistencyNudge = scoreProfileConsistency(pack, profileThesis);
  return { totalScore: Math.min(100, Math.round(subtotal + consistencyNudge)), breakdown };
}
