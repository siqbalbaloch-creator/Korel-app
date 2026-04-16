import { NextResponse } from "next/server";
import {
  EventName,
  type SubscriptionCreatedEvent,
  type SubscriptionUpdatedEvent,
  type SubscriptionCanceledEvent,
  type SubscriptionPausedEvent,
  type SubscriptionNotification,
} from "@paddle/paddle-node-sdk";
import { getPaddle } from "@/lib/paddleServer";
import { prisma } from "@/lib/prisma";
import { planFromPaddlePriceId, type PlanTier } from "@/lib/plans";

export const runtime = "nodejs";

const isDev = process.env.NODE_ENV !== "production";

type CustomData = { userId?: string } | null | undefined;

async function resolveUserId(
  sub: SubscriptionNotification,
): Promise<string | null> {
  const customData = sub.customData as CustomData;
  if (customData?.userId) return customData.userId;

  // Fall back to the Paddle customer ID we previously stored.
  const row = await prisma.subscription.findUnique({
    where: { paddleCustomerId: sub.customerId },
    select: { userId: true },
  });
  if (row?.userId) return row.userId;

  // Last resort: resolve by customer email.
  try {
    const paddle = getPaddle();
    const customer = await paddle.customers.get(sub.customerId);
    const email = customer.email?.toLowerCase().trim();
    if (!email) return null;
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    return user?.id ?? null;
  } catch (err) {
    console.error("[paddle webhook] failed to resolve user via customer lookup", err);
    return null;
  }
}

function firstPriceId(sub: SubscriptionNotification): string | null {
  return sub.items?.[0]?.price?.id ?? null;
}

function parseIsoDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function syncSubscription(
  userId: string,
  sub: SubscriptionNotification,
  opts: { forceFreePlan?: boolean } = {},
): Promise<void> {
  const plan: PlanTier = opts.forceFreePlan
    ? "FREE"
    : planFromPaddlePriceId(firstPriceId(sub));
  const currentPeriodEnd =
    parseIsoDate(sub.currentBillingPeriod?.endsAt) ?? null;

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      paddleCustomerId: sub.customerId,
      paddleSubscriptionId: sub.id,
      plan,
      status: sub.status ?? "unknown",
      currentPeriodEnd,
    },
    update: {
      paddleCustomerId: sub.customerId,
      paddleSubscriptionId: sub.id,
      plan,
      status: sub.status ?? "unknown",
      currentPeriodEnd,
    },
  });

  if (isDev) {
    console.log(
      `[paddle webhook] synced userId=${userId} plan=${plan} status=${sub.status}`,
    );
  }
}

export async function POST(request: Request) {
  const signature = request.headers.get("paddle-signature");
  const secret = process.env.PADDLE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret" },
      { status: 400 },
    );
  }

  const rawBody = await request.text();

  let paddle;
  try {
    paddle = getPaddle();
  } catch {
    return NextResponse.json({ error: "Paddle not configured" }, { status: 500 });
  }

  let event;
  try {
    event = await paddle.webhooks.unmarshal(rawBody, secret, signature);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid signature";
    if (isDev) console.error("[paddle webhook] signature check failed:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (!event) {
    return NextResponse.json({ error: "Empty event" }, { status: 400 });
  }

  if (isDev) console.log(`[paddle webhook] ${event.eventType}`);

  switch (event.eventType) {
    case EventName.SubscriptionCreated: {
      const sub = (event as SubscriptionCreatedEvent).data;
      const userId = await resolveUserId(sub);
      if (!userId) {
        console.warn("[paddle webhook] subscription.created: could not resolve userId");
        break;
      }
      await syncSubscription(userId, sub);
      break;
    }

    case EventName.SubscriptionUpdated: {
      const sub = (event as SubscriptionUpdatedEvent).data;
      const userId = await resolveUserId(sub);
      if (!userId) {
        console.warn("[paddle webhook] subscription.updated: could not resolve userId");
        break;
      }
      await syncSubscription(userId, sub);
      break;
    }

    case EventName.SubscriptionCanceled: {
      const sub = (event as SubscriptionCanceledEvent).data;
      const userId = await resolveUserId(sub);
      if (!userId) {
        console.warn("[paddle webhook] subscription.canceled: could not resolve userId");
        break;
      }
      await syncSubscription(userId, sub, { forceFreePlan: true });
      break;
    }

    case EventName.SubscriptionPaused: {
      const sub = (event as SubscriptionPausedEvent).data;
      const userId = await resolveUserId(sub);
      if (!userId) {
        console.warn("[paddle webhook] subscription.paused: could not resolve userId");
        break;
      }
      await syncSubscription(userId, sub, { forceFreePlan: true });
      break;
    }

    default:
      if (isDev) console.log(`[paddle webhook] unhandled: ${event.eventType}`);
  }

  return NextResponse.json({ received: true });
}
