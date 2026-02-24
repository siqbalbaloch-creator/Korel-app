import { prisma } from "@/lib/prisma";
import { getMonthlyLimit, type PlanTier } from "@/lib/plans";
import { getCurrentUsagePeriod } from "@/lib/usagePeriod";

export type UserPlanInfo = {
  plan: PlanTier;
  /** Monthly pack limit; Infinity for ENTERPRISE */
  limit: number;
  /** Packs generated so far this calendar month (from Usage table) */
  used: number;
  /** Remaining packs this month (Infinity for unlimited plans) */
  remaining: number;
};

type GetUserPlanOptions = {
  /** Optional user role override (e.g., admin gets ENTERPRISE limits). */
  role?: string;
};

export async function getUserPlan(
  userId: string,
  options: GetUserPlanOptions = {},
): Promise<UserPlanInfo> {
  const { month, year } = getCurrentUsagePeriod();

  const [sub, usage] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId } }),
    prisma.usage.findUnique({
      where: { userId_month_year: { userId, month, year } },
    }),
  ]);

  // Treat plan as FREE unless the subscription is genuinely active/trialing
  const isActive = sub?.status === "active" || sub?.status === "trialing";
  const plan: PlanTier = isActive
    ? ((sub?.plan as PlanTier | undefined) ?? "FREE")
    : "FREE";

  const effectivePlan: PlanTier = options.role === "admin" ? "ENTERPRISE" : plan;
  const limit = getMonthlyLimit(effectivePlan);
  const used = usage?.packsUsed ?? 0;
  const remaining = limit === Infinity ? Infinity : Math.max(0, limit - used);

  return { plan: effectivePlan, limit, used, remaining };
}
