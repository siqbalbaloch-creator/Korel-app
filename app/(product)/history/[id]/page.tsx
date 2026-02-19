import { notFound, redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import {
  ChevronDown,
  RefreshCw,
  Copy as CopyIcon,
  Trash2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import PostPlatformSection from "./PostPlatformSection";
import HooksSectionClient from "./HooksSectionClient";
import SourcePanel from "./SourcePanel";

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

const toEntryArray = (
  value: unknown,
): { asset: string; platform: string; format: string; angle: string }[] =>
  Array.isArray(value)
    ? value.filter(
        (entry): entry is {
          asset: string;
          platform: string;
          format: string;
          angle: string;
        } => {
          if (typeof entry !== "object" || entry === null) {
            return false;
          }
          const record = entry as Record<string, unknown>;
          return (
            typeof record.asset === "string" &&
            typeof record.platform === "string" &&
            typeof record.format === "string" &&
            typeof record.angle === "string"
          );
        },
      )
    : [];

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

const parseRepurposingMatrix = (
  value: Prisma.JsonValue | null,
): RepurposingMatrix => {
  if (!isRecord(value)) {
    return { entries: [] };
  }
  return {
    entries: toEntryArray(value.entries),
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

  const pack = await prisma.authorityPack.findUnique({ where: { id } });

  if (!pack) {
    notFound();
  }

  const coreThesis = parseCoreThesis(pack.coreThesis);
  const strategicHooks = parseStrategicHooks(pack.strategicHooks);
  const highLeveragePosts = parseHighLeveragePosts(pack.highLeveragePosts);
  const insightBreakdown = parseInsightBreakdown(pack.insightBreakdown);
  const repurposingMatrix = parseRepurposingMatrix(pack.repurposingMatrix);
  const executiveSummary = parseExecutiveSummary(pack.executiveSummary);

  const sourceType = getSourceType(pack.originalInput);
  const rawYoutubeUrl = extractUrl(pack.originalInput);
  const youtubeHref = rawYoutubeUrl;
  const displayYoutubeUrl = truncateText(rawYoutubeUrl, 60);

  const deletePackAction = async () => {
    "use server";
    await prisma.authorityPack.delete({ where: { id } });
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

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1100px] mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-neutral-900 mb-1">
            {pack.title}
          </h1>
          <p className="text-sm text-neutral-500">
            Created {formatDate(pack.createdAt)}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8 items-start">
          <div>
            <section className="mt-6">
              <HooksSectionClient
                packId={pack.id}
                initialHooks={strategicHooks}
              />
            </section>

            <section className="mt-8">
              <PostPlatformSection
                packId={pack.id}
                linkedinPosts={highLeveragePosts.linkedinPosts}
                twitterThread={highLeveragePosts.twitterThread}
              />
            </section>

            <section className="mt-10">
              <details className="group rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <summary className="flex h-12 items-center justify-between px-5 text-sm font-semibold text-neutral-900 cursor-pointer list-none">
                  <span>Core Thesis</span>
                  <ChevronDown className="h-4 w-4 text-neutral-400 transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="px-5 pb-5 pt-5 space-y-4">
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
              </details>
            </section>

            <section className="mt-10">
              <details className="group rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <summary className="flex h-12 items-center justify-between px-5 text-sm font-semibold text-neutral-900 cursor-pointer list-none">
                  <span>Insight Breakdown</span>
                  <ChevronDown className="h-4 w-4 text-neutral-400 transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="px-5 pb-5 pt-5 space-y-4">
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
              </details>
            </section>

            <section className="mt-10">
              <details className="group rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <summary className="flex h-12 items-center justify-between px-5 text-sm font-semibold text-neutral-900 cursor-pointer list-none">
                  <span>Repurposing Matrix</span>
                  <ChevronDown className="h-4 w-4 text-neutral-400 transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="px-5 pb-5 pt-5">
                  <div className="overflow-hidden rounded-xl border border-neutral-200">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-400">
                        <tr>
                          <th className="px-3 py-2 font-medium">Asset</th>
                          <th className="px-3 py-2 font-medium">Platform</th>
                          <th className="px-3 py-2 font-medium">Format</th>
                          <th className="px-3 py-2 font-medium">Angle</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 text-neutral-700">
                        {repurposingMatrix.entries.map((entry, index) => (
                          <tr key={`${entry.asset}-${index}`}>
                            <td className="px-3 py-2">{entry.asset}</td>
                            <td className="px-3 py-2">{entry.platform}</td>
                            <td className="px-3 py-2">{entry.format}</td>
                            <td className="px-3 py-2">{entry.angle}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </details>
            </section>

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
                <div className="flex items-center justify-between text-neutral-500">
                  <span>Plan</span>
                  <span className="rounded-full bg-[#EEE9FF] px-3 py-1 text-xs font-medium text-[#4F46E5]">
                    Free
                  </span>
                </div>
              </div>
            </section>

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
