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
  const beehiiv = accounts.find((a) => a.platform === "beehiiv") ?? null;

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
          beehiiv={
            beehiiv
              ? {
                  publicationName: beehiiv.platformUsername ?? null,
                  connectedAt: beehiiv.connectedAt.toISOString(),
                }
              : null
          }
        />
      </div>
    </div>
  );
}
