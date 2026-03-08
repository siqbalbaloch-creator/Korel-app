import { FileSearch, Map, LayoutGrid } from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: FileSearch,
    title: "Extract the Founder Thesis",
    body: "Paste a transcript, interview, investor update, or strategy memo. Korel reads the raw thinking and extracts the core thesis, supporting claims, and strategic hooks.",
    tags: ["Podcast transcripts", "Investor updates", "Strategy memos", "Interview recordings"],
    highlight: false,
  },
  {
    number: "02",
    icon: Map,
    title: "Build a Strategic Authority Map",
    body: "Korel constructs a structured map of your authority: core thesis, three strategic claims, evidence layers, objection handling, and a hook matrix — all from a single source.",
    tags: ["Core thesis", "Strategic claims", "Hook matrix", "Objection handling"],
    highlight: true,
  },
  {
    number: "03",
    icon: LayoutGrid,
    title: "Generate Platform-Ready Assets",
    body: "Every asset — LinkedIn post, X thread, newsletter outline, strategic hooks — is compiled directly from the same authority map. Consistent positioning across every channel.",
    tags: ["LinkedIn posts", "X threads", "Newsletter outlines", "Strategic hooks"],
    highlight: false,
  },
] as const;

export function HowKorelWorks() {
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
            How Korel Works
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
            Three steps from raw founder thinking to published authority content.
          </p>
        </div>

        {/* 3-step grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-3"
          style={{ gap: "20px" }}
        >
          {STEPS.map((step) => (
            <StepCard key={step.number} {...step} />
          ))}
        </div>

      </div>
    </section>
  );
}

function StepCard({
  number,
  icon: Icon,
  title,
  body,
  tags,
  highlight,
}: {
  number: string;
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
        gap: "16px",
      }}
    >
      {/* Step number + icon row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            color: "#9B7FFF",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {number}
        </span>
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
          }}
        >
          <Icon size={16} color={highlight ? "#4F46E5" : "#6D5EF3"} strokeWidth={1.75} />
        </div>
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
            lineHeight: "1.65",
            margin: 0,
          }}
        >
          {body}
        </p>
      </div>

      {/* Tag list */}
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
