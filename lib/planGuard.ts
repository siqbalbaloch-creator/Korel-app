import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/getUserPlan";
import { getPlanConfig, type PlanConfig, type PlanTier } from "@/lib/plans";
import { getCurrentUsagePeriod } from "@/lib/usagePeriod";

type TransactionClient = Parameters<typeof prisma.$transaction>[0] extends (
  tx: infer T,
) => unknown
  ? T
  : never;
type PrismaClientLike = typeof prisma | TransactionClient;

export type PlanAction = "create_pack" | "regenerate" | "repurpose";
export type PlanLimitCode =
  | "PLAN_LIMIT_PACKS_EXCEEDED"
  | "PLAN_LIMIT_REGEN_EXCEEDED"
  | "PLAN_LIMIT_NOT_ALLOWED";

export type PlanSnapshot = {
  plan: PlanTier;
  config: PlanConfig;
  limit: number;
  used: number;
  remaining: number;
};

export class PlanLimitError extends Error {
  code: PlanLimitCode;
  plan: PlanTier;
  limit?: number;
  used?: number;
  action: PlanAction;

  constructor(args: {
    code: PlanLimitCode;
    plan: PlanTier;
    action: PlanAction;
    limit?: number;
    used?: number;
    message?: string;
  }) {
    super(
      args.message ??
        `Plan limit reached for ${args.action} on ${args.plan} plan.`,
    );
    this.name = "PlanLimitError";
    this.code = args.code;
    this.plan = args.plan;
    this.limit = args.limit;
    this.used = args.used;
    this.action = args.action;
  }
}

const buildPackLimitMessage = (plan: PlanTier, used: number, limit: number) =>
  `You've reached your ${plan} plan limit of ${limit} packs per month (${used}/${limit}).`;

const buildStoredLimitMessage = (plan: PlanTier, used: number, limit: number) =>
  `You've reached your ${plan} plan storage limit (${used}/${limit} packs).`;

const buildRegenLimitMessage = (plan: PlanTier, used: number, limit: number) =>
  `You've reached your ${plan} plan regeneration limit (${used}/${limit}).`;

const buildFeatureGateMessage = (plan: PlanTier) =>
  `${plan} plan does not include this feature. Upgrade to unlock it.`;

export async function getPlanSnapshot(
  userId: string,
  userRole?: string,
): Promise<PlanSnapshot> {
  const planInfo = await getUserPlan(userId, { role: userRole });
  const config = getPlanConfig(planInfo.plan);
  return {
    plan: planInfo.plan,
    config,
    limit: planInfo.limit,
    used: planInfo.used,
    remaining: planInfo.remaining,
  };
}

export async function assertWithinPlanLimits(args: {
  userId: string;
  action: PlanAction;
  userRole?: string;
  packRegenerationCount?: number;
  packCount?: number;
}): Promise<PlanSnapshot> {
  const snapshot = await getPlanSnapshot(args.userId, args.userRole);

  if (args.action === "create_pack") {
    if (snapshot.remaining <= 0) {
      throw new PlanLimitError({
        code: "PLAN_LIMIT_PACKS_EXCEEDED",
        plan: snapshot.plan,
        action: args.action,
        limit: snapshot.limit,
        used: snapshot.used,
        message: buildPackLimitMessage(snapshot.plan, snapshot.used, snapshot.limit),
      });
    }
    if (
      Number.isFinite(snapshot.config.maxStoredPacks) &&
      typeof args.packCount === "number" &&
      args.packCount >= snapshot.config.maxStoredPacks
    ) {
      throw new PlanLimitError({
        code: "PLAN_LIMIT_PACKS_EXCEEDED",
        plan: snapshot.plan,
        action: args.action,
        limit: snapshot.config.maxStoredPacks,
        used: args.packCount,
        message: buildStoredLimitMessage(
          snapshot.plan,
          args.packCount,
          snapshot.config.maxStoredPacks,
        ),
      });
    }
  }

  if (args.action === "regenerate") {
    const limit = snapshot.config.maxRegenerationsPerPack;
    const used = args.packRegenerationCount ?? 0;
    if (Number.isFinite(limit) && used >= limit) {
      throw new PlanLimitError({
        code: "PLAN_LIMIT_REGEN_EXCEEDED",
        plan: snapshot.plan,
        action: args.action,
        limit,
        used,
        message: buildRegenLimitMessage(snapshot.plan, used, limit),
      });
    }
  }

  if (args.action === "repurpose") {
    if (!snapshot.config.repurposeAccess) {
      throw new PlanLimitError({
        code: "PLAN_LIMIT_NOT_ALLOWED",
        plan: snapshot.plan,
        action: args.action,
        message: buildFeatureGateMessage(snapshot.plan),
      });
    }
  }

  return snapshot;
}

export function buildPlanLimitPayload(error: PlanLimitError) {
  const errorKey =
    error.code === "PLAN_LIMIT_NOT_ALLOWED"
      ? "plan_not_allowed"
      : "plan_limit_reached";
  return {
    ok: false,
    error: errorKey,
    code: error.code,
    message: error.message,
    upgradeHint: true,
    plan: error.plan,
    limit: error.limit ?? null,
    used: error.used ?? null,
    action: error.action,
  };
}

/**
 * Throws PlanLimitError if the user has reached their monthly pack limit.
 * Server-side enforcement gate — call this BEFORE starting generation.
 */
export async function assertCanCreatePack(userId: string): Promise<void> {
  await assertWithinPlanLimits({ userId, action: "create_pack" });
}

/** Alias so existing callers keep working. */
export const assertCanGeneratePack = assertCanCreatePack;

/**
 * Increments the user's monthly usage counter.
 * Call this AFTER a pack is successfully saved to the DB.
 */
export async function incrementPackUsage(
  userId: string,
  tx: PrismaClientLike = prisma,
): Promise<void> {
  const { month, year } = getCurrentUsagePeriod();
  await tx.usage.upsert({
    where: { userId_month_year: { userId, month, year } },
    create: { userId, month, year, packsUsed: 1 },
    update: { packsUsed: { increment: 1 } },
  });
}
