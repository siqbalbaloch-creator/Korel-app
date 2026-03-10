import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/feeds/[id] — toggle active/inactive or rename
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json()) as { isActive?: boolean; feedName?: string };

  const feed = await prisma.rssFeed.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!feed) {
    return NextResponse.json({ error: "Feed not found" }, { status: 404 });
  }

  const updated = await prisma.rssFeed.update({
    where: { id },
    data: {
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.feedName !== undefined && { feedName: body.feedName }),
    },
  });

  return NextResponse.json({ feed: updated });
}

// DELETE /api/feeds/[id] — remove feed
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const deleted = await prisma.rssFeed.deleteMany({
    where: { id, userId: session.user.id },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Feed not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
