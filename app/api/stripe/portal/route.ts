import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { getStripe } from "@/lib/stripeServer";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST() {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account found." }, { status: 400 });
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 500 });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${baseUrl}/billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
