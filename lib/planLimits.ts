/**
 * Re-exports PLAN_LIMITS derived from the canonical plan config.
 * Kept for backward compatibility with existing callers.
 * New code should import from lib/plans.ts directly.
 */
import { PLAN_CONFIGS, type PlanTier } from "./plans";

export const PLAN_LIMITS: Record<string, number> = Object.fromEntries(
  (Object.keys(PLAN_CONFIGS) as PlanTier[]).map((tier) => [
    tier,
    PLAN_CONFIGS[tier].monthlyPackLimit,
  ]),
);
