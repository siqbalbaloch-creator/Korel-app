import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { platform } = (await req.json()) as { platform?: string };
  if (!platform || !["linkedin", "x"].includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  await prisma.connectedAccount.deleteMany({
    where: { userId: session.user.id, platform },
  });

  return NextResponse.json({ success: true });
}
