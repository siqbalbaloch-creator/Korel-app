"use client";

import { FileUp, Lightbulb, Package } from 'lucide-react';

export function HowItWorks() {
  return (
    <section 
      id="how-it-works"
      className="px-6" 
      style={{ paddingTop: '152px', paddingBottom: '152px', backgroundColor: '#ffffff' }}
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
            How KOREL Works
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
            Three simple steps to multiply your authority
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '28px' }}>
          <Step 
            number="1"
            icon={<FileUp size={22} strokeWidth={1.5} />}
            title="Paste Transcript"
            description="Upload transcript or YouTube link. No manual formatting required."
          />
          <Step 
            number="2"
            icon={<Lightbulb size={22} strokeWidth={1.5} />}
            title="Extract Core Frameworks"
            description="KOREL identifies your strongest ideas automatically."
          />
          <Step 
            number="3"
            icon={<Package size={22} strokeWidth={1.5} />}
            title="Generate Structured Pack"
            description="Receive a full week of authority-ready content."
          />
        </div>
      </div>
    </section>
  );
}

function Step({ 
  number, 
  icon, 
  title, 
  description 
}: { 
  number: string; 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div 
      style={{ 
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(0, 0, 0, 0.05)',
        borderRadius: '16px',
        padding: '36px',
        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.3s ease',
        height: '100%'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 28px rgba(15, 23, 42, 0.08)';
        e.currentTarget.style.borderColor = 'rgba(109, 94, 243, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 18px rgba(0, 0, 0, 0.06)';
        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.05)';
      }}
    >
      <div 
        className="flex items-center justify-center"
        style={{ 
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: 'rgba(109, 94, 243, 0.08)',
          color: '#6D5EF3',
          marginBottom: '20px',
          opacity: 0.8
        }}
      >
        {icon}
      </div>
      
      <div 
        style={{ 
          color: '#9B7FFF',
          fontWeight: 600,
          fontSize: '11px',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginBottom: '10px'
        }}
      >
        Step {number}
      </div>
      
      <h3 
        style={{ 
          color: '#0F172A', 
          fontWeight: 600,
          fontSize: '20px',
          marginBottom: '10px',
          letterSpacing: '0',
          lineHeight: '1.3'
        }}
      >
        {title}
      </h3>
      
      <p 
        style={{ 
          color: '#64748B',
          fontSize: '15px',
          lineHeight: '1.6',
          fontWeight: 400
        }}
      >
        {description}
      </p>
    </div>
  );
}