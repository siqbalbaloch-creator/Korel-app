import { notFound, redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import {
  RefreshCw,
  Copy as CopyIcon,
  Trash2,
  BarChart2,
  FileText,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import PostPlatformSection from "./PostPlatformSection";
import HooksSectionClient from "./HooksSectionClient";
import SourcePanel from "./SourcePanel";
import RepurposeButton from "./RepurposeButton";
import PublishButton from "./PublishButton";
import PackHealthPanel from "./PackHealthPanel";
import QualityNudgeBanner from "./QualityNudgeBanner";
import { calculateQualityScore } from "@/lib/calculateQualityScore";
import NewsletterSection from "./NewsletterSection";
import { getUserPlan } from "@/lib/getUserPlan";
import { getPlanConfig } from "@/lib/plans";
import {
  buildThesisTopicIndex,
  sectionAlignsWithTopics,
} from "@/lib/insightGuard";
import type { StrategicAuthorityMap } from "@/ai/prompts";

type CoreThesis = {
  primaryThesis: string;
  supportingThemes: string[];
  targetPersona: string;
};

type StrategicHooks = {
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

type ExecutiveSummary = {
  headline: string;
  positioningSentence: string;
  keyInsights: string[];
};

type MessagingStrength = {
  hookStrength: number;
  claimRobustness: number;
  evidenceDepth: number;
  differentiationClarity: number;
  objectionCoverage: number;
  total: number;
};

type AuthorityConsistency = {
  thesisAlignment: number;
  positioningAlignment: number;
  toneMatch: number;
  claimThemeCoherence: number;
  driftWarnings: string[];
  total: number;
};

type AuthorityMapView = {
  coreThesis: {
    statement: string;
    audience: string;
  };
  strategicClaims: {
    id: string;
    claim: string;
    whyItMatters: string;
  }[];
  objections: string[];
  hookMatrix: {
    categories: {
      category: string;
      hooks: string[];
    }[];
  };
};

type HistoryDetailParams = {
  params: Promise<{ id: string }>;
};

const formatDate = (value: Date) =>
  value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const truncateText = (value: string, maxLength = 96) => {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength)}...`;
};

const extractUrl = (value: string) => {
  const match = value.match(/https?:\/\/\S+/i);
  if (!match) {
    return "";
  }
  return match[0].replace(/[),.]+$/, "");
};

const getSourceType = (value: string): "youtube" | "transcript" => {
  const lower = value.toLowerCase();
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    return "youtube";
  }
  return "transcript";
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toString = (value: unknown) => (typeof value === "string" ? value : "");

const toStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

const toNonEmptyStrings = (value: unknown) =>
  toStringArray(value).map((item) => item.trim()).filter(Boolean);

const parseCoreThesis = (value: Prisma.JsonValue | null): CoreThesis => {
  if (!isRecord(value)) {
    return { primaryThesis: "", supportingThemes: [], targetPersona: "" };
  }
  return {
    primaryThesis: toString(value.primaryThesis),
    supportingThemes: toStringArray(value.supportingThemes),
    targetPersona: toString(value.targetPersona),
  };
};

const parseStrategicHooks = (value: Prisma.JsonValue | null): StrategicHooks => {
  if (!isRecord(value)) {
    return { linkedin: [], twitter: [], contrarian: [] };
  }
  return {
    linkedin: toStringArray(value.linkedin),
    twitter: toStringArray(value.twitter),
    contrarian: toStringArray(value.contrarian),
  };
};

const parseHighLeveragePosts = (
  value: Prisma.JsonValue | null,
): HighLeveragePosts => {
  if (!isRecord(value)) {
    return { linkedinPosts: [], twitterThread: [], newsletterSummary: "" };
  }
  return {
    linkedinPosts: toStringArray(value.linkedinPosts),
    twitterThread: toStringArray(value.twitterThread),
    newsletterSummary: toString(value.newsletterSummary),
  };
};

const parseInsightBreakdown = (
  value: Prisma.JsonValue | null,
): InsightBreakdown => {
  if (!isRecord(value)) {
    return { strongClaims: [], dataBackedAngles: [], frameworks: [] };
  }
  return {
    strongClaims: toStringArray(value.strongClaims),
    dataBackedAngles: toStringArray(value.dataBackedAngles),
    frameworks: toStringArray(value.frameworks),
  };
};


const parseExecutiveSummary = (
  value: Prisma.JsonValue | null,
): ExecutiveSummary => {
  if (!isRecord(value)) {
    return { headline: "", positioningSentence: "", keyInsights: [] };
  }
  return {
    headline: toString(value.headline),
    positioningSentence: toString(value.positioningSentence),
    keyInsights: toStringArray(value.keyInsights),
  };
};

const toNumber = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const parseMessagingStrength = (
  value: Prisma.JsonValue | null,
): MessagingStrength | null => {
  if (!isRecord(value)) {
    return null;
  }
  const total = toNumber(value.total);
  if (!Number.isFinite(total) || total <= 0) {
    return null;
  }
  return {
    hookStrength: toNumber(value.hookStrength),
    claimRobustness: toNumber(value.claimRobustness),
    evidenceDepth: toNumber(value.evidenceDepth),
    differentiationClarity: toNumber(value.differentiationClarity),
    objectionCoverage: toNumber(value.objectionCoverage),
    total,
  };
};

const parseAuthorityConsistency = (
  value: Prisma.JsonValue | null,
): AuthorityConsistency | null => {
  if (!isRecord(value)) {
    return null;
  }
  const total = toNumber(value.total);
  if (!Number.isFinite(total) || total <= 0) {
    return null;
  }
  return {
    thesisAlignment: toNumber(value.thesisAlignment),
    positioningAlignment: toNumber(value.positioningAlignment),
    toneMatch: toNumber(value.toneMatch),
    claimThemeCoherence: toNumber(value.claimThemeCoherence),
    driftWarnings: Array.isArray(value.driftWarnings)
      ? value.driftWarnings.filter((item): item is string => typeof item === "string")
      : [],
    total,
  };
};

const parseStrategicMap = (
  value: Prisma.JsonValue | null,
): AuthorityMapView | null => {
  if (!isRecord(value)) {
    return null;
  }
  const coreThesisRecord = isRecord(value.coreThesis)
    ? value.coreThesis
    : null;
  if (!coreThesisRecord) {
    return null;
  }
  const statement = toString(coreThesisRecord.statement).trim();
  if (!statement) {
    return null;
  }
  const audience = toString(coreThesisRecord.audience);

  const strategicClaims = Array.isArray(value.strategicClaims)
    ? value.strategicClaims
        .filter(isRecord)
        .map((claim) => ({
          id: toString(claim.id),
          claim: toString(claim.claim),
          whyItMatters: toString(claim.whyItMatters),
        }))
        .filter((claim) => claim.claim.trim().length > 0)
    : [];

  const objections = toNonEmptyStrings(value.objections);

  const hookMatrixRecord = isRecord(value.hookMatrix)
    ? value.hookMatrix
    : null;
  const categories = hookMatrixRecord && Array.isArray(hookMatrixRecord.categories)
    ? hookMatrixRecord.categories
        .filter(isRecord)
        .map((cat) => ({
          category: toString(cat.category),
          hooks: toNonEmptyStrings(cat.hooks),
        }))
        .filter((cat) => cat.category.trim().length > 0)
    : [];

  return {
    coreThesis: { statement, audience },
    strategicClaims,
    objections,
    hookMatrix: { categories },
  };
};

function QuickActionButton({
  icon,
  label,
  variant,
  type = "button",
}: {
  icon: React.ReactNode;
  label: string;
  variant?: "destructive";
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      className={`group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        variant === "destructive"
          ? "text-neutral-900 hover:bg-red-50 hover:text-red-700"
          : "text-neutral-900 hover:bg-neutral-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default async function HistoryDetailPage({ params }: HistoryDetailParams) {
  const { id } = await params;

  const session = await getServerAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/signin");
  }

  const pack = await prisma.authorityPack.findFirst({
    where: { id, userId },
  });

  if (!pack) {
    notFound();
  }

  const coreThesis = parseCoreThesis(pack.coreThesis);
  const strategicHooks = parseStrategicHooks(pack.strategicHooks);
  const highLeveragePosts = parseHighLeveragePosts(pack.highLeveragePosts);
  const insightBreakdown = parseInsightBreakdown(pack.insightBreakdown);
  const executiveSummary = parseExecutiveSummary(pack.executiveSummary);
  const strategicMapView = parseStrategicMap(pack.strategicMap);
  const strategicMapRaw = (pack.strategicMap ?? null) as StrategicAuthorityMap | null;
  const messagingStrength = parseMessagingStrength(pack.messagingStrength);
  const authorityConsistency = parseAuthorityConsistency(pack.authorityConsistency);

  const planInfo = await getUserPlan(userId, { role: session.user.role });
  const planConfig = getPlanConfig(planInfo.plan);
  const regenLimit = Number.isFinite(planConfig.maxRegenerationsPerPack)
    ? planConfig.maxRegenerationsPerPack
    : null;
  const regenLimitReached =
    typeof regenLimit === "number" ? pack.regenerationCount >= regenLimit : false;
  const regenNotice =
    regenLimitReached && typeof regenLimit === "number"
      ? `You've reached your regeneration limit (${pack.regenerationCount}/${regenLimit}). Upgrade to increase capacity.`
      : null;
  const canRepurpose = planConfig.repurposeAccess;

  const { breakdown: qualityBreakdown } = calculateQualityScore(
    pack,
    pack.inputType,
    pack.angle,
    undefined,
    strategicMapRaw,
  );

  const sourceType = getSourceType(pack.originalInput);
  const rawYoutubeUrl = extractUrl(pack.originalInput);
  const youtubeHref = rawYoutubeUrl;
  const displayYoutubeUrl = truncateText(rawYoutubeUrl, 60);

  const deletePackAction = async () => {
    "use server";
    const session = await getServerAuthSession();
    const userId = session?.user?.id;
    if (!userId) {
      redirect("/signin");
    }
    await prisma.authorityPack.deleteMany({ where: { id, userId } });
    redirect("/history");
  };

  const allWords = [
    coreThesis.primaryThesis,
    ...coreThesis.supportingThemes,
    coreThesis.targetPersona,
    ...strategicHooks.linkedin,
    ...strategicHooks.twitter,
    ...strategicHooks.contrarian,
    ...highLeveragePosts.linkedinPosts,
    ...highLeveragePosts.twitterThread,
    highLeveragePosts.newsletterSummary,
    ...insightBreakdown.strongClaims,
    ...insightBreakdown.dataBackedAngles,
    ...insightBreakdown.frameworks,
    executiveSummary.headline,
    executiveSummary.positioningSentence,
    ...executiveSummary.keyInsights,
  ]
    .join(" ")
    .split(/\s+/)
    .filter(Boolean);

  const wordCount = allWords.length;
  const sectionsCount = 6;
  const hasNewsletter = highLeveragePosts.newsletterSummary.trim().length > 0;

  const thesisIndex = buildThesisTopicIndex(coreThesis);
  const cohesionChecks = [
    sectionAlignsWithTopics(
      [
        ...strategicHooks.linkedin,
        ...strategicHooks.twitter,
        ...strategicHooks.contrarian,
      ].join(" "),
      thesisIndex,
    ),
    sectionAlignsWithTopics(
      [
        coreThesis.primaryThesis,
        ...coreThesis.supportingThemes,
        coreThesis.targetPersona,
      ].join(" "),
      thesisIndex,
    ),
    sectionAlignsWithTopics(
      [
        ...insightBreakdown.strongClaims,
        ...insightBreakdown.dataBackedAngles,
        ...insightBreakdown.frameworks,
      ].join(" "),
      thesisIndex,
    ),
    sectionAlignsWithTopics(
      [
        ...highLeveragePosts.linkedinPosts,
        ...highLeveragePosts.twitterThread,
      ].join(" "),
      thesisIndex,
    ),
    hasNewsletter
      ? sectionAlignsWithTopics(highLeveragePosts.newsletterSummary, thesisIndex)
      : true,
  ];
  const isCohesive = cohesionChecks.every(Boolean);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1100px] mx-auto px-6 py-8">
        <div className="mb-4">
          <h1 className="text-3xl font-semibold text-neutral-900 mb-1">
            {pack.title}
          </h1>
          <p className="text-sm text-neutral-500">
            Created {formatDate(pack.createdAt)}
          </p>
        </div>

        {/* Intelligence Strip */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {pack.qualityScore !== null && pack.qualityScore !== undefined && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                pack.qualityScore >= 80
                  ? "bg-green-100 text-green-700"
                  : pack.qualityScore >= 50
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-600"
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              {Math.round(pack.qualityScore)}/100
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
            <FileText className="h-3.5 w-3.5" />
            {wordCount} words
          </span>
          {isCohesive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700">
              Cohesion verified
            </span>
          ) : (
            <a
              href="#pack-health"
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 transition"
            >
              Cohesion check recommended
            </a>
          )}
          {pack.regenerationCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
              <RefreshCw className="h-3.5 w-3.5" />
              {pack.regenerationCount} regen{pack.regenerationCount !== 1 ? "s" : ""}
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              pack.status === "published"
                ? "bg-green-100 text-green-700"
                : "bg-neutral-100 text-neutral-500"
            }`}
          >
            {pack.status === "published" ? "Published" : "Draft"}
          </span>
          {/* Publish encouragement — high quality draft */}
          {pack.status !== "published" &&
            pack.qualityScore !== null &&
            pack.qualityScore !== undefined &&
            pack.qualityScore > 80 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700">
                Ready to publish
              </span>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8 items-start">
          <div>
            {/* Quality Nudge Banner */}
            {pack.qualityScore !== null && pack.qualityScore !== undefined && (
              <QualityNudgeBanner
                qualityScore={pack.qualityScore}
                breakdown={qualityBreakdown}
              />
            )}

            <section className="mt-6">
              <HooksSectionClient
                packId={pack.id}
                initialHooks={strategicHooks}
                defaultOpen
                regenLimitReached={regenLimitReached}
                regenNotice={regenNotice ?? undefined}
                upgradeHref="/upgrade"
              />
            </section>

            <section className="mt-8 border-t border-neutral-200 pt-8">
              <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <div className="px-5 pt-4">
                  <h2 className="text-sm font-semibold text-neutral-900">
                    Core Thesis
                  </h2>
                </div>
                <div className="px-5 pb-5 pt-4 space-y-4">
                  <p className="text-base text-neutral-800">
                    {coreThesis.primaryThesis}
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-sm text-neutral-600">
                    {coreThesis.supportingThemes.map((theme, index) => (
                      <li key={`theme-${index}`}>{theme}</li>
                    ))}
                  </ul>
                  <p className="text-sm text-neutral-500">
                    Target Persona{" "}
                    <span className="text-neutral-800">
                      {coreThesis.targetPersona}
                    </span>
                  </p>
                </div>
              </div>
            </section>

            {strategicMapView && (
              <section className="mt-8 border-t border-neutral-200 pt-8">
                <details className="group rounded-2xl border border-neutral-200 bg-white shadow-sm">
                  <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-neutral-900">
                    <span>Authority Map</span>
                    <span className="text-xs font-medium text-neutral-400 transition-transform group-open:rotate-180">
                      v
                    </span>
                  </summary>
                  <div className="px-5 pb-5 pt-1 space-y-5">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-neutral-400">
                        Core Thesis
                      </p>
                      <p className="text-sm text-neutral-800">
                        {strategicMapView.coreThesis.statement}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs uppercase tracking-wide text-neutral-400">
                        Claims
                      </p>
                      <div className="grid gap-3">
                        {strategicMapView.strategicClaims.map((claim) => (
                          <div
                            key={claim.id}
                            className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3"
                          >
                            <p className="text-xs font-semibold text-neutral-500">
                              {claim.id}
                            </p>
                            <p className="text-sm text-neutral-800">
                              {claim.claim}
                            </p>
                            <p className="mt-2 text-xs text-neutral-500">
                              Why it matters:{" "}
                              <span className="text-neutral-700">
                                {claim.whyItMatters}
                              </span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-neutral-400">
                        Objections
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-sm text-neutral-600">
                        {strategicMapView.objections.map((objection, index) => (
                          <li key={`objection-${index}`}>{objection}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs uppercase tracking-wide text-neutral-400">
                        Hook Matrix
                      </p>
                      <div className="grid gap-3 md:grid-cols-2">
                        {strategicMapView.hookMatrix.categories.map((category) => (
                          <div
                            key={category.category}
                            className="rounded-xl border border-neutral-200 bg-white px-4 py-3"
                          >
                            <p className="text-xs font-semibold text-neutral-500">
                              {category.category}
                            </p>
                            <ul className="mt-2 list-disc pl-4 space-y-1 text-sm text-neutral-600">
                              {category.hooks.map((hook, index) => (
                                <li key={`${category.category}-${index}`}>
                                  {hook}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </details>
              </section>
            )}

            {messagingStrength && (
              <section className="mt-8 border-t border-neutral-200 pt-8">
                <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
                  <div className="px-5 pt-4">
                    <h2 className="text-sm font-semibold text-neutral-900">
                      Messaging Strength
                    </h2>
                  </div>
                  <div className="px-5 pb-5 pt-4 space-y-3 text-sm text-neutral-700">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">Hook Strength</span>
                      <span className="font-semibold text-neutral-900">
                        {messagingStrength.hookStrength}/20
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">Claim Robustness</span>
                      <span className="font-semibold text-neutral-900">
                        {messagingStrength.claimRobustness}/20
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">Evidence Depth</span>
                      <span className="font-semibold text-neutral-900">
                        {messagingStrength.evidenceDepth}/20
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">Differentiation</span>
                      <span className="font-semibold text-neutral-900">
                        {messagingStrength.differentiationClarity}/20
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">Objection Coverage</span>
                      <span className="font-semibold text-neutral-900">
                        {messagingStrength.objectionCoverage}/20
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
                      <span className="font-semibold text-neutral-900">Total</span>
                      <span className="font-semibold text-neutral-900">
                        {messagingStrength.total}/100
                      </span>
                    </div>
                    {messagingStrength.total < 60 && (
                      <p className="text-xs text-neutral-400">
                        Structural improvements possible.
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}

            {authorityConsistency && (
              <section className="mt-8 border-t border-neutral-200 pt-8">
                <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
                  <div className="px-5 pt-4">
                    <h2 className="text-sm font-semibold text-neutral-900">
                      Authority Consistency
                    </h2>
                  </div>
                  <div className="px-5 pb-5 pt-4 space-y-3 text-sm text-neutral-700">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">Total</span>
                      <span className="font-semibold text-neutral-900">
                        {authorityConsistency.total}/100
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">Thesis Alignment</span>
                      <span className="font-semibold text-neutral-900">
                        {authorityConsistency.thesisAlignment}/25
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">Positioning Alignment</span>
                      <span className="font-semibold text-neutral-900">
                        {authorityConsistency.positioningAlignment}/25
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">Tone Match</span>
                      <span className="font-semibold text-neutral-900">
                        {authorityConsistency.toneMatch}/20
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">Theme Coherence</span>
                      <span className="font-semibold text-neutral-900">
                        {authorityConsistency.claimThemeCoherence}/20
                      </span>
                    </div>
                    {authorityConsistency.driftWarnings.length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs uppercase tracking-wide text-neutral-400">
                          Drift Warnings
                        </p>
                        <ul className="mt-2 list-disc pl-4 space-y-1 text-sm text-neutral-600">
                          {authorityConsistency.driftWarnings
                            .slice(0, 4)
                            .map((warning, index) => (
                              <li key={`consistency-warning-${index}`}>
                                {warning}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            <section className="mt-8 border-t border-neutral-200 pt-8">
              <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <div className="px-5 pt-4">
                  <h2 className="text-sm font-semibold text-neutral-900">
                    Insight Breakdown
                  </h2>
                </div>
                <div className="px-5 pb-5 pt-4 space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-neutral-400">
                      Strong Claims
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-sm text-neutral-600">
                      {insightBreakdown.strongClaims.map((claim, index) => (
                        <li key={`claim-${index}`}>{claim}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-neutral-400">
                      Data-Backed Angles
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-sm text-neutral-600">
                      {insightBreakdown.dataBackedAngles.map((angle, index) => (
                        <li key={`angle-${index}`}>{angle}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-neutral-400">
                      Frameworks
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-sm text-neutral-600">
                      {insightBreakdown.frameworks.map((framework, index) => (
                        <li key={`framework-${index}`}>{framework}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-8 border-t border-neutral-200 pt-8">
              <PostPlatformSection
                packId={pack.id}
                linkedinPosts={highLeveragePosts.linkedinPosts}
                twitterThread={highLeveragePosts.twitterThread}
                regenLimitReached={regenLimitReached}
                regenNotice={regenNotice ?? undefined}
                upgradeHref="/upgrade"
              />
            </section>

            {hasNewsletter && (
              <section className="mt-8 border-t border-neutral-200 pt-8">
                <NewsletterSection content={highLeveragePosts.newsletterSummary} />
              </section>
            )}

          </div>

          <aside className="space-y-8 lg:sticky lg:top-8">
            <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-5 space-y-4">
              <h2 className="text-sm font-semibold text-neutral-900">
                Quick Actions
              </h2>
              <div className="space-y-1">
                <QuickActionButton
                  icon={<RefreshCw className="h-4 w-4 text-neutral-400" />}
                  label="Regenerate"
                />
                <QuickActionButton
                  icon={<CopyIcon className="h-4 w-4 text-neutral-400" />}
                  label="Duplicate"
                />
                <PublishButton
                  packId={pack.id}
                  initialStatus={pack.status === "published" ? "published" : "draft"}
                  initialPublishedAt={pack.publishedAt ? pack.publishedAt.toISOString() : null}
                />
                <RepurposeButton
                  packId={pack.id}
                  canRepurpose={canRepurpose}
                  upgradeHref="/upgrade"
                />
                <form action={deletePackAction} className="w-full">
                  <QuickActionButton
                    icon={
                      <Trash2 className="h-4 w-4 text-neutral-400 group-hover:text-red-500" />
                    }
                    label="Delete"
                    variant="destructive"
                    type="submit"
                  />
                </form>
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-5 space-y-4">
              <h2 className="text-sm font-semibold text-neutral-900">
                Metadata
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-neutral-500">
                  <span>Word count</span>
                  <span className="font-semibold text-neutral-900">
                    {wordCount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-500">
                  <span>Sections</span>
                  <span className="font-semibold text-neutral-900">
                    {sectionsCount}
                  </span>
                </div>
                {pack.qualityScore !== null && pack.qualityScore !== undefined && (
                  <div className="flex items-center justify-between text-neutral-500">
                    <span>Quality score</span>
                    <span className="font-semibold text-neutral-900">
                      {Math.round(pack.qualityScore)}/100
                    </span>
                  </div>
                )}
                {pack.regenerationCount > 0 && (
                  <div className="flex items-center justify-between text-neutral-500">
                    <span>Regenerations</span>
                    <span className="font-semibold text-neutral-900">
                      {pack.regenerationCount}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-neutral-500">
                  <span>Status</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      pack.status === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {pack.status === "published" ? "Published" : "Draft"}
                  </span>
                </div>
                {pack.publishedAt && (
                  <div className="flex items-center justify-between text-neutral-500">
                    <span>Published on</span>
                    <span className="font-semibold text-neutral-900">
                      {pack.publishedAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </section>

            <div id="pack-health">
              <PackHealthPanel
                packId={pack.id}
                initialBreakdown={qualityBreakdown}
                regenLimitReached={regenLimitReached}
                regenNotice={regenNotice ?? undefined}
                upgradeHref="/upgrade"
              />
            </div>

            <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-5 space-y-4">
              <h2 className="text-sm font-semibold text-neutral-900">Source</h2>
              <SourcePanel
                sourceType={sourceType}
                youtubeHref={youtubeHref}
                displayYoutubeUrl={displayYoutubeUrl}
                originalInput={pack.originalInput}
              />
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
