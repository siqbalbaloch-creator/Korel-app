export function WhyNotChatGPT() {
  const POINTS = [
    {
      label: "Structure before text.",
      detail:
        "Chat tools start with the prompt. Korel starts with a Strategic Authority Map — thesis, claims, evidence, objections — then generates from that structure.",
    },
    {
      label: "Single source of truth.",
      detail:
        "Every LinkedIn post, X thread, and newsletter is compiled from the same SAM. No divergent positioning across platforms.",
    },
    {
      label: "Deterministic evaluation signals.",
      detail:
        "Messaging Strength, Authority Consistency, and Weakness Radar are rule-based scores derived from the SAM — not opinion, not AI approximation.",
    },
    {
      label: "Cross-pack consistency tracking.",
      detail:
        "As you generate more packs, Korel tracks whether your authority positioning stays coherent over time. Chat tools have no memory of your prior work.",
    },
  ];

  return (
    <section
      className="px-6"
      style={{
        paddingTop: "96px",
        paddingBottom: "96px",
        backgroundColor: "#F6F7FB",
      }}
    >
      <div className="mx-auto" style={{ maxWidth: "1100px" }}>
        {/* Header */}
        <div style={{ marginBottom: "56px" }}>
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
            Why not ChatGPT?
          </span>
          <h2
            style={{
              color: "#0F172A",
              fontWeight: 700,
              fontSize: "36px",
              lineHeight: "1.2",
              letterSpacing: "-0.02em",
              marginBottom: "12px",
            }}
          >
            Chat tools write text.{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #6D5EF3 0%, #8B7CFF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Korel compiles from structure.
            </span>
          </h2>
          <p
            style={{
              color: "#64748B",
              fontSize: "17px",
              lineHeight: "1.65",
              maxWidth: "600px",
            }}
          >
            The difference is not speed. It is architecture.
          </p>
        </div>

        {/* Points grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2"
          style={{ gap: "20px" }}
        >
          {POINTS.map((point) => (
            <div
              key={point.label}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                border: "1px solid rgba(0, 0, 0, 0.06)",
                padding: "28px 32px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#6D5EF3",
                    marginTop: "7px",
                    flexShrink: 0,
                  }}
                />
                <p
                  style={{
                    color: "#0F172A",
                    fontWeight: 600,
                    fontSize: "16px",
                    lineHeight: "1.4",
                    margin: 0,
                  }}
                >
                  {point.label}
                </p>
              </div>
              <p
                style={{
                  color: "#64748B",
                  fontSize: "14px",
                  lineHeight: "1.7",
                  margin: "0 0 0 20px",
                }}
              >
                {point.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
