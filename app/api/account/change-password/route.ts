import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  // Rate limit: 5 password change attempts per 15 minutes
  if (!rateLimit(`pwd:${session.user.id}`, 5, 15 * 60_000)) {
    logger.warn("account.password.rate_limited", { userId: session.user.id });
    return NextResponse.json(
      { error: "Too many attempts — please wait before trying again.", code: "RATE_LIMITED" },
      { status: 429 },
    );
  }

  const body = await request.json();
  const { currentPassword, newPassword } = body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });

  if (!user?.password) {
    return NextResponse.json(
      { error: "Password change is not available for OAuth accounts" },
      { status: 400 },
    );
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    return NextResponse.json(
      { error: "Current password is incorrect" },
      { status: 400 },
    );
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashed },
  });

  logger.info("account.password.changed", { userId: session.user.id });
  return NextResponse.json({ success: true });
}
