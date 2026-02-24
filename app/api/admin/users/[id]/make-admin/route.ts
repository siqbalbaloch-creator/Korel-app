import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerAuthSession();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!target) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.user.update({
    where: { id },
    data: { role: "admin" },
  });

  return NextResponse.json({ ok: true });
}
