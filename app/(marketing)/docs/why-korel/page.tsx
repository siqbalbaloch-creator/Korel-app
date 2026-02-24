import DocsShell from "../components/docs-shell";
import DocsCTA from "../components/docs-cta";

export default function WhyKorelPage() {
  return (
    <DocsShell current="why-korel">
      <section className="space-y-3">
        <a href="/docs" className="text-xs text-neutral-400 hover:text-neutral-600">
          Back to Docs
        </a>
        <h1 className="text-2xl font-semibold text-neutral-900">Why Korel</h1>
        <p className="text-sm text-neutral-600 leading-relaxed">
          Korel is built for consistent authority. It is not a prompt wrapper and it does not
          simply repurpose content. It structures the logic of your message before anything is published.
        </p>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">Why not ChatGPT or Claude?</h2>
        <ul className="text-sm text-neutral-600 space-y-2">
          <li>No preserved structure across time or packs.</li>
          <li>No workspace memory for positioning or audience context.</li>
          <li>No deterministic evaluation of message quality.</li>
          <li>No reliable iteration trail tied to a stable authority map.</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">What is defensible?</h2>
        <ul className="text-sm text-neutral-600 space-y-2">
          <li>Strategic Authority Map (SAM) as an intermediate representation.</li>
          <li>Authority Consistency scoring to prevent drift over time.</li>
          <li>Messaging Strength to evaluate hooks, claims, and evidence structure.</li>
          <li>Weakness Radar to detect recurring structural gaps across recent packs.</li>
        </ul>
      </section>

      <DocsCTA />
    </DocsShell>
  );
}
