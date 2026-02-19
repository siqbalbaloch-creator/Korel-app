import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ensureDemoUser } from "@/lib/demo-user";
import DashboardClient from "./dashboard-client";
import PacksList from "./packs-list";

const MAX_FREE_PACKS = 3;

const loadPacks = async () => {
  const user = await ensureDemoUser();
  return prisma.authorityPack.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
};

export default async function DashboardPage() {
  const packs = await loadPacks();
  const generatedCount = packs.length;
  const remainingFreePacks = Math.max(0, MAX_FREE_PACKS - generatedCount);

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <aside className="fixed inset-y-0 left-0 w-[240px] bg-white border-r border-black/5 px-5 py-6">
        <div className="text-lg font-semibold text-[#111]">Korel</div>
        <nav className="mt-8 space-y-1 text-sm text-[rgba(0,0,0,0.6)]">
          <div className="rounded-lg bg-[rgba(79,70,229,0.08)] px-3 py-2 text-[#111] font-semibold">
            Dashboard
          </div>
          <Link
            href="/history"
            className="rounded-lg px-3 py-2 hover:bg-[rgba(79,70,229,0.08)] transition"
          >
            History
          </Link>
          <div className="rounded-lg px-3 py-2 hover:bg-[rgba(79,70,229,0.08)] transition">
            Settings
          </div>
        </nav>
      </aside>

      <main className="pl-[240px]">
        <div className="max-w-[1100px] mx-auto px-6 sm:px-8 pt-4 pb-8 space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#111] mb-2">
              Dashboard
            </h1>
            <p className="text-[rgba(0,0,0,0.6)] text-sm mb-2">
              Your authority distribution control center.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white rounded-[12px] shadow-sm border border-black/5 px-5 py-1.5 transition-all duration-[160ms] ease hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)]">
              <p className="text-xs uppercase tracking-[0.06em] text-[rgba(0,0,0,0.55)]">
                Packs Generated
              </p>
              <p className="text-[34px] font-bold tracking-[-0.5px] text-[#111] mt-0.5">
                {generatedCount}
              </p>
            </div>

            <div className="bg-white rounded-[12px] shadow-sm border border-black/5 px-5 py-1.5 transition-all duration-[160ms] ease hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)]">
              <p className="text-xs uppercase tracking-[0.06em] text-[rgba(0,0,0,0.55)]">
                Remaining Free Packs
              </p>
              <p className="text-[34px] font-bold tracking-[-0.5px] text-[#111] mt-0.5">
                {remainingFreePacks}
              </p>
            </div>

            <div className="bg-white rounded-[12px] shadow-sm border border-black/5 px-5 py-1.5 transition-all duration-[160ms] ease hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)]">
              <p className="text-xs uppercase tracking-[0.06em] text-[rgba(0,0,0,0.55)]">
                Plan
              </p>
              <p className="text-[34px] font-bold tracking-[-0.5px] text-[#111] mt-0.5">
                Free
              </p>
              <p className="text-sm text-[rgba(0,0,0,0.6)] mt-1">
                Includes 3 free packs
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <DashboardClient initialRemainingFreePacks={remainingFreePacks} />
            <PacksList packs={packs} />
          </div>
        </div>
      </main>
    </div>
  );
}
