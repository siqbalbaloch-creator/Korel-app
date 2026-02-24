import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripeServer";
import { prisma } from "@/lib/prisma";
import type { Plan } from "@prisma/client";
import type Stripe from "stripe";

export const runtime = "nodejs";

const isDev = process.env.NODE_ENV !== "production";

// ─── helpers ─────────────────────────────────────────────────────────────────

function planFromPriceId(priceId: string): Plan {
  if (priceId && priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) return "ENTERPRISE";
  if (priceId && priceId === process.env.STRIPE_PRO_PRICE_ID) return "PRO";
  return "FREE";
}

function periodEnd(sub: Stripe.Subscription): Date | null {
  const ts = (sub as unknown as { current_period_end?: number }).current_period_end;
  return ts ? new Date(ts * 1000) : null;
}

/** Prefer metadata, then fall back to DB lookup by Stripe customer ID. */
async function resolveUserId(
  sub: Stripe.Subscription,
  stripeCustomerId: string
): Promise<string | null> {
  if (sub.metadata?.userId) return sub.metadata.userId;
  const row = await prisma.subscription.findUnique({
    where: { stripeCustomerId },
    select: { userId: true },
  });
  return row?.userId ?? null;
}

/** Idempotent upsert — safe if Stripe re-delivers the same event. */
async function syncSubscription(
  userId: string,
  stripeCustomerId: string,
  stripeSub: Stripe.Subscription
): Promise<void> {
  const plan = planFromPriceId(stripeSub.items.data[0]?.price.id ?? "");
  const currentPeriodEnd = periodEnd(stripeSub);

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId,
      stripeSubId: stripeSub.id,
      plan,
      status: stripeSub.status,
      currentPeriodEnd,
    },
    update: {
      stripeCustomerId,
      stripeSubId: stripeSub.id,
      plan,
      status: stripeSub.status,
      currentPeriodEnd,
    },
  });

  if (isDev) {
    console.log(`[webhook] synced userId=${userId} plan=${plan} status=${stripeSub.status}`);
  }
}

// ─── route handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (isDev) console.log(`[webhook] ${event.type}`);

  switch (event.type) {
    // User completed checkout ─────────────────────────────────────────────────
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (!session.subscription) break;

      const userId = session.metadata?.userId;
      if (!userId) {
        console.error("[webhook] checkout.session.completed: no userId in metadata");
        break;
      }

      const stripeCustomerId = session.customer as string;
      const stripeSub = await stripe.subscriptions.retrieve(session.subscription as string);
      await syncSubscription(userId, stripeCustomerId, stripeSub);
      break;
    }

    // Subscription created ────────────────────────────────────────────────────
    case "customer.subscription.created": {
      const stripeSub = event.data.object as Stripe.Subscription;
      const stripeCustomerId = stripeSub.customer as string;
      const userId = await resolveUserId(stripeSub, stripeCustomerId);
      if (!userId) {
        console.warn("[webhook] customer.subscription.created: could not resolve userId");
        break;
      }
      await syncSubscription(userId, stripeCustomerId, stripeSub);
      break;
    }

    // Subscription updated (renewal, plan change, past_due) ───────────────────
    case "customer.subscription.updated": {
      const stripeSub = event.data.object as Stripe.Subscription;
      const stripeCustomerId = stripeSub.customer as string;
      const userId = await resolveUserId(stripeSub, stripeCustomerId);
      if (!userId) {
        console.warn("[webhook] customer.subscription.updated: could not resolve userId");
        break;
      }
      await syncSubscription(userId, stripeCustomerId, stripeSub);
      break;
    }

    // Subscription cancelled ──────────────────────────────────────────────────
    case "customer.subscription.deleted": {
      const stripeSub = event.data.object as Stripe.Subscription;
      const stripeCustomerId = stripeSub.customer as string;
      const userId = await resolveUserId(stripeSub, stripeCustomerId);
      if (!userId) {
        console.warn("[webhook] customer.subscription.deleted: could not resolve userId");
        break;
      }
      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          stripeCustomerId,
          stripeSubId: null,
          plan: "FREE",
          status: "canceled",
          currentPeriodEnd: null,
        },
        update: {
          stripeSubId: null,
          plan: "FREE",
          status: "canceled",
          currentPeriodEnd: null,
        },
      });
      if (isDev) console.log(`[webhook] cancelled → userId=${userId} downgraded to FREE`);
      break;
    }

    default:
      if (isDev) console.log(`[webhook] unhandled: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
