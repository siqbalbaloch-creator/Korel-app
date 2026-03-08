import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getServerAuthSession();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { status, email } = (await request.json()) as {
    status?: string;
    email?: string;
  };

  const data: Record<string, unknown> = {};

  if (status === "APPROVED") {
    data.status = "APPROVED";
    data.approvedAt = new Date();
  } else if (status === "SKIPPED") {
    data.status = "SKIPPED";
  } else if (status === "SENT") {
    data.status = "SENT";
    data.sentAt = new Date();
  } else if (status) {
    data.status = status;
  }

  if (email !== undefined) {
    data.email = email || null;
  }

  const lead = await prisma.outreachLead.update({
    where: { id },
    data,
  });

  return NextResponse.json(lead);
}
