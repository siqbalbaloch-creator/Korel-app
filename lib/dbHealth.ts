import { prisma } from "@/lib/prisma";

export type DbHealthSummary = {
  ok: boolean;
  elapsedMs: number;
  checkedAt: string;
  userCount?: number;
  error?: string;
};

export async function getDbHealthSummary(): Promise<DbHealthSummary> {
  const startedAt = Date.now();
  try {
    const userCount = await prisma.user.count();
    return {
      ok: true,
      elapsedMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
      userCount,
    };
  } catch (err) {
    return {
      ok: false,
      elapsedMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
