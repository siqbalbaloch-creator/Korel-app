"use client";

import { useState } from "react";
import { Check, CreditCard, ExternalLink } from "lucide-react";
import type { UserPlanInfo } from "@/lib/getUserPlan";
import type { PlanTier } from "@/lib/plans";
import { startCheckout } from "@/components/pricing/startCheckout";

type PaidPlanKey = "STARTER" | "PROFESSIONAL";

type PlanCard = {
  key: PlanTier;
  label: string;
  priceDisplay: string;
  subtext: string;
  features: string[];
  cta: string;
  priceEnvValue?: string;
  featured?: boolean;
  purchasable: boolean;
};

const PLAN_CARDS: PlanCard[] = [
  {
    key: "FREE",
    label: "Free",
    priceDisplay: "$0",
    subtext: "Try Korel risk-free",
    features: [
      "3 content packs per month",
      "LinkedIn + X posts",
      "Manual transcript input",
      "Basic quality scoring",
    ],
    cta: "Your current plan",
    purchasable: false,
  },
  {
    key: "STARTER",
    label: "Starter",
    priceDisplay: "$49",
    subtext: "For founders publishing weekly",
    features: [
      "Unlimited content packs",
      "RSS feed monitoring (1 feed)",
      "Auto-publish to LinkedIn + X",
      "Beehiiv newsletter integration",
      "Content calendar",
      "Back catalog repurposing",
    ],
    cta: "Upgrade to Starter",
    priceEnvValue: process.env.NEXT_PUBLIC_PADDLE_STARTER_PRICE_ID,
    featured: true,
    purchasable: true,
  },
  {
    key: "PROFESSIONAL",
    label: "Professional",
    priceDisplay: "$149",
    subtext: "For founders who publish everywhere",
    features: [
      "Everything in Starter",
      "5 RSS feeds monitored",
      "Priority pack generation",
      "Advanced analytics",
      "Repurpose back catalog (unlimited)",
      "Priority support",
    ],
    cta: "Upgrade to Professional",
    priceEnvValue: process.env.NEXT_PUBLIC_PADDLE_PROFESSIONAL_PRICE_ID,
    purchasable: true,
  },
];

const PLAN_LABELS: Record<PlanTier, string> = {
  FREE: "Free",
  STARTER: "Starter",
  PROFESSIONAL: "Professional",
  ENTERPRISE: "Enterprise",
};

export default function BillingClient({
  planInfo,
  hasPaddleCustomer,
}: {
  planInfo: UserPlanInfo;
  hasPaddleCustomer: boolean;
}) {
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<PaidPlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleManage = async () => {
    setPortalLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.assign(data.url);
      } else {
        setError(data.error ?? "Could not open billing portal.");
        setPortalLoading(false);
      }
    } catch {
      setError("Something went wrong opening the billing portal.");
      setPortalLoading(false);
    }
  };

  const handleUpgrade = async (card: PlanCard) => {
    if (!card.priceEnvValue) {
      setError(
        `Price ID for ${card.label} is not configured. Set NEXT_PUBLIC_PADDLE_${card.key}_PRICE_ID.`,
      );
      return;
    }
    setCheckoutLoading(card.key as PaidPlanKey);
    setError(null);
    try {
      await startCheckout(card.priceEnvValue);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setCheckoutLoading(null);
    }
  };

  const { plan, used, limit, remaining } = planInfo;
  const effectiveLimit = limit === Infinity ? null : limit;
  const progressPercent = effectiveLimit
    ? Math.min(100, Math.round((used / effectiveLimit) * 100))
    : 0;

  const planLabel = PLAN_LABELS[plan] ?? "Free";

  return (
    <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0F172A]">Billing</h1>
        <p className="mt-1 text-sm text-[#64748B]">Manage your plan and usage.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Current usage */}
      <div className="mb-8 rounded-xl border border-[#E2E8F0] bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#94A3B8]">
              Current Plan
            </p>
            <p className="text-xl font-bold text-[#0F172A] mt-0.5">{planLabel}</p>
          </div>
          {hasPaddleCustomer && (
            <button
              onClick={handleManage}
              disabled={portalLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-60 transition-colors"
            >
              <CreditCard size={14} />
              {portalLoading ? "Opening..." : "Manage Subscription"}
              <ExternalLink size={12} className="text-[#94A3B8]" />
            </button>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-[#64748B]">
            <span>Packs this month</span>
            <span>
              {used}
              {effectiveLimit !== null ? ` / ${effectiveLimit}` : " (unlimited)"}
            </span>
          </div>
          {effectiveLimit !== null && (
            <div className="h-2 w-full rounded-full bg-[#E2E8F0]">
              <div
                className="h-2 rounded-full bg-[#4F46E5] transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
          {effectiveLimit !== null && (
            <p className="text-xs text-[#94A3B8]">
              {remaining} pack{remaining !== 1 ? "s" : ""} remaining this month
            </p>
          )}
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLAN_CARDS.map((card) => {
          const isCurrent = plan === card.key;
          const isFeatured = !!card.featured;
          const isLoading = checkoutLoading === card.key;

          return (
            <div
              key={card.key}
              className={`rounded-xl flex flex-col overflow-hidden ${
                isFeatured
                  ? "border border-[#6D5EF3]/30 shadow-lg shadow-[#6D5EF3]/10"
                  : isCurrent
                  ? "border-2 border-[#4F46E5]"
                  : "border border-[#E2E8F0]"
              } bg-white`}
            >
              {isFeatured && (
                <div className="bg-gradient-to-r from-[#6D5EF3] to-[#8B7CFF] px-4 py-2 text-center">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-white">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="flex flex-col flex-1 p-5 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-[#0F172A]">{card.label}</p>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded-full">
                        Current Plan
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#64748B]">{card.subtext}</p>
                </div>

                <ul className="space-y-2 flex-1">
                  {card.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-[#475569]">
                      <Check
                        size={12}
                        className={`mt-0.5 flex-shrink-0 ${isFeatured ? "text-[#6D5EF3]" : "text-[#4F46E5]"}`}
                        strokeWidth={2.5}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                <div>
                  <p className="text-2xl font-bold text-[#0F172A] mb-3">
                    {card.priceDisplay}
                    {card.key !== "FREE" && (
                      <span className="text-sm font-normal text-[#94A3B8]"> / month</span>
                    )}
                  </p>

                  {!card.purchasable ? (
                    <button
                      disabled
                      className="w-full rounded-lg py-2.5 text-sm font-semibold bg-[#F1F5F9] text-[#94A3B8] cursor-default"
                    >
                      {isCurrent ? "Your current plan" : "Downgrade"}
                    </button>
                  ) : isCurrent ? (
                    <button
                      disabled
                      className="w-full rounded-lg py-2.5 text-sm font-semibold bg-[#F1F5F9] text-[#94A3B8] cursor-default"
                    >
                      Current plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(card)}
                      disabled={isLoading || checkoutLoading !== null}
                      className={`w-full rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
                        isFeatured
                          ? "bg-gradient-to-r from-[#6D5EF3] to-[#8B7CFF] text-white hover:opacity-90"
                          : "bg-[#4F46E5] text-white hover:bg-[#4338CA]"
                      }`}
                    >
                      {isLoading ? "Opening checkout..." : card.cta}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-[#94A3B8]">
        All paid plans include a{" "}
        <a href="/refund" className="underline hover:text-[#64748B] transition-colors">
          14-day money-back guarantee
        </a>
        . Payments processed by Paddle.
      </p>
    </div>
  );
}
