"use client";

import { useEffect, useRef, useState } from "react";
import { LayoutGrid, FileSearch, RefreshCw, CheckCircle2 } from "lucide-react";

const SAM_TREE = [
  { label: "Core Thesis",         level: 0 },
  { label: "3 Strategic Claims",  level: 1 },
  { label: "Evidence per Claim",  level: 2 },
  { label: "Objection Handling",  level: 2 },
  { label: "Hook Matrix",         level: 1 },
] as const;

const PILLARS = [
  { icon: LayoutGrid, title: "Structured Outputs",        sub: "Coherent content architecture"  },
  { icon: FileSearch, title: "Deterministic Evaluation",  sub: "Evidence-based positioning"     },
  { icon: RefreshCw,  title: "Cross-Pack Consistency",    sub: "Unified messaging system"       },
] as const;

const BULLETS = [
  "Every interview becomes a coherent thesis",
  "Claims are supported with structured evidence",
  "Objections are anticipated and addressed",
  "Platform assets inherit the same positioning",
  "Messaging weaknesses are identified and reduced",
  "Authority compounds through consistency",
] as const;

// dot color by indent level
const DOT_COLORS = ["#6366F1", "#8B7FFF", "#A78BFA"] as const;

export function WhatYouGet() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @keyframes sam-breathe {
          0%, 100% {
            box-shadow: 0 0 24px rgba(99, 102, 241, 0.15),
                        inset 0 0 24px rgba(99, 102, 241, 0.03);
          }
          50% {
            box-shadow: 0 0 52px rgba(99, 102, 241, 0.32),
                        inset 0 0 40px rgba(99, 102, 241, 0.07);
          }
        }
      `}</style>

      <section
        ref={sectionRef}
        className="px-6 relative overflow-hidden"
        style={{
          paddingTop: '120px',
          paddingBottom: '120px',
          background: 'linear-gradient(135deg, #090D26 0%, #0F1240 55%, #0C1030 100%)',
        }}
      >
        {/* Radial glow — top left */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-10%',
            left: '-8%',
            width: '620px',
            height: '620px',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.14) 0%, transparent 68%)',
          }}
        />
        {/* Radial glow — bottom right */}
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: '-15%',
            right: '-8%',
            width: '520px',
            height: '520px',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.11) 0%, transparent 65%)',
          }}
        />

        <div className="relative mx-auto" style={{ maxWidth: '1100px' }}>
          <div
            className="grid grid-cols-1 lg:grid-cols-2"
            style={{ gap: '72px', alignItems: 'center' }}
          >

            {/* ── LEFT: SAM card + pillars ── */}
            <div
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateX(0)' : 'translateX(-28px)',
                transition: 'opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s',
              }}
            >
              {/* SAM card */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '16px',
                  border: '1px solid rgba(99, 102, 241, 0.22)',
                  padding: '28px 28px 32px',
                  marginBottom: '16px',
                  backdropFilter: 'blur(8px)',
                  animation: visible ? 'sam-breathe 4s ease-in-out infinite' : undefined,
                }}
              >
                {/* Card header */}
                <div style={{ marginBottom: '24px' }}>
                  <p
                    style={{
                      color: '#F1F5F9',
                      fontSize: '15px',
                      fontWeight: 600,
                      margin: '0 0 3px',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Strategic Authority Map (SAM)
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: '12px', margin: 0 }}>
                    Preview
                  </p>
                </div>

                {/* Tree hierarchy */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {SAM_TREE.map((item, i) => {
                    const hovered = hoveredItem === i;
                    const delay = 0.35 + i * 0.08;
                    return (
                      <div
                        key={item.label}
                        onMouseEnter={() => setHoveredItem(i)}
                        onMouseLeave={() => setHoveredItem(null)}
                        style={{
                          paddingLeft: `${item.level * 24}px`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '11px',
                          cursor: 'default',
                          opacity: visible ? 1 : 0,
                          transform: visible ? 'translateX(0)' : 'translateX(-10px)',
                          transition: `opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`,
                        }}
                      >
                        {/* Dot */}
                        <div
                          style={{
                            width:  item.level === 0 ? '9px' : item.level === 1 ? '7px' : '6px',
                            height: item.level === 0 ? '9px' : item.level === 1 ? '7px' : '6px',
                            borderRadius: '50%',
                            flexShrink: 0,
                            backgroundColor: hovered ? '#ffffff' : DOT_COLORS[item.level],
                            boxShadow: hovered ? `0 0 10px ${DOT_COLORS[item.level]}` : 'none',
                            transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
                          }}
                        />
                        {/* Label */}
                        <span
                          style={{
                            color: hovered
                              ? '#ffffff'
                              : item.level === 0
                              ? '#E2E8F0'
                              : item.level === 1
                              ? '#B8C0D8'
                              : '#8E96B8',
                            fontSize: item.level === 0 ? '14px' : '13px',
                            fontWeight: item.level === 0 ? 500 : 400,
                            lineHeight: '1.4',
                            transition: 'color 0.2s ease',
                          }}
                        >
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pillars strip */}
              <div
                className="grid grid-cols-3"
                style={{
                  gap: '12px',
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(14px)',
                  transition: 'opacity 0.55s ease 0.65s, transform 0.55s ease 0.65s',
                }}
              >
                {PILLARS.map(({ icon: Icon, title, sub }) => (
                  <div
                    key={title}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      borderRadius: '12px',
                      padding: '18px 12px',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '10px',
                        color: 'rgba(255,255,255,0.28)',
                      }}
                    >
                      <Icon size={18} strokeWidth={1.5} />
                    </div>
                    <p
                      style={{
                        color: '#E2E8F0',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        margin: '0 0 3px',
                        lineHeight: '1.3',
                      }}
                    >
                      {title}
                    </p>
                    <p
                      style={{
                        color: 'rgba(255,255,255,0.35)',
                        fontSize: '11px',
                        margin: 0,
                        lineHeight: '1.4',
                      }}
                    >
                      {sub}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT: headline + bullets + CTA ── */}
            <div
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateX(0)' : 'translateX(28px)',
                transition: 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s',
              }}
            >
              <h2
                style={{
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '40px',
                  letterSpacing: '-0.025em',
                  lineHeight: '1.13',
                  marginBottom: '20px',
                }}
              >
                Built for B2B Founders Who Value Strategic Clarity
              </h2>
              <p
                style={{
                  color: 'rgba(255, 255, 255, 0.58)',
                  fontSize: '16px',
                  lineHeight: '1.72',
                  marginBottom: '32px',
                }}
              >
                You already generate insight through interviews, updates, and
                conversations. Korel ensures those insights become structured
                authority — not scattered posts.
              </p>

              {/* Bullets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
                {BULLETS.map((text, i) => (
                  <div
                    key={text}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '11px',
                      opacity: visible ? 1 : 0,
                      transform: visible ? 'translateX(0)' : 'translateX(12px)',
                      transition: `opacity 0.5s ease ${0.42 + i * 0.07}s, transform 0.5s ease ${0.42 + i * 0.07}s`,
                    }}
                  >
                    <CheckCircle2
                      size={17}
                      strokeWidth={2}
                      style={{ color: '#4ADE80', flexShrink: 0, marginTop: '2px' }}
                    />
                    <span
                      style={{
                        color: 'rgba(255, 255, 255, 0.82)',
                        fontSize: '15px',
                        lineHeight: '1.55',
                      }}
                    >
                      {text}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA callout */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.09)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  opacity: visible ? 1 : 0,
                  transition: 'opacity 0.5s ease 0.9s',
                }}
              >
                <p
                  style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '14px',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <span style={{ color: '#6366F1', fontWeight: 700 }}>•</span>
                  Early access — private founder cohort.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
