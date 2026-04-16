/**
 * Shared Paddle checkout helper. Used by every upgrade button
 * (public pricing, authenticated /billing, authenticated /upgrade)
 * so the flow is consistent.
 *
 * Throws on any failure so callers can show an error state.
 */
export async function startCheckout(priceId: string): Promise<never> {
  const res = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceId }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    checkoutUrl?: string;
    error?: string;
  };

  if (!data.checkoutUrl) {
    throw new Error(data.error ?? "Could not start checkout.");
  }

  window.location.assign(data.checkoutUrl);
  // Reachable only if the browser cancels the navigation.
  return new Promise<never>(() => {});
}

/**
 * Public-pricing entrypoint: unauthenticated users are bounced to /signin
 * with a callbackUrl pointing at /billing, where they can finish the upgrade.
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
