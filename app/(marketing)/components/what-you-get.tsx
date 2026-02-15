"use client";

import { Linkedin, Twitter, Video, Mail } from 'lucide-react';

export function WhatYouGet() {
  return (
    <section className="px-6" style={{ paddingTop: '152px', paddingBottom: '152px', backgroundColor: '#ffffff' }}>
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
            Your Authority Pack Includes
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
            Platform-optimized content ready to publish
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '28px' }}>
          <Card
            icon={<Linkedin size={20} strokeWidth={1.5} />}
            iconColor="#0A66C2"
            platform="LinkedIn Posts"
            preview="The best authority content comes from insights you already shared.\n\nHere's how to extract and multiply them..."
            benefits={[
              'Structured for authority building',
              'Hook-first format',
              'Optimized for engagement'
            ]}
          />
          <Card
            icon={<Twitter size={20} strokeWidth={1.5} />}
            iconColor="#1DA1F2"
            platform="X Thread"
            preview="1/ Most creators sit on hours of valuable content\n\n2/ But distribution remains manual\n\n3/ KOREL automates extraction"
            benefits={[
              'Numbered sequential format',
              'Core insight extraction',
              'Native thread structure'
            ]}
          />
          <Card
            icon={<Video size={20} strokeWidth={1.5} />}
            iconColor="#FF0050"
            platform="Short Scripts"
            preview='HOOK: "Stop starting from scratch"\n\nSETUP: Your authority is already there\n\nPAYOFF: Extract it instantly'
            benefits={[
              'Platform-ready formats',
              'Hook and payoff structure',
              'TikTok / Reels / Shorts'
            ]}
          />
          <Card
            icon={<Mail size={20} strokeWidth={1.5} />}
            iconColor="#9B7FFF"
            platform="Newsletter"
            preview="Subject: The Authority Multiplier Effect\n\nWhy one great conversation contains a week of content..."
            benefits={[
              'Long-form essay version',
              'Structured narrative',
              'Copy-paste ready'
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function Card({ 
  icon,
  iconColor,
  platform, 
  preview,
  benefits 
}: { 
  icon: React.ReactNode;
  iconColor: string;
  platform: string; 
  preview: string;
  benefits: string[];
}) {
  return (
    <div 
      className="group cursor-pointer"
      style={{ 
        border: '1px solid rgba(0, 0, 0, 0.05)',
        borderRadius: '16px',
        backgroundColor: '#FFFFFF',
        padding: '32px',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.06)',
        height: '100%'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 12px 28px rgba(15, 23, 42, 0.08)';
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = 'rgba(109, 94, 243, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 18px rgba(0, 0, 0, 0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.05)';
      }}
    >
      {/* Icon */}
      <div 
        className="flex items-center justify-center"
        style={{ 
          width: '44px',
          height: '44px',
          borderRadius: '10px',
          backgroundColor: 'rgba(109, 94, 243, 0.08)',
          color: iconColor,
          marginBottom: '18px',
          opacity: 0.8
        }}
      >
        {icon}
      </div>

      {/* Platform name */}
      <h3 
        style={{ 
          color: '#0F172A', 
          fontWeight: 600,
          fontSize: '20px',
          marginBottom: '14px',
          letterSpacing: '0',
          lineHeight: '1.3'
        }}
      >
        {platform}
      </h3>

      {/* Real Content Preview */}
      <div 
        style={{ 
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '18px',
          minHeight: '110px',
          fontFamily: 'monospace'
        }}
      >
        <p 
          style={{ 
            color: '#475569',
            fontSize: '12px',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap',
            margin: 0,
            fontWeight: 400
          }}
        >
          {preview}
        </p>
      </div>

      {/* Benefits */}
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {benefits.map((benefit, index) => (
          <li 
            key={index}
            style={{ 
              color: '#64748B',
              fontSize: '14px',
              lineHeight: '1.6',
              marginBottom: index < benefits.length - 1 ? '8px' : '0',
              paddingLeft: '18px',
              position: 'relative',
              fontWeight: 400
            }}
          >
            <span 
              style={{ 
                position: 'absolute',
                left: '0',
                color: iconColor,
                fontWeight: 700,
                fontSize: '15px'
              }}
            >
              •
            </span>
            {benefit}
          </li>
        ))}
      </ul>
    </div>
  );
}