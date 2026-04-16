/**
 * Centralized plan definitions.
 * Single source of truth for all plan tiers, limits, and feature flags.
 */

export type PlanTier = "FREE" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE";

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
  /** Max active RSS feeds. Use Infinity for unlimited. */
  maxRssFeeds: number;
  /** Can the user use the one-click quality Fix button? */
  qualityFixAccess: boolean;
  /** Can the user repurpose packs? */
  repurposeAccess: boolean;
  /** Display price in USD/month (null = free) */
  priceUsd: number | null;
  /** Paddle price ID env var name (resolved at runtime; null for tiers not sold via Paddle) */
  paddlePriceEnvVar: string | null;
}

export const PLAN_CONFIGS: Record<PlanTier, PlanConfig> = {
  FREE: {
    tier: "FREE",
    name: "Free",
    monthlyPackLimit: 3,
    maxRegenerationsPerPack: 3,
    maxStoredPacks: Infinity,
    maxRssFeeds: 0,
    qualityFixAccess: false,
    repurposeAccess: false,
    priceUsd: null,
    paddlePriceEnvVar: null,
  },
  STARTER: {
    tier: "STARTER",
    name: "Starter",
    monthlyPackLimit: 15,
    maxRegenerationsPerPack: 10,
    maxStoredPacks: Infinity,
    maxRssFeeds: 1,
    qualityFixAccess: true,
    repurposeAccess: true,
    priceUsd: 49,
    paddlePriceEnvVar: "NEXT_PUBLIC_PADDLE_STARTER_PRICE_ID",
  },
  PROFESSIONAL: {
    tier: "PROFESSIONAL",
    name: "Professional",
    monthlyPackLimit: 50,
    maxRegenerationsPerPack: Infinity,
    maxStoredPacks: Infinity,
    maxRssFeeds: 5,
    qualityFixAccess: true,
    repurposeAccess: true,
    priceUsd: 149,
    paddlePriceEnvVar: "NEXT_PUBLIC_PADDLE_PROFESSIONAL_PRICE_ID",
  },
  ENTERPRISE: {
    tier: "ENTERPRISE",
    name: "Enterprise",
    monthlyPackLimit: Infinity,
    maxRegenerationsPerPack: Infinity,
    maxStoredPacks: Infinity,
    maxRssFeeds: Infinity,
    qualityFixAccess: true,
    repurposeAccess: true,
    priceUsd: null,
    paddlePriceEnvVar: null,
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

/** Resolve a Paddle price ID back to the owning plan tier (used by webhook). */
export function planFromPaddlePriceId(priceId: string | null | undefined): PlanTier {
  if (!priceId) return "FREE";
  for (const tier of Object.keys(PLAN_CONFIGS) as PlanTier[]) {
    const envVar = PLAN_CONFIGS[tier].paddlePriceEnvVar;
    if (envVar && process.env[envVar] === priceId) return tier;
  }
  return "FREE";
}
