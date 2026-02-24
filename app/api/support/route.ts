import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { guardAsync } from "@/lib/runtimeGuard";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  return guardAsync(async () => {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }

    // Rate limit: 5 tickets per hour per user
    if (!rateLimit(`support:${session.user.id}`, 5, 60 * 60_000)) {
      logger.warn("support.ticket.rate_limited", { userId: session.user.id });
      return NextResponse.json(
        { error: "Too many support requests - please wait before submitting again.", code: "RATE_LIMITED" },
        { status: 429 },
      );
    }

    let subject = "";
    let message = "";
    try {
      const body = (await request.json()) as { subject?: string; message?: string };
      subject = typeof body.subject === "string" ? body.subject.trim() : "";
      message = typeof body.message === "string" ? body.message.trim() : "";
    } catch {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    if (!subject || !message) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    // Save ticket to database
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session.user.id,
        subject,
        message,
      },
    });

    // Send email notification to owner (non-fatal if it fails - ticket is already saved)
    const ownerEmail = process.env.SUPPORT_OWNER_EMAIL;
    const resendKey  = process.env.RESEND_API_KEY;

    if (ownerEmail && resendKey && resendKey !== "re_your_api_key_here") {
      const userEmail = session.user.email ?? "unknown";
      const userName  = session.user.name  ?? userEmail;

      await resend.emails.send({
        from:    "Korel Support <onboarding@resend.dev>",
        to:      ownerEmail,
        subject: `[Support] ${subject}`,
        html: `
          <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111827">
            <h2 style="margin:0 0 4px;font-size:18px;font-weight:600">New Support Ticket</h2>
            <p style="margin:0 0 20px;font-size:13px;color:#6B7280">Ticket #${ticket.id.slice(-8).toUpperCase()}</p>

            <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
              <tr>
                <td style="padding:8px 0;color:#6B7280;width:100px">From</td>
                <td style="padding:8px 0;color:#111827;font-weight:500">${userName} &lt;${userEmail}&gt;</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#6B7280">Subject</td>
                <td style="padding:8px 0;color:#111827;font-weight:500">${subject}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#6B7280">Submitted</td>
                <td style="padding:8px 0;color:#111827">${new Date().toUTCString()}</td>
              </tr>
            </table>

            <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:16px;font-size:14px;line-height:1.6;color:#374151;white-space:pre-wrap">${message}</div>

            <p style="margin-top:24px;font-size:12px;color:#9CA3AF">
              Reply directly to <a href="mailto:${userEmail}" style="color:#4F46E5">${userEmail}</a> to respond.
            </p>
          </div>
        `,
      }).catch(() => {
        // Email failure is non-fatal - ticket is already saved in DB
      });
    }

    logger.info("support.ticket.created", { userId: session.user.id, ticketId: ticket.id });
    return NextResponse.json({ success: true });
  }, "support.post");
}
