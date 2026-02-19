import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDemoUser } from "@/lib/demo-user";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const user = await ensureDemoUser();

  const pack = await prisma.authorityPack.findFirst({
    where: { id, userId: user.id },
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
  });
}

