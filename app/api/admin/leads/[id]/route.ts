import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { classifyEmailFormat } from "@/lib/pipeline/emailValidation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getServerAuthSession();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const lead = await prisma.outreachLead.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      email: true,
      emailConfidence: true,
      emailSource: true,
      emailAttemptLog: true,
    },
  });

  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(lead);
}

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
    if (email) {
      // Manual edits still go through the format/role/placeholder gate so a
      // typo or copy-pasted role inbox can't slip past the automated filter.
      // MX check is skipped here — admin may be fixing before sending.
      const verdict = classifyEmailFormat(email);
      if (!verdict.ok) {
        return NextResponse.json(
          { error: `Rejected: ${verdict.reason}` },
          { status: 422 },
        );
      }
      data.email = verdict.email;
      data.emailSource = "manual";
    } else {
      data.email = null;
    }
  }

  const lead = await prisma.outreachLead.update({
    where: { id },
    data,
  });

  return NextResponse.json(lead);
}
