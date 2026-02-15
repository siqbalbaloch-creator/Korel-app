"use client";

export function Footer() {
  return (
    <footer 
      className="px-6" 
      style={{ 
        borderTop: '1px solid #E2E8F0',
        backgroundColor: '#ffffff',
        paddingTop: '60px', 
        paddingBottom: '60px' 
      }}
    >
      <div className="mx-auto" style={{ maxWidth: '1400px' }}>
        <div className="flex flex-col md:flex-row justify-between items-center" style={{ gap: '32px' }}>
          {/* Logo */}
          <div>
            <h1 
              style={{ 
                color: '#0F172A', 
                fontWeight: 700,
                fontSize: '22px',
                letterSpacing: '-0.01em'
              }}
            >
              KOREL
            </h1>
            <p 
              style={{ 
                color: '#94A3B8',
                fontSize: '14px',
                marginTop: '6px',
                fontWeight: 400
              }}
            >
              Authority Distribution Engine
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center" style={{ gap: '32px' }}>
            <a 
              href="#pricing"
              style={{ 
                color: '#64748B',
                fontSize: '15px',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#0F172A'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#64748B'}
            >
              Pricing
            </a>
            <a 
              href="#how-it-works"
              style={{ 
                color: '#64748B',
                fontSize: '15px',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#0F172A'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#64748B'}
            >
              How It Works
            </a>
            <a 
              href="#privacy"
              style={{ 
                color: '#64748B',
                fontSize: '15px',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#0F172A'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#64748B'}
            >
              Privacy
            </a>
            <a 
              href="#terms"
              style={{ 
                color: '#64748B',
                fontSize: '15px',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#0F172A'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#64748B'}
            >
              Terms
            </a>
            <a 
              href="#contact"
              style={{ 
                color: '#64748B',
                fontSize: '15px',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#0F172A'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#64748B'}
            >
              Contact
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
