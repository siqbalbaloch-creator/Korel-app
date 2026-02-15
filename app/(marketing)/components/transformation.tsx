"use client";

export function Transformation() {
  return (
    <section 
      className="px-6" 
      style={{ 
        paddingTop: '152px', 
        paddingBottom: '152px',
        backgroundColor: '#ffffff'
      }}
    >
      <div className="mx-auto" style={{ maxWidth: '1100px' }}>
        <div className="text-center" style={{ marginBottom: '64px' }}>
          <h2 
            style={{ 
              color: '#1F2937', 
              fontWeight: 600,
              fontSize: '40px',
              marginBottom: '12px',
              letterSpacing: '-0.01em',
              lineHeight: '1.2'
            }}
          >
            Before vs After
          </h2>
          <p 
            style={{ 
              color: '#6B7280',
              fontSize: '17px',
              fontWeight: 400,
              lineHeight: '1.6',
              maxWidth: '560px',
              margin: '0 auto'
            }}
          >
            From scattered insights to structured authority
          </p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-2" style={{ gap: '0' }}>
          {/* Vertical divider line */}
          <div 
            className="hidden md:block absolute left-1/2 top-0 bottom-0"
            style={{
              width: '1px',
              backgroundColor: 'rgba(0, 0, 0, 0.06)',
              transform: 'translateX(-50%)'
            }}
          />

          {/* Before Panel */}
          <div style={{ padding: '0 32px 0 0' }}>
            <div 
              style={{ 
                backgroundColor: '#FAFAFC',
                borderRadius: '16px',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                padding: '44px',
                position: 'relative',
                overflow: 'hidden',
                filter: 'saturate(0.7)',
                opacity: 0.85,
                minHeight: '460px'
              }}
            >
              <div className="relative">
                <h3 
                  style={{ 
                    color: '#64748B', 
                    fontWeight: 600,
                    fontSize: '22px',
                    marginBottom: '6px',
                    letterSpacing: '0',
                    lineHeight: '1.3'
                  }}
                >
                  Before KOREL
                </h3>
                <p 
                  style={{ 
                    color: '#94A3B8', 
                    fontSize: '15px',
                    marginBottom: '36px',
                    fontStyle: 'italic',
                    fontWeight: 400,
                    lineHeight: '1.6'
                  }}
                >
                  Scattered ideas. Manual distribution.
                </p>

                {/* Messy content representation */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[70, 55, 65, 80, 60].map((width, i) => (
                    <div 
                      key={i}
                      style={{ 
                        backgroundColor: '#ffffff',
                        border: '1px dashed #CBD5E1',
                        borderRadius: '10px',
                        padding: '16px',
                        opacity: 0.6 - (i * 0.08),
                        filter: 'blur(0.4px)'
                      }}
                    >
                      <div style={{ 
                        height: '7px', 
                        backgroundColor: '#E2E8F0', 
                        width: `${width}%`, 
                        marginBottom: '9px', 
                        borderRadius: '4px' 
                      }} />
                      <div style={{ 
                        height: '6px', 
                        backgroundColor: '#F1F5F9', 
                        width: '85%', 
                        marginBottom: '7px', 
                        borderRadius: '4px' 
                      }} />
                      <div style={{ 
                        height: '6px', 
                        backgroundColor: '#F1F5F9', 
                        width: '60%', 
                        borderRadius: '4px' 
                      }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* After Panel */}
          <div style={{ padding: '0 0 0 32px' }}>
            <div 
              style={{ 
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #CBD5E1',
                padding: '44px',
                boxShadow: '0 8px 20px rgba(184, 163, 255, 0.08)',
                position: 'relative',
                minHeight: '460px'
              }}
            >
              <div>
                <h3 
                  style={{ 
                    color: '#0F172A', 
                    fontWeight: 600,
                    fontSize: '22px',
                    marginBottom: '6px',
                    letterSpacing: '0',
                    lineHeight: '1.3'
                  }}
                >
                  After KOREL
                </h3>
                <p 
                  style={{ 
                    fontSize: '15px',
                    marginBottom: '36px',
                    fontWeight: 600,
                    lineHeight: '1.6'
                  }}
                >
                  <span 
                    style={{ 
                      background: 'linear-gradient(135deg, #B8A3FF 0%, #9B7FFF 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    Systemized authority
                  </span>
                  <span style={{ color: '#0F172A' }}>. Automated distribution.</span>
                </p>

                {/* Clean structured weekly layout */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, i) => (
                    <div 
                      key={i}
                      style={{ 
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '10px',
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px'
                      }}
                    >
                      <div 
                        style={{ 
                          color: '#9B7FFF',
                          fontSize: '11px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          minWidth: '75px'
                        }}
                      >
                        {day}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
                        <div style={{ 
                          backgroundColor: '#9B7FFF', 
                          height: '5px', 
                          flex: 1, 
                          borderRadius: '3px',
                          opacity: 0.25
                        }} />
                        <div style={{ 
                          backgroundColor: '#9B7FFF', 
                          height: '5px', 
                          flex: 1, 
                          borderRadius: '3px',
                          opacity: 0.25
                        }} />
                        <div style={{ 
                          backgroundColor: '#9B7FFF', 
                          height: '5px', 
                          flex: 1, 
                          borderRadius: '3px',
                          opacity: 0.25
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}