"use client";

import { Check } from "lucide-react";

interface Plan {
  name: string;
  price: string;
  period: string | null;
  badge?: string;
  subtext: string;
  cta: string;
  ctaHref: string;
  variant: "default" | "featured" | "plain";
  features: readonly string[];
}

const PLANS: Plan[] = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    subtext: "Try Korel risk-free",
    cta: "Start Free",
    ctaHref: "/new",
    variant: "plain",
    features: [
      "3 content packs per month",
      "LinkedIn + X posts",
      "Manual transcript input",
      "Basic quality scoring",
    ],
  },
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    badge: "Most Popular",
    subtext: "For founders publishing weekly",
    cta: "Get Started",
    ctaHref: "/new",
    variant: "featured",
    features: [
      "Unlimited content packs",
      "RSS feed monitoring (1 feed)",
      "Auto-publish to LinkedIn + X",
      "Beehiiv newsletter integration",
      "Content calendar",
      "Mobile approve flow",
      "Back catalog repurposing",
    ],
  },
  {
    name: "Professional",
    price: "$149",
    period: "/month",
    subtext: "For founders who publish everywhere",
    cta: "Get Started",
    ctaHref: "/new",
    variant: "default",
    features: [
      "Everything in Starter",
      "5 RSS feeds monitored",
      "Priority pack generation",
      "Advanced analytics",
      "Repurpose back catalog (unlimited)",
      "Priority support",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="px-6" style={{ paddingTop: "112px", paddingBottom: "112px", backgroundColor: "#F6F7FB" }}>
      <div className="mx-auto" style={{ maxWidth: "1100px" }}>
        <div className="text-center" style={{ marginBottom: "56px" }}>
          <span style={{ display: "inline-block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6D5EF3", marginBottom: "16px" }}>
            Pricing
          </span>
          <h2 style={{ color: "#1F2937", fontWeight: 700, fontSize: "38px", marginBottom: "12px", letterSpacing: "-0.02em", lineHeight: "1.15" }}>
            Simple pricing. Cancel anytime.
          </h2>
          <p style={{ color: "#64748B", fontSize: "17px", fontWeight: 400, lineHeight: "1.6", margin: 0 }}>
            Start free. Upgrade when Korel saves you more time than it costs.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: "24px", alignItems: "stretch" }}>
          {PLANS.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </div>
        <p style={{ textAlign: "center", color: "#94A3B8", fontSize: "14px", fontWeight: 400, marginTop: "40px", marginBottom: 0 }}>
          Payments coming soon. Start free today — your account will be ready when billing launches.
        </p>
      </div>
    </section>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const featured = plan.variant === "featured";
  const plain = plan.variant === "plain";

  const ctaStyle: React.CSSProperties = featured
    ? { background: "linear-gradient(135deg,#6D5EF3 0%,#8B7CFF 100%)", color: "#ffffff", boxShadow: "0 4px 16px rgba(109,94,243,0.2)" }
    : plain
    ? { backgroundColor: "rgba(109,94,243,0.06)", border: "1.5px solid rgba(109,94,243,0.25)", color: "#6D5EF3" }
    : { backgroundColor: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#374151" };

  return (
    <div style={{ display: "flex", flexDirection: "column", backgroundColor: "#FFFFFF", borderRadius: "20px", border: featured ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(0,0,0,0.07)", padding: featured ? "0" : "36px", boxShadow: featured ? "0 8px 36px rgba(99,102,241,0.13)" : "0 2px 12px rgba(0,0,0,0.04)", overflow: "hidden" }}>
      {featured && (
        <div style={{ background: "linear-gradient(135deg,#6D5EF3 0%,#8B7CFF 100%)", padding: "10px 36px", textAlign: "center" }}>
          <span style={{ color: "#ffffff", fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{plan.badge}</span>
        </div>
      )}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: featured ? "36px" : "0" }}>
        <p style={{ color: featured ? "#6D5EF3" : "#64748B", fontSize: "13px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px" }}>{plan.name}</p>
        <div style={{ marginBottom: "6px", display: "flex", alignItems: "baseline", gap: "4px" }}>
          <span style={{ color: "#0F172A", fontWeight: 800, fontSize: "48px", lineHeight: 1, letterSpacing: "-0.03em" }}>{plan.price}</span>
          {plan.period && <span style={{ color: "#94A3B8", fontSize: "16px", fontWeight: 500 }}>{plan.period}</span>}
        </div>
        <p style={{ color: "#64748B", fontSize: "14px", lineHeight: "1.6", marginBottom: "28px" }}>{plan.subtext}</p>
        <div style={{ height: "1px", backgroundColor: "rgba(0,0,0,0.06)", marginBottom: "24px" }} />
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: "11px", flex: 1 }}>
          {plan.features.map((f) => (
            <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: featured ? "rgba(109,94,243,0.1)" : "rgba(0,0,0,0.05)", color: featured ? "#6D5EF3" : "#9B7FFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                <Check size={10} strokeWidth={3} />
              </div>
              <span style={{ color: "#374151", fontSize: "14px", lineHeight: "1.55" }}>{f}</span>
            </li>
          ))}
        </ul>
        <a href={plan.ctaHref} style={{ display: "block", width: "100%", textAlign: "center", height: "48px", lineHeight: "48px", borderRadius: "12px", fontSize: "15px", fontWeight: 600, textDecoration: "none", transition: "all 0.2s ease", ...ctaStyle }}>
          {plan.cta}
        </a>
      </div>
    </div>
  );
}
