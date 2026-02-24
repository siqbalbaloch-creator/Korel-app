import DocsShell from "./components/docs-shell";
import DocsCTA from "./components/docs-cta";

const DOC_CARDS = [
  {
    title: "How Korel Works",
    description: "The deterministic pipeline from input to Strategic Authority Map.",
    href: "/docs/how-it-works",
  },
  {
    title: "Why Korel",
    description: "What makes an Authority Engine defensible and repeatable.",
    href: "/docs/why-korel",
  },
  {
    title: "Use Cases",
    description: "Founder, investor, and operator workflows with recommended angles.",
    href: "/docs/use-cases",
  },
  {
    title: "Examples",
    description: "Mini packs showing SAM excerpts and platform-ready assets.",
    href: "/docs/examples",
  },
  {
    title: "FAQ",
    description: "Short answers to common questions about inputs and scoring.",
    href: "/docs/faq",
  },
];

export default function DocsIndexPage() {
  return (
    <DocsShell current="overview">
      <section className="space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
          Documentation
        </p>
        <h1 className="text-3xl font-semibold text-neutral-900">
          Korel is an Authority Engine, not a repurposer.
        </h1>
        <p className="text-base text-neutral-600 leading-relaxed">
          Korel transforms a transcript or memo into a structured Strategic Authority Map (SAM),
          then compiles platform assets from that map. The system is deterministic, inspectable,
          and designed for founders who want repeatable authority across weeks, not one-off posts.
        </p>
        <div>
          <a
            href="/new"
            className="inline-flex items-center justify-center rounded-lg bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338CA] transition-colors"
          >
            Try Korel
          </a>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {DOC_CARDS.map((card) => (
          <a
            key={card.href}
            href={card.href}
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-sm font-semibold text-neutral-900">{card.title}</p>
            <p className="text-sm text-neutral-500 mt-2">{card.description}</p>
          </a>
        ))}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900">Who Korel is for</h2>
        <p className="text-sm text-neutral-600">
          Founders, operators, and B2B investors who need consistent positioning across interviews,
          updates, and thought leadership. Korel gives you a stable authority backbone to build on.
        </p>
        <p className="text-sm text-neutral-600">
          If your content feels scattered or hard to reproduce, the Strategic Authority Map keeps
          the logic consistent while your narrative evolves.
        </p>
      </section>

      <DocsCTA />
    </DocsShell>
  );
}
