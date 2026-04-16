"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { UserPlanInfo } from "@/lib/getUserPlan";
import type { PlanTier } from "@/lib/plans";
import { startCheckout } from "@/components/pricing/startCheckout";

type PaidPlanKey = "STARTER" | "PROFESSIONAL";

type PlanCardDef = {
  key: PlanTier;
  label: string;
  priceDisplay: string;
  hasPeriod: boolean;
  subtext: string;
  features: string[];
  cta: string;
  priceEnvValue?: string;
  featured?: boolean;
  purchasable: boolean;
};

const PLAN_CARDS: PlanCardDef[] = [
  {
    key: "FREE",
    label: "Free",
    priceDisplay: "$0",
    hasPeriod: false,
    subtext: "Try Korel risk-free",
    features: [
      "3 content packs per month",
      "LinkedIn + X posts",
      "Manual transcript input",
      "Basic quality scoring",
    ],
    cta: "Downgrade",
    purchasable: false,
  },
  {
    key: "STARTER",
    label: "Starter",
    priceDisplay: "$49",
    hasPeriod: true,
    subtext: "For founders publishing weekly",
    features: [
      "Unlimited content packs",
      "RSS feed monitoring (1 feed)",
      "Auto-publish to LinkedIn + X",
      "Beehiiv newsletter integration",
      "Content calendar",
      "Mobile approve flow",
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
    hasPeriod: true,
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

const PLAN_DISPLAY_NAMES: Record<PlanTier, string> = {
  FREE: "Free",
  STARTER: "Starter",
  PROFESSIONAL: "Professional",
  ENTERPRISE: "Enterprise",
};

export default function UpgradeClient({ planInfo }: { planInfo: UserPlanInfo }) {
  const [loadingKey, setLoadingKey] = useState<PaidPlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { plan } = planInfo;
  const planLabel = PLAN_DISPLAY_NAMES[plan] ?? plan;

  const handleUpgrade = async (card: PlanCardDef) => {
    if (!card.priceEnvValue) {
      setError(
        `Price ID for ${card.label} is not configured. Set NEXT_PUBLIC_PADDLE_${card.key}_PRICE_ID.`,
      );
      return;
    }
    setLoadingKey(card.key as PaidPlanKey);
    setError(null);
    try {
      await startCheckout(card.priceEnvValue);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoadingKey(null);
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-[1100px] mx-auto px-6 py-10 space-y-10">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-[#111]">Plans</h1>
          <p className="text-sm text-[#64748B]">
            You are currently on the{" "}
            <span className="font-semibold text-[#4F46E5]">{planLabel}</span> plan.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLAN_CARDS.map((card) => {
            const isCurrent = plan === card.key;
            const isFeatured = !!card.featured;
            const isLoading = loadingKey === card.key;

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
                {/* Featured bar */}
                {isFeatured && (
                  <div className="bg-gradient-to-r from-[#6D5EF3] to-[#8B7CFF] px-4 py-2 text-center">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-white">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="flex flex-col flex-1 p-5 gap-4">
                  {/* Name + current badge */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-[#0F172A]">{card.label}</p>
                      {isCurrent && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#64748B]">{card.subtext}</p>
                  </div>

                  {/* Features */}
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

                  {/* Price + CTA */}
                  <div>
                    <p className="text-2xl font-bold text-[#0F172A] mb-3">
                      {card.priceDisplay}
                      {card.hasPeriod && (
                        <span className="text-sm font-normal text-[#94A3B8]"> / month</span>
                      )}
                    </p>

                    {!card.purchasable ? (
                      <button
                        disabled
                        className="w-full rounded-lg py-2.5 text-sm font-semibold bg-[#F1F5F9] text-[#94A3B8] cursor-default"
                      >
                        {isCurrent ? "Your current plan" : card.cta}
                      </button>
                    ) : isCurrent ? (
                      <button
                        disabled
                        className="w-full rounded-lg border border-[#E2E8F0] py-2.5 text-sm font-medium text-[#94A3B8] cursor-default"
                      >
                        Your current plan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpgrade(card)}
                        disabled={isLoading || loadingKey !== null}
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

        <p className="text-center text-xs text-[#94A3B8]">
          All paid plans include a 14-day money-back guarantee. Payments processed by Paddle.
        </p>
      </div>
    </div>
  );
}
