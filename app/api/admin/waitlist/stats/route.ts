import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { WaitlistPlan, WaitlistSource, WaitlistStatus } from "@prisma/client";

function startOfDayUTC(daysAgo: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d;
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  const now = new Date();
  const sevenDaysAgo = startOfDayUTC(7);
  const thirtyDaysAgo = startOfDayUTC(30);
  const fourteenDaysAgo = startOfDayUTC(14);

  const [
    totalActive,
    byPlanRaw,
    last7Days,
    last30Days,
    bySourceRaw,
    dailyRaw,
  ] = await Promise.all([
    // Total active entries
    prisma.waitlistEntry.count({ where: { status: WaitlistStatus.ACTIVE } }),

    // Active entries grouped by plan
    prisma.waitlistEntry.groupBy({
      by: ["plan"],
      where: { status: WaitlistStatus.ACTIVE },
      _count: { _all: true },
    }),

    // Signups in last 7 days
    prisma.waitlistEntry.count({ where: { createdAt: { gte: sevenDaysAgo } } }),

    // Signups in last 30 days
    prisma.waitlistEntry.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),

    // All entries grouped by source
    prisma.waitlistEntry.groupBy({
      by: ["source"],
      _count: { _all: true },
    }),

    // Entries from last 14 days for daily series
    prisma.waitlistEntry.findMany({
      where: { createdAt: { gte: fourteenDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Build byPlan map
  const byPlan: Record<WaitlistPlan, number> = {
    STARTER: 0,
    PROFESSIONAL: 0,
    ENTERPRISE: 0,
  };
  for (const row of byPlanRaw) {
    byPlan[row.plan] = row._count._all;
  }

  // Build topSources map
  const topSources: Record<WaitlistSource, number> = {
    PRICING: 0,
    NAVBAR: 0,
    UPGRADE: 0,
    UNKNOWN: 0,
  };
  for (const row of bySourceRaw) {
    topSources[row.source] = row._count._all;
  }

  // Build daily series (last 14 days)
  const buckets: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = startOfDayUTC(i);
    buckets[toDateKey(d)] = 0;
  }
  for (const row of dailyRaw) {
    const key = toDateKey(row.createdAt);
    if (key in buckets) buckets[key]++;
  }
  const dailySeries = Object.entries(buckets).map(([date, count]) => ({ date, count }));

  return NextResponse.json({
    totalActive,
    byPlan,
    last7Days,
    last30Days,
    topSources,
    dailySeries,
    generatedAt: now.toISOString(),
  });
}
