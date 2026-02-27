/**
 * Centralized plan definitions.
 * Single source of truth for all plan tiers, limits, and feature flags.
 * Stripe is NOT wired here — this is the pre-billing structural layer.
 */

export type PlanTier = "FREE" | "PRO" | "ENTERPRISE";

export interface PlanConfig {
  tier: PlanTier;
  /** Display name */
  name: string;
  /** Monthly pack quota. Use Infinity for unlimited. */
  monthlyPackLimit: number;
  /** Regeneration cap per pack. Use Infinity for unlimited. */
  maxRegenerationsPerPack: number;
  /** Max packs stored in workspace. Use Infinity for unlimited. */
  maxStoredPacks: number;
  /** Can the user use the one-click quality Fix button? */
  qualityFixAccess: boolean;
  /** Can the user repurpose packs? */
  repurposeAccess: boolean;
  /** Display price in USD/month (null = free) */
  priceUsd: number | null;
}

export const PLAN_CONFIGS: Record<PlanTier, PlanConfig> = {
  FREE: {
    tier: "FREE",
    name: "Free",
    monthlyPackLimit: 3,
    maxRegenerationsPerPack: 3,
    maxStoredPacks: Infinity,
    qualityFixAccess: false,
    repurposeAccess: false,
    priceUsd: null,
  },
  PRO: {
    tier: "PRO",
    name: "Starter",
    monthlyPackLimit: 15,
    maxRegenerationsPerPack: 10,
    maxStoredPacks: Infinity,
    qualityFixAccess: true,
    repurposeAccess: true,
    priceUsd: 49,
  },
  ENTERPRISE: {
    tier: "ENTERPRISE",
    name: "Enterprise",
    monthlyPackLimit: Infinity,
    maxRegenerationsPerPack: Infinity,
    maxStoredPacks: Infinity,
    qualityFixAccess: true,
    repurposeAccess: true,
    priceUsd: 99,
  },
};

/** Feature flags for a given tier — safe to call with unknown strings. */
export function getPlanConfig(tier: string): PlanConfig {
  return PLAN_CONFIGS[tier as PlanTier] ?? PLAN_CONFIGS.FREE;
}

/** Monthly pack limit for a given tier — safe to call with unknown strings. */
export function getMonthlyLimit(tier: string): number {
  return getPlanConfig(tier).monthlyPackLimit;
}
