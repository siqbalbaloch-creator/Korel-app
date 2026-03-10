const PLATFORMS = [
  {
    emoji: "🔗",
    name: "LinkedIn",
    description:
      "Long-form authority post, structured from your core thesis. Ready to publish with one tap.",
    color: "#0A66C2",
    bg: "#EFF6FF",
    border: "rgba(10, 102, 194, 0.15)",
  },
  {
    emoji: "𝕏",
    name: "X / Twitter",
    description:
      "Sharp hooks and threads extracted from your best moments. Optimised for engagement.",
    color: "#0F172A",
    bg: "#F8FAFC",
    border: "rgba(0,0,0,0.08)",
  },
  {
    emoji: "📧",
    name: "Newsletter",
    description:
      "A complete newsletter section ready to send to your Beehiiv or Substack subscribers.",
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "rgba(124, 58, 237, 0.15)",
  },
  {
    emoji: "📅",
    name: "Content Calendar",
    description:
      "Every piece scheduled weeks in advance. Your content runs on autopilot.",
    color: "#059669",
    bg: "#ECFDF5",
    border: "rgba(5, 150, 105, 0.15)",
  },
];

export function PlatformCards() {
  return (
    <section
      className="px-6"
      style={{
        paddingTop: "104px",
        paddingBottom: "104px",
        backgroundColor: "#ffffff",
      }}
    >
      <div className="mx-auto" style={{ maxWidth: "1100px" }}>
        {/* Header */}
        <div className="text-center" style={{ marginBottom: "52px" }}>
          <span
            style={{
              display: "inline-block",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#6D5EF3",
              marginBottom: "16px",
            }}
          >
            What Korel publishes to
          </span>
          <h2
            style={{
              color: "#0F172A",
              fontWeight: 700,
              fontSize: "36px",
              lineHeight: "1.2",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            One interview. Every platform. Automatically.
          </h2>
        </div>

        {/* Cards grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          style={{ gap: "20px" }}
        >
          {PLATFORMS.map((p) => (
            <div
              key={p.name}
              style={{
                backgroundColor: p.bg,
                borderRadius: "16px",
                border: `1px solid ${p.border}`,
                padding: "28px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "28px",
                  lineHeight: 1,
                }}
              >
                {p.emoji}
              </div>
              <p
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: "16px",
                  color: p.color,
                }}
              >
                {p.name}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: "#64748B",
                  lineHeight: "1.65",
                }}
              >
                {p.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
