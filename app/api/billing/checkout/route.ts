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
  const userEmail = session?.user?.email;

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

  const baseUrl =
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

  const transaction = await paddle.transactions.create({
    items: [{ priceId, quantity: 1 }],
    ...(existingSub?.paddleCustomerId
      ? { customerId: existingSub.paddleCustomerId }
      : userEmail
        ? { customer: { email: userEmail } }
        : {}),
    customData: { userId },
    checkout: { url: `${baseUrl}/billing?success=1` },
  });

  const checkoutUrl = transaction.checkout?.url ?? null;

  if (!checkoutUrl) {
    // Happens when the Paddle account doesn't have a default payment link
    // configured. Surface the transaction id so the client can fall back to
    // the Paddle.js overlay checkout.
    return NextResponse.json(
      {
        error:
          "No checkout URL returned. Configure a default payment link in Paddle Dashboard > Checkout Settings, or use the Paddle.js overlay with transactionId.",
        transactionId: transaction.id,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ checkoutUrl, transactionId: transaction.id });
}
