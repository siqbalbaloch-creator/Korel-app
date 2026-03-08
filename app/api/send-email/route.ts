import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { to, toName, subject, body, packId } = await req.json() as {
    to: string;
    toName?: string;
    subject: string;
    body: string;
    packId?: string;
  };

  if (!to || !subject || !body) {
    return NextResponse.json({ error: "Missing to, subject, or body" }, { status: 400 });
  }

  const gmailUser = process.env.GMAIL_USER;
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!gmailUser || !clientId || !clientSecret || !refreshToken) {
    logger.error("send-email.missing-env", {
      hasUser: !!gmailUser,
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasRefreshToken: !!refreshToken,
    });
    return NextResponse.json({ error: "Gmail OAuth2 not configured" }, { status: 500 });
  }

  logger.info("send-email.start", {
    to,
    subject,
    packId: packId ?? null,
    gmailUser,
  });

  let success = false;
  let errorMsg: string | null = null;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: gmailUser,
        clientId,
        clientSecret,
        refreshToken,
      },
    });

    await transporter.sendMail({
      from: gmailUser,
      to,
      subject,
      text: body,
    });

    success = true;
    logger.info("send-email.success", { to });
  } catch (e) {
    errorMsg = e instanceof Error ? e.message : "Unknown error";
    logger.error("send-email.exception", { error: errorMsg });
  }

  // Log to DB if packId provided
  if (packId) {
    await prisma.packSendLog.create({
      data: {
        packId,
        recipientEmail: to,
        recipientName: toName ?? to,
        subject,
        status: success ? "sent" : "failed",
        error: errorMsg ?? undefined,
      },
    });
  }

  if (!success) {
    return NextResponse.json({ error: errorMsg }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
