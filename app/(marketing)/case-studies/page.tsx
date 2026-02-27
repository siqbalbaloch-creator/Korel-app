import type { Metadata } from "next";
import CaseStudiesShell from "./components/case-studies-shell";
import { CASE_STUDIES } from "./data";

export const metadata: Metadata = {
  title: "Case Studies — Real Authority Packs in Action",
  description:
    "See how B2B founders use Korel to turn interviews, investor updates, and product launches into structured authority content for LinkedIn, X, and newsletters.",
  alternates: { canonical: "https://www.usekorel.com/case-studies" },
  openGraph: {
    title: "Case Studies — Real Authority Packs in Action | Korel",
    description:
      "See how B2B founders use Korel to turn interviews, investor updates, and product launches into structured authority content for LinkedIn, X, and newsletters.",
    url: "https://www.usekorel.com/case-studies",
  },
};

export default function CaseStudiesIndexPage() {
  return (
    <CaseStudiesShell current="index">
      <section className="space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
          Case Studies
        </p>
        <h1 className="text-3xl font-semibold text-neutral-900">
          Founder stories with structural proof.
        </h1>
        <p className="text-base text-neutral-600 leading-relaxed">
          These case studies show how Korel converts interviews and updates into a Strategic
          Authority Map, then delivers consistent platform assets with measurable structure.
        </p>
      </section>

      <section className="grid gap-4">
        {CASE_STUDIES.map((study) => (
          <a
            key={study.slug}
            href={`/case-studies/${study.slug}`}
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-sm font-semibold text-neutral-900">{study.title}</p>
            <p className="text-sm text-neutral-500 mt-2">{study.summary}</p>
          </a>
        ))}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900">Why these matter</h2>
        <p className="text-sm text-neutral-600">
          Korel is built for repeatable authority, not one-off performance. Each case shows how
          the Strategic Authority Map keeps messaging consistent while allowing new angles.
        </p>
        <a
          href="/new"
          className="inline-flex items-center justify-center rounded-lg bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338CA] transition-colors"
        >
          Create your Authority Pack
        </a>
      </section>
    </CaseStudiesShell>
  );
}
