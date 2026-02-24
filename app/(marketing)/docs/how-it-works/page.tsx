import DocsShell from "../components/docs-shell";
import DocsCTA from "../components/docs-cta";

const STEPS = [
  {
    title: "1) Input",
    body: "Provide a transcript, internal memo, or a YouTube talk. The input is the source of truth.",
  },
  {
    title: "2) Context",
    body: "Select an Input Type and Angle, then apply your Authority Profile to steer the lens.",
  },
  {
    title: "3) Extraction",
    body: "Korel builds a Strategic Authority Map (SAM) with thesis, claims, hooks, objections, and proof assets.",
  },
  {
    title: "4) Compilation",
    body: "LinkedIn posts, X threads, and newsletters are generated from the SAM only. No re-interpretation.",
  },
  {
    title: "5) Evaluation",
    body: "Messaging Strength, Authority Consistency, and Weakness Radar measure the structure, not engagement.",
  },
];

export default function HowItWorksPage() {
  return (
    <DocsShell current="how-it-works">
      <section className="space-y-3">
        <a href="/docs" className="text-xs text-neutral-400 hover:text-neutral-600">
          Back to Docs
        </a>
        <h1 className="text-2xl font-semibold text-neutral-900">How Korel Works</h1>
        <p className="text-sm text-neutral-600 leading-relaxed">
          Korel follows a deterministic pipeline. Each step is explicit, inspectable, and repeatable,
          so every asset traces back to a single Strategic Authority Map.
        </p>
      </section>

      <section className="space-y-4">
        {STEPS.map((step) => (
          <div
            key={step.title}
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-semibold text-neutral-900">{step.title}</p>
            <p className="text-sm text-neutral-500 mt-2">{step.body}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900">Using Korel Well</h2>
        <ul className="text-sm text-neutral-600 space-y-2">
          <li>Choose a clean transcript with clear stakes, metrics, or decisions.</li>
          <li>Match the Input Type to the source (Investor Update, Customer Story, Strategy Memo).</li>
          <li>Pick an Angle that matches the goal: execution, contrarian, or story-driven.</li>
          <li>Keep your Authority Profile updated so Korel maintains long-term positioning.</li>
        </ul>
      </section>

      <DocsCTA />
    </DocsShell>
  );
}
