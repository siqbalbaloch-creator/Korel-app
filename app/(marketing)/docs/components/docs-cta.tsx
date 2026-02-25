import Link from "next/link";

export default function DocsCTA() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-neutral-900">
            Ready to generate your next Authority Pack?
          </p>
          <p className="text-sm text-neutral-500">
            Start with a transcript or talk and let Korel structure the authority engine.
          </p>
          <Link href="/case-studies" className="text-xs text-neutral-400 hover:text-neutral-600">
            View founder case studies
          </Link>
        </div>
        <a
          href="/new"
          className="inline-flex items-center justify-center rounded-lg bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338CA] transition-colors"
        >
          Create a Pack
        </a>
      </div>
    </div>
  );
}
