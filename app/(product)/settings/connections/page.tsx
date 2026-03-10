import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ConnectionsClient from "./ConnectionsClient";

export default async function ConnectionsPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) redirect("/signin");

  const accounts = await prisma.connectedAccount.findMany({
    where: { userId: session.user.id, isActive: true },
    select: {
      platform: true,
      platformUsername: true,
      connectedAt: true,
      tokenExpiresAt: true,
    },
  });

  const linkedin = accounts.find((a) => a.platform === "linkedin") ?? null;
  const x = accounts.find((a) => a.platform === "x") ?? null;

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-[640px] mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111]">
            Connected Accounts
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Connect your social accounts to publish Authority Packs directly.
          </p>
        </div>

        <ConnectionsClient
          linkedin={
            linkedin
              ? {
                  username: linkedin.platformUsername ?? null,
                  connectedAt: linkedin.connectedAt.toISOString(),
                  expiresAt: linkedin.tokenExpiresAt?.toISOString() ?? null,
                }
              : null
          }
          x={
            x
              ? {
                  username: x.platformUsername ?? null,
                  connectedAt: x.connectedAt.toISOString(),
                  expiresAt: x.tokenExpiresAt?.toISOString() ?? null,
                }
              : null
          }
        />

        <section className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100">
            <h2 className="text-sm font-semibold text-neutral-900">Newsletter</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Coming soon</p>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-700">Beehiiv</p>
                <p className="text-xs text-neutral-400">Publish newsletter sections directly</p>
              </div>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-400">
                Coming soon
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-700">Substack</p>
                <p className="text-xs text-neutral-400">Publish newsletter sections directly</p>
              </div>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-400">
                Coming soon
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
