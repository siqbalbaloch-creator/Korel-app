import DocsShell from "../components/docs-shell";
import DocsCTA from "../components/docs-cta";

const USE_CASES = [
  {
    title: "Founder interview → Authority Pack",
    inputType: "INTERVIEW",
    angle: "THOUGHT_LEADERSHIP",
  },
  {
    title: "Investor update → Distribution Pack",
    inputType: "INVESTOR_UPDATE",
    angle: "EXECUTION_FOCUSED",
  },
  {
    title: "Product update → Positioning Pack",
    inputType: "PRODUCT_UPDATE",
    angle: "TACTICAL",
  },
  {
    title: "Strategy memo → Thought leadership series",
    inputType: "STRATEGY_MEMO",
    angle: "VISIONARY",
  },
  {
    title: "Customer story → Case-study narrative",
    inputType: "CUSTOMER_STORY",
    angle: "STORY_DRIVEN",
  },
  {
    title: "Internal ops recap → Execution credibility",
    inputType: "PRODUCT_UPDATE",
    angle: "EXECUTION_FOCUSED",
  },
];

export default function UseCasesPage() {
  return (
    <DocsShell current="use-cases">
      <section className="space-y-3">
        <a href="/docs" className="text-xs text-neutral-400 hover:text-neutral-600">
          Back to Docs
        </a>
        <h1 className="text-2xl font-semibold text-neutral-900">Use Cases</h1>
        <p className="text-sm text-neutral-600 leading-relaxed">
          Each use case is matched with a recommended Input Type and Angle so the Strategic
          Authority Map aligns with the intended outcome.
        </p>
      </section>

      <section className="space-y-3">
        {USE_CASES.map((useCase) => (
          <div
            key={useCase.title}
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-semibold text-neutral-900">{useCase.title}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-500">
              <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1">
                Input Type: {useCase.inputType}
              </span>
              <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1">
                Angle: {useCase.angle}
              </span>
            </div>
          </div>
        ))}
      </section>

      <DocsCTA />
    </DocsShell>
  );
}
