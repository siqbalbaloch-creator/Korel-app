import type { AuthorityProfileContext, StrategicAuthorityMap } from "@/ai/prompts";

export type AuthorityConsistency = {
  thesisAlignment: number;
  positioningAlignment: number;
  toneMatch: number;
  claimThemeCoherence: number;
  driftWarnings: string[];
  total: number;
};

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "this",
  "that",
  "from",
  "into",
  "your",
  "their",
  "they",
  "them",
  "then",
  "than",
  "what",
  "when",
  "where",
  "which",
  "who",
  "whom",
  "whose",
  "why",
  "how",
  "our",
  "ours",
  "you",
  "yours",
  "yourself",
  "we",
  "us",
  "i",
  "me",
  "my",
  "mine",
  "a",
  "an",
  "to",
  "of",
  "in",
  "on",
  "at",
  "by",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "it",
  "its",
  "as",
  "or",
  "but",
  "if",
  "so",
  "not",
  "no",
  "yes",
  "can",
  "could",
  "should",
  "would",
  "may",
  "might",
  "will",
  "just",
  "very",
  "more",
  "most",
  "less",
  "least",
  "about",
  "over",
  "under",
  "between",
  "across",
  "because",
  "there",
  "here",
  "also",
  "make",
  "makes",
  "made",
  "use",
  "using",
]);

const HYPE_WORDS = [
  "revolutionary",
  "game-changing",
  "breakthrough",
  "massive",
  "explosive",
  "unprecedented",
  "world-class",
  "next-level",
];

const BOLD_WORDS = [
  "must",
  "never",
  "always",
  "wrong",
  "stop",
  "refuse",
  "myth",
  "lie",
  "non-negotiable",
];

const DIRECT_WORDS = [
  "ship",
  "shipped",
  "shipping",
  "execute",
  "execution",
  "deliver",
  "delivered",
  "launch",
  "outcome",
  "results",
  "metric",
  "metrics",
  "deadline",
];

const ACADEMIC_WORDS = [
  "principle",
  "framework",
  "model",
  "tradeoff",
  "hypothesis",
  "mechanism",
  "thesis",
];

const GENERIC_DIFFERENTIATION = [
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

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, Math.round(value)));

const toTokens = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 4 && !STOPWORDS.has(t));

const tokensToSet = (tokens: string[]): Set<string> =>
  new Set(tokens.filter(Boolean));

const overlapCount = (a: Set<string>, b: Set<string>): number => {
  let count = 0;
  a.forEach((token) => {
    if (b.has(token)) count += 1;
  });
  return count;
};

const overlapRatio = (a: Set<string>, b: Set<string>): number => {
  if (!a.size || !b.size) return 0;
  return overlapCount(a, b) / Math.min(a.size, b.size);
};

const containsAny = (text: string, phrases: string[]): boolean => {
  const lower = text.toLowerCase();
  return phrases.some((phrase) => lower.includes(phrase));
};

const hasComparativeLanguage = (text: string): boolean =>
  /(instead of|unlike|most|typical|vs\.?|versus|compared to|rather than|whereas)/i.test(
    text,
  );

const hasAnyNumber = (text: string): boolean => /\d/.test(text);

const isMeaningful = (value: string | null | undefined, minLen: number): boolean =>
  typeof value === "string" && value.trim().length >= minLen;

const buildTopTokens = (texts: string[], limit = 12): string[] => {
  const counts = new Map<string, number>();
  texts.forEach((text) => {
    toTokens(text).forEach((token) => {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    });
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([token]) => token);
};

const buildBigramSet = (texts: string[]): Set<string> => {
  const set = new Set<string>();
  texts.forEach((text) => {
    const tokens = toTokens(text);
    for (let i = 0; i < tokens.length - 1; i += 1) {
      set.add(`${tokens[i]} ${tokens[i + 1]}`);
    }
  });
  return set;
};

const normalizeWarnings = (warnings: string[]): string[] => {
  const unique = Array.from(new Set(warnings.map((w) => w.trim()).filter(Boolean)));
  return unique.slice(0, 5);
};

const buildPackText = (sam: StrategicAuthorityMap): string[] => [
  sam.coreThesis.statement,
  ...sam.strategicClaims.map((c) => c.claim),
  ...sam.strategicClaims.map((c) => c.whyItMatters),
  ...sam.strategicClaims.map((c) => c.differentiation),
  ...sam.objections,
];

const validateConsistency = (value: AuthorityConsistency): AuthorityConsistency => ({
  thesisAlignment: clamp(value.thesisAlignment, 0, 25),
  positioningAlignment: clamp(value.positioningAlignment, 0, 25),
  toneMatch: clamp(value.toneMatch, 0, 20),
  claimThemeCoherence: clamp(value.claimThemeCoherence, 0, 20),
  driftWarnings: normalizeWarnings(value.driftWarnings),
  total: clamp(value.total, 0, 100),
});

export const calculateAuthorityConsistency = (
  profile: AuthorityProfileContext | null,
  sam: StrategicAuthorityMap | null,
  priorSAMs: StrategicAuthorityMap[],
): AuthorityConsistency | null => {
  if (!sam) return null;

  const warnings: string[] = [];
  const profileThesis = profile?.coreThesis?.trim() ?? "";
  const profilePositioning = profile?.positioning?.trim() ?? "";
  const profileTone = profile?.tone?.trim() ?? "";

  // Thesis alignment
  let thesisAlignment = 12;
  if (!profileThesis) {
    warnings.push("No thesis set in authority profile.");
  } else {
    const thesisTokens = tokensToSet(toTokens(profileThesis));
    const packTokens = tokensToSet(toTokens([sam.coreThesis.statement, ...sam.strategicClaims.map((c) => c.claim)].join(" ")));
    const overlap = overlapCount(thesisTokens, packTokens);
    const ratio = overlapRatio(thesisTokens, packTokens);
    if (overlap >= 6 || ratio >= 0.45) thesisAlignment = 25;
    else if (overlap >= 3 || ratio >= 0.25) thesisAlignment = 18;
    else {
      thesisAlignment = 10;
      warnings.push("Thesis drift risk: low overlap with workspace thesis.");
    }
  }

  // Positioning alignment
  let positioningAlignment = 12;
  if (!profilePositioning) {
    warnings.push("No positioning set in authority profile.");
  } else {
    const positioningTokens = tokensToSet(toTokens(profilePositioning));
    const diffText = sam.strategicClaims.map((c) => c.differentiation).join(" ");
    const packTokens = tokensToSet(toTokens(`${sam.coreThesis.statement} ${diffText}`));
    const overlap = overlapCount(positioningTokens, packTokens);
    const ratio = overlapRatio(positioningTokens, packTokens);
    if (overlap >= 5 || ratio >= 0.4) positioningAlignment = 23;
    else if (overlap >= 2 || ratio >= 0.2) positioningAlignment = 16;
    else {
      positioningAlignment = 8;
      warnings.push("Positioning drift: differentiation not aligned with positioning statement.");
    }

    const diffWithCompare = sam.strategicClaims.find(
      (claim) =>
        hasComparativeLanguage(claim.differentiation) &&
        toTokens(claim.differentiation).some((token) => positioningTokens.has(token)),
    );
    if (diffWithCompare) positioningAlignment = clamp(positioningAlignment + 2, 0, 25);
  }

  // Tone match
  let toneMatch = 10;
  if (!profileTone) {
    warnings.push("No authority profile tone set.");
  } else {
    const packText = buildPackText(sam).join(" ");
    const whyText = sam.strategicClaims.map((c) => c.whyItMatters).join(" ");
    const narrativeText = `${sam.narrativeArc.setup} ${sam.narrativeArc.tension} ${sam.narrativeArc.resolution}`;

    if (profileTone === "MEASURED") {
      const hasHype = containsAny(packText, HYPE_WORDS);
      toneMatch = hasHype ? 10 : 18;
      if (hasHype) warnings.push("Tone mismatch: profile set to MEASURED, but hype language appears.");
    } else if (profileTone === "BOLD") {
      const count = toTokens(packText).filter((t) => BOLD_WORDS.includes(t)).length;
      toneMatch = count >= 2 ? 20 : count === 1 ? 14 : 8;
      if (toneMatch <= 8) warnings.push("Tone mismatch: profile set to BOLD, but stance language is limited.");
    } else if (profileTone === "DIRECT") {
      const hasMetrics = sam.proofAssets.metrics.length > 0 || hasAnyNumber(packText);
      const hasDirect = toTokens(packText).some((t) => DIRECT_WORDS.includes(t));
      toneMatch = hasMetrics && hasDirect ? 20 : hasMetrics || hasDirect ? 14 : 8;
      if (toneMatch <= 8) warnings.push("Tone mismatch: profile set to DIRECT, but execution signals are limited.");
    } else if (profileTone === "ACADEMIC") {
      const count = toTokens(whyText).filter((t) => ACADEMIC_WORDS.includes(t)).length;
      toneMatch = count >= 2 ? 20 : count === 1 ? 14 : 8;
      if (toneMatch <= 8) warnings.push("Tone mismatch: profile set to ACADEMIC, but framework language is limited.");
    } else if (profileTone === "FRIENDLY") {
      const narrativeLength = narrativeText.trim().length;
      const hasPronoun = /\b(i|we|our)\b/i.test(narrativeText);
      toneMatch = narrativeLength >= 80 && hasPronoun ? 18 : 10;
      if (toneMatch <= 10) warnings.push("Tone mismatch: profile set to FRIENDLY, but narrative signals are limited.");
    } else {
      toneMatch = 10;
    }
  }

  // Claim theme coherence
  let claimThemeCoherence = 12;
  const priorClaims = priorSAMs.flatMap((p) => p.strategicClaims.map((c) => c.claim));
  if (priorClaims.length > 0) {
    const currentTop = buildTopTokens(sam.strategicClaims.map((c) => c.claim), 12);
    const priorTop = buildTopTokens(priorClaims, 12);
    const currentSet = tokensToSet(currentTop);
    const priorSet = tokensToSet(priorTop);
    const ratio = overlapRatio(currentSet, priorSet);
    if (ratio >= 0.45) claimThemeCoherence = 20;
    else if (ratio >= 0.25) claimThemeCoherence = 16;
    else if (ratio >= 0.12) claimThemeCoherence = 10;
    else {
      claimThemeCoherence = 6;
      warnings.push("Theme drift: low overlap with recent packs.");
    }

    if (ratio >= 0.55) {
      const currentBigrams = buildBigramSet(sam.strategicClaims.map((c) => c.claim));
      const priorBigrams = buildBigramSet(priorClaims);
      const bigramRatio = overlapRatio(currentBigrams, priorBigrams);
      if (bigramRatio >= 0.35) {
        warnings.push("Repetition risk: claims repeat themes from recent packs.");
      }
    }
  }

  // Positioning differentiation generic check
  const genericDiff = sam.strategicClaims.some((c) =>
    containsAny(c.differentiation, GENERIC_DIFFERENTIATION),
  );
  if (genericDiff && profilePositioning) {
    warnings.push("Positioning drift: differentiation is overly generic.");
  }

  // Objection generic check
  const genericObjection = sam.objections.some((o) => containsAny(o, GENERIC_OBJECTIONS));
  if (genericObjection) warnings.push("Objection coverage: generic objections detected.");

  const total = thesisAlignment + positioningAlignment + toneMatch + claimThemeCoherence;

  return validateConsistency({
    thesisAlignment,
    positioningAlignment,
    toneMatch,
    claimThemeCoherence,
    driftWarnings: warnings,
    total,
  });
};

