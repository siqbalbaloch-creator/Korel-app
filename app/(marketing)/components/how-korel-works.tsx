const STEPS = [
  {
    number: "01",
    emoji: "📡",
    title: "Monitor",
    body: "Connect your podcast RSS or YouTube channel. Korel watches for new episodes 24/7.",
  },
  {
    number: "02",
    emoji: "⚡",
    title: "Detect",
    body: "New episode drops. Korel detects it automatically within hours — no manual input needed.",
  },
  {
    number: "03",
    emoji: "🤖",
    title: "Generate",
    body: "Korel reads the transcript and generates a LinkedIn post, X thread, and newsletter section from your actual ideas.",
  },
  {
    number: "04",
    emoji: "📬",
    title: "Notify",
    body: 'You get an email: "New pack ready." One tap opens your mobile review page.',
  },
  {
    number: "05",
    emoji: "🚀",
    title: "Publish",
    body: "Review in 60 seconds. Tap Approve. Korel publishes to all your connected platforms.",
  },
] as const;

export function HowKorelWorks() {
  return (
    <section
      id="why-korel"
      className="px-6"
      style={{ paddingTop: "104px", paddingBottom: "104px", backgroundColor: "#ffffff" }}
    >
      <div className="mx-auto" style={{ maxWidth: "1100px" }}>
        {/* Header */}
        <div className="text-center" style={{ marginBottom: "56px" }}>
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
            The agent loop
          </span>
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
            Set it up once. Content runs forever.
          </h2>
          <p
            style={{
              color: "#64748B",
              fontSize: "17px",
              fontWeight: 400,
              lineHeight: "1.6",
              margin: 0,
              maxWidth: "520px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Korel works like a full-time content employee — without the salary.
          </p>
        </div>

        {/* Steps — horizontal desktop, vertical mobile */}
        <div
          className="grid grid-cols-1 sm:grid-cols-5"
          style={{ gap: "0", alignItems: "start" }}
        >
          {STEPS.map((step, i) => (
            <div key={step.number} style={{ display: "flex", alignItems: "stretch" }}>
              {/* Step card */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: "#FAFAFF",
                  border: "1px solid rgba(109, 94, 243, 0.12)",
                  borderRadius: "16px",
                  padding: "24px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  margin: "0 6px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "22px" }}>{step.emoji}</span>
                  <span
                    style={{
                      color: "#C4B5FD",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {step.number}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    color: "#0F172A",
                    fontWeight: 700,
                    fontSize: "15px",
                    lineHeight: "1.3",
                  }}
                >
                  {step.title}
                </p>
                <p
                  style={{
                    margin: 0,
                    color: "#64748B",
                    fontSize: "13px",
                    lineHeight: "1.65",
                  }}
                >
                  {step.body}
                </p>
              </div>

              {/* Connector arrow — hidden on last item */}
              {i < STEPS.length - 1 && (
                <div
                  className="hidden sm:flex"
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#C4B5FD",
                    fontSize: "20px",
                    flexShrink: 0,
                    width: "0",
                    overflow: "visible",
                    zIndex: 1,
                    position: "relative",
                  }}
                >
                  <span style={{ position: "absolute", left: "-8px" }}>→</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p
          style={{
            textAlign: "center",
            color: "#94A3B8",
            fontSize: "14px",
            marginTop: "36px",
            marginBottom: 0,
          }}
        >
          Or skip the review entirely — schedule auto-publish and Korel handles everything.
        </p>
      </div>
    </section>
  );
}
