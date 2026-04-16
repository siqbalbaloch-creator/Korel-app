import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { getPaddle } from "@/lib/paddleServer";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const ALLOWED_PRICE_ENV_VARS = [
  "NEXT_PUBLIC_PADDLE_STARTER_PRICE_ID",
  "NEXT_PUBLIC_PADDLE_PROFESSIONAL_PRICE_ID",
] as const;

function isAllowedPriceId(priceId: string): boolean {
  return ALLOWED_PRICE_ENV_VARS.some(
    (envVar) => process.env[envVar] === priceId,
  );
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;
  const userEmail = session?.user?.email ?? null;

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { priceId?: string };
  const priceId = body.priceId?.trim();

  if (!priceId) {
    return NextResponse.json({ error: "priceId is required" }, { status: 400 });
  }
  if (!isAllowedPriceId(priceId)) {
    return NextResponse.json({ error: "Unknown priceId" }, { status: 400 });
  }

  let paddle;
  try {
    paddle = getPaddle();
  } catch {
    return NextResponse.json(
      { error: "Paddle is not configured. Add PADDLE_API_KEY to env." },
      { status: 500 },
    );
  }

  const existingSub = await prisma.subscription.findUnique({
    where: { userId },
    select: { paddleCustomerId: true },
  });

  // Create a transaction to get a transactionId. The browser will open Paddle.js
  // overlay checkout with that id — no redirect, no Paddle dashboard default
  // payment link involved.
  const transaction = await paddle.transactions.create({
    items: [{ priceId, quantity: 1 }],
    ...(existingSub?.paddleCustomerId
      ? { customerId: existingSub.paddleCustomerId }
      : {}),
    customData: { userId },
  });

  return NextResponse.json({
    transactionId: transaction.id,
    customerEmail: userEmail,
  });
}
