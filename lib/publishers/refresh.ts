import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";

const X_TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // refresh 5 min before expiry

/**
 * Returns a valid X access token for the user, refreshing it if needed.
 * Throws if the account is not connected or refresh fails.
 */
export async function getValidXToken(userId: string): Promise<string> {
  const account = await prisma.connectedAccount.findUnique({
    where: { userId_platform: { userId, platform: "x" } },
  });

  if (!account || !account.isActive) {
    throw new Error("X account not connected");
  }

  const accessToken = decrypt(account.accessToken);

  // If no expiry recorded or still has plenty of time, return as-is
  if (
    !account.tokenExpiresAt ||
    account.tokenExpiresAt.getTime() > Date.now() + X_TOKEN_REFRESH_BUFFER_MS
  ) {
    return accessToken;
  }

  // Token is expiring — refresh it
  if (!account.refreshToken) {
    throw new Error("X token expired and no refresh token available. Please reconnect X.");
  }

  const refreshToken = decrypt(account.refreshToken);
  const clientId = process.env.X_CLIENT_ID!;
  const clientSecret = process.env.X_CLIENT_SECRET!;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`X token refresh failed (${tokenRes.status}): ${errText}`);
  }

  const tokenData = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  const newAccessToken = tokenData.access_token;
  const newRefreshToken = tokenData.refresh_token ?? null;
  const newExpiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000)
    : null;

  await prisma.connectedAccount.update({
    where: { userId_platform: { userId, platform: "x" } },
    data: {
      accessToken: encrypt(newAccessToken),
      refreshToken: newRefreshToken ? encrypt(newRefreshToken) : account.refreshToken,
      tokenExpiresAt: newExpiresAt,
    },
  });

  return newAccessToken;
}

/**
 * Returns a valid LinkedIn access token for the user.
 * LinkedIn tokens last 60 days — throws if expired with instructions to reconnect.
 */
export async function getValidLinkedInToken(userId: string): Promise<{
  accessToken: string;
  platformUserId: string;
}> {
  const account = await prisma.connectedAccount.findUnique({
    where: { userId_platform: { userId, platform: "linkedin" } },
  });

  if (!account || !account.isActive) {
    throw new Error("LinkedIn account not connected");
  }

  if (account.tokenExpiresAt && account.tokenExpiresAt < new Date()) {
    throw new Error("LinkedIn token expired. Please reconnect LinkedIn in Settings > Connections.");
  }

  return {
    accessToken: decrypt(account.accessToken),
    platformUserId: account.platformUserId,
  };
}
