"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { PricingWaitlistModal } from "@/components/pricing/PricingWaitlistModal";
import { logMarketingEvent } from "@/lib/marketingEvents";

type PlanVariant = "default" | "featured" | "enterprise";
type WaitlistPlan = "STARTER" | "PROFESSIONAL" | "ENTERPRISE";

interface Plan {
  name: string;
  price: string;
  period: string | null;
  badge?: string;
  subtext: string;
  cta: string;
  ctaHref: string | null;
  ctaModal: WaitlistPlan;
  variant: PlanVariant;
  features: readonly string[];
}

const PLANS: Plan[] = [
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    subtext: "For founders beginning to systemize their authority.",
    cta: "Join Starter Waitlist",
    ctaHref: null,
    ctaModal: "STARTER",
    variant: "default",
    features: [
      "5 interview or update uploads per month",
      "Structured Authority Map (SAM) generation",
      "LinkedIn and X platform-ready assets",
      "Messaging Strength evaluation",
      "7-day content cadence preview",
      "Email support",
    ],
  },
  {
    name: "Professional",
    price: "$149",
    period: "/month",
    badge: "Most Popular",
    subtext: "For active founders building consistent authority.",
    cta: "Join Professional Cohort",
    ctaHref: null,
    ctaModal: "PROFESSIONAL",
    variant: "featured",
    features: [
      "20 interview or update uploads per month",
      "Unlimited platform-ready assets per upload",
      "Full Strategic Authority Map (SAM)",
      "Messaging Strength + Authority Consistency tracking",
      "Weakness Radar insights",
      "Newsletter format included",
      "30-day authority calendar",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: null,
    subtext: "For teams, agencies, and advanced operators.",
    cta: "Contact Sales",
    ctaHref: null,
    ctaModal: "ENTERPRISE",
    variant: "enterprise",
    features: [
      "Unlimited uploads",
      "Multi-user accounts",
      "Cross-brand authority management",
      "Advanced analytics & reporting",
      "Custom integrations",
      "Dedicated onboarding support",
      "SLA & account manager",
    ],
  },
];

export function Pricing() {
  const [hoveredCta, setHoveredCta] = useState<string | null>(null);
  const [modalPlan, setModalPlan] = useState<WaitlistPlan | null>(null);

  async function handlePlanClick(plan: Plan) {
    // Track click for Starter / Professional (fire-and-forget, legacy model)
    if (plan.ctaModal === "STARTER" || plan.ctaModal === "PROFESSIONAL") {
      fetch("/api/pricing-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.ctaModal.toLowerCase() }),
      }).catch(() => {});
    }
    void logMarketingEvent("PRICING_INTENT_OPEN", { plan: plan.ctaModal });
    setModalPlan(plan.ctaModal);
  }

  return (
    <>
      <section
        id="pricing"
        className="px-6"
        style={{ paddingTop: "112px", paddingBottom: "112px", backgroundColor: "#ffffff" }}
      >
        <div className="mx-auto" style={{ maxWidth: "1100px" }}>

          {/* Header */}
          <div className="text-center" style={{ marginBottom: "56px" }}>
            <h2
              style={{
                color: "#1F2937",
                fontWeight: 700,
                fontSize: "38px",
                marginBottom: "12px",
                letterSpacing: "-0.02em",
                lineHeight: "1.15",
              }}
            >
              Simple, Transparent Pricing
            </h2>
            <p style={{ color: "#64748B", fontSize: "17px", fontWeight: 400, lineHeight: "1.6", margin: 0 }}>
              Choose the plan that matches your authority-building needs.
            </p>
          </div>

          {/* Plans grid */}
          <div
            className="grid grid-cols-1 lg:grid-cols-3"
            style={{ gap: "24px", alignItems: "stretch" }}
          >
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.name}
                plan={plan}
                ctaHovered={hoveredCta === plan.name}
                onCtaEnter={() => setHoveredCta(plan.name)}
                onCtaLeave={() => setHoveredCta(null)}
                onCtaClick={() => handlePlanClick(plan)}
              />
            ))}
          </div>

          {/* Bottom note */}
          <p
            style={{
              textAlign: "center",
              color: "#94A3B8",
              fontSize: "14px",
              fontWeight: 400,
              marginTop: "40px",
              marginBottom: 0,
            }}
          >
            Paid plans are opening in phases. Join the waitlist to get notified.
          </p>

        </div>
      </section>

      {modalPlan && (
        <PricingWaitlistModal
          plan={modalPlan}
          source="PRICING"
          onClose={() => setModalPlan(null)}
        />
      )}
    </>
  );
}

function PlanCard({
  plan,
  ctaHovered,
  onCtaEnter,
  onCtaLeave,
  onCtaClick,
}: {
  plan: Plan;
  ctaHovered: boolean;
  onCtaEnter: () => void;
  onCtaLeave: () => void;
  onCtaClick: () => void;
}) {
  const featured = plan.variant === "featured";
  const enterprise = plan.variant === "enterprise";

  const ctaStyle: React.CSSProperties = featured
    ? {
        background: ctaHovered
          ? "linear-gradient(135deg, #5d4ee3 0%, #7b6cff 100%)"
          : "linear-gradient(135deg, #6D5EF3 0%, #8B7CFF 100%)",
        color: "#ffffff",
        boxShadow: ctaHovered
          ? "0 8px 24px rgba(109, 94, 243, 0.32)"
          : "0 4px 16px rgba(109, 94, 243, 0.2)",
        transform: ctaHovered ? "translateY(-1px)" : "translateY(0)",
      }
    : enterprise
    ? {
        backgroundColor: ctaHovered ? "rgba(0,0,0,0.04)" : "transparent",
        border: "1.5px solid #D1D5DB",
        color: "#374151",
        boxShadow: ctaHovered ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
      }
    : {
        backgroundColor: ctaHovered
          ? "rgba(109, 94, 243, 0.08)"
          : "rgba(109, 94, 243, 0.06)",
        border: "1.5px solid rgba(109, 94, 243, 0.25)",
        color: "#6D5EF3",
      };

  const sharedCtaStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    textAlign: "center",
    height: "48px",
    lineHeight: "48px",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: 600,
    textDecoration: "none",
    transition: "all 0.2s ease",
    cursor: "pointer",
    border: "none",
    padding: 0,
    ...ctaStyle,
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#FFFFFF",
        borderRadius: "20px",
        border: featured
          ? "1px solid rgba(99, 102, 241, 0.3)"
          : "1px solid rgba(0, 0, 0, 0.07)",
        padding: featured ? "0" : "36px",
        boxShadow: featured
          ? "0 8px 36px rgba(99, 102, 241, 0.13), 0 2px 8px rgba(99, 102, 241, 0.07)"
          : "0 2px 12px rgba(0, 0, 0, 0.04)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Featured badge header bar */}
      {featured && (
        <div
          style={{
            background: "linear-gradient(135deg, #6D5EF3 0%, #8B7CFF 100%)",
            padding: "10px 36px",
            textAlign: "center",
          }}
        >
          <span
            style={{
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {plan.badge}
          </span>
        </div>
      )}

      {/* Card body */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: featured ? "36px" : "0",
        }}
      >
        {/* Plan name */}
        <p
          style={{
            color: featured ? "#6D5EF3" : "#64748B",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}
        >
          {plan.name}
        </p>

        {/* Price */}
        <div style={{ marginBottom: "6px", display: "flex", alignItems: "baseline", gap: "4px" }}>
          <span
            style={{
              color: "#0F172A",
              fontWeight: 800,
              fontSize: enterprise ? "36px" : "48px",
              lineHeight: 1,
              letterSpacing: "-0.03em",
            }}
          >
            {plan.price}
          </span>
          {plan.period && (
            <span style={{ color: "#94A3B8", fontSize: "16px", fontWeight: 500 }}>
              {plan.period}
            </span>
          )}
        </div>

        {/* Subtext */}
        <p
          style={{
            color: "#64748B",
            fontSize: "14px",
            fontWeight: 400,
            lineHeight: "1.6",
            marginBottom: "28px",
          }}
        >
          {plan.subtext}
        </p>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            backgroundColor: "rgba(0, 0, 0, 0.06)",
            marginBottom: "24px",
          }}
        />

        {/* Features */}
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "0 0 32px",
            display: "flex",
            flexDirection: "column",
            gap: "11px",
            flex: 1,
          }}
        >
          {plan.features.map((f) => (
            <li
              key={f}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  backgroundColor: featured
                    ? "rgba(109, 94, 243, 0.1)"
                    : "rgba(0, 0, 0, 0.05)",
                  color: featured ? "#6D5EF3" : "#9B7FFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: "1px",
                }}
              >
                <Check size={10} strokeWidth={3} />
              </div>
              <span
                style={{
                  color: "#374151",
                  fontSize: "14px",
                  lineHeight: "1.55",
                  fontWeight: 400,
                }}
              >
                {f}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA — all plans now open the modal */}
        <button
          type="button"
          onMouseEnter={onCtaEnter}
          onMouseLeave={onCtaLeave}
          onClick={onCtaClick}
          style={sharedCtaStyle}
        >
          {plan.cta}
        </button>
      </div>
    </div>
  );
}
