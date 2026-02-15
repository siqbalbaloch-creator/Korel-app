"use client";

import { Sparkles } from 'lucide-react';

export function Navbar() {
  return (
    <nav 
      className="fixed top-0 left-0 right-0 z-50 px-6" 
      style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.5)'
      }}
    >
      <div 
        className="mx-auto flex items-center justify-between" 
        style={{ 
          maxWidth: '1200px',
          height: '68px'
        }}
      >
        {/* Logo - Premium Wordmark */}
        <div className="flex items-center" style={{ gap: '8px' }}>
          {/* Icon - Rounded Square with Gradient K */}
          <div 
            style={{ 
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6D5EF3 0%, #8B7CFF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '19px',
              letterSpacing: '-0.02em'
            }}
          >
            K
          </div>
          
          {/* Wordmark */}
          <h1 
            style={{ 
              fontSize: '22px',
              fontWeight: 600,
              letterSpacing: '0.5px'
            }}
          >
            <span 
              style={{ 
                background: 'linear-gradient(135deg, #6D5EF3 0%, #8B7CFF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              K
            </span>
            <span style={{ color: '#0F172A' }}>OREL</span>
          </h1>
        </div>

        {/* Navigation Links + Buttons */}
        <div className="flex items-center" style={{ gap: '32px' }}>
          <nav className="hidden md:flex items-center" style={{ gap: '32px' }}>
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
              href="#signin"
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
              Sign In
            </a>
          </nav>

          {/* Blue Start Free Button */}
          <button
            style={{
              background: '#3B82F6',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '14px',
              height: '38px',
              padding: '0 20px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.12)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2563EB';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.18)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#3B82F6';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.12)';
            }}
          >
            Start Free
          </button>
        </div>
      </div>
    </nav>
  );
}