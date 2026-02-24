import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { getServerAuthSession } from "@/lib/auth";
import { getUserPlan } from "@/lib/getUserPlan";
import { PLAN_CONFIGS } from "@/lib/plans";

const PLAN_FEATURES: Record<
  "FREE" | "PRO" | "ENTERPRISE",
  { description: string; features: string[] }
> = {
  FREE: {
    description: "Get started building your Authority Pack library.",
    features: [
      "3 Authority Packs / month",
      "All 6 Authority Pack sections",
      "LinkedIn, X & Newsletter assets",
      "Pack History",
    ],
  },
  PRO: {
    description: "Scale Authority Pack production and refinement.",
    features: [
      "50 Authority Packs / month",
      "All Free features",
      "One-click quality Fix",
      "Pack repurposing",
      "Priority generation",
    ],
  },
  ENTERPRISE: {
    description: "Unlimited Authority Pack output for power creators and teams.",
    features: [
      "Unlimited Authority Packs",
      "All Pro features",
      "Team workspace (coming soon)",
      "Custom branding (coming soon)",
      "Dedicated support",
    ],
  },
};

export default async function UpgradePage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) redirect("/signin");

  const { plan: currentPlan } = await getUserPlan(session.user.id, {
    role: session.user.role,
  });

  const tiers = ["FREE", "PRO", "ENTERPRISE"] as const;

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-[1000px] mx-auto px-6 py-10 space-y-10">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-[#111]">
            Plans
          </h1>
          <p className="text-sm text-[#64748B]">
            You are currently on the{" "}
            <span className="font-semibold text-[#4F46E5]">
              {PLAN_CONFIGS[currentPlan].name}
            </span>{" "}
            plan.
          </p>
        </div>

        {/* Coming soon banner */}
        <div className="rounded-xl border border-[#C7D2FE] bg-[#EEF2FF] px-5 py-4">
          <p className="text-sm text-[#4F46E5]">
            <span className="font-semibold">Paid plans are coming soon.</span>{" "}
            We&apos;re finalising billing. Early users will get priority access
            and a founding discount when it goes live.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {tiers.map((tier) => {
            const config = PLAN_CONFIGS[tier];
            const meta = PLAN_FEATURES[tier];
            const isCurrent = tier === currentPlan;
            const isPro = tier === "PRO";

            return (
              <div
                key={tier}
                className={`relative rounded-2xl border p-6 flex flex-col gap-5 ${
                  isPro
                    ? "border-[#4F46E5] shadow-[0_0_0_1px_#4F46E5]"
                    : "border-neutral-200"
                } bg-white`}
              >
                {isPro && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#4F46E5] px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                    Most popular
                  </span>
                )}

                {/* Plan name + price */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-[#0F172A]">
                      {config.name}
                    </p>
                    {isCurrent && (
                      <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-semibold text-green-700">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-[#64748B] text-xs">{meta.description}</p>
                  <div className="mt-3">
                    {config.priceUsd === null ? (
                      <p className="text-3xl font-bold text-[#0F172A]">
                        Free
                      </p>
                    ) : (
                      <p className="text-3xl font-bold text-[#0F172A]">
                        ${config.priceUsd}
                        <span className="text-sm font-normal text-[#94A3B8]">
                          {" "}
                          / mo
                        </span>
                      </p>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[#64748B]">
                    {config.monthlyPackLimit === Infinity
                      ? "Unlimited Authority Packs / month"
                      : `${config.monthlyPackLimit} Authority Packs / month`}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2 flex-1">
                  {meta.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-xs text-[#475569]"
                    >
                      <Check
                        className="mt-0.5 flex-shrink-0 text-[#4F46E5]"
                        size={11}
                        strokeWidth={2.5}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="mt-2">
                  {isCurrent ? (
                    <div className="w-full rounded-lg border border-neutral-200 py-2.5 text-center text-sm font-medium text-neutral-400 cursor-default">
                      Your current plan
                    </div>
                  ) : (
                    <div className="relative w-full">
                      <button
                        disabled
                        className={`w-full rounded-lg py-2.5 text-sm font-semibold opacity-60 cursor-not-allowed ${
                          isPro
                            ? "bg-[#4F46E5] text-white"
                            : "bg-[#0F172A] text-white"
                        }`}
                      >
                        {config.priceUsd === null ? "Downgrade" : `Upgrade to ${config.name}`}
                      </button>
                      <span className="absolute -top-2.5 right-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        Coming soon
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-neutral-400">
          Billing powered by Stripe Â· Cancel anytime Â· Prices in USD
        </p>
      </div>
    </div>
  );
}

