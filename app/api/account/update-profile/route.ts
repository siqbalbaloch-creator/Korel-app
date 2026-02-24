import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";

export async function PATCH(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  // Rate limit: 10 profile updates per minute
  if (!rateLimit(`profile:${session.user.id}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests.", code: "RATE_LIMITED" },
      { status: 429 },
    );
  }

  const body = await request.json();
  const { name } = body as { name?: string };

  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const trimmed = name.trim().slice(0, 100);

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { name: trimmed },
    select: { name: true },
  });

  return NextResponse.json({ name: updated.name });
}
