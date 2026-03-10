import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/getUserPlan";
import { getPlanConfig } from "@/lib/plans";
import RepurposeClient from "./RepurposeClient";

export default async function RepurposePage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) redirect("/signin");

  const userId = session.user.id;

  const [packs, userPlan] = await Promise.all([
    prisma.authorityPack.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        qualityScore: true,
        status: true,
        angle: true,
        inputType: true,
        _count: { select: { repurposes: true } },
      },
    }),
    getUserPlan(userId, { role: session.user.role }),
  ]);

  // Admins get ENTERPRISE via the role option above.
  // canRepurpose is true for PRO + ENTERPRISE; false for FREE.
  const canRepurpose =
    session.user.role === "admin" || getPlanConfig(userPlan.plan).repurposeAccess;

  return (
    <div className="flex-1 overflow-auto bg-[#F8FAFC]">
      <div className="max-w-[900px] mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111]">
            Back Catalog Repurposing
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Select packs from your library, pick a format, and generate content for all at once.
          </p>
        </div>

        <RepurposeClient
          packs={packs.map((p) => ({
            id: p.id,
            title: p.title,
            createdAt: p.createdAt.toISOString(),
            qualityScore: p.qualityScore ?? null,
            status: p.status,
            angle: p.angle,
            inputType: p.inputType,
            repurposeCount: p._count.repurposes,
          }))}
          canRepurpose={canRepurpose}
          upgradeHref="/billing"
        />
      </div>
    </div>
  );
}
