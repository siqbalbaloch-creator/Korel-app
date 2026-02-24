import { prisma } from "@/lib/prisma";

export type LaunchDiagnosticsSummary = {
  totalUsers: number;
  totalPacks: number;
  packsLast24h: number;
  avgQualityLast24h: number;
  generationFailureCountLast24h: number;
};

export async function getLaunchDiagnosticsSummary(): Promise<LaunchDiagnosticsSummary> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [totalUsers, totalPacks, packsLast24h, avgQuality, failedPacks] = await Promise.all([
    prisma.user.count(),
    prisma.authorityPack.count(),
    prisma.authorityPack.count({ where: { createdAt: { gte: since } } }),
    prisma.authorityPack.aggregate({
      where: { createdAt: { gte: since }, qualityScore: { not: null } },
      _avg: { qualityScore: true },
    }),
    prisma.authorityPack.count({
      where: { createdAt: { gte: since }, qualityScore: null },
    }),
  ]);

  return {
    totalUsers,
    totalPacks,
    packsLast24h,
    avgQualityLast24h: Math.round((avgQuality._avg.qualityScore ?? 0) * 10) / 10,
    generationFailureCountLast24h: failedPacks,
  };
}
