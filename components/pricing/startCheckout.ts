"use client";

import type { CheckoutOpenOptions, CheckoutSettings } from "@paddle/paddle-js";
import { getPaddleClient, resetPaddleClient } from "./paddleClient";

const CHECKOUT_SETTINGS: CheckoutSettings = {
  displayMode: "overlay",
  theme: "light",
  locale: "en",
  successUrl: "https://www.usekorel.com/billing?success=1",
  frameTarget: "self",
  frameInitialHeight: 450,
  frameStyle: "width: 100%; background-color: transparent; border: none;",
};

/**
 * Open the overlay, resetting the cached Paddle client + retrying once
 * if the first call throws. Paddle.js can get into a stale internal state
 * after a prior overlay was closed/cancelled; a fresh init clears it.
 */
async function openOverlayWithRetry(options: CheckoutOpenOptions): Promise<void> {
  let paddle = await getPaddleClient();
  try {
    paddle.Checkout.open(options);
  } catch (firstErr) {
    resetPaddleClient();
    try {
      paddle = await getPaddleClient();
      paddle.Checkout.open(options);
    } catch (retryErr) {
      throw retryErr instanceof Error
        ? retryErr
        : (firstErr instanceof Error
          ? firstErr
          : new Error("Paddle checkout failed to open."));
    }
  }
}

/**
 * Opens a Paddle overlay checkout for the given priceId.
 * Server creates the transaction, client loads Paddle.js and opens the overlay —
 * this bypasses Paddle's global default payment link entirely, so the shared
 * Paddle account's default (Prompify) is never touched.
 *
 * Throws on any server-side or SDK init failure.
 */
export async function startCheckout(priceId: string): Promise<void> {
  const res = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceId }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    transactionId?: string;
    customerEmail?: string | null;
    error?: string;
  };

  if (!data.transactionId) {
    throw new Error(data.error ?? "Could not start checkout.");
  }

  await openOverlayWithRetry({
    transactionId: data.transactionId,
    settings: CHECKOUT_SETTINGS,
    ...(data.customerEmail ? { customer: { email: data.customerEmail } } : {}),
  });
}

/**
 * Public-pricing entrypoint: unauthenticated users are bounced to /signin with
 * a callbackUrl pointing at /billing, where they can finish the upgrade.
 */
export async function startCheckoutOrLogin(
  priceId: string,
  isAuthenticated: boolean,
): Promise<void> {
  if (!isAuthenticated) {
    const callback = encodeURIComponent("/billing");
    window.location.assign(`/signin?callbackUrl=${callback}`);
    return;
  }
  await startCheckout(priceId);
}
