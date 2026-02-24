"use client";

import { useEffect, useRef, useState } from "react";
import { X, Check } from "lucide-react";

const BEFORE_BULLETS = [
  "No defined thesis before writing",
  "Claims vary across platforms",
  "Evidence is inconsistent",
  "Objections remain unaddressed",
  "Messaging drifts over time",
  "Output depends on prompt quality",
] as const;

const AFTER_BULLETS = [
  "Core thesis defined before generation",
  "Strategic claims organized and supported",
  "Objections handled within structure",
  "Platform assets inherit positioning",
  "Messaging strength evaluated deterministically",
  "Authority consistency tracked over time",
] as const;

export function Transformation() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

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
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="px-6"
      style={{ paddingTop: '104px', paddingBottom: '104px', backgroundColor: '#F6F7FB' }}
    >
      <div className="mx-auto" style={{ maxWidth: '1100px' }}>

        {/* Header */}
        <div
          className="text-center"
          style={{
            marginBottom: '52px',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}
        >
          <h2
            style={{
              color: '#1F2937',
              fontWeight: 700,
              fontSize: '38px',
              marginBottom: '12px',
              letterSpacing: '-0.02em',
              lineHeight: '1.15',
            }}
          >
            Before vs After
          </h2>
          <p style={{ color: '#64748B', fontSize: '17px', fontWeight: 400, lineHeight: '1.6', margin: 0 }}>
            From scattered insights to structured authority.
          </p>
        </div>

        {/* Two panels */}
        <div
          className="grid grid-cols-1 md:grid-cols-2"
          style={{ gap: '24px', marginBottom: '40px' }}
        >
          {/* BEFORE */}
          <div
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateX(0)' : 'translateX(-28px)',
              transition: 'opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s',
            }}
          >
            <div
              style={{
                backgroundColor: '#F7F8FA',
                borderRadius: '20px',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                padding: '40px',
                height: '100%',
                filter: 'saturate(0.8)',
              }}
            >
              <div style={{ marginBottom: '24px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(239, 68, 68, 0.07)',
                    color: '#EF4444',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '5px 13px',
                    borderRadius: '100px',
                    border: '1px solid rgba(239, 68, 68, 0.14)',
                  }}
                >
                  <X size={12} strokeWidth={2.5} />
                  Before
                </span>
              </div>

              <h3
                style={{
                  color: '#374151',
                  fontWeight: 700,
                  fontSize: '22px',
                  marginBottom: '8px',
                  letterSpacing: '-0.01em',
                  lineHeight: '1.2',
                }}
              >
                Unstructured Repurposing
              </h3>
              <p
                style={{
                  color: '#94A3B8',
                  fontSize: '14px',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  lineHeight: '1.6',
                  marginBottom: '28px',
                }}
              >
                Raw insights turned into isolated posts.
              </p>

              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '11px',
                }}
              >
                {BEFORE_BULLETS.map((item) => (
                  <li
                    key={item}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      color: '#94A3B8',
                      fontSize: '14px',
                      lineHeight: '1.55',
                    }}
                  >
                    <span
                      style={{
                        color: '#CBD5E1',
                        flexShrink: 0,
                        marginTop: '2px',
                        lineHeight: 1,
                      }}
                    >
                      —
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* AFTER */}
          <div
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateX(0)' : 'translateX(28px)',
              transition: 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s',
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid rgba(99, 102, 241, 0.18)',
                padding: '40px',
                height: '100%',
                boxShadow: '0 4px 32px rgba(99, 102, 241, 0.1), 0 1px 4px rgba(99, 102, 241, 0.06)',
              }}
            >
              <div style={{ marginBottom: '24px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #6D5EF3 0%, #8B7CFF 100%)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '5px 13px',
                    borderRadius: '100px',
                    boxShadow: '0 3px 10px rgba(109, 94, 243, 0.25)',
                  }}
                >
                  <Check size={12} strokeWidth={2.5} />
                  After
                </span>
              </div>

              <h3
                style={{
                  color: '#0F172A',
                  fontWeight: 700,
                  fontSize: '22px',
                  marginBottom: '8px',
                  letterSpacing: '-0.01em',
                  lineHeight: '1.2',
                }}
              >
                Structured Authority System
              </h3>
              <p
                style={{
                  color: '#6366F1',
                  fontSize: '14px',
                  fontWeight: 400,
                  lineHeight: '1.6',
                  marginBottom: '28px',
                }}
              >
                Every asset inherits the same strategic logic.
              </p>

              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '11px',
                }}
              >
                {AFTER_BULLETS.map((item) => (
                  <li
                    key={item}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      color: '#374151',
                      fontSize: '14px',
                      lineHeight: '1.55',
                    }}
                  >
                    <span
                      style={{
                        color: '#9B7FFF',
                        flexShrink: 0,
                        marginTop: '2px',
                        fontWeight: 700,
                        lineHeight: 1,
                      }}
                    >
                      &bull;
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* CTA block */}
        <div
          className="text-center"
          style={{
            paddingTop: '48px',
            borderTop: '1px solid rgba(0, 0, 0, 0.06)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease 0.35s, transform 0.6s ease 0.35s',
          }}
        >
          <p
            style={{
              color: '#1F2937',
              fontWeight: 600,
              fontSize: '20px',
              letterSpacing: '-0.01em',
              lineHeight: '1.45',
              maxWidth: '440px',
              margin: '0 auto 28px',
            }}
          >
            Authority compounds when structure remains consistent.
          </p>
          <a
            href="/new"
            style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #6D5EF3 0%, #8B7CFF 100%)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '16px',
              height: '52px',
              lineHeight: '52px',
              paddingLeft: '32px',
              paddingRight: '32px',
              borderRadius: '12px',
              textDecoration: 'none',
              boxShadow: '0 6px 20px rgba(109, 94, 243, 0.2)',
            }}
          >
            Create Your Authority Pack
          </a>
        </div>

      </div>
    </section>
  );
}
