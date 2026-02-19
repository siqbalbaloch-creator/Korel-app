import Link from "next/link";

type Pack = {
  id: string;
  title: string;
  createdAt: Date;
};

type PacksListProps = {
  packs: Pack[];
};

const formatDate = (value: Date) =>
  value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export default function PacksList({ packs }: PacksListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-[#111]">
          Recent Authority Packs
        </h2>
        <span className="text-sm text-[rgba(0,0,0,0.6)]">
          {packs.length} total
        </span>
      </div>

      <div className="space-y-4">
        {packs.length === 0 && (
          <div className="bg-white rounded-[12px] shadow-sm border border-black/5 p-5 text-sm text-[rgba(0,0,0,0.6)] transition-all duration-[160ms] ease hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)]">
            No packs yet. Generate your first Authority Pack to see it here.
          </div>
        )}

        {packs.map((pack) => (
          <Link
            key={pack.id}
            href={`/history/${pack.id}`}
            className="block bg-white rounded-[12px] border border-black/5 shadow-sm transition-all duration-[160ms] ease hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)]"
          >
            <div className="px-5 py-2.5 text-left flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-[#111]">{pack.title}</h3>
              </div>
              <div className="flex items-center gap-3 text-sm text-[rgba(0,0,0,0.6)]">
                <span className="whitespace-nowrap">
                  {formatDate(pack.createdAt)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
