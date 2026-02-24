import Link from "next/link";
import { redirect } from "next/navigation";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { getUserStats } from "@/lib/getUserStats";
import { getUserPlan } from "@/lib/getUserPlan";
import { getWeaknessRadarForUser } from "@/lib/weaknessRadar";
import DashboardClient from "./dashboard-client";
import PacksList from "./packs-list";

function motivationalMessage(totalPacks: number): string {
  if (totalPacks === 0) return "Welcome. Generate your first Authority Pack to get started.";
  if (totalPacks < 3) return "Great start. Keep building your Authority Pack library.";
  if (totalPacks < 10) return "You're building momentum. Your authority library is growing.";
  return "Impressive library! You're establishing real authority.";
}

function StatCard({
  label,
  value,
  badge,
}: {
  label: string;
  value: string | number;
  badge?: boolean;
}) {
  return (
    <div className="bg-white rounded-[12px] shadow-sm border border-black/5 px-5 py-4 transition-all duration-[160ms] ease hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)]">
      <p className="text-xs uppercase tracking-[0.06em] text-[rgba(0,0,0,0.55)] mb-1">
        {label}
      </p>
      {badge ? (
        <span className="inline-flex items-center rounded-full bg-[#EEF2FF] px-3 py-1 text-sm font-semibold text-[#4F46E5]">
          {value}
        </span>
      ) : (
        <p className="text-3xl font-bold tracking-[-0.5px] text-[#111]">{value}</p>
      )}
    </div>
  );
}

function QualityTrendCard({
  avg,
  trend,
}: {
  avg: number;
  trend: "up" | "down" | "flat" | null;
}) {
  return (
    <div className="bg-white rounded-[12px] shadow-sm border border-black/5 px-5 py-4 transition-all duration-[160ms] ease hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)]">
      <p className="text-xs uppercase tracking-[0.06em] text-[rgba(0,0,0,0.55)] mb-1">
        Avg Quality
      </p>
      <div className="flex items-center gap-2">
        <p className="text-3xl font-bold tracking-[-0.5px] text-[#111]">{avg}</p>
        {trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
        {trend === "down" && <TrendingDown className="h-4 w-4 text-red-400" />}
        {trend === "flat" && <Minus className="h-4 w-4 text-neutral-400" />}
      </div>
    </div>
  );
}

function daysSince(dateIso: string | null): number | null {
  if (!dateIso) return null;
  const ms = Date.now() - new Date(dateIso).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

const YOUTUBE_REGEX = /youtube\.com|youtu\.be/i;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ asCreator?: string }>;
}) {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;
  if (!userId) redirect("/signin");

  // Admin context variant — shown when an admin lands here without opting in as creator
  const { asCreator } = await searchParams;
  if (session.user.role === "admin" && asCreator !== "1") {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-[520px] mx-auto px-6 py-20 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#111]">
              Admin Workspace
            </h1>
            <p className="text-[#64748B] text-sm leading-relaxed">
              You&apos;re signed in as an admin. The creator dashboard shows
              pack-generation analytics for regular users. Where would you like
              to go?
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center justify-center rounded-lg bg-[#4F46E5] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#4338CA] transition-colors"
            >
              Go to Admin Panel
            </Link>
            <Link
              href="/dashboard?asCreator=1"
              className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Enter App as Creator
            </Link>
          </div>
          <p className="text-xs text-neutral-400">
            You can also browse{" "}
            <Link href="/history" className="text-[#4F46E5] hover:underline">
              Pack History
            </Link>{" "}
            or create a{" "}
            <Link href="/new" className="text-[#4F46E5] hover:underline">
              New Pack
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  const [stats, planInfo, recentPacks, lowScorePack, qualityTrendPacks, radarResult] = await Promise.all([
    getUserStats(userId),
    getUserPlan(userId, { role: session.user.role }),
    prisma.authorityPack.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.authorityPack.findFirst({
      where: { userId, qualityScore: { lt: 60 } },
      select: { id: true },
    }),
    prisma.authorityPack.findMany({
      where: { userId, qualityScore: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { qualityScore: true },
    }),
    getWeaknessRadarForUser(userId),
  ]);

  // Quality trend: avg of last 5 vs previous 5 packs
  const recent5 = qualityTrendPacks.slice(0, 5).map((p) => p.qualityScore ?? 0);
  const prev5 = qualityTrendPacks.slice(5, 10).map((p) => p.qualityScore ?? 0);
  const recentAvg = recent5.length >= 2
    ? Math.round(recent5.reduce((a, b) => a + b, 0) / recent5.length)
    : null;
  const prevAvg = prev5.length >= 2
    ? Math.round(prev5.reduce((a, b) => a + b, 0) / prev5.length)
    : null;
  const qualityTrend: "up" | "down" | "flat" | null =
    recentAvg !== null && prevAvg !== null
      ? recentAvg > prevAvg
        ? "up"
        : recentAvg < prevAvg
          ? "down"
          : "flat"
      : null;

  // Activity memory
  const lastPack = recentPacks[0] ?? null;
  const lastPackDays = daysSince(lastPack?.createdAt?.toISOString() ?? null);
  const isYouTubeLink = lastPack ? YOUTUBE_REGEX.test(lastPack.originalInput) : false;
  const duplicateHref = lastPack && isYouTubeLink
    ? `/new?prefill=${encodeURIComponent(lastPack.originalInput.trim())}`
    : "/new";

  const remainingForClient =
    planInfo.remaining === Infinity ? 999 : planInfo.remaining;

  const radar = radarResult.radar;
  const radarAnalyzed = radarResult.analyzed;
  const radarIssues = radar.issues.slice(0, 3);

  if (stats.totalPacks === 0) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-[720px] mx-auto px-6 py-20">
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-10 text-center space-y-4">
            <h2 className="text-xl font-semibold text-neutral-900">
              You haven&apos;t created your first Authority Pack yet.
            </h2>
            <p className="text-sm text-neutral-500">
              Start with a YouTube talk, podcast, or transcript. Korel will structure the
              insights and prepare distribution-ready assets.
            </p>
            <Link
              href="/new"
              className="inline-flex items-center justify-center rounded-lg bg-[#4F46E5] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#4338CA] transition-colors"
            >
              Generate Your First Pack
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-[1100px] mx-auto px-6 sm:px-8 pt-8 pb-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111] mb-1">
            Dashboard
          </h1>
          <p className="text-[#64748B] text-sm">
            {motivationalMessage(stats.totalPacks)}
          </p>
        </div>

        {/* Activity Memory Strip */}
        {lastPack && lastPackDays !== null && (
          <div className="rounded-xl border border-neutral-200 bg-white px-5 py-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-neutral-700">
              {lastPackDays < 1
                ? "You generated a pack today."
                : lastPackDays === 1
                  ? "Your last pack was generated yesterday."
                  : `Your last pack was generated ${lastPackDays} days ago.`}
              {lastPackDays < 3 && (
                <span className="text-neutral-500"> Want to refine it?</span>
              )}
              {lastPackDays >= 7 && (
                <span className="font-medium text-neutral-800"> Turn your next talk into authority this week.</span>
              )}
            </p>
            <div className="flex items-center gap-2">
              {lastPackDays < 3 && (
                <Link
                  href={`/history/${lastPack.id}`}
                  className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Open last pack
                </Link>
              )}
              <Link
                href={duplicateHref}
                className="rounded-lg bg-[#4F46E5] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#4338CA] transition-colors"
              >
                {lastPackDays >= 7 ? "Generate New Pack" : "Generate from last source"}
              </Link>
            </div>
          </div>
        )}

        {/* Pro features nudge */}
        {stats.totalPacks >= 3 && planInfo.plan === "FREE" && (
          <div className="rounded-xl border border-[#C7D2FE] bg-[#EEF2FF] px-5 py-3 flex items-center justify-between gap-4">
            <p className="text-sm text-[#4F46E5]">
              <span className="font-semibold">Pro features coming soon</span>{" "}
              — priority access opening soon.{" "}
              <Link href="/upgrade" className="underline font-medium">
                Learn more
              </Link>
            </p>
            <span className="flex-shrink-0 rounded-full border border-[#C7D2FE] bg-white px-3 py-1 text-xs font-semibold text-[#4F46E5]">
              PRO
            </span>
          </div>
        )}

        {/* Soft plan pressure — 80%+ of monthly limit used */}
        {planInfo.plan === "FREE" &&
          planInfo.limit !== Infinity &&
          planInfo.remaining > 0 &&
          planInfo.limit > 0 &&
          planInfo.used / planInfo.limit >= 0.8 && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 px-5 py-3 flex items-center justify-between gap-4">
              <p className="text-sm text-orange-800">
                <span className="font-semibold">You&apos;re close to your monthly Authority Pack limit.</span>{" "}
                {planInfo.remaining} Authority Pack{planInfo.remaining !== 1 ? "s" : ""} remaining this month.
              </p>
              <Link
                href="/upgrade"
                className="flex-shrink-0 rounded-full border border-orange-300 bg-white px-3 py-1 text-xs font-semibold text-orange-800 hover:bg-orange-100 transition-colors"
              >
                View Upgrade Plans
              </Link>
            </div>
          )}

        {/* Low-score pack nudge */}
        {lowScorePack && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 flex items-center justify-between gap-4">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Some of your packs could be improved.</span>{" "}
              Review your lowest scoring Authority Pack to strengthen positioning.
            </p>
            <Link
              href="/history"
              className="flex-shrink-0 rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
            >
              Review
            </Link>
          </div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
          <StatCard label="Total Packs" value={stats.totalPacks} />
          <StatCard label="Draft" value={stats.drafts} />
          <StatCard label="Published" value={stats.published} />
          <StatCard label="This Month" value={stats.monthlyCount} />
          {recentAvg !== null && (
            <QualityTrendCard avg={recentAvg} trend={qualityTrend} />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <DashboardClient
            initialRemainingFreePacks={remainingForClient}
            totalPacks={stats.totalPacks}
            plan={planInfo.plan}
            monthlyLimit={planInfo.limit === Infinity ? null : planInfo.limit}
            usedThisMonth={planInfo.used}
          />
          <div className="space-y-4">
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-900">
                  Weakness Radar
                </h2>
                <Link
                  href="/dashboard/radar"
                  className="text-xs text-[#4F46E5] hover:underline"
                >
                  View all
                </Link>
              </div>
              {radarAnalyzed < 3 ? (
                <p className="text-sm text-neutral-500">
                  Not enough data yet. Generate at least 3 packs to surface recurring patterns.
                </p>
              ) : radarIssues.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  No recurring issues detected in the last {radar.windowSize} packs.
                </p>
              ) : (
                <ul className="space-y-3">
                  {radarIssues.map((issue) => (
                    <li key={issue.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-neutral-900">{issue.title}</span>
                        <span className="text-xs uppercase tracking-wide text-neutral-400">
                          {issue.severity}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500">
                        {issue.evidence.affectedPacks}/{radarAnalyzed} recent packs
                      </p>
                      <p className="text-xs text-neutral-600">
                        {issue.recommendation}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <PacksList packs={recentPacks} />
            {recentPacks.length > 0 && (
              <Link
                href="/history"
                className="block text-center text-sm text-[#4F46E5] hover:underline"
              >
                View all packs →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
