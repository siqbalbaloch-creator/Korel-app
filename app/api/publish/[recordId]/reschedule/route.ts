import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ recordId: string }> },
) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { recordId } = await params;

  let body: { scheduledFor: string };
  try {
    body = (await req.json()) as { scheduledFor: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const scheduledDate = new Date(body.scheduledFor);
  if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
    return NextResponse.json({ error: "scheduledFor must be a valid future date." }, { status: 400 });
  }

  const updated = await prisma.publishRecord.updateMany({
    where: {
      id: recordId,
      userId: session.user.id,
      status: "scheduled",
    },
    data: { scheduledFor: scheduledDate },
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "Record not found or not reschedulable" }, { status: 404 });
  }

  return NextResponse.json({ scheduledFor: scheduledDate.toISOString() });
}
