"use client";

const POINTS = [
  {
    topic: "Structure first",
    chatgpt: "You write a prompt. It writes text. Generic content that sounds like everyone else.",
    korel: "Korel builds an Authority Map — thesis, claims, evidence — then generates from that structure.",
  },
  {
    topic: "One source, every platform",
    chatgpt: "Three separate prompts for LinkedIn, X, and email. Three different tones. Three versions of you.",
    korel: "One authority map compiles everything. Identical positioning across every platform. Zero drift.",
  },
  {
    topic: "Agent, not a chat window",
    chatgpt: "ChatGPT waits for you to open it. You do all the work. It just writes what you ask.",
    korel: "Korel monitors your feeds, detects new content, generates and publishes — without you lifting a finger.",
  },
];

export function WhyNotChatGPT() {
  return (
    <section
      className="px-6"
      style={{
        paddingTop: "120px",
        paddingBottom: "128px",
        background: "linear-gradient(160deg, #1A0B3B 0%, #0F0826 40%, #150D35 70%, #1A0B3B 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top glow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "1200px",
          height: "500px",
          pointerEvents: "none",
          background: "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.28) 0%, transparent 60%)",
        }}
      />

      <div className="mx-auto" style={{ maxWidth: "1000px", position: "relative" }}>

        {/* Header */}
        <div className="text-center" style={{ marginBottom: "64px" }}>
          <span
            style={{
              display: "inline-block",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "#A78BFA",
              marginBottom: "24px",
              background: "rgba(167,139,250,0.12)",
              padding: "6px 16px",
              borderRadius: "20px",
              border: "1px solid rgba(167,139,250,0.22)",
            }}
          >
            Why not ChatGPT?
          </span>
          <h2
            style={{
              color: "#F8FAFC",
              fontWeight: 800,
              fontSize: "clamp(30px, 3.6vw, 50px)",
              lineHeight: "1.12",
              letterSpacing: "-0.03em",
              marginBottom: "16px",
            }}
          >
            Chat tools write text.{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #A78BFA 0%, #DDD6FE 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Korel runs a system.
            </span>
          </h2>
          <p style={{ color: "#7C85A2", fontSize: "17px", lineHeight: "1.6", margin: "0 auto", maxWidth: "360px" }}>
            The difference is not speed. It is architecture.
          </p>
        </div>

        {/* Unified comparison card */}
        <div
          style={{
            border: "1px solid rgba(139,92,246,0.28)",
            borderRadius: "28px",
            overflow: "hidden",
            boxShadow: "0 40px 100px rgba(109,94,243,0.20), 0 0 0 1px rgba(109,94,243,0.08)",
          }}
        >
          {/* ── Column headers ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1px 1fr",
            }}
          >
            {/* ChatGPT header */}
            <div
              style={{
                padding: "28px 40px",
                background: "rgba(15,8,38,0.80)",
                display: "flex",
                alignItems: "center",
                gap: "14px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "13px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  flexShrink: 0,
                }}
              >
                💬
              </div>
              <div>
                <p style={{ margin: 0, color: "#94A3B8", fontWeight: 800, fontSize: "20px", letterSpacing: "-0.01em" }}>
                  ChatGPT
                </p>
                <p style={{ margin: 0, color: "#475569", fontSize: "12.5px", marginTop: "2px" }}>
                  Chat window · manual · no memory
                </p>
              </div>
            </div>

            {/* Center divider */}
            <div style={{ background: "rgba(139,92,246,0.22)" }} />

            {/* Korel header */}
            <div
              style={{
                padding: "28px 40px",
                background: "rgba(109,94,243,0.12)",
                display: "flex",
                alignItems: "center",
                gap: "14px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "13px",
                  background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 6px 20px rgba(109,94,243,0.55)",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 11a9 9 0 0 1 9 9" />
                  <path d="M4 4a16 16 0 0 1 16 16" />
                  <circle cx="5" cy="19" r="1" fill="white" stroke="none" />
                </svg>
              </div>
              <div>
                <p style={{ margin: 0, color: "#E2E8F0", fontWeight: 800, fontSize: "20px", letterSpacing: "-0.01em" }}>
                  Korel
                </p>
                <p style={{ margin: 0, color: "#A78BFA", fontSize: "12.5px", marginTop: "2px" }}>
                  Autonomous agent · structured · always on
                </p>
              </div>
            </div>
          </div>

          {/* ── Divider after header ── */}
          <div style={{ height: "1px", background: "rgba(139,92,246,0.22)" }} />

          {/* ── Comparison rows ── */}
          {POINTS.map((pt, i) => (
            <div key={pt.topic}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1px 1fr",
                }}
              >
                {/* ChatGPT cell */}
                <div
                  style={{
                    padding: "32px 40px",
                    background: i % 2 === 0 ? "rgba(15,8,38,0.80)" : "rgba(12,6,30,0.80)",
                    display: "flex",
                    gap: "16px",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: "rgba(239,68,68,0.12)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "3px",
                    }}
                  >
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M2 2L6 6M6 2L2 6" stroke="#F87171" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <p style={{ margin: "0 0 8px", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "#374151" }}>
                      {pt.topic}
                    </p>
                    <p style={{ margin: 0, color: "#94A3B8", fontSize: "15.5px", lineHeight: "1.72" }}>
                      {pt.chatgpt}
                    </p>
                  </div>
                </div>

                {/* Center divider */}
                <div style={{ background: "rgba(139,92,246,0.22)" }} />

                {/* Korel cell */}
                <div
                  style={{
                    padding: "32px 40px",
                    background: i % 2 === 0 ? "rgba(109,94,243,0.10)" : "rgba(109,94,243,0.07)",
                    display: "flex",
                    gap: "16px",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: "rgba(109,94,243,0.28)",
                      border: "1px solid rgba(167,139,250,0.50)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "3px",
                      boxShadow: "0 0 10px rgba(109,94,243,0.30)",
                    }}
                  >
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path d="M1.5 4.5L3.7 6.7L7.5 2.2" stroke="#C4B5FD" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <p style={{ margin: "0 0 8px", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "#7C6EF3" }}>
                      {pt.topic}
                    </p>
                    <p style={{ margin: 0, color: "#DDD6FE", fontSize: "15.5px", lineHeight: "1.72" }}>
                      {pt.korel}
                    </p>
                  </div>
                </div>
              </div>

              {/* Row divider */}
              {i < POINTS.length - 1 && (
                <div style={{ height: "1px", background: "rgba(139,92,246,0.14)" }} />
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: "56px", textAlign: "center" }}>
          <a
            href="/new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #9333EA 100%)",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "16px",
              height: "52px",
              padding: "0 36px",
              borderRadius: "13px",
              textDecoration: "none",
              boxShadow: "0 8px 32px rgba(109,94,243,0.50)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 16px 48px rgba(109,94,243,0.65)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 8px 32px rgba(109,94,243,0.50)";
            }}
          >
            Start Free →
          </a>
          <p style={{ marginTop: "12px", color: "#4B5563", fontSize: "13px" }}>
            No credit card required. Free plan available.
          </p>
        </div>

      </div>
    </section>
  );
}
