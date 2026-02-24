"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "What inputs can I use?",
    a: "You can paste a YouTube transcript, interview transcript, investor update, product update, strategy memo, or customer story. Any long-form founder-sourced text works. Select the appropriate Input Type when creating your pack so the extraction is biased correctly.",
  },
  {
    q: "Does Korel auto-post to LinkedIn or X?",
    a: "No. Korel generates structured, ready-to-copy assets — LinkedIn posts, X threads, and newsletters. You review and publish them yourself. This is intentional: your authority should be published with your judgment, not automated.",
  },
  {
    q: "Can I edit the outputs?",
    a: "Yes. All generated content is plain text you can copy and adapt. There is no lock-in. The goal is to give you a structured starting point that reflects your actual positioning, not to replace your editorial judgment.",
  },
  {
    q: "Is the generation deterministic?",
    a: "The structure is deterministic: the Strategic Authority Map (SAM), scoring rules, and evaluation signals are computed from fixed logic. The language generation (LinkedIn posts, threads, newsletters) is AI-assisted and will vary slightly between runs — but it always compiles from the same SAM.",
  },
  {
    q: "How are quality scores computed?",
    a: "Scores are rule-based: they check for thesis presence, evidence depth, objection coverage, hook count, and cross-pack consistency. They are not AI opinions — they are derived from the SAM structure. See the docs for the full breakdown.",
  },
  {
    q: "When are paid plans available?",
    a: "Paid plans (Starter, Professional, Enterprise) are coming soon. You can join the waitlist now and you will be notified when enrollment opens. Free accounts get 3 packs.",
  },
  {
    q: "How is my data handled?",
    a: "Your packs and inputs are stored in your account and are not shared publicly. Packs are private by default. You can publish a pack if you choose, but nothing is made public automatically.",
  },
  {
    q: "Can teams use Korel?",
    a: "Multi-user team accounts are planned for the Enterprise tier. If you are evaluating Korel for a team, join the Enterprise waitlist and we will reach out during the onboarding cohort.",
  },
] as const;

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section
      className="px-6"
      style={{
        paddingTop: "96px",
        paddingBottom: "96px",
        backgroundColor: "#ffffff",
      }}
    >
      <div className="mx-auto" style={{ maxWidth: "760px" }}>
        {/* Header */}
        <div style={{ marginBottom: "48px", textAlign: "center" }}>
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
            FAQ
          </span>
          <h2
            style={{
              color: "#0F172A",
              fontWeight: 700,
              fontSize: "36px",
              lineHeight: "1.2",
              letterSpacing: "-0.02em",
            }}
          >
            Common questions
          </h2>
        </div>

        {/* Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div
                key={faq.q}
                style={{
                  borderRadius: "12px",
                  border: "1px solid",
                  borderColor: isOpen ? "rgba(109, 94, 243, 0.2)" : "rgba(0, 0, 0, 0.06)",
                  backgroundColor: isOpen ? "rgba(109, 94, 243, 0.03)" : "#ffffff",
                  overflow: "hidden",
                  transition: "border-color 0.15s ease, background-color 0.15s ease",
                  marginBottom: "8px",
                }}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    padding: "20px 24px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      color: "#0F172A",
                      fontWeight: 600,
                      fontSize: "15px",
                      lineHeight: "1.4",
                    }}
                  >
                    {faq.q}
                  </span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    style={{
                      flexShrink: 0,
                      color: "#6D5EF3",
                      transition: "transform 0.2s ease",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    <path
                      d="M4.5 6.75L9 11.25L13.5 6.75"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                {isOpen && (
                  <div style={{ padding: "0 24px 20px" }}>
                    <p
                      style={{
                        color: "#64748B",
                        fontSize: "15px",
                        lineHeight: "1.7",
                        margin: 0,
                      }}
                    >
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
