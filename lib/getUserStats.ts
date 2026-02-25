import { prisma } from "@/lib/prisma";
import { getCurrentUsagePeriod } from "@/lib/usagePeriod";

export type UserStats = {
  totalPacks: number;
  drafts: number;
  published: number;
  monthlyCount: number;
  lastActivity: string | null;
};

type PackRow = {
  status: string;
  published: boolean;
  createdAt: Date;
};

export async function getUserStats(userId: string): Promise<UserStats> {
  const { month, year } = getCurrentUsagePeriod();

  const [packs, usage] = await Promise.all([
    prisma.authorityPack.findMany({
      where: { userId },
      select: { status: true, published: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.usage.findUnique({
      where: { userId_month_year: { userId, month, year } },
    }),
  ]);

  const totalPacks = packs.length;
  const drafts = packs.filter((p: PackRow) => !p.published && p.status === "draft").length;
  const published = packs.filter((p: PackRow) => p.published).length;
  const monthlyCount = usage?.packsUsed ?? 0;
  const lastActivity = packs[0]?.createdAt?.toISOString() ?? null;

  return { totalPacks, drafts, published, monthlyCount, lastActivity };
}
