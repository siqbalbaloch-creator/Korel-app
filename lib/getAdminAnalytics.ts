import { prisma } from "./prisma";
import { logger } from "./logger";

export type DailyBucket = { date: string; count: number };

export type InputTypeBreakdownRow = {
  type: string;
  count: number;
  avgQuality: number;
};

export type AngleBreakdownRow = {
  angle: string;
  count: number;
  avgQuality: number;
};

type InputTypeStatRow = {
  inputType: string | null;
  _count: { id: number };
  _avg: { qualityScore: number | null };
};

type AngleStatRow = {
  angle: string | null;
  _count: { id: number };
  _avg: { qualityScore: number | null };
};

export type AdminAnalytics = {
  totalUsers: number;
  usersLast7Days: number;
  totalPacks: number;
  packsLast7Days: number;
  publishedCount: number;
  lowQualityCount: number;
  avgMessagingStrength: number;
  avgAuthorityConsistency: number;
  activeUsersLast7Days: number;
  openTickets: number;
  resolvedTickets: number;
  ticketsLast7Days: number;
  dailyUserSignups: DailyBucket[];
  dailyPackCreations: DailyBucket[];
  inputTypeBreakdown: InputTypeBreakdownRow[];
  angleBreakdown: AngleBreakdownRow[];
  profilesSetCount: number;
  profilePercentage: number;
};

/** Returns "YYYY-MM-DD" string in local time for a given Date */
function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Generates an ordered array of date keys for the last N days (oldest first, today last) */
function lastNDays(n: number): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    keys.push(toDateKey(d));
  }
  return keys;
}

/** Buckets an array of dates into a per-day count map */
function bucketByDay(dates: Date[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const d of dates) {
    const key = toDateKey(d);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    totalUsers,
    totalPacks,
    publishedCount,
    lowQualityCount,
    openTickets,
    resolvedTickets,
    recentTickets,
    recentUsers,
    recentPacks,
    activeUsersResult,
    avgQualityResult,
    inputTypeStatsRaw,
    angleStatsRaw,
    profilesSetCount,
    messagingStrengthRows,
    authorityConsistencyRows,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.authorityPack.count(),
    prisma.authorityPack.count({ where: { status: "published" } }),
    prisma.authorityPack.count({
      where: { qualityScore: { lt: 60, not: null } },
    }),
    prisma.supportTicket.count({ where: { status: "open" } }),
    prisma.supportTicket.count({ where: { status: "resolved" } }),
    prisma.supportTicket.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
    // Users created in last 7 days (only need createdAt for bucketing)
    prisma.user.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    // Packs created in last 7 days
    prisma.authorityPack.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, userId: true },
    }),
    // Distinct users who created packs in last 7 days
    prisma.authorityPack.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.authorityPack.aggregate({ _avg: { qualityScore: true } }),
    // Breakdown by inputType
    prisma.authorityPack.groupBy({
      by: ["inputType"],
      _count: { id: true },
      _avg: { qualityScore: true },
      orderBy: { _count: { id: "desc" } },
    }),
    // Breakdown by angle
    prisma.authorityPack.groupBy({
      by: ["angle"],
      _count: { id: true },
      _avg: { qualityScore: true },
      orderBy: { _count: { id: "desc" } },
    }),
    // Users with at least one authority profile field set
    prisma.authorityProfile.count({
      where: {
        OR: [
          { coreThesis: { not: null } },
          { positioning: { not: null } },
          { targetAudience: { not: null } },
        ],
      },
    }),
    prisma.authorityPack.findMany({ select: { messagingStrength: true } }),
    prisma.authorityPack.findMany({ select: { authorityConsistency: true } }),
  ]);

  const messagingTotals = messagingStrengthRows
    .map((row: { messagingStrength: unknown }) => {
      const ms = row.messagingStrength as Record<string, unknown> | null;
      return ms && typeof ms.total === "number" ? ms.total : null;
    })
    .filter((value: number | null): value is number => typeof value === "number" && Number.isFinite(value));

  const avgMessagingStrength =
    messagingTotals.length > 0
      ? Math.round((messagingTotals.reduce((sum: number, v: number) => sum + v, 0) / messagingTotals.length) * 10) / 10
      : 0;

  const consistencyTotals = authorityConsistencyRows
    .map((row: { authorityConsistency: unknown }) => {
      const cs = row.authorityConsistency as Record<string, unknown> | null;
      return cs && typeof cs.total === "number" ? cs.total : null;
    })
    .filter((value: number | null): value is number => typeof value === "number" && Number.isFinite(value));

  const avgAuthorityConsistency =
    consistencyTotals.length > 0
      ? Math.round((consistencyTotals.reduce((sum: number, v: number) => sum + v, 0) / consistencyTotals.length) * 10) / 10
      : 0;

  const inputTypeBreakdown: InputTypeBreakdownRow[] = inputTypeStatsRaw.map((row: InputTypeStatRow) => ({
    type: row.inputType ?? "INTERVIEW",
    count: row._count.id,
    avgQuality: Math.round((row._avg.qualityScore ?? 0) * 10) / 10,
  }));

  const angleBreakdown: AngleBreakdownRow[] = angleStatsRaw.map((row: AngleStatRow) => ({
    angle: row.angle ?? "THOUGHT_LEADERSHIP",
    count: row._count.id,
    avgQuality: Math.round((row._avg.qualityScore ?? 0) * 10) / 10,
  }));

  const days = lastNDays(7);

  const userBuckets = bucketByDay(recentUsers.map((u: { createdAt: Date }) => u.createdAt));
  const packBuckets = bucketByDay(recentPacks.map((p: { createdAt: Date }) => p.createdAt));

  const dailyUserSignups: DailyBucket[] = days.map((date) => ({
    date,
    count: userBuckets.get(date) ?? 0,
  }));

  const dailyPackCreations: DailyBucket[] = days.map((date) => ({
    date,
    count: packBuckets.get(date) ?? 0,
  }));

  if (process.env.NODE_ENV !== "production") {
    const avgQuality = Math.round((avgQualityResult._avg.qualityScore ?? 0) * 10) / 10;
    logger.info("launch.metrics_snapshot", {
      totalUsers,
      totalPacks,
      avgQuality,
      openTickets,
    });
  }

  return {
    totalUsers,
    usersLast7Days: recentUsers.length,
    totalPacks,
    packsLast7Days: recentPacks.length,
    publishedCount,
    lowQualityCount,
    avgMessagingStrength,
    avgAuthorityConsistency,
    activeUsersLast7Days: activeUsersResult.length,
    openTickets,
    resolvedTickets,
    ticketsLast7Days: recentTickets,
    dailyUserSignups,
    dailyPackCreations,
    inputTypeBreakdown,
    angleBreakdown,
    profilesSetCount,
    profilePercentage: totalUsers > 0 ? Math.round((profilesSetCount / totalUsers) * 100) : 0,
  };
}
