"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Linkedin, Twitter, Mail, Zap, Sparkles, Loader2, X, ArrowRight, Copy, Check } from "lucide-react";

// ---------------------------------------------------------------------------
// Static demo content
// ---------------------------------------------------------------------------

const SAMPLE_TRANSCRIPT = `Most founders don't have a distribution problem.
They have a thinking problem.

They say interesting things in interviews, investor calls,
and strategy meetings — but none of it becomes content.

The issue isn't ideas.

It's structure.

Every strong authority brand has one core thesis
that every post reinforces.

Without that structure, content becomes noise.`;

const DEMO_CONTENT = {
  linkedin: [
    "Most founders don't have a distribution problem.",
    "",
    "They have a thinking problem.",
    "",
    "Founders say interesting things in interviews, investor calls, and strategy meetings — but none of it becomes content.",
    "",
    "The issue isn't ideas.",
    "",
    "It's structure.",
    "",
    "Every strong authority brand has a core thesis that every post reinforces.",
    "",
    "Without structure, content becomes noise.",
    "",
    "That's exactly why we built Korel.",
  ],
  xthread: [
    { num: "1 / 5", text: "Most founders think they have a distribution problem.\n\nThey don't.\n\nThey have a thinking problem." },
    { num: "2 / 5", text: "Founders say great things in interviews, investor calls, and internal strategy discussions.\n\nBut none of it becomes content." },
    { num: "3 / 5", text: "The problem isn't ideas.\n\nIt's structure." },
    { num: "4 / 5", text: "Strong authority brands repeat one core thesis.\n\nOver and over again." },
    { num: "5 / 5", text: "Without structure, content becomes noise.\n\nThat's exactly why we built Korel." },
  ],
  newsletter: {
    title: "Why Founders Struggle With Content Distribution",
    sections: [
      "The Hidden Thinking Problem",
      "Why Interviews Contain Gold",
      "Turning Insights Into Structured Content",
      "How Authority Brands Repeat Core Ideas",
      "Why Korel Exists",
    ],
  },
  hooks: [
    "Most founders don't have a distribution problem.",
    "Great ideas die inside founder interviews.",
    "Authority isn't about content volume.",
    "The founders with the strongest brands say the same thing — differently.",
    "Structure is what separates signal from noise.",
  ],
};

// Pre-built strings for clipboard copy
const COPY_TEXT = {
  linkedin: DEMO_CONTENT.linkedin.filter((l) => l !== "").join("\n\n"),
  newsletter: `${DEMO_CONTENT.newsletter.title}\n\n${DEMO_CONTENT.newsletter.sections.map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
  hooks: DEMO_CONTENT.hooks.map((h) => `"${h}"`).join("\n"),
};

const GENERATION_STEPS = [
  { label: "Analyzing transcript", icon: "scan" },
  { label: "Extracting core thesis", icon: "brain" },
  { label: "Generating strategic hooks", icon: "zap" },
  { label: "Crafting LinkedIn post", icon: "linkedin" },
  { label: "Building X thread", icon: "twitter" },
  { label: "Outlining newsletter", icon: "mail" },
];

const STEP_DURATION = 320;
const TOTAL_DURATION = GENERATION_STEPS.length * STEP_DURATION;

const DEMO_RUN_KEY = "korel_demo_runs";
const MAX_RUNS = 3;

// Fixed card height — both columns are exactly this tall
const CARD_HEIGHT = 580;

type Tab = "linkedin" | "xthread" | "newsletter" | "hooks";

const TABS: { id: Tab; icon: React.ElementType; label: string }[] = [
  { id: "linkedin", icon: Linkedin, label: "LinkedIn" },
  { id: "xthread", icon: Twitter, label: "X Thread" },
  { id: "newsletter", icon: Mail, label: "Newsletter" },
  { id: "hooks", icon: Zap, label: "Hooks" },
];

// ---------------------------------------------------------------------------
// Paywall modal
// ---------------------------------------------------------------------------

function DemoPaywallModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        backgroundColor: "rgba(15, 23, 42, 0.56)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          padding: "44px 40px 40px",
          maxWidth: "400px",
          width: "100%",
          boxShadow: "0 32px 80px rgba(15, 23, 42, 0.22)",
          position: "relative",
          textAlign: "center",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "18px",
            right: "18px",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "6px",
            color: "#94A3B8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "8px",
          }}
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Icon */}
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "18px",
            background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            boxShadow: "0 8px 24px rgba(79, 70, 229, 0.3)",
          }}
        >
          <Sparkles size={24} color="#ffffff" />
        </div>

        <h2
          style={{
            fontSize: "22px",
            fontWeight: 700,
            color: "#0F172A",
            marginBottom: "10px",
            lineHeight: 1.25,
          }}
        >
          You&apos;ve seen what Korel can do
        </h2>
        <p
          style={{
            fontSize: "15px",
            color: "#64748B",
            lineHeight: 1.65,
            marginBottom: "32px",
          }}
        >
          Create a free account to generate unlimited authority packs from your own transcripts, interviews, and strategy calls.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <Link
            href="/signup"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "15px",
              padding: "14px 24px",
              borderRadius: "12px",
              textDecoration: "none",
              boxShadow: "0 4px 16px rgba(79, 70, 229, 0.32)",
            }}
          >
            Create Free Account
            <ArrowRight size={15} />
          </Link>
          <Link
            href="/signin"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              color: "#475569",
              fontWeight: 500,
              fontSize: "15px",
              padding: "14px 24px",
              borderRadius: "12px",
              textDecoration: "none",
            }}
          >
            Sign In
          </Link>
        </div>

        <p style={{ marginTop: "16px", fontSize: "12px", color: "#94A3B8" }}>
          Free plan includes 3 packs/month. No card needed.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Copy button
// ---------------------------------------------------------------------------

function CopyButton({
  text,
  copyKey,
  copiedKey,
  onCopy,
  size = "md",
}: {
  text: string;
  copyKey: string;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
  size?: "sm" | "md";
}) {
  const copied = copiedKey === copyKey;
  const isSmall = size === "sm";
  const iconSize = isSmall ? 13 : 14;
  const pad = isSmall ? "5px" : "6px";
  return (
    <button
      onClick={() => onCopy(text, copyKey)}
      title={copied ? "Copied!" : "Copy to clipboard"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: pad,
        borderRadius: "7px",
        border: `1px solid ${copied ? "#BBF7D0" : "#E2E8F0"}`,
        backgroundColor: copied ? "#F0FDF4" : "#F8FAFC",
        cursor: "pointer",
        color: copied ? "#16A34A" : "#94A3B8",
        transition: "all 0.15s ease",
        flexShrink: 0,
        lineHeight: 0,
      }}
    >
      {copied ? (
        <Check size={iconSize} strokeWidth={2.5} />
      ) : (
        <Copy size={iconSize} />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Tab bar
// ---------------------------------------------------------------------------

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div
      style={{
        display: "flex",
        borderBottom: "1px solid #F1F5F9",
        padding: "0 4px",
        gap: "0",
      }}
    >
      {TABS.map(({ id, icon: Icon, label }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "12px 14px",
              border: "none",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: isActive ? 600 : 500,
              color: isActive ? "#4F46E5" : "#94A3B8",
              backgroundColor: "transparent",
              borderBottom: isActive ? "2px solid #4F46E5" : "2px solid transparent",
              marginBottom: "-1px",
              transition: "color 0.15s, border-color 0.15s",
              whiteSpace: "nowrap",
              letterSpacing: isActive ? "0.01em" : "0",
            }}
          >
            <Icon size={12} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card chrome (shared header/footer style)
// ---------------------------------------------------------------------------

function CardHeader({
  icon: Icon,
  title,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  badge?: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: "16px 20px",
        borderBottom: "1px solid #F1F5F9",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: "30px",
          height: "30px",
          borderRadius: "9px",
          backgroundColor: "#EEF2FF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={14} color="#4F46E5" />
      </div>
      <span style={{ fontSize: "13px", fontWeight: 600, color: "#0F172A", flex: 1 }}>
        {title}
      </span>
      {badge}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DemoAuthorityPack() {
  const [runsUsed, setRunsUsed] = useState(0);
  const [phase, setPhase] = useState<"idle" | "generating" | "done">("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("linkedin");
  const [showModal, setShowModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [transcriptValue, setTranscriptValue] = useState(SAMPLE_TRANSCRIPT);

  const handleCopy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    });
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DEMO_RUN_KEY);
      if (stored) setRunsUsed(parseInt(stored, 10) || 0);
    } catch {
      // ignore
    }
  }, []);

  const handleGenerate = useCallback(() => {
    if (runsUsed >= MAX_RUNS) {
      setShowModal(true);
      return;
    }

    const newRuns = runsUsed + 1;
    setRunsUsed(newRuns);
    try {
      localStorage.setItem(DEMO_RUN_KEY, String(newRuns));
    } catch {
      // ignore
    }

    setPhase("generating");
    setStepIndex(0);

    GENERATION_STEPS.forEach((_, i) => {
      setTimeout(() => setStepIndex(i), i * STEP_DURATION);
    });

    setTimeout(() => {
      setPhase("done");
      setActiveTab("linkedin");
    }, TOTAL_DURATION + 80);
  }, [runsUsed]);

  const runsLeft = MAX_RUNS - runsUsed;
  const isGenerating = phase === "generating";

  return (
    <>
      {showModal && <DemoPaywallModal onClose={() => setShowModal(false)} />}

      <section
        id="live-demo"
        style={{
          backgroundColor: "#F6F7FB",
          padding: "28px 24px 88px",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

          {/* Two-column grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              alignItems: "stretch",
            }}
          >
            {/* ── LEFT: Transcript panel ── */}
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #E2E8F0",
                borderRadius: "20px",
                boxShadow: "0 4px 24px rgba(15, 23, 42, 0.07)",
                display: "flex",
                flexDirection: "column",
                height: `${CARD_HEIGHT}px`,
                overflow: "hidden",
              }}
            >
              <CardHeader
                icon={Sparkles}
                title="Paste a Transcript"
                badge={
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 500,
                      color: "#94A3B8",
                      backgroundColor: "#F8FAFC",
                      border: "1px solid #F1F5F9",
                      borderRadius: "6px",
                      padding: "3px 8px",
                    }}
                  >
                    Sample loaded
                  </span>
                }
              />

              {/* Load sample button */}
              <div style={{ padding: "10px 20px 0", flexShrink: 0 }}>
                <button
                  onClick={() => setTranscriptValue(SAMPLE_TRANSCRIPT)}
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "#4F46E5",
                    backgroundColor: "#EEF2FF",
                    border: "1px solid #E0E7FF",
                    borderRadius: "7px",
                    padding: "5px 12px",
                    cursor: "pointer",
                    transition: "background-color 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#E0E7FF"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#EEF2FF"; }}
                >
                  Load Sample Transcript
                </button>
              </div>

              {/* Textarea — grows to fill space */}
              <div style={{ flex: 1, padding: "10px 20px 0", display: "flex", flexDirection: "column", minHeight: 0 }}>
                <textarea
                  value={transcriptValue}
                  onChange={(e) => setTranscriptValue(e.target.value)}
                  style={{
                    flex: 1,
                    resize: "none",
                    border: "1px solid #E8EDF5",
                    borderRadius: "12px",
                    padding: "14px 16px",
                    fontSize: "13.5px",
                    lineHeight: 1.75,
                    color: "#334155",
                    backgroundColor: "#FAFBFD",
                    fontFamily: "inherit",
                    outline: "none",
                    width: "100%",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#A5B4FC"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#E8EDF5"; }}
                />
              </div>

              {/* Button area */}
              <div style={{ padding: "16px 20px 20px", flexShrink: 0 }}>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    background: isGenerating
                      ? "linear-gradient(135deg, #A5B4FC 0%, #C4B5FD 100%)"
                      : "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                    color: "#ffffff",
                    fontWeight: 600,
                    fontSize: "14.5px",
                    padding: "14px 24px",
                    borderRadius: "12px",
                    border: "none",
                    cursor: isGenerating ? "not-allowed" : "pointer",
                    boxShadow: isGenerating ? "none" : "0 4px 16px rgba(79, 70, 229, 0.35)",
                    width: "100%",
                    letterSpacing: "0.01em",
                    transition: "opacity 0.2s, box-shadow 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isGenerating) (e.currentTarget as HTMLButtonElement).style.opacity = "0.92";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                  }}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={15} style={{ animation: "korel-spin 0.75s linear infinite" }} />
                      Generating your pack…
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      Generate Authority Pack
                    </>
                  )}
                </button>

                {/* Run counter */}
                <div style={{ marginTop: "10px", minHeight: "18px", textAlign: "center" }}>
                  {runsUsed > 0 && runsLeft > 0 && (
                    <p style={{ fontSize: "12px", color: "#94A3B8", margin: 0 }}>
                      {runsLeft} free {runsLeft === 1 ? "run" : "runs"} remaining
                    </p>
                  )}
                  {runsLeft === 0 && (
                    <p style={{ fontSize: "12px", color: "#94A3B8", margin: 0 }}>
                      Demo limit reached —{" "}
                      <Link href="/signup" style={{ color: "#4F46E5", textDecoration: "none", fontWeight: 600 }}>
                        sign up for unlimited
                      </Link>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── RIGHT: Output panel ── */}
            <div
              style={{
                backgroundColor: "#ffffff",
                border: phase === "done" ? "1px solid #C7D2FE" : "1px solid #E2E8F0",
                borderRadius: "20px",
                boxShadow: phase === "done"
                  ? "0 4px 32px rgba(79, 70, 229, 0.12)"
                  : "0 4px 24px rgba(15, 23, 42, 0.07)",
                display: "flex",
                flexDirection: "column",
                height: `${CARD_HEIGHT}px`,
                overflow: "hidden",
                transition: "border-color 0.4s, box-shadow 0.4s",
              }}
            >
              {/* Gradient top accent when done */}
              {phase === "done" && (
                <div
                  style={{
                    height: "3px",
                    background: "linear-gradient(90deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)",
                    flexShrink: 0,
                  }}
                />
              )}

              <CardHeader
                icon={Zap}
                title="Generated Content Pack"
                badge={
                  phase === "done" ? (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#16A34A",
                        backgroundColor: "#DCFCE7",
                        borderRadius: "6px",
                        padding: "3px 9px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      4 assets ready
                    </span>
                  ) : undefined
                }
              />

              {/* Body */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>

                {/* IDLE */}
                {phase === "idle" && (
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "32px 40px",
                      textAlign: "center",
                    }}
                  >
                    {/* Illustration */}
                    <div style={{ marginBottom: "24px" }}>
                      {/* Central icon */}
                      <div
                        style={{
                          width: "64px",
                          height: "64px",
                          borderRadius: "18px",
                          backgroundColor: "#F1F5F9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 16px",
                        }}
                      >
                        <Zap size={26} color="#CBD5E1" />
                      </div>
                      {/* Platform icon row */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                        {([Linkedin, Twitter, Mail] as React.ElementType[]).map((Icon, i) => (
                          <div
                            key={i}
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "10px",
                              backgroundColor: "#EEF2FF",
                              border: "1px solid #E0E7FF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Icon size={15} color="#4F46E5" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <p style={{ fontSize: "15px", fontWeight: 600, color: "#334155", marginBottom: "8px", margin: "0 0 8px" }}>
                      Your output will appear here
                    </p>
                    <p style={{ fontSize: "13px", color: "#94A3B8", lineHeight: 1.65, margin: 0, maxWidth: "240px" }}>
                      Click generate on the left to transform the transcript into ready-to-publish content.
                    </p>
                  </div>
                )}

                {/* GENERATING */}
                {phase === "generating" && (
                  <div style={{ flex: 1, padding: "24px 24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "20px", margin: "0 0 20px" }}>
                      Generating your pack
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      {GENERATION_STEPS.map((step, i) => {
                        const done = i < stepIndex;
                        const active = i === stepIndex;
                        return (
                          <div
                            key={step.label}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              padding: "9px 12px",
                              borderRadius: "10px",
                              backgroundColor: active ? "#F5F3FF" : "transparent",
                              opacity: (!done && !active) ? 0.4 : 1,
                              transition: "opacity 0.25s ease, background-color 0.25s ease",
                            }}
                          >
                            <div
                              style={{
                                width: "22px",
                                height: "22px",
                                borderRadius: "50%",
                                backgroundColor: done ? "#DCFCE7" : active ? "#EEF2FF" : "#F1F5F9",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                transition: "background-color 0.25s ease",
                              }}
                            >
                              {done ? (
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                  <path d="M2 5L4 7L8 3" stroke="#16A34A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              ) : active ? (
                                <Loader2 size={11} color="#4F46E5" style={{ animation: "korel-spin 0.75s linear infinite" }} />
                              ) : (
                                <div style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#CBD5E1" }} />
                              )}
                            </div>
                            <span
                              style={{
                                fontSize: "13px",
                                fontWeight: active ? 600 : 500,
                                color: done ? "#16A34A" : active ? "#4F46E5" : "#64748B",
                                transition: "color 0.25s ease",
                              }}
                            >
                              {step.label}{active ? "…" : ""}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* DONE */}
                {phase === "done" && (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
                    <TabBar active={activeTab} onChange={setActiveTab} />

                    {/* Copy action bar — shown for all tabs except xthread (which has per-tweet buttons) */}
                    {activeTab !== "xthread" && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          padding: "8px 16px 0",
                          flexShrink: 0,
                        }}
                      >
                        <CopyButton
                          text={
                            activeTab === "linkedin"
                              ? COPY_TEXT.linkedin
                              : activeTab === "newsletter"
                              ? COPY_TEXT.newsletter
                              : COPY_TEXT.hooks
                          }
                          copyKey={activeTab}
                          copiedKey={copiedKey}
                          onCopy={handleCopy}
                        />
                      </div>
                    )}

                    {/* Scrollable content area — fixed height, scrolls internally */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "12px 22px 20px" }}>

                      {activeTab === "linkedin" && (
                        <div style={{ fontSize: "14px", lineHeight: 1.8, color: "#334155" }}>
                          {DEMO_CONTENT.linkedin.map((line, i) =>
                            line === "" ? (
                              <div key={i} style={{ height: "6px" }} />
                            ) : (
                              <p key={i} style={{ margin: 0 }}>{line}</p>
                            )
                          )}
                        </div>
                      )}

                      {activeTab === "xthread" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {DEMO_CONTENT.xthread.map((tweet, idx) => (
                            <div
                              key={tweet.num}
                              style={{
                                padding: "12px 14px",
                                backgroundColor: "#F8FAFC",
                                borderRadius: "12px",
                                border: "1px solid #F1F5F9",
                              }}
                            >
                              {/* Tweet header: num + copy */}
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                                <span
                                  style={{
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    color: "#4F46E5",
                                    letterSpacing: "0.06em",
                                    textTransform: "uppercase",
                                  }}
                                >
                                  {tweet.num}
                                </span>
                                <CopyButton
                                  text={tweet.text}
                                  copyKey={`tweet-${idx}`}
                                  copiedKey={copiedKey}
                                  onCopy={handleCopy}
                                  size="sm"
                                />
                              </div>
                              <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.75, color: "#334155", whiteSpace: "pre-line" }}>
                                {tweet.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {activeTab === "newsletter" && (
                        <div>
                          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94A3B8", margin: "0 0 8px" }}>
                            Subject Line
                          </p>
                          <p style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A", lineHeight: 1.4, margin: "0 0 24px", padding: "14px 16px", backgroundColor: "#F8FAFC", borderRadius: "10px", border: "1px solid #F1F5F9" }}>
                            {DEMO_CONTENT.newsletter.title}
                          </p>
                          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94A3B8", margin: "0 0 10px" }}>
                            Section Outline
                          </p>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {DEMO_CONTENT.newsletter.sections.map((section, i) => (
                              <div
                                key={i}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "12px",
                                  padding: "11px 14px",
                                  backgroundColor: "#F8FAFC",
                                  borderRadius: "10px",
                                  border: "1px solid #F1F5F9",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: "#ffffff",
                                    backgroundColor: "#4F46E5",
                                    borderRadius: "5px",
                                    width: "20px",
                                    height: "20px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                  }}
                                >
                                  {i + 1}
                                </span>
                                <span style={{ fontSize: "13px", color: "#334155", fontWeight: 500 }}>{section}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeTab === "hooks" && (
                        <div>
                          <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.6, margin: "0 0 16px" }}>
                            5 proven opening lines extracted from your transcript.
                          </p>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {DEMO_CONTENT.hooks.map((hook, i) => (
                              <div
                                key={i}
                                style={{
                                  padding: "13px 16px",
                                  backgroundColor: "#F8FAFC",
                                  borderRadius: "10px",
                                  border: "1px solid #F1F5F9",
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "10px",
                                }}
                              >
                                <Zap size={12} color="#4F46E5" style={{ flexShrink: 0, marginTop: "3px" }} />
                                <span style={{ fontSize: "13.5px", lineHeight: 1.65, color: "#1E293B", fontStyle: "italic" }}>
                                  &ldquo;{hook}&rdquo;
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card footer */}
                    <div
                      style={{
                        padding: "11px 20px",
                        borderTop: "1px solid #F1F5F9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexShrink: 0,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <Sparkles size={11} color="#94A3B8" />
                        <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                          Generated from sample transcript
                        </span>
                      </div>
                      <Link
                        href="/signup"
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#4F46E5",
                          textDecoration: "none",
                          display: "flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        Use your own
                        <ArrowRight size={10} />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom CTA strip */}
          <div
            style={{
              marginTop: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            <p style={{ fontSize: "14px", color: "#64748B", margin: 0 }}>
              Ready to run it on your own content?
            </p>
            <Link
              href="/signup"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "14px",
                padding: "11px 22px",
                borderRadius: "10px",
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(79, 70, 229, 0.28)",
              }}
            >
              Start Free
              <ArrowRight size={14} />
            </Link>
            <p style={{ fontSize: "13px", color: "#94A3B8", margin: 0 }}>
              No credit card required
            </p>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes korel-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
