const DOC_LINKS = [
  { id: "overview", label: "Overview", href: "/docs" },
  { id: "how-it-works", label: "How It Works", href: "/docs/how-it-works" },
  { id: "why-korel", label: "Why Korel", href: "/docs/why-korel" },
  { id: "use-cases", label: "Use Cases", href: "/docs/use-cases" },
  { id: "examples", label: "Examples", href: "/docs/examples" },
  { id: "faq", label: "FAQ", href: "/docs/faq" },
];

type DocsNavProps = {
  current?: string;
};

export default function DocsNav({ current }: DocsNavProps) {
  return (
    <aside className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
          Docs
        </p>
        <p className="text-sm font-semibold text-neutral-900">
          Authority Documentation
        </p>
      </div>
      <nav className="space-y-1">
        {DOC_LINKS.map((link) => {
          const isActive = current === link.id;
          return (
            <a
              key={link.id}
              href={link.href}
              className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-white text-neutral-900 shadow-sm border border-neutral-200"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {link.label}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
