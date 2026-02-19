import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDemoUser } from "@/lib/demo-user";
import { generateAuthorityPackSafe } from "@/lib/packGenerationService";

export const runtime = "nodejs";

const MAX_FREE_PACKS = 3;

type PackResponse = {
  id: string;
  title: string;
  originalInput: string;
  createdAt: string;
};

const serializePack = (pack: {
  id: string;
  title: string;
  originalInput: string;
  createdAt: Date;
}): PackResponse => ({
  id: pack.id,
  title: pack.title,
  originalInput: pack.originalInput,
  createdAt: pack.createdAt.toISOString(),
});

const buildResponse = (packs: {
  id: string;
  title: string;
  originalInput: string;
  createdAt: Date;
}[]) => {
  const generated = packs.length;
  const remaining = Math.max(0, MAX_FREE_PACKS - generated);

  return {
    packs: packs.map(serializePack),
    generated,
    remaining,
  };
};

const loadUserPacks = async (userId: string) =>
  prisma.authorityPack.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

export async function GET() {
  const user = await ensureDemoUser();
  const packs = await loadUserPacks(user.id);

  return NextResponse.json(buildResponse(packs));
}

export async function POST(request: Request) {
  const user = await ensureDemoUser();
  const packs = await loadUserPacks(user.id);

  if (packs.length >= MAX_FREE_PACKS) {
    return NextResponse.json({ ...buildResponse(packs), error: "quota" });
  }

  let input = "";
  let titleFromUser = "";
  try {
    const body = (await request.json()) as { input?: string; title?: string };
    input = typeof body.input === "string" ? body.input.trim() : "";
    titleFromUser =
      typeof body.title === "string" ? body.title.trim() : "";
  } catch {
    input = "";
  }

  if (!input) {
    return NextResponse.json(
      { ...buildResponse(packs), error: "invalid" },
      { status: 400 },
    );
  }

  const { pack: structuredPack, error: generationError, transcriptUnavailable } =
    await generateAuthorityPackSafe(input);

  if (transcriptUnavailable) {
    return NextResponse.json(
      { ...buildResponse(packs), error: "transcript_unavailable", detail: generationError },
      { status: 422 },
    );
  }

  if (generationError) {
    return NextResponse.json(
      { ...buildResponse(packs), error: "generation_failed", detail: generationError },
      { status: 500 },
    );
  }

  const fallbackTitle = structuredPack.title || `Authority Pack #${packs.length + 1}`;
  const finalTitle = titleFromUser || fallbackTitle;

  const created = await prisma.authorityPack.create({
    data: {
      title: finalTitle,
      originalInput: input,
      coreThesis: structuredPack.coreThesis,
      strategicHooks: structuredPack.strategicHooks,
      highLeveragePosts: structuredPack.highLeveragePosts,
      insightBreakdown: structuredPack.insightBreakdown,
      repurposingMatrix: structuredPack.repurposingMatrix,
      executiveSummary: structuredPack.executiveSummary,
      userId: user.id,
    },
  });

  const responsePayload = {
    ...buildResponse([...packs, created]),
    lastCreatedId: created.id,
  };

  return NextResponse.json(responsePayload);
}
