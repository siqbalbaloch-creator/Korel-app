import type { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import HistoryClient from "./history-client";

type PackRecord = {
  id: string;
  title: string;
  createdAt: Date;
  originalInput: string;
  status: string;
  regenerationCount: number;
  coreThesis: Prisma.JsonValue | null;
  strategicHooks: Prisma.JsonValue | null;
  highLeveragePosts: Prisma.JsonValue | null;
  insightBreakdown: Prisma.JsonValue | null;
  repurposingMatrix: Prisma.JsonValue | null;
  executiveSummary: Prisma.JsonValue | null;
};

const truncateText = (value: string, maxLength = 96) => {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength)}...`;
};

const getSourceType = (value: string): "youtube" | "transcript" => {
  const lower = value.toLowerCase();
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    return "youtube";
  }
  return "transcript";
};

const extractUrl = (value: string) => {
  const match = value.match(/https?:\/\/\S+/i);
  if (!match) {
    return "";
  }
  return match[0].replace(/[),.]+$/, "");
};

const isRecord = (
  value: Prisma.JsonValue | null,
): value is Prisma.JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toString = (value: unknown) => (typeof value === "string" ? value : "");

const toStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

const toEntryArray = (value: unknown) =>
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

const countWords = (value: string) =>
  value.trim() ? value.trim().split(/\s+/).length : 0;

const sumWords = (items: string[]) =>
  items.reduce((total, item) => total + countWords(item), 0);

const calculateWordCount = (pack: PackRecord) => {
  const coreThesisRecord: Record<string, unknown> = isRecord(pack.coreThesis)
    ? pack.coreThesis
    : {};
  const strategicHooksRecord: Record<string, unknown> = isRecord(
    pack.strategicHooks,
  )
    ? pack.strategicHooks
    : {};
  const highLeveragePostsRecord: Record<string, unknown> = isRecord(
    pack.highLeveragePosts,
  )
    ? pack.highLeveragePosts
    : {};
  const insightBreakdownRecord: Record<string, unknown> = isRecord(
    pack.insightBreakdown,
  )
    ? pack.insightBreakdown
    : {};
  const repurposingMatrixRecord: Record<string, unknown> = isRecord(
    pack.repurposingMatrix,
  )
    ? pack.repurposingMatrix
    : {};
  const executiveSummaryRecord: Record<string, unknown> = isRecord(
    pack.executiveSummary,
  )
    ? pack.executiveSummary
    : {};

  const supportingThemes = toStringArray(coreThesisRecord.supportingThemes);
  const linkedinHooks = toStringArray(strategicHooksRecord.linkedin);
  const twitterHooks = toStringArray(strategicHooksRecord.twitter);
  const contrarianHooks = toStringArray(strategicHooksRecord.contrarian);
  const linkedinPosts = toStringArray(highLeveragePostsRecord.linkedinPosts);
  const twitterThread = toStringArray(highLeveragePostsRecord.twitterThread);
  const strongClaims = toStringArray(insightBreakdownRecord.strongClaims);
  const dataBackedAngles = toStringArray(
    insightBreakdownRecord.dataBackedAngles,
  );
  const frameworks = toStringArray(insightBreakdownRecord.frameworks);
  const keyInsights = toStringArray(executiveSummaryRecord.keyInsights);
  const matrixEntries = toEntryArray(repurposingMatrixRecord.entries);

  return (
    countWords(pack.title) +
    countWords(toString(coreThesisRecord.primaryThesis)) +
    sumWords(supportingThemes) +
    countWords(toString(coreThesisRecord.targetPersona)) +
    sumWords(linkedinHooks) +
    sumWords(twitterHooks) +
    sumWords(contrarianHooks) +
    sumWords(linkedinPosts) +
    sumWords(twitterThread) +
    countWords(toString(highLeveragePostsRecord.newsletterSummary)) +
    sumWords(strongClaims) +
    sumWords(dataBackedAngles) +
    sumWords(frameworks) +
    matrixEntries.reduce(
      (total, entry) =>
        total +
        countWords(entry.asset) +
        countWords(entry.platform) +
        countWords(entry.format) +
        countWords(entry.angle),
      0,
    ) +
    countWords(toString(executiveSummaryRecord.headline)) +
    countWords(toString(executiveSummaryRecord.positioningSentence)) +
    sumWords(keyInsights)
  );
};

const loadPacks = async (): Promise<PackRecord[]> => {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/signin");
  }
  return prisma.authorityPack.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      originalInput: true,
      status: true,
      regenerationCount: true,
      coreThesis: true,
      strategicHooks: true,
      highLeveragePosts: true,
      insightBreakdown: true,
      repurposingMatrix: true,
      executiveSummary: true,
    },
  });
};

export default async function HistoryPage() {
  const packs = await loadPacks();
  const historyPacks = packs.map((pack) => {
    const sourceType = getSourceType(pack.originalInput);
    const sourceText =
      sourceType === "youtube"
        ? extractUrl(pack.originalInput) || pack.originalInput
        : pack.originalInput;

    return {
      id: pack.id,
      title: pack.title,
      createdAt: pack.createdAt.toISOString(),
      sourceType,
      sourcePreview: truncateText(sourceText, 96),
      wordCount: calculateWordCount(pack),
      planAtGeneration: "Free" as const,
      status: pack.status === "published" ? ("published" as const) : ("draft" as const),
      regenerationCount: pack.regenerationCount,
    };
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1100px] mx-auto px-6 py-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-neutral-900">History</h1>
          <p className="text-sm text-neutral-500">
            A record of all generated Authority Packs and their original inputs.
          </p>
        </div>

        <div>
          {historyPacks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-10 text-center space-y-3">
              <p className="text-sm font-medium text-neutral-700">No packs yet.</p>
              <p className="text-sm text-neutral-500">
                Create your first Authority Pack to see it here.
              </p>
              <Link
                href="/new"
                className="inline-flex items-center justify-center rounded-md bg-[#4F46E5] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#4338CA]"
              >
                Generate New Pack
              </Link>
            </div>
          ) : (
            <HistoryClient packs={historyPacks} />
          )}
        </div>
      </div>
    </div>
  );
}
