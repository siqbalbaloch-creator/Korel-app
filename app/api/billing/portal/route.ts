import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { getPaddle } from "@/lib/paddleServer";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST() {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { paddleCustomerId: true, paddleSubscriptionId: true },
  });

  if (!sub?.paddleCustomerId) {
    return NextResponse.json(
      { error: "No billing account found." },
      { status: 400 },
    );
  }

  let paddle;
  try {
    paddle = getPaddle();
  } catch {
    return NextResponse.json(
      { error: "Paddle not configured." },
      { status: 500 },
    );
  }

  const portalSession = await paddle.customerPortalSessions.create(
    sub.paddleCustomerId,
    sub.paddleSubscriptionId ? [sub.paddleSubscriptionId] : [],
  );

  const url = portalSession.urls?.general?.overview ?? null;
  if (!url) {
    return NextResponse.json(
      { error: "Portal session did not return a URL." },
      { status: 500 },
    );
  }

  return NextResponse.json({ url });
}
