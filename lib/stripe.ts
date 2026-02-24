/**
 * Re-exports for backwards compat.
 * No Stripe instantiation at module scope — use getStripe() inside handlers only.
 */
export { getStripe, PLANS } from "@/lib/stripeServer";
export { PLAN_LIMITS } from "@/lib/planLimits";
