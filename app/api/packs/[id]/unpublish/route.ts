import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const pack = await prisma.authorityPack.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!pack) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const updated = await prisma.authorityPack.update({
    where: { id },
    data: {
      published: false,
      publishedAt: null,
      status: "draft",
    },
    select: { id: true, published: true, publishedAt: true, status: true },
  });

  return NextResponse.json(updated);
}
