const WITHOUT = [
  "Record podcast",
  "Spend 2 hours writing LinkedIn post",
  "Write X thread separately",
  "Write newsletter separately",
  "Copy-paste into each platform",
  "Forget to post because you're busy",
  "Inconsistent posting schedule",
];

const WITH = [
  "Record podcast",
  "Korel detects it automatically",
  "Pack generated while you sleep",
  'Email arrives: "Your pack is ready"',
  "Review on phone in 60 seconds",
  "One tap publishes everywhere",
  "Consistent presence, zero effort",
];

export function BeforeAfter() {
  return (
    <section
      className="px-6"
      style={{
        paddingTop: "104px",
        paddingBottom: "104px",
        backgroundColor: "#F6F7FB",
      }}
    >
      <div className="mx-auto" style={{ maxWidth: "1000px" }}>
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
            The difference
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
            What changes when you use Korel
          </h2>
        </div>

        {/* Two columns */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2"
          style={{ gap: "24px", alignItems: "start" }}
        >
          {/* Without */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              border: "1px solid rgba(0,0,0,0.07)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #F1F5F9", backgroundColor: "#FEF2F2" }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "16px", color: "#991B1B" }}>Without Korel</p>
            </div>
            <div style={{ padding: "24px" }}>
              {WITHOUT.map((item) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    marginBottom: "14px",
                  }}
                >
                  <span style={{ fontSize: "16px", lineHeight: "1.4", flexShrink: 0 }}>❌</span>
                  <span style={{ color: "#64748B", fontSize: "14px", lineHeight: "1.5" }}>{item}</span>
                </div>
              ))}
              <div
                style={{
                  marginTop: "20px",
                  paddingTop: "16px",
                  borderTop: "1px solid #F1F5F9",
                }}
              >
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#DC2626" }}>
                  Total: 3+ hours per episode
                </p>
              </div>
            </div>
          </div>

          {/* With */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              border: "1px solid rgba(109, 94, 243, 0.2)",
              overflow: "hidden",
              boxShadow: "0 4px 24px rgba(109, 94, 243, 0.08)",
            }}
          >
            <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(109,94,243,0.08)", background: "linear-gradient(135deg, #6D5EF3 0%, #8B7CFF 100%)" }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "16px", color: "#ffffff" }}>With Korel</p>
            </div>
            <div style={{ padding: "24px" }}>
              {WITH.map((item) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    marginBottom: "14px",
                  }}
                >
                  <span style={{ fontSize: "16px", lineHeight: "1.4", flexShrink: 0 }}>✅</span>
                  <span style={{ color: "#374151", fontSize: "14px", lineHeight: "1.5" }}>{item}</span>
                </div>
              ))}
              <div
                style={{
                  marginTop: "20px",
                  paddingTop: "16px",
                  borderTop: "1px solid rgba(109,94,243,0.08)",
                }}
              >
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#6D5EF3" }}>
                  Total: 60 seconds per episode
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
