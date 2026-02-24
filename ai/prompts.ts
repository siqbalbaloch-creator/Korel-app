export type ExtractedInsights = {
  primaryThesis: string;
  supportingThemes: string[];
  contrarianAngle: string;
  keyPoints: string[];
  notableStatsOrClaims: string[];
};

// ---------------------------------------------------------------------------
// InputType — document source classification (Phase 13)
// ---------------------------------------------------------------------------

export type InputType =
  | "INTERVIEW"
  | "PRODUCT_UPDATE"
  | "INVESTOR_UPDATE"
  | "STRATEGY_MEMO"
  | "CUSTOMER_STORY"
  | "CUSTOM";

export const VALID_INPUT_TYPES = new Set<InputType>([
  "INTERVIEW",
  "PRODUCT_UPDATE",
  "INVESTOR_UPDATE",
  "STRATEGY_MEMO",
  "CUSTOMER_STORY",
  "CUSTOM",
]);

export const INPUT_TYPE_LABELS: Record<InputType, string> = {
  INTERVIEW: "Interview",
  PRODUCT_UPDATE: "Product Update",
  INVESTOR_UPDATE: "Investor Update",
  STRATEGY_MEMO: "Strategy Memo",
  CUSTOMER_STORY: "Customer Story",
  CUSTOM: "Custom",
};

// ---------------------------------------------------------------------------
// AngleType — positioning lens applied on top of source (Phase 14)
// ---------------------------------------------------------------------------

export type AngleType =
  | "THOUGHT_LEADERSHIP"
  | "TACTICAL"
  | "CONTRARIAN"
  | "STORY_DRIVEN"
  | "VISIONARY"
  | "EXECUTION_FOCUSED";

export const VALID_ANGLES = new Set<AngleType>([
  "THOUGHT_LEADERSHIP",
  "TACTICAL",
  "CONTRARIAN",
  "STORY_DRIVEN",
  "VISIONARY",
  "EXECUTION_FOCUSED",
]);

export const ANGLE_LABELS: Record<AngleType, string> = {
  THOUGHT_LEADERSHIP: "Thought Leadership",
  TACTICAL: "Tactical",
  CONTRARIAN: "Contrarian",
  STORY_DRIVEN: "Story-Driven",
  VISIONARY: "Visionary",
  EXECUTION_FOCUSED: "Execution-Focused",
};

// ---------------------------------------------------------------------------
// Extraction bias — inputType bias injected BEFORE main extraction rules
// ---------------------------------------------------------------------------

const EXTRACTION_BIAS: Record<InputType, string> = {
  INTERVIEW: `Extraction bias — Interview/Talk context:
- Prioritize personal belief statements and first-person experiential insights.
- Extract moments where the speaker reveals a shift in thinking or a hard-won lesson.
- Weight narrative evidence and direct observations over abstract or generic claims.`,

  PRODUCT_UPDATE: `Extraction bias — Product Update context:
- Prioritize feature differentiation signals and concrete improvements over prior state.
- Extract measurable outcomes: performance gains, adoption rates, conversion data.
- Identify market-relevance signals and competitive positioning language.
- Downweight narrative storytelling; elevate functional specificity.`,

  INVESTOR_UPDATE: `Extraction bias — Investor Update context:
- Prioritize metrics, traction signals, and financial or growth evidence above all else.
- Extract ARR, MRR, retention, churn, and any quantified outcome explicitly stated.
- Identify inflection points and model-validation signals.
- Reduce storytelling bias; elevate proof statements and specificity.`,

  STRATEGY_MEMO: `Extraction bias — Strategy Memo context:
- Prioritize frameworks, decision logic, and positioning clarity.
- Extract the reasoning behind strategic choices, not just the choices themselves.
- Identify explicitly stated or strongly implied trade-offs.
- Highlight where the author reframes conventional strategic assumptions.`,

  CUSTOMER_STORY: `Extraction bias — Customer Story context:
- Prioritize the transformation arc: problem state → intervention → measurable outcome.
- Extract concrete before/after evidence and direct customer-voice language.
- Highlight the specific mechanism of change — what exactly caused the improvement.
- Focus on verifiable outcomes and measurable impact over general praise.`,

  CUSTOM: "",
};

// ---------------------------------------------------------------------------
// Angle extraction hints — short selection priority line (Phase 14)
// Injected after inputType bias, before main extraction rules.
// ---------------------------------------------------------------------------

const ANGLE_EXTRACTION_HINTS: Record<AngleType, string> = {
  THOUGHT_LEADERSHIP:
    "Selection priority: Favor principles, strategic frameworks, and lessons with broad applicability.",
  TACTICAL:
    "Selection priority: Favor actionable tactics, step-by-step mechanisms, and concrete decision rules over abstract principles.",
  CONTRARIAN:
    "Selection priority: Favor counterintuitive claims, surprising findings, and direct rebuttals of conventional assumptions.",
  STORY_DRIVEN:
    "Selection priority: Favor narrative moments, transformation arcs, and before/after evidence over abstract frameworks.",
  VISIONARY:
    "Selection priority: Favor trends, second-order implications, and forward-looking market signals.",
  EXECUTION_FOCUSED:
    "Selection priority: Favor quantified outcomes, operational decisions, constraints, and real-world tradeoffs.",
};

export const buildExtractionBiasInstruction = (inputType: InputType): string =>
  EXTRACTION_BIAS[inputType] ?? "";

export const buildAngleExtractionHint = (angle: AngleType): string =>
  ANGLE_EXTRACTION_HINTS[angle] ?? "";

// ---------------------------------------------------------------------------
// Generation framing — inputType framing suffix for platform prompts
// ---------------------------------------------------------------------------

const GENERATION_FRAMING: Record<InputType, string> = {
  INTERVIEW: `Generation framing — Interview context:
- Hooks can reference a personal realization, belief shift, or experiential observation.
- Claims should feel like hard-won first-person insights, not academic assertions.
- Narrative tone is appropriate; founder-to-founder voice preferred.`,

  PRODUCT_UPDATE: `Generation framing — Product Update context:
- Hooks must reference the specific improvement, outcome, or market shift — not a personal story.
- Claims must cite concrete outcomes or metrics drawn from the insights.
- Avoid personal narrative frames; keep content functional and outcome-specific.`,

  INVESTOR_UPDATE: `Generation framing — Investor Update context:
- Hooks must reference traction, numbers, or inflection points — not emotional narrative.
- Claims must cite proof or metrics; no unsupported assertions.
- Avoid emotional storytelling tone. Structure as: signal → implication → strategic bet.`,

  STRATEGY_MEMO: `Generation framing — Strategy Memo context:
- Hooks must announce a framework, decision logic, or clear positioning reframe — not a question.
- Claims should be structured as frameworks or positioning choices.
- Avoid story arcs; use analytical precision and declarative logic.`,

  CUSTOMER_STORY: `Generation framing — Customer Story context:
- Hooks can be narrative and anchor on the before-state or the unexpected outcome.
- Claims must emphasize the transformation arc and measurable impact.
- Center on the human outcome — not the product feature or company benefit.`,

  CUSTOM: "",
};

// ---------------------------------------------------------------------------
// Angle instructions — positioning lens (Phase 14)
// Injected after inputType framing, before the Insights block.
// ---------------------------------------------------------------------------

const ANGLE_INSTRUCTIONS: Record<AngleType, string> = {
  THOUGHT_LEADERSHIP: `Angle lens — Thought Leadership:
- Hooks: open with a sharp principle or expertise signal — calm confidence, no hype.
- Claims: state the principle first, then the strategic implication.
- Tone: measured, strategic, authoritative without aggression.`,

  TACTICAL: `Angle lens — Tactical:
- Hooks: lead with a clear "how-to", a rule count, or a concrete step that promises specificity.
- Claims: present as numbered steps, rules, or decision frameworks — no abstract fluff.
- Tone: practical and direct — every sentence must earn its place, zero filler.`,

  CONTRARIAN: `Angle lens — Contrarian:
- Hooks: challenge a widely held belief — name what most people do wrong or assume incorrectly.
- Claims: use "Most [X] [do Y]. The evidence shows [Z]." structure where possible.
- Tone: confident and evidence-forward — bold stance, never arrogant or gratuitously edgy.`,

  STORY_DRIVEN: `Angle lens — Story-Driven:
- Hooks: open with a narrative setup — a problem, a moment of tension, or an unexpected outcome.
- Claims: extracted as lessons from the story arc, not as abstract principles.
- Tone: human and vivid — B2B credible, not consumer-blog casual.`,

  VISIONARY: `Angle lens — Visionary:
- Hooks: frame the future — "where this is heading" or "what most people are not seeing yet."
- Claims: second-order effects, market direction, implications — grounded in the provided evidence.
- Tone: bold but disciplined — prediction without speculation or unsupported hype.`,

  EXECUTION_FOCUSED: `Angle lens — Execution-Focused:
- Hooks: lead with what shipped, what changed, or what constraint was solved.
- Claims: outcomes, tradeoffs, and decisions made — no abstract principles, no motivational language.
- Tone: operator voice — specific, direct, zero hype.`,
};

export const buildGenerationFramingSuffix = (inputType: InputType): string =>
  GENERATION_FRAMING[inputType] ?? "";

export const buildAngleInstruction = (angle: AngleType): string =>
  ANGLE_INSTRUCTIONS[angle] ?? "";

// ---------------------------------------------------------------------------
// Authority Profile Context — Phase 15
// Compact workspace memory block injected into extraction + generation prompts.
// ---------------------------------------------------------------------------

export type AuthorityProfileContext = {
  coreThesis?: string | null;
  positioning?: string | null;
  targetAudience?: string | null;
  tone?: string | null;
  toneNotes?: string | null;
};

const TONE_LABELS: Record<string, string> = {
  MEASURED: "Measured — calm, precise, no hype. Let the evidence speak.",
  BOLD: "Bold — strong stances, confident assertions, no hedging.",
  DIRECT: "Direct — minimal context, no filler, every sentence earns its place.",
  ACADEMIC: "Academic — structured, evidence-first, analytical precision.",
  FRIENDLY: "Friendly — accessible, conversational B2B voice.",
};

const sanitizeProfileField = (value: string): string =>
  value.replace(/\n{2,}/g, " ").replace(/[\x00-\x1F\x7F]/g, "").trim().slice(0, 500);

export const buildAuthorityContextBlock = (
  profile?: AuthorityProfileContext | null,
): string => {
  if (!profile) return "";
  const lines: string[] = [];
  if (profile.coreThesis?.trim())
    lines.push(`- Core thesis: ${sanitizeProfileField(profile.coreThesis)}`);
  if (profile.positioning?.trim())
    lines.push(`- Positioning: ${sanitizeProfileField(profile.positioning)}`);
  if (profile.targetAudience?.trim())
    lines.push(`- Audience: ${sanitizeProfileField(profile.targetAudience)}`);
  if (profile.tone?.trim()) {
    const label = TONE_LABELS[profile.tone] ?? profile.tone;
    lines.push(`- Tone: ${label}`);
  }
  if (profile.toneNotes?.trim())
    lines.push(`- Tone notes: ${sanitizeProfileField(profile.toneNotes)}`);
  if (!lines.length) return "";
  return `Authority Profile Context:\n${lines.join("\n")}`;
};

// ---------------------------------------------------------------------------
// Core prompts
// ---------------------------------------------------------------------------

const stringifyInsights = (insights: ExtractedInsights) =>
  JSON.stringify(insights, null, 2);

export const EXTRACTION_SYSTEM_PROMPT =
  "You are a precise strategic insight extractor. Return ONLY valid JSON that matches the provided schema. No markdown, no commentary, no extra text. Use short, declarative language. Avoid motivational tone.";

export const EXTRACTION_JSON_RETRY_INSTRUCTION =
  "Return ONLY valid JSON. No markdown, no commentary, no extra text.";

export const buildExtractionUserPrompt = (
  transcript: string,
  inputType: InputType = "INTERVIEW",
  angle: AngleType = "THOUGHT_LEADERSHIP",
  profile?: AuthorityProfileContext | null,
) => {
  const bias = buildExtractionBiasInstruction(inputType);
  const biasBlock = bias ? `${bias}\n\n` : "";
  const hint = buildAngleExtractionHint(angle);
  const hintLine = hint ? `${hint}\n\n` : "";
  const ctx = buildAuthorityContextBlock(profile);
  const profileSection = ctx ? `${ctx}\n\n` : "";

  return `${biasBlock}${hintLine}${profileSection}Extract the core insights from the transcript.

Rules:
- Use ONLY the transcript. Do not invent facts, stats, or claims.
- If a field is not present, use an empty string or empty array.
- Return JSON only.
- Each insight must include a core tension or contradiction, a specific outcome/pattern/principle, and a strategic implication (not advice language).
- Use short, decisive statements. No filler. No motivational tone.
- Avoid generic summary phrasing. Do NOT use: "This shows that", "It is important to", "In summary", "This means".

Categorize distinctly using existing fields (no schema changes):
- primaryThesis: the strategic angle anchoring the pack (tension + outcome/pattern + strategic implication).
- supportingThemes: additional strategic angles (distinct from the thesis; no repetition).
- keyPoints: tactical mechanisms (how it works) stated as mechanisms, not advice.
- notableStatsOrClaims: evidence-based observations (metrics, benchmarks, or concrete outcomes).
- contrarianAngle: only if present; a clear rebuttal of a common belief with an implication.

Transcript:\n${transcript}`;
};

export const PLATFORM_SYSTEM_PROMPT =
  "You are a B2B founder authority editor. Write with precision and decisiveness — no filler, no hedging, no AI-pattern phrases. Use ONLY the provided insights. Do not invent facts, stats, or claims. Vary sentence structure and phrasing so assets do not read like rewrites. Hooks must differ from posts. Newsletter must expand the insight rather than repeat LinkedIn or X wording. Output plain text only.";

export const buildLinkedInVariantAPrompt = (
  insights: ExtractedInsights,
  inputType: InputType = "INTERVIEW",
  angle: AngleType = "THOUGHT_LEADERSHIP",
  profile?: AuthorityProfileContext | null,
) => {
  const framing = buildGenerationFramingSuffix(inputType);
  const framingBlock = framing ? `\n---\n${framing}\n` : "";
  const angleBlock = `\n---\n${buildAngleInstruction(angle)}\n`;
  const ctx = buildAuthorityContextBlock(profile);
  const profileBlock = ctx ? `\n---\n${ctx}\n` : "";

  return `Variant A — Analytical (Strategic Breakdown)

Write a LinkedIn post with a founder-to-founder voice. Be decisive, specific, and direct.

Format (hard constraints):
\u2022 Opening line: one punchy signal, observation, or number \u2014 no question, no "I want to share", no greeting
\u2022 Context: 1\u20132 lines max
\u2022 Breakdown: 3\u20135 short lines (em dash bullets or plain numbers)
\u2022 Closing: one clean insight line \u2014 no CTA, no "Let me know your thoughts", no question

Voice rules:
\u2022 Founder-to-founder. No hedging ("might", "could", "perhaps").
\u2022 BANNED openers \u2014 never start with: "In today's world", "In today's fast-paced", "It's important to note", "This shows that", "As a founder", "I've been thinking about", "Let's talk about"
\u2022 Use specific numbers or outcomes from the insights wherever possible
\u2022 Keep phrasing distinct from other variants and from hook language
\u2022 Max 14 short paragraphs total \u2014 keep it tight
${framingBlock}${angleBlock}${profileBlock}
Insights:\n${stringifyInsights(insights)}`;
};

export const buildLinkedInVariantBPrompt = (
  insights: ExtractedInsights,
  inputType: InputType = "INTERVIEW",
  angle: AngleType = "THOUGHT_LEADERSHIP",
  profile?: AuthorityProfileContext | null,
) => {
  const framing = buildGenerationFramingSuffix(inputType);
  const framingBlock = framing ? `\n---\n${framing}\n` : "";
  const angleBlock = `\n---\n${buildAngleInstruction(angle)}\n`;
  const ctx = buildAuthorityContextBlock(profile);
  const profileBlock = ctx ? `\n---\n${ctx}\n` : "";

  return `Variant B \u2014 Contrarian (Bold Reframe)

Write a LinkedIn post that challenges a conventional belief directly. Be sharp and confident.

Format (hard constraints):
\u2022 Opening: one bold contrarian statement that names what most people believe and subverts it (e.g. "Most founders optimize X. That's the wrong lever.")
\u2022 Reframe: 2\u20133 short lines with the alternative view
\u2022 Evidence: 2\u20134 bullet points from the insights
\u2022 Closing: one sharp one-liner \u2014 not a question, not a request for engagement

Voice rules:
\u2022 No hedging. No softening. Take a clear stance.
\u2022 BANNED openers \u2014 never use: "In today's fast-paced world", "It's important to note", "This shows that", "Many people believe"
\u2022 Specific over vague \u2014 cite numbers or outcomes from the insights
\u2022 Keep phrasing distinct from other variants and from hook language
\u2022 Max 14 short paragraphs total
${framingBlock}${angleBlock}${profileBlock}
Insights:\n${stringifyInsights(insights)}`;
};

export const buildXThreadPrompt = (
  insights: ExtractedInsights,
  inputType: InputType = "INTERVIEW",
  angle: AngleType = "THOUGHT_LEADERSHIP",
  profile?: AuthorityProfileContext | null,
) => {
  const framing = buildGenerationFramingSuffix(inputType);
  const framingBlock = framing ? `\n---\n${framing}\n` : "";
  const angleBlock = `\n---\n${buildAngleInstruction(angle)}\n`;
  const ctx = buildAuthorityContextBlock(profile);
  const profileBlock = ctx ? `\n---\n${ctx}\n` : "";

  return `Create an X (Twitter) thread from the insights.

Rules:
\u2022 5\u20138 tweets total.
\u2022 Prefix each tweet with its number: "1/", "2/", etc.
\u2022 Tweet 1: the hook \u2014 scroll-stopping, creates tension or stakes. Do NOT open with a thesis statement. Make the reader want tweet 2.
\u2022 Tweets 2\u2013N: each is 1\u20132 short lines max. Logical progression. No tweet repeats the opening thesis.
\u2022 Final tweet: end on a strong insight or observation \u2014 NOT "Follow me for more", NOT "Let me know your thoughts", NOT a promotional CTA.
\u2022 Each tweet must be under 280 characters.
\u2022 No hashtags. No emojis. No paragraph walls.
\u2022 Do not reuse LinkedIn wording; rephrase and vary rhythm
\u2022 Use only the insights provided.
${framingBlock}${angleBlock}${profileBlock}
Insights:\n${stringifyInsights(insights)}`;
};

export const buildNewsletterPrompt = (
  insights: ExtractedInsights,
  inputType: InputType = "INTERVIEW",
  angle: AngleType = "THOUGHT_LEADERSHIP",
  profile?: AuthorityProfileContext | null,
) => {
  const framing = buildGenerationFramingSuffix(inputType);
  const framingBlock = framing ? `\n---\n${framing}\n` : "";
  const angleBlock = `\n---\n${buildAngleInstruction(angle)}\n`;
  const ctx = buildAuthorityContextBlock(profile);
  const profileBlock = ctx ? `\n---\n${ctx}\n` : "";

  return `Write a newsletter section for founders.

Format (hard constraints):
\u2022 Open with an executive framing paragraph: why this insight matters right now, in 2\u20133 sentences. No greetings, no "this week we're covering", no "I hope you're doing well".
\u2022 2\u20133 body sections. Label each with a plain-text subheading followed by a colon (e.g. "The Problem:" or "What Actually Works:").
\u2022 Each section: 3\u20135 concise sentences. Specific > general.
\u2022 Close with a "The Takeaway:" block \u2014 one insight sentence and one action sentence.
\u2022 Total: 250\u2013400 words.

Voice rules:
\u2022 Executive briefing tone \u2014 direct, structured, no filler.
\u2022 BANNED phrases: "In conclusion", "To summarize", "I hope this was helpful", "In today's fast-paced world", "It goes without saying"
\u2022 Expand the insight with fresh framing; do not reuse LinkedIn or X sentence structures
\u2022 Use only the insights provided.
${framingBlock}${angleBlock}${profileBlock}
Insights:\n${stringifyInsights(insights)}`;
};

// ---------------------------------------------------------------------------
// StrategicAuthorityMap — Phase 16
// The inspectable intermediate representation that powers all outputs.
// ---------------------------------------------------------------------------

export type EvidencePoint = {
  point: string;
  sourceQuote: string | null;
  type: "metric" | "example" | "comparison" | "principle";
};

export type StrategicClaim = {
  id: "C1" | "C2" | "C3";
  claim: string;
  whyItMatters: string;
  evidence: EvidencePoint[];
  counterObjection: string;
  differentiation: string;
};

export type HookCategoryName = "Contrarian" | "Data" | "Story" | "Tactical" | "Vision";

export type HookCategory = {
  category: HookCategoryName;
  hooks: string[];
};

export type StrategicAuthorityMap = {
  coreThesis: {
    statement: string;
    audience: string;
    angle: AngleType;
    inputType: InputType;
  };
  strategicClaims: StrategicClaim[];
  narrativeArc: {
    setup: string;
    tension: string;
    turningPoint: string;
    resolution: string;
    takeaway: string;
  };
  hookMatrix: {
    categories: HookCategory[];
  };
  objections: string[];
  proofAssets: {
    metrics: string[];
    examples: string[];
    comparisons: string[];
  };
};

/** SAM JSON schema for OpenAI structured output (strict mode). */
export const SAM_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["coreThesis", "strategicClaims", "narrativeArc", "hookMatrix", "objections", "proofAssets"],
  properties: {
    coreThesis: {
      type: "object",
      additionalProperties: false,
      required: ["statement", "audience", "angle", "inputType"],
      properties: {
        statement: { type: "string" },
        audience: { type: "string" },
        angle: { type: "string" },
        inputType: { type: "string" },
      },
    },
    strategicClaims: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "claim", "whyItMatters", "evidence", "counterObjection", "differentiation"],
        properties: {
          id: { type: "string" },
          claim: { type: "string" },
          whyItMatters: { type: "string" },
          evidence: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["point", "sourceQuote", "type"],
              properties: {
                point: { type: "string" },
                sourceQuote: { anyOf: [{ type: "string" }, { type: "null" }] },
                type: { type: "string" },
              },
            },
          },
          counterObjection: { type: "string" },
          differentiation: { type: "string" },
        },
      },
    },
    narrativeArc: {
      type: "object",
      additionalProperties: false,
      required: ["setup", "tension", "turningPoint", "resolution", "takeaway"],
      properties: {
        setup: { type: "string" },
        tension: { type: "string" },
        turningPoint: { type: "string" },
        resolution: { type: "string" },
        takeaway: { type: "string" },
      },
    },
    hookMatrix: {
      type: "object",
      additionalProperties: false,
      required: ["categories"],
      properties: {
        categories: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["category", "hooks"],
            properties: {
              category: { type: "string" },
              hooks: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
    },
    objections: { type: "array", items: { type: "string" } },
    proofAssets: {
      type: "object",
      additionalProperties: false,
      required: ["metrics", "examples", "comparisons"],
      properties: {
        metrics: { type: "array", items: { type: "string" } },
        examples: { type: "array", items: { type: "string" } },
        comparisons: { type: "array", items: { type: "string" } },
      },
    },
  },
} as const;

export const SAM_EXTRACTION_SYSTEM_PROMPT =
  "You are a strategic insight architect. Extract a complete StrategicAuthorityMap from the source material. Return ONLY valid JSON matching the schema. No markdown, no commentary. Every string field must be non-empty and substantive. Claims and hooks must be grounded strictly in the source — do not invent facts, statistics, or outcomes.";

export const buildSAMExtractionPrompt = (
  transcript: string,
  inputType: InputType = "INTERVIEW",
  angle: AngleType = "THOUGHT_LEADERSHIP",
  profile?: AuthorityProfileContext | null,
): string => {
  const bias = buildExtractionBiasInstruction(inputType);
  const biasBlock = bias ? `${bias}\n\n` : "";
  const hint = buildAngleExtractionHint(angle);
  const hintLine = hint ? `${hint}\n\n` : "";
  const ctx = buildAuthorityContextBlock(profile);
  const profileSection = ctx ? `${ctx}\n\n` : "";

  return `${biasBlock}${hintLine}${profileSection}Extract a StrategicAuthorityMap from the source material below.

Hard rules:
- coreThesis.angle: "${angle}" (use exactly this string)
- coreThesis.inputType: "${inputType}" (use exactly this string)
- coreThesis.audience: use Authority Profile audience if set, otherwise infer from source
- Produce EXACTLY 3 strategicClaims with ids "C1", "C2", "C3" — each must be distinct and non-redundant
- Each claim: 2–4 evidence points grounded in the source; evidence.type must be one of: metric, example, comparison, principle
- evidence.sourceQuote: include a direct quote (max 20 words) from the source if available, otherwise null
- hookMatrix: EXACTLY 5 categories: "Contrarian", "Data", "Story", "Tactical", "Vision" — 3–5 short punchy hooks each (under 100 chars, one clear idea per hook)
- objections: 3–5 realistic skeptic objections to the core thesis
- proofAssets.metrics: actual numbers and performance indicators from the source; empty array if none
- proofAssets.examples: concrete situations, companies, or decisions mentioned; empty array if none
- proofAssets.comparisons: before/after pairs or X vs Y contrasts; empty array if none
- All non-array string fields must be substantive — no placeholders, no generic summaries
- Do NOT invent statistics or claim outcomes not present in the source

Source material:
${transcript}`;
};

/** Concise SAM representation for injection into generation prompts. */
const stringifySAMForPrompt = (sam: StrategicAuthorityMap): string => {
  const claims = sam.strategicClaims.map((c) => ({
    id: c.id,
    claim: c.claim,
    whyItMatters: c.whyItMatters,
    evidence: c.evidence.map((e) => e.point),
    counterObjection: c.counterObjection,
    differentiation: c.differentiation,
  }));

  const hooks: Record<string, string[]> = {};
  sam.hookMatrix.categories.forEach((cat) => {
    hooks[cat.category] = cat.hooks.slice(0, 3);
  });

  return JSON.stringify(
    {
      thesis: sam.coreThesis.statement,
      audience: sam.coreThesis.audience,
      claims,
      arc: sam.narrativeArc,
      hooks,
      objections: sam.objections.slice(0, 4),
      proof: sam.proofAssets,
    },
    null,
    2,
  );
};

export const SAM_PLATFORM_SYSTEM_PROMPT =
  "You are a B2B founder authority editor. The Strategic Map is your ONLY source of truth — do not invent or re-interpret the source material. Write with precision and decisiveness. No filler, no hedging, no AI-pattern phrases. Vary sentence structure so assets do not read like rewrites of each other. Output plain text only.";

export const buildLinkedInFromSAMPrompt = (
  sam: StrategicAuthorityMap,
  variant: "A" | "B",
  inputType: InputType = "INTERVIEW",
  angle: AngleType = "THOUGHT_LEADERSHIP",
  profile?: AuthorityProfileContext | null,
): string => {
  const framing = buildGenerationFramingSuffix(inputType);
  const framingBlock = framing ? `\n---\n${framing}\n` : "";
  const angleBlock = `\n---\n${buildAngleInstruction(angle)}\n`;
  const ctx = buildAuthorityContextBlock(profile);
  const profileBlock = ctx ? `\n---\n${ctx}\n` : "";

  const c1 = sam.strategicClaims[0];
  const c2 = sam.strategicClaims[1];

  if (variant === "A") {
    return `Variant A \u2014 Analytical (Strategic Breakdown)

Write a LinkedIn post with a founder-to-founder voice. Be decisive, specific, and direct.

Focus guidance (use the Strategic Map as source of truth):
\u2022 Central claim: ${c1?.claim ?? sam.coreThesis.statement}
\u2022 Why it matters: ${c1?.whyItMatters ?? ""}
\u2022 Key evidence: ${c1?.evidence.map((e) => e.point).join("; ") ?? ""}
\u2022 Open with context or tension: ${sam.narrativeArc.setup}
\u2022 Close with resolution: ${sam.narrativeArc.takeaway}${c1?.counterObjection ? `\n\u2022 Optionally address objection: ${c1.counterObjection}` : ""}

Format (hard constraints):
\u2022 Opening line: one punchy signal, observation, or number \u2014 no question, no "I want to share", no greeting
\u2022 Context: 1\u20132 lines max
\u2022 Breakdown: 3\u20135 short lines (em dash bullets or plain numbers)
\u2022 Closing: one clean insight line \u2014 no CTA, no "Let me know your thoughts"
\u2022 One optional brief CTA line consistent with tone is allowed

Voice rules:
\u2022 Founder-to-founder. No hedging.
\u2022 BANNED openers: "In today\u2019s world", "It\u2019s important to note", "As a founder", "Let\u2019s talk about"
\u2022 Use specific numbers or outcomes from the evidence
\u2022 Max 14 short paragraphs total
${framingBlock}${angleBlock}${profileBlock}
Strategic Map:
${stringifySAMForPrompt(sam)}`;
  }

  return `Variant B \u2014 Contrarian (Bold Reframe)

Write a LinkedIn post that challenges a conventional belief. Be sharp and confident.

Focus guidance (use the Strategic Map as source of truth):
\u2022 Central claim: ${c2?.claim ?? sam.coreThesis.statement}
\u2022 Why it matters: ${c2?.whyItMatters ?? ""}
\u2022 Counter-objection to address: ${c2?.counterObjection ?? ""}
\u2022 Differentiation: ${c2?.differentiation ?? ""}
\u2022 Key evidence: ${c2?.evidence.map((e) => e.point).join("; ") ?? ""}

Format (hard constraints):
\u2022 Opening: one bold contrarian statement \u2014 names what most people believe and subverts it
\u2022 Reframe: 2\u20133 short lines with the alternative view
\u2022 Evidence: 2\u20134 bullet points from the strategic map
\u2022 Closing: one sharp one-liner \u2014 not a question, not a request for engagement

Voice rules:
\u2022 No hedging. No softening. Take a clear stance.
\u2022 BANNED openers: "In today\u2019s fast-paced world", "It\u2019s important to note", "Many people believe"
\u2022 Specific over vague
\u2022 Max 14 short paragraphs total
${framingBlock}${angleBlock}${profileBlock}
Strategic Map:
${stringifySAMForPrompt(sam)}`;
};

export const buildLinkedInFromSAMWithContextPrompt = (
  sam: StrategicAuthorityMap,
  existingContent: string,
  variant: "A" | "B",
  inputType: InputType = "INTERVIEW",
  angle: AngleType = "THOUGHT_LEADERSHIP",
  profile?: AuthorityProfileContext | null,
): string =>
  `${buildLinkedInFromSAMPrompt(sam, variant, inputType, angle, profile)}

Existing version (improve on it \u2014 do not repeat phrases verbatim):
---
${existingContent.slice(0, 600)}
---`;

export const buildXThreadFromSAMPrompt = (
  sam: StrategicAuthorityMap,
  inputType: InputType = "INTERVIEW",
  angle: AngleType = "THOUGHT_LEADERSHIP",
  profile?: AuthorityProfileContext | null,
  existingThread?: string,
): string => {
  const framing = buildGenerationFramingSuffix(inputType);
  const framingBlock = framing ? `\n---\n${framing}\n` : "";
  const angleBlock = `\n---\n${buildAngleInstruction(angle)}\n`;
  const ctx = buildAuthorityContextBlock(profile);
  const profileBlock = ctx ? `\n---\n${ctx}\n` : "";

  const ANGLE_HOOK_PRIORITY: Partial<Record<AngleType, HookCategoryName[]>> = {
    CONTRARIAN: ["Contrarian", "Story"],
    STORY_DRIVEN: ["Story", "Contrarian"],
    TACTICAL: ["Tactical", "Data"],
    EXECUTION_FOCUSED: ["Tactical", "Data"],
    VISIONARY: ["Vision", "Story"],
    THOUGHT_LEADERSHIP: ["Data", "Vision"],
  };
  const priority = ANGLE_HOOK_PRIORITY[angle] ?? ["Data", "Story"];
  const catMap = new Map(sam.hookMatrix.categories.map((c) => [c.category, c.hooks]));
  let bestHook = "";
  for (const cat of priority) {
    const hooks = catMap.get(cat);
    if (hooks?.length) {
      bestHook = hooks[0]!;
      break;
    }
  }
  if (!bestHook) bestHook = sam.hookMatrix.categories[0]?.hooks[0] ?? sam.coreThesis.statement;

  const contextBlock = existingThread
    ? `\n\nExisting thread (improve on it \u2014 do not repeat lines verbatim):\n---\n${existingThread.slice(0, 600)}\n---`
    : "";

  return `Create an X (Twitter) thread from the Strategic Map. The map is your ONLY source of truth.

Structure:
\u2022 Tweet 1 (hook): Use this hook or improve it: "${bestHook}" \u2014 scroll-stopping, creates stakes, makes reader want Tweet 2
\u2022 Tweet 2: Thesis \u2014 ${sam.coreThesis.statement}
\u2022 Tweet 3: ${sam.strategicClaims[0]?.claim ?? ""} \u2014 evidence: ${sam.strategicClaims[0]?.evidence[0]?.point ?? ""}
\u2022 Tweet 4: ${sam.strategicClaims[1]?.claim ?? ""} \u2014 evidence: ${sam.strategicClaims[1]?.evidence[0]?.point ?? ""}
\u2022 Tweet 5: ${sam.strategicClaims[2]?.claim ?? ""} \u2014 evidence: ${sam.strategicClaims[2]?.evidence[0]?.point ?? ""}
\u2022 Final tweet: "${sam.narrativeArc.takeaway}"

Rules:
\u2022 5\u20138 tweets total. Prefix each with its number: "1/", "2/", etc.
\u2022 Each tweet: 1\u20132 short lines max, under 280 characters.
\u2022 No hashtags. No emojis. No paragraph walls.
\u2022 Final tweet must NOT be "Follow me for more" or a promotional CTA.
\u2022 Do not reuse LinkedIn wording.
${framingBlock}${angleBlock}${profileBlock}
Strategic Map:
${stringifySAMForPrompt(sam)}${contextBlock}`;
};

export const buildNewsletterFromSAMPrompt = (
  sam: StrategicAuthorityMap,
  inputType: InputType = "INTERVIEW",
  angle: AngleType = "THOUGHT_LEADERSHIP",
  profile?: AuthorityProfileContext | null,
): string => {
  const framing = buildGenerationFramingSuffix(inputType);
  const framingBlock = framing ? `\n---\n${framing}\n` : "";
  const angleBlock = `\n---\n${buildAngleInstruction(angle)}\n`;
  const ctx = buildAuthorityContextBlock(profile);
  const profileBlock = ctx ? `\n---\n${ctx}\n` : "";

  const c0 = sam.strategicClaims[0];
  const c1 = sam.strategicClaims[1];
  const c2 = sam.strategicClaims[2];

  return `Write a newsletter section for founders. The Strategic Map is your ONLY source of truth.

Structure:
\u2022 Intro (2\u20133 sentences): Open with the narrative setup and tension \u2014 "${sam.narrativeArc.setup}" / "${sam.narrativeArc.tension}"
\u2022 Section labeled "${c0?.claim ?? "Key Insight"}:" \u2014 3\u20134 sentences using evidence: ${c0?.evidence.map((e) => e.point).join("; ") ?? ""}
\u2022 Section labeled "${c1?.claim ?? "The Reframe"}:" \u2014 3\u20134 sentences; address: "${c1?.counterObjection ?? ""}"${
    c2 ? `\n\u2022 Section labeled "${c2.claim}:" \u2014 2\u20133 sentences; differentiation: "${c2.differentiation}"` : ""
  }
\u2022 "The Takeaway:" block \u2014 "${sam.narrativeArc.takeaway}" + one action sentence

Format rules:
\u2022 Plain-text subheadings followed by a colon
\u2022 Total: 250\u2013400 words
\u2022 Executive briefing tone \u2014 direct, structured, no filler
\u2022 BANNED phrases: "In conclusion", "To summarize", "I hope this was helpful", "In today\u2019s fast-paced world"
\u2022 Do not reuse LinkedIn or X sentence structures
${framingBlock}${angleBlock}${profileBlock}
Strategic Map:
${stringifySAMForPrompt(sam)}`;
};

export const buildLinkedInVariantAWithContextPrompt = (
  insights: ExtractedInsights,
  existingContent: string,
  inputType: InputType = "INTERVIEW",
  angle: AngleType = "THOUGHT_LEADERSHIP",
  profile?: AuthorityProfileContext | null,
) =>
  `${buildLinkedInVariantAPrompt(insights, inputType, angle, profile)}

Existing version (improve on it \u2014 do not repeat phrases verbatim):
---
${existingContent.slice(0, 600)}
---`;

export const buildLinkedInVariantBWithContextPrompt = (
  insights: ExtractedInsights,
  existingContent: string,
  inputType: InputType = "INTERVIEW",
  angle: AngleType = "THOUGHT_LEADERSHIP",
  profile?: AuthorityProfileContext | null,
) =>
  `${buildLinkedInVariantBPrompt(insights, inputType, angle, profile)}

Existing version (improve on it \u2014 do not repeat phrases verbatim):
---
${existingContent.slice(0, 600)}
---`;

export const buildXThreadWithContextPrompt = (
  insights: ExtractedInsights,
  existingThread: string,
  inputType: InputType = "INTERVIEW",
  angle: AngleType = "THOUGHT_LEADERSHIP",
  profile?: AuthorityProfileContext | null,
) =>
  `${buildXThreadPrompt(insights, inputType, angle, profile)}

Existing thread (improve on it \u2014 do not repeat lines verbatim):
---
${existingThread.slice(0, 600)}
---`;
