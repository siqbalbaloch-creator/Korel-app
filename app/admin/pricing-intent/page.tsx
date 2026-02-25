import { requireAdmin } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PricingPlan = string;

type PricingInterestRow = {
  id: string;
  name: string;
  email: string;
  plan: PricingPlan;
  createdAt: Date;
};

type PricingClickRow = {
  id: string;
  plan: PricingPlan;
  createdAt: Date;
};

function fmt(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function PricingIntentPage() {
  await requireAdmin();

  const [interests, clicks]: [PricingInterestRow[], PricingClickRow[]] = await Promise.all([
    prisma.pricingInterest.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.pricingClick.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  // Aggregate by plan
  const plans = ["starter", "professional"] as const;

  const stats = plans.map((plan) => {
    const planClicks = clicks.filter((c) => c.plan === plan).length;
    const planLeads = interests.filter((i) => i.plan === plan).length;
    const convRate = planClicks > 0 ? ((planLeads / planClicks) * 100).toFixed(1) : "—";
    return { plan, clicks: planClicks, leads: planLeads, convRate };
  });

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-10">
      {/* Page header */}
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 700,
            color: "#0F172A",
            letterSpacing: "-0.01em",
            marginBottom: "4px",
          }}
        >
          Pricing Intent
        </h1>
        <p style={{ color: "#64748B", fontSize: "14px" }}>
          Waitlist signups and CTA click tracking from the marketing pricing section.
        </p>
      </div>

      {/* Stat cards */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4"
        style={{ gap: "16px", marginBottom: "40px" }}
      >
        {stats.map(({ plan, clicks: c, leads, convRate }) => (
          <>
            <StatCard
              key={`${plan}-clicks`}
              label={`${plan === "starter" ? "Starter" : "Professional"} Clicks`}
              value={c}
            />
            <StatCard
              key={`${plan}-leads`}
              label={`${plan === "starter" ? "Starter" : "Professional"} Leads`}
              value={leads}
              sub={`${convRate}% conv.`}
            />
          </>
        ))}
      </div>

      {/* Waitlist table */}
      <section style={{ marginBottom: "48px" }}>
        <h2
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "#0F172A",
            marginBottom: "14px",
          }}
        >
          Waitlist Signups ({interests.length})
        </h2>

        {interests.length === 0 ? (
          <EmptyState message="No waitlist signups yet." />
        ) : (
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              border: "1px solid rgba(0,0,0,0.07)",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                  {["Name", "Email", "Plan", "Date"].map((col) => (
                    <th
                      key={col}
                      style={{
                        padding: "10px 16px",
                        textAlign: "left",
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "#94A3B8",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {interests.map((row, i) => (
                  <tr
                    key={row.id}
                    style={{
                      borderBottom:
                        i < interests.length - 1
                          ? "1px solid rgba(0,0,0,0.05)"
                          : "none",
                    }}
                  >
                    <td style={tdStyle}>{row.name}</td>
                    <td style={{ ...tdStyle, color: "#6D5EF3" }}>{row.email}</td>
                    <td style={tdStyle}>
                      <PlanBadge plan={row.plan} />
                    </td>
                    <td style={{ ...tdStyle, color: "#94A3B8", whiteSpace: "nowrap" }}>
                      {fmt(row.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recent clicks table */}
      <section>
        <h2
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "#0F172A",
            marginBottom: "14px",
          }}
        >
          Recent CTA Clicks ({clicks.length})
        </h2>

        {clicks.length === 0 ? (
          <EmptyState message="No clicks tracked yet." />
        ) : (
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              border: "1px solid rgba(0,0,0,0.07)",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                  {["Plan", "Date"].map((col) => (
                    <th
                      key={col}
                      style={{
                        padding: "10px 16px",
                        textAlign: "left",
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "#94A3B8",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clicks.slice(0, 100).map((row, i) => (
                  <tr
                    key={row.id}
                    style={{
                      borderBottom:
                        i < Math.min(clicks.length, 100) - 1
                          ? "1px solid rgba(0,0,0,0.05)"
                          : "none",
                    }}
                  >
                    <td style={tdStyle}>
                      <PlanBadge plan={row.plan} />
                    </td>
                    <td style={{ ...tdStyle, color: "#94A3B8", whiteSpace: "nowrap" }}>
                      {fmt(row.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {clicks.length > 100 && (
              <div
                style={{
                  padding: "10px 16px",
                  fontSize: "13px",
                  color: "#94A3B8",
                  borderTop: "1px solid rgba(0,0,0,0.05)",
                }}
              >
                Showing most recent 100 of {clicks.length} clicks.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

const tdStyle: React.CSSProperties = {
  padding: "11px 16px",
  fontSize: "14px",
  color: "#374151",
};

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        border: "1px solid rgba(0,0,0,0.07)",
        padding: "20px 22px",
      }}
    >
      <p
        style={{
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "#94A3B8",
          marginBottom: "8px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "28px",
          fontWeight: 800,
          color: "#0F172A",
          letterSpacing: "-0.02em",
          lineHeight: 1,
          marginBottom: sub ? "4px" : 0,
        }}
      >
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: "12px", color: "#6D5EF3", fontWeight: 600 }}>{sub}</p>
      )}
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const professional = plan === "professional";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "100px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        backgroundColor: professional
          ? "rgba(109, 94, 243, 0.1)"
          : "rgba(0, 0, 0, 0.05)",
        color: professional ? "#6D5EF3" : "#64748B",
      }}
    >
      {plan}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        border: "1px solid rgba(0,0,0,0.07)",
        padding: "40px 24px",
        textAlign: "center",
        color: "#94A3B8",
        fontSize: "14px",
      }}
    >
      {message}
    </div>
  );
}
