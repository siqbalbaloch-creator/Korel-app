import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rateLimit";

const VALID_STATUSES = ["open", "in_progress", "resolved"] as const;
type TicketStatus = (typeof VALID_STATUSES)[number];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerAuthSession();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  // Rate limit: 60 status updates per minute per admin (prevents accidental bulk hammering)
  if (!rateLimit(`ticket-status:${session.user.id}`, 60, 60_000)) {
    return NextResponse.json({ error: "Rate limit exceeded.", code: "RATE_LIMITED" }, { status: 429 });
  }

  const { id } = await params;

  const body = await request.json();
  const { status } = body as { status?: string };

  if (!status || !VALID_STATUSES.includes(status as TicketStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: { status },
    include: {
      user: { select: { email: true, name: true } },
    },
  });

  // Notify creator when their ticket is resolved
  if (status === "resolved" && ticket.user.email) {
    const userEmail = ticket.user.email;
    const userName = ticket.user.name ?? userEmail;

    await sendEmail({
      to: userEmail,
      subject: `Your support ticket has been resolved — ${ticket.subject}`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111827">
          <h2 style="margin:0 0 4px;font-size:18px;font-weight:600">Ticket resolved</h2>
          <p style="margin:0 0 20px;font-size:13px;color:#6B7280">Ticket #${id.slice(-8).toUpperCase()}</p>

          <p style="font-size:14px;color:#374151">Hi ${userName},</p>
          <p style="font-size:14px;color:#374151;margin-top:8px">
            Your support ticket <strong>${ticket.subject}</strong> has been marked as resolved.
          </p>
          <p style="font-size:14px;color:#374151;margin-top:8px">
            If you have further questions, feel free to open a new ticket from your account.
          </p>

          <p style="margin-top:32px;font-size:12px;color:#9CA3AF">— The Korel team</p>
        </div>
      `,
    }).catch(() => {
      // Non-fatal
    });
  }

  logger.info("support.ticket.status_changed", {
    adminId: session.user.id,
    ticketId: id,
    status,
  });
  return NextResponse.json({ id: ticket.id, status: ticket.status });
}
