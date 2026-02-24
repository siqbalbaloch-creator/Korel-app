"use client";

import { useState } from "react";
import { Check, Zap, Building2, CreditCard, ExternalLink } from "lucide-react";
import type { UserPlanInfo } from "@/lib/getUserPlan";

const PLAN_CARDS = [
  {
    key: "FREE" as const,
    label: "Free",
    price: 0,
    limit: "3 packs / month",
    features: ["3 Authority Packs per month", "All content formats", "LinkedIn, X & Newsletter outputs"],
  },
  {
    key: "PRO" as const,
    label: "Pro",
    price: 29,
    limit: "50 packs / month",
    icon: Zap,
    features: [
      "50 Authority Packs per month",
      "All content formats",
      "LinkedIn, X & Newsletter outputs",
      "Priority generation",
      "Email support",
    ],
  },
  {
    key: "ENTERPRISE" as const,
    label: "Enterprise",
    price: 99,
    limit: "Unlimited packs",
    icon: Building2,
    features: [
      "Unlimited Authority Packs",
      "All Pro features",
      "Team workspace (coming soon)",
      "Custom branding (coming soon)",
      "Dedicated support",
    ],
  },
];

export default function BillingClient({ planInfo }: { planInfo: UserPlanInfo }) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const handleUpgrade = async (planKey: "PRO" | "ENTERPRISE") => {
    setLoadingPlan(planKey);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Something went wrong.");
        setLoadingPlan(null);
      }
    } catch {
      alert("Something went wrong.");
      setLoadingPlan(null);
    }
  };

  const handleManage = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
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

  return (
    <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0F172A]">Billing</h1>
        <p className="mt-1 text-sm text-[#64748B]">Manage your plan and usage.</p>
      </div>

      {/* Current usage */}
      <div className="mb-8 rounded-xl border border-[#E2E8F0] bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#94A3B8]">Current Plan</p>
            <p className="text-xl font-bold text-[#0F172A] mt-0.5">{plan === "FREE" ? "Free" : plan === "PRO" ? "Pro" : "Enterprise"}</p>
          </div>
          {plan !== "FREE" && (
            <button
              onClick={handleManage}
              disabled={portalLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-60 transition-colors"
            >
              <CreditCard size={14} />
              {portalLoading ? "Opening…" : "Manage Subscription"}
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
          const isPro = card.key === "PRO";

          return (
            <div
              key={card.key}
              className={`rounded-xl border-2 p-5 flex flex-col gap-4 ${
                isCurrent
                  ? "border-[#4F46E5] bg-[#FAFAFE]"
                  : isPro
                  ? "border-[#E2E8F0] bg-white"
                  : "border-[#E2E8F0] bg-white"
              }`}
            >
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

              <ul className="space-y-2 flex-1">
                {card.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-[#475569]">
                    <Check size={12} className="mt-0.5 flex-shrink-0 text-[#4F46E5]" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>

              <div>
                <p className="text-2xl font-bold text-[#0F172A] mb-3">
                  {card.price === 0 ? "Free" : `$${card.price}`}
                  {card.price > 0 && (
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
                    onClick={() => handleUpgrade(card.key as "PRO" | "ENTERPRISE")}
                    disabled={isCurrent || loadingPlan === card.key}
                    className={`w-full rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
                      isCurrent
                        ? "bg-[#F1F5F9] text-[#94A3B8] cursor-default"
                        : "bg-[#4F46E5] text-white hover:bg-[#4338CA]"
                    }`}
                  >
                    {isCurrent
                      ? "Current plan"
                      : loadingPlan === card.key
                      ? "Redirecting…"
                      : `Upgrade to ${card.label}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-[#94A3B8]">
        Secure payment via Stripe · Cancel anytime · Billing resets monthly
      </p>
    </div>
  );
}
