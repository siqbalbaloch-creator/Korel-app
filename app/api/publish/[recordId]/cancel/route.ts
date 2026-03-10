import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ recordId: string }> },
) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { recordId } = await params;

  const deleted = await prisma.publishRecord.deleteMany({
    where: {
      id: recordId,
      userId: session.user.id,
      status: "scheduled",
    },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Record not found or not cancellable" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
