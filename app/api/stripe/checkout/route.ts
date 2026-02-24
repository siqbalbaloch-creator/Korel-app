import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { getStripe, PLANS } from "@/lib/stripeServer";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;
  const userEmail = session?.user?.email;

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { plan?: "PRO" | "ENTERPRISE" };
  const planKey = body.plan === "ENTERPRISE" ? "ENTERPRISE" : "PRO";
  const plan = PLANS[planKey];

  if (!plan.priceId) {
    return NextResponse.json(
      { error: "Price not configured. Set STRIPE_PRO_PRICE_ID / STRIPE_ENTERPRISE_PRICE_ID in .env." },
      { status: 500 }
    );
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json(
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to .env." },
      { status: 500 }
    );
  }

  // Get or create Stripe customer
  let stripeCustomerId: string;
  const sub = await prisma.subscription.findUnique({ where: { userId } });

  if (sub?.stripeCustomerId) {
    stripeCustomerId = sub.stripeCustomerId;
  } else {
    const customer = await stripe.customers.create({
      email: userEmail ?? undefined,
      metadata: { userId },
    });
    stripeCustomerId = customer.id;
    // Persist the customer ID so we can match incoming webhooks
    await prisma.subscription.upsert({
      where: { userId },
      create: { userId, stripeCustomerId, plan: "FREE", status: "none" },
      update: { stripeCustomerId },
    });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: `${baseUrl}/billing?success=1`,
    cancel_url: `${baseUrl}/billing?canceled=1`,
    metadata: { userId, plan: planKey },
    subscription_data: {
      metadata: { userId, plan: planKey },
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
