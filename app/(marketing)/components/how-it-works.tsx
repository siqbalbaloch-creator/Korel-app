const CARDS = [
  {
    number: '01',
    title: 'Paste a Transcript or Update',
    body: 'Drop in a podcast transcript, founder interview, investor update, or long-form thinking.',
    bullets: ['Interview / podcast transcript', 'Investor update', 'Internal strategy memo', 'Long-form founder thoughts'],
    highlight: false,
  },
  {
    number: '02',
    title: 'Korel Extracts Your Core Ideas',
    body: 'Korel analyzes the transcript and identifies the key ideas that define your authority.',
    bullets: ['Core thesis', 'Supporting arguments', 'Strategic positioning', 'Audience hooks'],
    highlight: true,
  },
  {
    number: '03',
    title: 'Content Is Structured for Platforms',
    body: 'Your ideas are converted into ready-to-publish formats for every channel.',
    bullets: ['LinkedIn posts', 'X threads', 'Newsletter drafts', 'Hook variations'],
    highlight: false,
  },
  {
    number: '04',
    title: 'Publish Authority Content',
    body: 'Edit if needed and publish the content across your channels.',
    bullets: ['LinkedIn', 'X', 'Newsletters', 'Blogs'],
    highlight: false,
  },
] as const;

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="px-6"
      style={{ paddingTop: '104px', paddingBottom: '104px', backgroundColor: '#ffffff' }}
    >
      <div className="mx-auto" style={{ maxWidth: '1100px' }}>

        {/* Header */}
        <div className="text-center" style={{ marginBottom: '52px' }}>
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
            From Transcript to Authority Content
          </h2>
          <p
            style={{
              color: '#64748B',
              fontSize: '17px',
              fontWeight: 400,
              lineHeight: '1.6',
              margin: 0,
            }}
          >
            Four steps from raw thinking to published content — no copywriting required.
          </p>
        </div>

        {/* 4-card grid: 4 col desktop / 2x2 tablet / stacked mobile */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          style={{ gap: '20px', marginBottom: '64px' }}
        >
          {CARDS.map((card) => (
            <SystemCard key={card.number} {...card} />
          ))}
        </div>

        {/* Closing CTA */}
        <div
          className="text-center"
          style={{
            paddingTop: '52px',
            borderTop: '1px solid rgba(0, 0, 0, 0.06)',
          }}
        >
          <h3
            style={{
              color: '#1F2937',
              fontWeight: 700,
              fontSize: '32px',
              letterSpacing: '-0.02em',
              lineHeight: '1.2',
              marginBottom: '28px',
            }}
          >
            Authority compounds.
          </h3>
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

function SystemCard({
  number,
  title,
  body,
  bullets,
  highlight,
}: {
  number: string;
  title: string;
  body: string;
  bullets: readonly string[];
  highlight: boolean;
}) {
  return (
    <div
      style={{
        backgroundColor: highlight ? '#FAFAFF' : '#FFFFFF',
        border: highlight
          ? '1px solid rgba(109, 94, 243, 0.22)'
          : '1px solid rgba(0, 0, 0, 0.07)',
        borderRadius: '16px',
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Number label */}
      <span
        style={{
          color: '#9B7FFF',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {number}
      </span>

      {/* Title + body */}
      <div>
        <h3
          style={{
            color: '#0F172A',
            fontWeight: 600,
            fontSize: '17px',
            lineHeight: '1.3',
            letterSpacing: '-0.01em',
            marginBottom: '8px',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            color: '#64748B',
            fontSize: '14px',
            lineHeight: '1.6',
            margin: 0,
          }}
        >
          {body}
        </p>
      </div>

      {/* Micro bullets */}
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          paddingTop: '14px',
          borderTop: '1px solid rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '7px',
          marginTop: 'auto',
        }}
      >
        {bullets.map((item) => (
          <li
            key={item}
            style={{
              color: '#475569',
              fontSize: '13px',
              lineHeight: '1.4',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ color: '#C4B5FD', fontWeight: 700, flexShrink: 0 }}>&bull;</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
