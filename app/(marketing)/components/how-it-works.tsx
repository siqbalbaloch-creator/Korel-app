import { Layers, Sparkles, Lightbulb, Share2 } from "lucide-react";

const CARDS = [
  {
    icon: Layers,
    title: "Turn Interviews Into Weeks of Content",
    body: "Convert a single podcast or interview into multiple LinkedIn posts, threads, and newsletter ideas.",
    tags: ["Podcast transcripts", "Investor calls", "Strategy memos"],
    highlight: false,
  },
  {
    icon: Sparkles,
    title: "Build Authority Without Writing",
    body: "Your best ideas already exist in conversations. Korel structures them into publish-ready content.",
    tags: ["No copywriting needed", "Publish-ready output", "Your voice, structured"],
    highlight: true,
  },
  {
    icon: Lightbulb,
    title: "Extract Insights From Founder Thinking",
    body: "Korel identifies the core thesis, supporting arguments, and hooks hidden inside transcripts.",
    tags: ["Core thesis", "Strategic hooks", "Audience positioning"],
    highlight: false,
  },
  {
    icon: Share2,
    title: "Structure Content for Distribution",
    body: "Authority content is structured, not improvised. Korel formats your ideas for LinkedIn, X, and newsletters.",
    tags: ["LinkedIn posts", "X threads", "Newsletter drafts"],
    highlight: false,
  },
] as const;

export function WhyFoundersUseKorel() {
  return (
    <section
      id="why-korel"
      className="px-6"
      style={{ paddingTop: "104px", paddingBottom: "104px", backgroundColor: "#ffffff" }}
    >
      <div className="mx-auto" style={{ maxWidth: "1100px" }}>

        {/* Header */}
        <div className="text-center" style={{ marginBottom: "52px" }}>
          <h2
            style={{
              color: "#1F2937",
              fontWeight: 700,
              fontSize: "38px",
              marginBottom: "12px",
              letterSpacing: "-0.02em",
              lineHeight: "1.15",
            }}
          >
            Why Founders Use Korel
          </h2>
          <p
            style={{
              color: "#64748B",
              fontSize: "17px",
              fontWeight: 400,
              lineHeight: "1.6",
              margin: 0,
            }}
          >
            Turn founder thinking into consistent authority content.
          </p>
        </div>

        {/* 4-card grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          style={{ gap: "20px", marginBottom: "64px" }}
        >
          {CARDS.map((card) => (
            <BenefitCard key={card.title} {...card} />
          ))}
        </div>

        {/* Closing CTA */}
        <div
          className="text-center"
          style={{
            paddingTop: "52px",
            borderTop: "1px solid rgba(0, 0, 0, 0.06)",
          }}
        >
          <h3
            style={{
              color: "#1F2937",
              fontWeight: 700,
              fontSize: "32px",
              letterSpacing: "-0.02em",
              lineHeight: "1.2",
              marginBottom: "28px",
            }}
          >
            Authority compounds.
          </h3>
          <a
            href="/new"
            style={{
              display: "inline-block",
              background: "linear-gradient(135deg, #6D5EF3 0%, #8B7CFF 100%)",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "16px",
              height: "52px",
              lineHeight: "52px",
              paddingLeft: "32px",
              paddingRight: "32px",
              borderRadius: "12px",
              textDecoration: "none",
              boxShadow: "0 6px 20px rgba(109, 94, 243, 0.2)",
            }}
          >
            Create Your Authority Pack
          </a>
        </div>

      </div>
    </section>
  );
}

// Keep legacy export so any existing references don't break
export { WhyFoundersUseKorel as HowItWorks };

function BenefitCard({
  icon: Icon,
  title,
  body,
  tags,
  highlight,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
  tags: readonly string[];
  highlight: boolean;
}) {
  return (
    <div
      style={{
        backgroundColor: highlight ? "#FAFAFF" : "#FFFFFF",
        border: highlight
          ? "1px solid rgba(109, 94, 243, 0.22)"
          : "1px solid rgba(0, 0, 0, 0.07)",
        borderRadius: "16px",
        padding: "28px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          backgroundColor: highlight ? "#EEF2FF" : "#F8FAFC",
          border: highlight ? "1px solid #E0E7FF" : "1px solid #F1F5F9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={16} color={highlight ? "#4F46E5" : "#6D5EF3"} strokeWidth={1.75} />
      </div>

      {/* Title + body */}
      <div>
        <h3
          style={{
            color: "#0F172A",
            fontWeight: 600,
            fontSize: "17px",
            lineHeight: "1.3",
            letterSpacing: "-0.01em",
            marginBottom: "8px",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            color: "#64748B",
            fontSize: "14px",
            lineHeight: "1.6",
            margin: 0,
          }}
        >
          {body}
        </p>
      </div>

      {/* Tag pills */}
      <div
        style={{
          paddingTop: "14px",
          borderTop: "1px solid rgba(0, 0, 0, 0.05)",
          display: "flex",
          flexDirection: "column",
          gap: "7px",
          marginTop: "auto",
        }}
      >
        {tags.map((tag) => (
          <div
            key={tag}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#475569",
              fontSize: "13px",
              lineHeight: "1.4",
            }}
          >
            <span style={{ color: "#C4B5FD", fontWeight: 700, flexShrink: 0 }}>&bull;</span>
            {tag}
          </div>
        ))}
      </div>
    </div>
  );
}
