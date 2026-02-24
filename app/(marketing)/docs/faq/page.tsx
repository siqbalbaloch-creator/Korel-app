import DocsShell from "../components/docs-shell";
import DocsCTA from "../components/docs-cta";

const FAQS = [
  {
    question: "What inputs work best?",
    answer:
      "Clean transcripts, internal memos, and talks with clear decisions or metrics. The stronger the source, the stronger the map.",
  },
  {
    question: "What is an Angle?",
    answer:
      "An Angle is the positioning lens applied to the input. It controls how the Strategic Authority Map is framed.",
  },
  {
    question: "What is the Authority Profile and why does it matter?",
    answer:
      "It stores your core thesis, positioning, audience, and tone so every pack stays aligned over time.",
  },
  {
    question: "What do the scores mean?",
    answer:
      "Messaging Strength measures structural clarity. Authority Consistency checks alignment to your profile and recent packs. Weakness Radar flags recurring gaps.",
  },
  {
    question: "Is anything auto-posted?",
    answer: "No. Korel generates assets, but publishing is always manual.",
  },
  {
    question: "Can I export?",
    answer:
      "You can copy platform-ready outputs and export via your existing workflow. Korel does not auto-publish.",
  },
];

export default function FAQPage() {
  return (
    <DocsShell current="faq">
      <section className="space-y-3">
        <a href="/docs" className="text-xs text-neutral-400 hover:text-neutral-600">
          Back to Docs
        </a>
        <h1 className="text-2xl font-semibold text-neutral-900">FAQ</h1>
        <p className="text-sm text-neutral-600 leading-relaxed">
          Short answers to the most common questions about inputs, angles, and scoring.
        </p>
      </section>

      <section className="space-y-4">
        {FAQS.map((faq) => (
          <div
            key={faq.question}
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-semibold text-neutral-900">{faq.question}</p>
            <p className="text-sm text-neutral-600 mt-2">{faq.answer}</p>
          </div>
        ))}
      </section>

      <DocsCTA />
    </DocsShell>
  );
}
