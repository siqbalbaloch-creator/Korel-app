"use client";

import { initializePaddle, type Paddle } from "@paddle/paddle-js";

let paddlePromise: Promise<Paddle | undefined> | null = null;

/**
 * Lazy singleton for the browser-side Paddle.js client.
 * Loads the Paddle.js CDN bundle on first call and memoises the promise.
 *
 * The client token's approved-domain list (Paddle Dashboard) determines which
 * origins can open a checkout with it — this is how Korel bypasses Prompify's
 * global default payment link without changing shared Paddle account settings.
 */
export async function getPaddleClient(): Promise<Paddle> {
  if (typeof window === "undefined") {
    throw new Error("Paddle.js can only be initialized in the browser.");
  }

  if (!paddlePromise) {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    if (!token) {
      throw new Error("Missing NEXT_PUBLIC_PADDLE_CLIENT_TOKEN env var.");
    }

    const envName = (process.env.NEXT_PUBLIC_PADDLE_ENV ?? "production").toLowerCase();
    const environment = envName === "sandbox" ? "sandbox" : "production";

    paddlePromise = initializePaddle({ token, environment });
  }

  const paddle = await paddlePromise;
  if (!paddle) {
    // Reset so a transient failure doesn't permanently brick the page.
    paddlePromise = null;
    throw new Error("Paddle.js failed to initialize.");
  }
  return paddle;
}

/**
 * Clears the memoised Paddle instance. Call this after the overlay is
 * dismissed or if a Checkout.open() call fails, so the next attempt
 * re-initialises the client cleanly. The underlying CDN script is cached
 * by the browser, so re-init is cheap.
 */
export function resetPaddleClient(): void {
  paddlePromise = null;
}
