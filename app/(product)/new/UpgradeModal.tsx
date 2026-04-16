"use client";

import { useRouter } from "next/navigation";
import { X, Zap, Building2, Check } from "lucide-react";

type Plan = "STARTER" | "PROFESSIONAL";

const PLAN_FEATURES: Record<
  Plan,
  { icon: React.ElementType; color: string; price: number; limit: string; features: string[] }
> = {
  STARTER: {
    icon: Zap,
    color: "#4F46E5",
    price: 49,
    limit: "15 Authority Packs / month",
    features: [
      "15 Authority Packs per month",
      "All Authority Pack sections",
      "LinkedIn, X & Newsletter assets",
      "One-click quality Fix",
      "RSS feed monitoring (1 feed)",
    ],
  },
  PROFESSIONAL: {
    icon: Building2,
    color: "#0F172A",
    price: 149,
    limit: "50 Authority Packs / month",
    features: [
      "50 Authority Packs per month",
      "All Starter features",
      "RSS feed monitoring (5 feeds)",
      "Priority generation",
      "Unlimited regenerations",
    ],
  },
};

export function UpgradeModal({
  currentPlan,
  onClose,
}: {
  currentPlan: string;
  onClose: () => void;
}) {
  const router = useRouter();

  const handleViewPlans = () => {
    onClose();
    router.push("/billing");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-[#F1F5F9]">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 rounded-full p-1.5 text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors"
          >
            <X size={18} />
          </button>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#4F46E5] mb-1">
            Monthly Authority Pack limit reached
          </p>
          <h2 className="text-2xl font-bold text-[#0F172A]">
            Continue with structured authority output
          </h2>
          <p className="mt-1 text-sm text-[#64748B]">
            You&apos;ve reached your monthly Authority Pack limit on the{" "}
            <span className="font-medium">{currentPlan}</span> plan. Upgrade to
            continue turning your source material into structured authority assets.
          </p>
        </div>

        {/* Plan cards */}
        <div className="px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(["STARTER", "PROFESSIONAL"] as Plan[]).map((planKey) => {
            const p = PLAN_FEATURES[planKey];
            const Icon = p.icon;
            const label = planKey === "STARTER" ? "Starter" : "Professional";

            return (
              <div
                key={planKey}
                className={`rounded-xl border-2 p-5 flex flex-col gap-4 ${
                  planKey === "STARTER"
                    ? "border-[#4F46E5] bg-[#FAFAFE]"
                    : "border-[#E2E8F0] bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center rounded-lg"
                    style={{
                      width: 36,
                      height: 36,
                      background:
                        planKey === "STARTER"
                          ? "rgba(79,70,229,0.1)"
                          : "#F1F5F9",
                    }}
                  >
                    <Icon size={16} color={p.color} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0F172A]">{label}</p>
                    <p className="text-xs text-[#64748B]">{p.limit}</p>
                  </div>
                  {planKey === "STARTER" && (
                    <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded-full">
                      Popular
                    </span>
                  )}
                </div>

                <ul className="space-y-2">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-xs text-[#475569]"
                    >
                      <Check
                        size={12}
                        className="mt-0.5 flex-shrink-0 text-[#4F46E5]"
                        strokeWidth={2.5}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <p className="mb-3 text-2xl font-bold text-[#0F172A]">
                    ${p.price}
                    <span className="text-sm font-normal text-[#94A3B8]">
                      {" "}
                      / month
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={handleViewPlans}
                    className={`w-full rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                      planKey === "STARTER"
                        ? "bg-[#4F46E5] text-white hover:bg-[#4338CA]"
                        : "bg-[#0F172A] text-white hover:bg-[#1E293B]"
                    }`}
                  >
                    Upgrade to {label}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-8 pb-7 flex flex-col items-center gap-3">
          <p className="text-xs text-[#94A3B8]">
            Billing powered by Paddle · Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}
