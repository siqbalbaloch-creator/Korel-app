import DocsShell from "../components/docs-shell";
import DocsCTA from "../components/docs-cta";

const EXAMPLES = [
  {
    title: "Example 1: Founder Interview → Thought Leadership",
    sam: {
      thesis: "Great products win when the founder can name the hidden constraint the market ignores.",
      claim: "Strategic clarity beats speed because it prevents expensive pivots.",
      why: "Teams aligned on the real constraint ship fewer features with higher adoption.",
    },
    linkedin:
      "Most launches fail because the team never agrees on the real constraint. Speed only helps once you name the bottleneck. Define the constraint, then ship with purpose.",
    xHook: "Speed is not the edge. Clarity is.",
    xOutline: [
      "Name the constraint you keep avoiding.",
      "Explain the cost of shipping without a shared constraint.",
      "Show how a single constraint aligns roadmap, messaging, and sales.",
    ],
    newsletter: [
      "Intro: the overlooked constraint in early-stage teams",
      "Section: why speed amplifies the wrong roadmap",
      "Takeaway: clarity creates velocity",
    ],
  },
  {
    title: "Example 2: Investor Update → Execution Focused",
    sam: {
      thesis: "Execution credibility is built through measurable progress, not optimism.",
      claim: "Weekly delivery metrics outperform narrative updates in investor trust.",
      why: "Investors back teams that prove reliability and learning velocity.",
    },
    linkedin:
      "Investor trust is earned in the week-to-week metrics, not the quarterly story. Show delivery cadence, learning velocity, and what changed because of it.",
    xHook: "Stop selling progress. Show it.",
    xOutline: [
      "Lead with a delivery metric or cycle time change.",
      "Describe the decision it enabled.",
      "Close with the next measurable milestone.",
    ],
    newsletter: [
      "Intro: the gap between narrative updates and execution proof",
      "Section: metrics that signal reliability",
      "Takeaway: repeatable delivery builds trust",
    ],
  },
];

export default function ExamplesPage() {
  return (
    <DocsShell current="examples">
      <section className="space-y-3">
        <a href="/docs" className="text-xs text-neutral-400 hover:text-neutral-600">
          Back to Docs
        </a>
        <h1 className="text-2xl font-semibold text-neutral-900">Examples</h1>
        <p className="text-sm text-neutral-600 leading-relaxed">
          These mini packs show how a Strategic Authority Map turns into platform assets.
          Each example is intentionally short and structured.
        </p>
      </section>

      <section className="space-y-6">
        {EXAMPLES.map((example) => (
          <div
            key={example.title}
            className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4"
          >
            <h2 className="text-lg font-semibold text-neutral-900">{example.title}</h2>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">SAM Excerpt</p>
              <p className="text-sm text-neutral-700 mt-2">
                <span className="font-semibold text-neutral-900">Thesis:</span> {example.sam.thesis}
              </p>
              <p className="text-sm text-neutral-700 mt-2">
                <span className="font-semibold text-neutral-900">Claim:</span> {example.sam.claim}
              </p>
              <p className="text-sm text-neutral-700 mt-2">
                <span className="font-semibold text-neutral-900">Why it matters:</span> {example.sam.why}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">LinkedIn Post</p>
              <p className="text-sm text-neutral-700">{example.linkedin}</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">X Hook + Outline</p>
              <p className="text-sm font-semibold text-neutral-900">{example.xHook}</p>
              <ul className="text-sm text-neutral-600 space-y-1">
                {example.xOutline.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Newsletter Outline</p>
              <ul className="text-sm text-neutral-600 space-y-1">
                {example.newsletter.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </section>

      <DocsCTA />
    </DocsShell>
  );
}
