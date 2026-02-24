import { notFound } from "next/navigation";
import CaseStudiesShell from "../components/case-studies-shell";
import { CASE_STUDIES, CASE_STUDY_SLUGS } from "../data";

type CaseStudyPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return CASE_STUDY_SLUGS.map((slug) => ({ slug }));
}

export default async function CaseStudyPage({ params }: CaseStudyPageProps) {
  const { slug } = await params;
  const study = CASE_STUDIES.find((item) => item.slug === slug);
  if (!study) return notFound();

  return (
    <CaseStudiesShell current={study.slug}>
      <section className="space-y-3">
        <a
          href="/case-studies"
          className="text-xs text-neutral-400 hover:text-neutral-600"
        >
          Back to Case Studies
        </a>
        <h1 className="text-2xl font-semibold text-neutral-900">{study.title}</h1>
        <p className="text-sm text-neutral-600 leading-relaxed">{study.summary}</p>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900">Context</h2>
        <p className="text-sm text-neutral-600">{study.context.who}</p>
        <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
          <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1">
            Input Type: {study.context.inputType}
          </span>
          <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1">
            Angle: {study.context.angle}
          </span>
        </div>
        <p className="text-sm text-neutral-600">
          Authority Profile: {study.context.profileExcerpt}
        </p>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          Strategic Authority Map (excerpt)
        </h2>
        <div className="space-y-2 text-sm text-neutral-700">
          <p>
            <span className="font-semibold text-neutral-900">Core Thesis:</span>{" "}
            {study.sam.thesis}
          </p>
          <p>
            <span className="font-semibold text-neutral-900">Claim C1:</span>{" "}
            {study.sam.claim}
          </p>
          <p>
            <span className="font-semibold text-neutral-900">Objection:</span>{" "}
            {study.sam.objection}
          </p>
        </div>
        <div className="space-y-1 text-sm text-neutral-600">
          {study.sam.evidence.map((point) => (
            <p key={point}>{point}</p>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">Output Snapshot</h2>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
            LinkedIn Post
          </p>
          <p className="text-sm text-neutral-700">{study.outputs.linkedin}</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
            X Hook + Outline
          </p>
          <p className="text-sm font-semibold text-neutral-900">{study.outputs.xHook}</p>
          <div className="space-y-1 text-sm text-neutral-600">
            {study.outputs.xOutline.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
            Newsletter Intro
          </p>
          <p className="text-sm text-neutral-700">{study.outputs.newsletterIntro}</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-2">
          <h2 className="text-lg font-semibold text-neutral-900">Messaging Strength</h2>
          <p className="text-sm text-neutral-600">
            Hook Strength {study.evaluation.messagingStrength.hookStrength}/20
          </p>
          <p className="text-sm text-neutral-600">
            Claim Robustness {study.evaluation.messagingStrength.claimRobustness}/20
          </p>
          <p className="text-sm text-neutral-600">
            Evidence Depth {study.evaluation.messagingStrength.evidenceDepth}/20
          </p>
          <p className="text-sm text-neutral-600">
            Differentiation {study.evaluation.messagingStrength.differentiationClarity}/20
          </p>
          <p className="text-sm text-neutral-600">
            Objection Coverage {study.evaluation.messagingStrength.objectionCoverage}/20
          </p>
          <p className="text-sm font-semibold text-neutral-900 mt-2">
            Total {study.evaluation.messagingStrength.total}/100
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-2">
          <h2 className="text-lg font-semibold text-neutral-900">Authority Consistency</h2>
          <p className="text-sm text-neutral-600">
            Thesis Alignment {study.evaluation.authorityConsistency.thesisAlignment}/25
          </p>
          <p className="text-sm text-neutral-600">
            Positioning Alignment {study.evaluation.authorityConsistency.positioningAlignment}/25
          </p>
          <p className="text-sm text-neutral-600">
            Tone Match {study.evaluation.authorityConsistency.toneMatch}/20
          </p>
          <p className="text-sm text-neutral-600">
            Theme Coherence {study.evaluation.authorityConsistency.claimThemeCoherence}/20
          </p>
          <p className="text-sm font-semibold text-neutral-900 mt-2">
            Total {study.evaluation.authorityConsistency.total}/100
          </p>
          {study.evaluation.weaknessRadar && study.evaluation.weaknessRadar.length > 0 && (
            <div className="pt-2 space-y-1 text-sm text-neutral-500">
              {study.evaluation.weaknessRadar.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          )}
        </div>
      </section>

      {study.beforeAfter && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold text-neutral-900">Before vs After</h2>
          <p className="text-sm text-neutral-600">
            <span className="font-semibold text-neutral-900">Before:</span>{" "}
            {study.beforeAfter.before}
          </p>
          <p className="text-sm text-neutral-600">
            <span className="font-semibold text-neutral-900">After:</span>{" "}
            {study.beforeAfter.after}
          </p>
        </section>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900">Outcome / Benefit</h2>
        <div className="space-y-1 text-sm text-neutral-600">
          {study.outcome.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              Create your Authority Pack
            </p>
            <p className="text-sm text-neutral-500">
              Start with a transcript or update and build your Strategic Authority Map.
            </p>
          </div>
          <a
            href="/new"
            className="inline-flex items-center justify-center rounded-lg bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338CA] transition-colors"
          >
            Create a Pack
          </a>
        </div>
      </section>
    </CaseStudiesShell>
  );
}
