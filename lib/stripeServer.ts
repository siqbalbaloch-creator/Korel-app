import Stripe from "stripe";
import { PLAN_CONFIGS } from "@/lib/plans";

/**
 * Returns a fresh Stripe client each time.
 * Do NOT call this at module scope — only call inside route handlers / server actions.
 * This keeps Stripe off the critical path for non-billing routes (pack listing, plan checks, etc.).
 */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY env var");
  return new Stripe(key, { apiVersion: "2026-01-28.clover" });
}

export const PLANS = {
  PRO: {
    name: "Pro",
    monthlyPackLimit: PLAN_CONFIGS.PRO.monthlyPackLimit,
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
    price: 29,
  },
  ENTERPRISE: {
    name: "Enterprise",
    monthlyPackLimit: PLAN_CONFIGS.ENTERPRISE.monthlyPackLimit,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID ?? "",
    price: 99,
  },
} as const;
