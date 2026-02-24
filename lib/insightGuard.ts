type TopicIndex = {
  topics: string[];
  keywords: string[];
};

type InsightSource = {
  coreThesis?: unknown;
  insightBreakdown?: unknown;
  executiveSummary?: unknown;
  strategicHooks?: unknown;
};

const toRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toString = (value: unknown) => (typeof value === "string" ? value : "");

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const unique = (items: string[]) => Array.from(new Set(items));

const buildTopicIndex = (topics: string[]): TopicIndex => {
  const normalizedTopics = unique(
    topics.map(normalize).filter((topic) => topic.length > 0),
  );
  const keywords = unique(
    normalizedTopics
      .flatMap((topic) => topic.split(" "))
      .filter((word) => word.length >= 4),
  );
  return { topics: normalizedTopics, keywords };
};

export const buildInsightTopicIndex = (source: InsightSource): TopicIndex => {
  const coreThesis = toRecord(source.coreThesis);
  const insightBreakdown = toRecord(source.insightBreakdown);
  const executiveSummary = toRecord(source.executiveSummary);
  const strategicHooks = toRecord(source.strategicHooks);

  const topics = [
    toString(coreThesis.primaryThesis),
    ...toStringArray(coreThesis.supportingThemes),
    ...toStringArray(insightBreakdown.strongClaims),
    ...toStringArray(insightBreakdown.dataBackedAngles),
    ...toStringArray(insightBreakdown.frameworks),
    toString(executiveSummary.headline),
    toString(executiveSummary.positioningSentence),
    ...toStringArray(executiveSummary.keyInsights),
    ...toStringArray(strategicHooks.linkedin),
    ...toStringArray(strategicHooks.twitter),
    ...toStringArray(strategicHooks.contrarian),
  ].filter(Boolean);

  return buildTopicIndex(topics);
};

export const buildThesisTopicIndex = (coreThesisValue: unknown): TopicIndex => {
  const coreThesis = toRecord(coreThesisValue);
  const topics = [
    toString(coreThesis.primaryThesis),
    ...toStringArray(coreThesis.supportingThemes),
  ].filter(Boolean);
  return buildTopicIndex(topics);
};

const matchesTopicIndex = (normalizedText: string, index: TopicIndex): boolean =>
  index.topics.some((topic) => normalizedText.includes(topic)) ||
  index.keywords.some((keyword) => normalizedText.includes(keyword));

export const sectionAlignsWithTopics = (text: string, index: TopicIndex): boolean => {
  const normalizedText = normalize(text);
  if (!normalizedText) {
    return false;
  }
  return matchesTopicIndex(normalizedText, index);
};

const CLAIM_REGEX =
  /\b(is|are|was|were|will|drives?|leads?|causes?|means|shows|proves|reduces?|increases?|decreases?|cuts?|boosts?|creates?|prevents?|results?)\b|%|\d{2,}/i;

const splitChunks = (content: string): string[] =>
  content
    .replace(/\r\n/g, "\n")
    .split(/\n+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

export const validateAssetContent = (
  content: string,
  index: TopicIndex,
): { ok: boolean; unsupported: string[] } => {
  const chunks = splitChunks(content);
  const unsupported: string[] = [];

  for (const chunk of chunks) {
    if (chunk.length < 18 || !CLAIM_REGEX.test(chunk)) {
      continue;
    }
    const normalizedChunk = normalize(chunk);
    if (!matchesTopicIndex(normalizedChunk, index)) {
      unsupported.push(chunk);
    }
  }

  return { ok: unsupported.length === 0, unsupported };
};
