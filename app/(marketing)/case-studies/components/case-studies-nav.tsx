import { CASE_STUDIES } from "../data";

type CaseStudiesNavProps = {
  current?: string;
};

export default function CaseStudiesNav({ current }: CaseStudiesNavProps) {
  return (
    <aside className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
          Case Studies
        </p>
        <p className="text-sm font-semibold text-neutral-900">
          Founder Authority Proof
        </p>
      </div>
      <nav className="space-y-1">
        <a
          href="/case-studies"
          className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
            current === "index"
              ? "bg-white text-neutral-900 shadow-sm border border-neutral-200"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          Overview
        </a>
        {CASE_STUDIES.map((study) => {
          const isActive = current === study.slug;
          return (
            <a
              key={study.slug}
              href={`/case-studies/${study.slug}`}
              className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-white text-neutral-900 shadow-sm border border-neutral-200"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {study.title}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
