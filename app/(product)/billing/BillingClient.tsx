"use client";

import { useState } from "react";
import { Check, CreditCard, ExternalLink } from "lucide-react";
import type { UserPlanInfo } from "@/lib/getUserPlan";
import { PricingWaitlistModal } from "@/components/pricing/PricingWaitlistModal";

type WaitlistPlan = "STARTER" | "PROFESSIONAL" | "ENTERPRISE";

const PLAN_CARDS = [
  {
    key: "FREE" as const,
    label: "Free",
    price: null as null,
    priceDisplay: "Free",
    limit: "3 packs / month",
    features: [
      "3 Authority Packs per month",
      "All content formats",
      "LinkedIn, X & Newsletter outputs",
    ],
    cta: "Your current plan",
    waitlistKey: null as WaitlistPlan | null,
  },
  {
    key: "STARTER" as const,
    label: "Starter",
    price: 49,
    priceDisplay: "$49",
    limit: "15 uploads / month",
    features: [
      "15 interview or update uploads per month",
      "Structured Authority Map (SAM) generation",
      "LinkedIn and X platform-ready assets",
      "Messaging Strength evaluation",
      "7-day content cadence preview",
      "Email support",
    ],
    cta: "Join Starter Waitlist",
    waitlistKey: "STARTER" as WaitlistPlan,
  },
  {
    key: "PROFESSIONAL" as const,
    label: "Professional",
    price: 149,
    priceDisplay: "$149",
    limit: "50 uploads / month",
    features: [
      "50 interview or update uploads per month",
      "Unlimited platform-ready assets per upload",
      "Full Strategic Authority Map (SAM)",
      "Messaging Strength + Authority Consistency tracking",
      "Weakness Radar insights",
      "Newsletter format included",
      "30-day authority calendar",
      "Priority support",
    ],
    cta: "Join Professional Cohort",
    waitlistKey: "PROFESSIONAL" as WaitlistPlan,
    featured: true,
  },
  {
    key: "ENTERPRISE" as const,
    label: "Enterprise",
    price: null as null,
    priceDisplay: "Custom",
    limit: "Unlimited uploads",
    features: [
      "Unlimited uploads",
      "Multi-user accounts",
      "Cross-brand authority management",
      "Advanced analytics & reporting",
      "Custom integrations",
      "Dedicated onboarding support",
      "SLA & account manager",
    ],
    cta: "Contact Sales",
    waitlistKey: "ENTERPRISE" as WaitlistPlan,
  },
];

export default function BillingClient({ planInfo }: { planInfo: UserPlanInfo }) {
  const [portalLoading, setPortalLoading] = useState(false);
  const [modalPlan, setModalPlan] = useState<WaitlistPlan | null>(null);

  const handleManage = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.assign(data.url);
      } else {
        alert(data.error ?? "Could not open billing portal.");
        setPortalLoading(false);
      }
    } catch {
      alert("Something went wrong.");
      setPortalLoading(false);
    }
  };

  const { plan, used, limit, remaining } = planInfo;
  const effectiveLimit = limit === Infinity ? null : limit;
  const progressPercent = effectiveLimit
    ? Math.min(100, Math.round((used / effectiveLimit) * 100))
    : 0;

  const planLabel =
    plan === "FREE" ? "Free" : plan === "PRO" ? "Pro" : "Enterprise";

  return (
    <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0F172A]">Billing</h1>
        <p className="mt-1 text-sm text-[#64748B]">Manage your plan and usage.</p>
      </div>

      {/* Current usage */}
      <div className="mb-8 rounded-xl border border-[#E2E8F0] bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#94A3B8]">
              Current Plan
            </p>
            <p className="text-xl font-bold text-[#0F172A] mt-0.5">{planLabel}</p>
          </div>
          {plan !== "FREE" && (
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLAN_CARDS.map((card) => {
          const isCurrent = plan === card.key;
          const isFeatured = !!card.featured;

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
                  <p className="text-xs text-[#64748B]">{card.limit}</p>
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
                    {card.price !== null && (
                      <span className="text-sm font-normal text-[#94A3B8]"> / month</span>
                    )}
                  </p>

                  {card.key === "FREE" ? (
                    <button
                      disabled
                      className="w-full rounded-lg py-2.5 text-sm font-semibold bg-[#F1F5F9] text-[#94A3B8] cursor-default"
                    >
                      {isCurrent ? "Your current plan" : "Downgrade"}
                    </button>
                  ) : (
                    <button
                      onClick={() => card.waitlistKey && setModalPlan(card.waitlistKey)}
                      className={`w-full rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                        isFeatured
                          ? "bg-gradient-to-r from-[#6D5EF3] to-[#8B7CFF] text-white hover:opacity-90"
                          : "bg-[#4F46E5] text-white hover:bg-[#4338CA]"
                      }`}
                    >
                      {card.cta}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-[#94A3B8]">
        Paid plans are opening in phases. Join the waitlist to get notified.
      </p>

      {modalPlan && (
        <PricingWaitlistModal
          plan={modalPlan}
          source="PRICING"
          onClose={() => setModalPlan(null)}
        />
      )}
    </div>
  );
}
