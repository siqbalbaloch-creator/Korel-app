"use client";

import { Check } from 'lucide-react';

export function Pricing() {
  return (
    <section 
      id="pricing"
      className="px-6" 
      style={{ 
        paddingTop: '132px', 
        paddingBottom: '132px',
        backgroundColor: '#ffffff'
      }}
    >
      <div className="mx-auto text-center" style={{ maxWidth: '1100px' }}>
        <div className="text-center" style={{ marginBottom: '56px' }}>
          <h2 
            style={{ 
              color: '#1F2937', 
              fontWeight: 600,
              fontSize: '36px',
              marginBottom: '10px',
              letterSpacing: '-0.01em',
              lineHeight: '1.2'
            }}
          >
            Simple Pricing
          </h2>
          <p 
            style={{ 
              color: '#6B7280',
              fontSize: '16px',
              fontWeight: 400,
              lineHeight: '1.6'
            }}
          >
            Start free. Upgrade when ready.
          </p>
        </div>

        <div className="mx-auto" style={{ maxWidth: '420px' }}>
          {/* Pricing Card */}
          <div 
            style={{ 
              borderRadius: '20px',
              backgroundColor: '#FFFFFF',
              padding: '44px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(0, 0, 0, 0.06)'
            }}
          >
            <div>
              {/* Price */}
              <div style={{ marginBottom: '32px' }}>
                <div className="flex items-baseline justify-center" style={{ gap: '6px', marginBottom: '10px' }}>
                  <span 
                    style={{ 
                      color: '#0F172A', 
                      fontWeight: 700,
                      fontSize: '52px',
                      lineHeight: '1',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    $29
                  </span>
                  <span 
                    style={{ 
                      color: '#64748B',
                      fontSize: '17px',
                      fontWeight: 500
                    }}
                  >
                    / month
                  </span>
                </div>
                <p 
                  style={{ 
                    color: '#64748B',
                    fontSize: '15px',
                    fontWeight: 400,
                    lineHeight: '1.6'
                  }}
                >
                  For serious authority builders.
                </p>
              </div>

              {/* Features */}
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', marginBottom: '32px', textAlign: 'left' }}>
                <Feature text="Unlimited packs" />
                <Feature text="All platform formats" />
                <Feature text="Copy-optimized outputs" />
                <Feature text="Priority support" />
              </ul>

              {/* CTA Button */}
              <button
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #6D5EF3 0%, #8B7CFF 100%)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '15px',
                  height: '48px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(109, 94, 243, 0.15)',
                  transition: 'all 0.2s ease',
                  letterSpacing: '0',
                  marginBottom: '14px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(109, 94, 243, 0.25)';
                  e.currentTarget.style.filter = 'brightness(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(109, 94, 243, 0.15)';
                  e.currentTarget.style.filter = 'brightness(1)';
                }}
              >
                Upgrade to Pro
              </button>

              {/* Value note */}
              <p 
                style={{ 
                  color: '#9B7FFF',
                  fontSize: '13px',
                  fontWeight: 600,
                  margin: 0
                }}
              >
                Costs less than one ghostwriter hour
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <li 
      className="flex items-center" 
      style={{ 
        gap: '10px',
        marginBottom: '12px'
      }}
    >
      <div 
        className="flex items-center justify-center"
        style={{ 
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          backgroundColor: 'rgba(184, 163, 255, 0.12)',
          color: '#9B7FFF',
          flexShrink: 0
        }}
      >
        <Check size={11} strokeWidth={3} />
      </div>
      <span 
        style={{ 
          color: '#0F172A',
          fontSize: '14px',
          lineHeight: '1.6',
          fontWeight: 500
        }}
      >
        {text}
      </span>
    </li>
  );
}