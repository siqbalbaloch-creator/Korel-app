import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const session = await getServerAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const pack = await prisma.authorityPack.findFirst({
    where: { id, userId },
  });

  if (!pack) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    id: pack.id,
    title: pack.title,
    originalInput: pack.originalInput,
    createdAt: pack.createdAt.toISOString(),
    coreThesis: pack.coreThesis,
    strategicHooks: pack.strategicHooks,
    highLeveragePosts: pack.highLeveragePosts,
    insightBreakdown: pack.insightBreakdown,
    repurposingMatrix: pack.repurposingMatrix,
    executiveSummary: pack.executiveSummary,
    strategicMap: pack.strategicMap,
    messagingStrength: pack.messagingStrength,
    authorityConsistency: pack.authorityConsistency,
    regenerationCount: pack.regenerationCount,
  });
}
