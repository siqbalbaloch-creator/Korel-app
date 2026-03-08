import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerAuthSession();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await prisma.outreachLead.updateMany({
    where: {
      status: { in: ["PENDING_EMAIL", "EMAIL_FOUND", "NO_EMAIL"] },
    },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
    },
  });

  return NextResponse.json({ approved: result.count });
}
