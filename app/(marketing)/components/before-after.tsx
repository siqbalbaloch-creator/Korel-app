"use client";

import { Mail, ThumbsUp, MessageSquare, Repeat2, Send, Heart, BarChart2, Mic, CheckCircle } from "lucide-react";

export function BeforeAfter() {
  return (
    <section
      className="px-6"
      style={{
        paddingTop: "112px",
        paddingBottom: "120px",
        background: "#ffffff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Faint radial glow behind source */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 700px 500px at 50% 42%, rgba(109,94,243,0.055) 0%, transparent 70%)" }} />

      <div className="mx-auto" style={{ maxWidth: "1100px", position: "relative" }}>

        {/* Header */}
        <div className="text-center" style={{ marginBottom: "60px" }}>
          <span style={{ display: "inline-block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "#6D5EF3", marginBottom: "18px", background: "rgba(109,94,243,0.09)", padding: "5px 14px", borderRadius: "20px", border: "1px solid rgba(109,94,243,0.18)" }}>
            The output
          </span>
          <h2 style={{ color: "#0F172A", fontWeight: 700, fontSize: "clamp(28px, 3.2vw, 44px)", letterSpacing: "-0.02em", lineHeight: "1.15", marginBottom: "14px" }}>
            One recording. Three platforms. Ready before you wake up.
          </h2>
          <p style={{ color: "#64748B", fontSize: "17px", lineHeight: "1.65", margin: "0 auto", maxWidth: "460px" }}>
            Your agent takes one episode and distributes it everywhere — automatically.
          </p>
        </div>

        {/* ── Source card (centred) ── */}
        <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
          <div
            style={{
              width: "100%",
              maxWidth: "380px",
              borderRadius: "20px",
              background: "linear-gradient(145deg, #1E1B4B 0%, #312E81 60%, #4338CA 100%)",
              padding: "28px 28px 24px",
              boxShadow: "0 16px 56px rgba(79,70,229,0.30), 0 4px 16px rgba(0,0,0,0.12)",
              border: "1px solid rgba(255,255,255,0.10)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Inner glow */}
            <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "180px", height: "180px", borderRadius: "50%", background: "rgba(167,139,250,0.12)", pointerEvents: "none" }} />

            {/* Top: icon + label */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Mic size={18} color="#C4B5FD" strokeWidth={1.75} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#E0E7FF", lineHeight: 1.2 }}>Source</p>
                  <p style={{ margin: 0, fontSize: "11px", color: "rgba(196,181,253,0.7)", lineHeight: 1.2 }}>Podcast / Interview</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "20px", padding: "4px 10px" }}>
                <CheckCircle size={11} color="#4ADE80" strokeWidth={2.5} />
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#4ADE80", letterSpacing: "0.04em" }}>Processed</span>
              </div>
            </div>

            {/* Episode info */}
            <p style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 700, color: "#F0EFFE", letterSpacing: "-0.01em" }}>Episode #247</p>
            <p style={{ margin: "0 0 18px", fontSize: "13px", color: "rgba(196,181,253,0.75)" }}>The Authority Playbook · 42 min 18 s</p>

            {/* Waveform visual */}
            <div style={{ display: "flex", alignItems: "center", gap: "3px", marginBottom: "18px", height: "28px" }}>
              {[14, 22, 10, 26, 18, 8, 24, 16, 28, 12, 20, 26, 10, 22, 18, 14, 26, 8, 20, 16].map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h}px`, borderRadius: "2px", background: i < 14 ? "rgba(167,139,250,0.85)" : "rgba(255,255,255,0.15)" }} />
              ))}
            </div>

            {/* Footer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", color: "rgba(196,181,253,0.6)" }}>Your Podcast Name</span>
              <span style={{ fontSize: "11px", color: "rgba(196,181,253,0.6)" }}>Korel Agent · Just now</span>
            </div>
          </div>
        </div>

        {/* ── Radiating rays SVG ── desktop only */}
        <div className="hidden sm:block" style={{ position: "relative", height: "72px", marginTop: "0" }}>
          <svg width="100%" height="72" viewBox="0 0 1000 72" preserveAspectRatio="none" style={{ overflow: "visible" }}>
            <defs>
              <linearGradient id="rayL" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6D5EF3" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#8B7CFF" stopOpacity="0.15" />
              </linearGradient>
            </defs>
            {/* Source dot */}
            <circle cx="500" cy="2" r="4" fill="#6D5EF3" />
            {/* Three rays */}
            <line x1="500" y1="4" x2="167" y2="70" stroke="url(#rayL)" strokeWidth="1.5" />
            <line x1="500" y1="4" x2="500" y2="70" stroke="url(#rayL)" strokeWidth="1.5" />
            <line x1="500" y1="4" x2="833" y2="70" stroke="url(#rayL)" strokeWidth="1.5" />
            {/* Arrival dots */}
            <circle cx="167" cy="70" r="3" fill="#A78BFA" opacity="0.6" />
            <circle cx="500" cy="70" r="3" fill="#A78BFA" opacity="0.6" />
            <circle cx="833" cy="70" r="3" fill="#A78BFA" opacity="0.6" />
          </svg>
        </div>

        {/* Mobile arrow */}
        <div className="sm:hidden" style={{ textAlign: "center", padding: "20px 0 4px", color: "#A78BFA", fontSize: "22px" }}>↓</div>

        {/* ── Output cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: "18px" }}>

          {/* LinkedIn */}
          <div
            style={{ borderRadius: "18px", background: "#fff", border: "1px solid rgba(10,102,194,0.14)", boxShadow: "0 4px 20px rgba(10,102,194,0.08), 0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden", display: "flex", flexDirection: "column", transition: "transform 0.22s ease, box-shadow 0.22s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = "0 14px 44px rgba(10,102,194,0.15), 0 2px 8px rgba(0,0,0,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(10,102,194,0.08), 0 1px 4px rgba(0,0,0,0.04)"; }}
          >
            <div style={{ height: "3px", background: "linear-gradient(90deg, #0A66C2, #3B9EE0)" }} />
            <div style={{ padding: "14px 16px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <div style={{ width: "19px", height: "19px", background: "#0A66C2", borderRadius: "3px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#fff", fontWeight: 900, fontSize: "11px", fontFamily: "serif" }}>in</span>
                </div>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#0A66C2" }}>LinkedIn Post</span>
              </div>
              <span style={{ fontSize: "9.5px", fontWeight: 700, color: "#6D5EF3", background: "rgba(109,94,243,0.08)", padding: "2px 7px", borderRadius: "8px" }}>✦ Generated</span>
            </div>
            <div style={{ padding: "12px 16px", flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", gap: "9px", alignItems: "center" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg, #4F46E5, #7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "11px", flexShrink: 0 }}>YF</div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "12.5px", color: "#0F172A" }}>Your Full Name</p>
                  <p style={{ margin: 0, fontSize: "10.5px", color: "#94A3B8" }}>B2B Founder · 12,847 followers</p>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: "12.5px", color: "#1a1a1a", lineHeight: 1.65, flex: 1 }}>
                Most founders sit on a goldmine of expert insight — and never mine it. After 200+ interviews, here&apos;s the framework I use to turn every conversation into lasting authority...
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid #F1F5F9" }}>
                <span style={{ fontSize: "10.5px", color: "#94A3B8" }}>👍 38 &nbsp;·&nbsp; 💬 14</span>
                <span style={{ fontSize: "10.5px", color: "#94A3B8" }}>847 reposts</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #F1F5F9", paddingTop: "6px" }}>
                {[{ Icon: ThumbsUp, label: "Like" }, { Icon: MessageSquare, label: "Comment" }, { Icon: Repeat2, label: "Repost" }, { Icon: Send, label: "Send" }].map(({ Icon, label }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: "3px", color: "#94A3B8", fontSize: "11px" }}>
                    <Icon size={13} strokeWidth={1.75} /><span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: "9px 16px", background: "#F8FAFC", borderTop: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10.5px", fontWeight: 600, color: "#16A34A" }}><span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />Ready to publish</span>
              <span style={{ fontSize: "10.5px", color: "#94A3B8" }}>1,240 views</span>
            </div>
          </div>

          {/* X Thread */}
          <div
            style={{ borderRadius: "18px", background: "#fff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden", display: "flex", flexDirection: "column", transition: "transform 0.22s ease, box-shadow 0.22s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = "0 14px 44px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)"; }}
          >
            <div style={{ height: "3px", background: "linear-gradient(90deg, #1a1a1a, #555)" }} />
            <div style={{ padding: "14px 16px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <div style={{ width: "19px", height: "19px", background: "#000", borderRadius: "3px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </div>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#0F172A" }}>X Thread</span>
              </div>
              <span style={{ fontSize: "9.5px", fontWeight: 700, color: "#6D5EF3", background: "rgba(109,94,243,0.08)", padding: "2px 7px", borderRadius: "8px" }}>✦ Generated</span>
            </div>
            <div style={{ padding: "12px 16px", flex: 1, display: "flex", flexDirection: "column", gap: "0" }}>
              <div style={{ display: "flex", gap: "9px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg, #4F46E5, #7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "11px" }}>YF</div>
                  <div style={{ width: "1.5px", flex: 1, background: "#E2E8F0", margin: "5px 0" }} />
                </div>
                <div style={{ flex: 1, paddingBottom: "10px" }}>
                  <div style={{ display: "flex", gap: "5px", marginBottom: "4px", alignItems: "baseline" }}>
                    <span style={{ fontWeight: 700, fontSize: "12.5px", color: "#0F172A" }}>Your Name</span>
                    <span style={{ fontSize: "10.5px", color: "#94A3B8" }}>@handle · 2h</span>
                  </div>
                  <p style={{ margin: "0 0 4px", fontSize: "12.5px", color: "#1E293B", lineHeight: 1.65 }}>
                    I spent 18 months building the wrong thing. Here&apos;s the exact framework I wish I had on day one — and why 90% of B2B founders make this mistake at Series A:
                  </p>
                  <span style={{ fontSize: "10.5px", color: "#94A3B8" }}>1 / 4</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", opacity: 0.5 }}>
                <div style={{ flexShrink: 0, width: "34px", display: "flex", justifyContent: "center" }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#E2E8F0" }} />
                </div>
                <p style={{ margin: 0, fontSize: "11.5px", color: "#64748B", lineHeight: 1.55 }}>The framework has 3 layers: market timing, positioning... <span style={{ color: "#94A3B8" }}>2 / 4</span></p>
              </div>
              <div style={{ display: "flex", gap: "14px", marginTop: "10px", paddingTop: "8px", borderTop: "1px solid #F1F5F9" }}>
                {[{ Icon: MessageSquare, val: "52" }, { Icon: Repeat2, val: "89" }, { Icon: Heart, val: "318" }, { Icon: BarChart2, val: "9.1K" }].map(({ Icon, val }) => (
                  <span key={val} style={{ display: "flex", alignItems: "center", gap: "3px", color: "#94A3B8", fontSize: "11px" }}>
                    <Icon size={12} strokeWidth={1.75} />{val}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ padding: "9px 16px", background: "#F8FAFC", borderTop: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10.5px", fontWeight: 600, color: "#16A34A" }}><span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />Ready to publish</span>
              <span style={{ fontSize: "10.5px", color: "#94A3B8" }}>Thread · 4 posts</span>
            </div>
          </div>

          {/* Newsletter */}
          <div
            style={{ borderRadius: "18px", background: "#fff", border: "1px solid rgba(109,94,243,0.14)", boxShadow: "0 4px 20px rgba(109,94,243,0.08), 0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden", display: "flex", flexDirection: "column", transition: "transform 0.22s ease, box-shadow 0.22s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = "0 14px 44px rgba(109,94,243,0.14), 0 2px 8px rgba(0,0,0,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(109,94,243,0.08), 0 1px 4px rgba(0,0,0,0.04)"; }}
          >
            <div style={{ height: "3px", background: "linear-gradient(90deg, #4F46E5, #7C3AED)" }} />
            <div style={{ padding: "14px 16px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <div style={{ width: "19px", height: "19px", background: "linear-gradient(135deg, #4F46E5, #7C3AED)", borderRadius: "3px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Mail size={10} color="#fff" strokeWidth={2} />
                </div>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#4F46E5" }}>Newsletter</span>
              </div>
              <span style={{ fontSize: "9.5px", fontWeight: 700, color: "#6D5EF3", background: "rgba(109,94,243,0.08)", padding: "2px 7px", borderRadius: "8px" }}>✦ Generated</span>
            </div>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #F1F5F9" }}>
              {[{ label: "From", val: "Your Name <you@domain.com>" }, { label: "To", val: "1,240 subscribers" }, { label: "Subject", val: "The 3× close rate move nobody talks about", bold: true }].map(({ label, val, bold }) => (
                <div key={label} style={{ display: "flex", gap: "6px", marginBottom: "2px" }}>
                  <span style={{ fontSize: "10.5px", color: "#94A3B8", fontWeight: 600, width: "42px", flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: "10.5px", color: bold ? "#0F172A" : "#64748B", fontWeight: bold ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{val}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: "12px 16px", flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
              <p style={{ margin: 0, fontSize: "12.5px", color: "#475569", lineHeight: 1.7 }}>
                <strong>Hey [First Name],</strong><br />
                This week we went deep on pricing pressure and the counterintuitive move that 3× our close rate...
              </p>
              <div style={{ display: "inline-block" }}>
                <div style={{ display: "inline-flex", background: "linear-gradient(135deg, #4F46E5, #7C3AED)", padding: "6px 12px", borderRadius: "7px" }}>
                  <span style={{ color: "#fff", fontSize: "11.5px", fontWeight: 600 }}>Read the full breakdown →</span>
                </div>
              </div>
            </div>
            <div style={{ padding: "9px 16px", background: "#F8FAFC", borderTop: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10.5px", fontWeight: 600, color: "#16A34A" }}><span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />Ready to send</span>
              <span style={{ fontSize: "10.5px", color: "#94A3B8" }}>Issue #31</span>
            </div>
          </div>

        </div>

        {/* Stats strip */}
        <div style={{ marginTop: "56px", display: "flex", justifyContent: "center" }}>
          <div
            className="grid grid-cols-3"
            style={{ maxWidth: "560px", width: "100%", background: "#F8F9FF", borderRadius: "16px", border: "1px solid rgba(109,94,243,0.10)", overflow: "hidden" }}
          >
            <div style={{ padding: "22px 24px", textAlign: "center" as const, borderRight: "1px solid rgba(109,94,243,0.08)" }}>
              <p style={{ margin: "0 0 4px", fontSize: "26px", fontWeight: 800, color: "#DC2626", letterSpacing: "-0.03em", lineHeight: 1 }}>3+ hrs</p>
              <p style={{ margin: 0, fontSize: "11px", color: "#94A3B8", fontWeight: 500 }}>per episode, manually</p>
            </div>
            <div style={{ padding: "22px 12px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(109,94,243,0.03)" }}>
              <div style={{ textAlign: "center" as const }}>
                <p style={{ margin: "0 0 2px", fontSize: "16px", color: "#6D5EF3" }}>→</p>
                <p style={{ margin: 0, fontSize: "9.5px", fontWeight: 800, color: "#6D5EF3", letterSpacing: "0.07em", textTransform: "uppercase" as const }}>With Korel</p>
              </div>
            </div>
            <div style={{ padding: "22px 24px", textAlign: "center" as const, borderLeft: "1px solid rgba(109,94,243,0.08)" }}>
              <p style={{ margin: "0 0 4px", fontSize: "26px", fontWeight: 800, color: "#16A34A", letterSpacing: "-0.03em", lineHeight: 1 }}>60 sec</p>
              <p style={{ margin: 0, fontSize: "11px", color: "#94A3B8", fontWeight: 500 }}>to review &amp; approve</p>
            </div>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: "16px", marginBottom: 0, color: "#94A3B8", fontSize: "13px", fontStyle: "italic" }}>
          Everything else runs automatically — while you sleep.
        </p>

      </div>
    </section>
  );
}
