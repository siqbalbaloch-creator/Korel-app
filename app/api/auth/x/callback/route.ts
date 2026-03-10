import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(`${BASE_URL}/settings/connections?error=x_denied`);
  }

  // Decode userId from state
  let userId: string;
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as {
      userId: string;
    };
    userId = parsed.userId;
  } catch {
    return NextResponse.redirect(`${BASE_URL}/settings/connections?error=invalid_state`);
  }

  // Retrieve PKCE verifier from cookie
  const cookieStore = await cookies();
  const codeVerifier = cookieStore.get("x_pkce_verifier")?.value;
  if (!codeVerifier) {
    return NextResponse.redirect(`${BASE_URL}/settings/connections?error=missing_verifier`);
  }
  // Clear the cookie
  cookieStore.delete("x_pkce_verifier");

  const clientId = process.env.X_CLIENT_ID!;
  const clientSecret = process.env.X_CLIENT_SECRET!;
  const redirectUri = process.env.X_REDIRECT_URI!;

  // Exchange code for tokens
  let accessToken: string;
  let refreshToken: string | null = null;
  let expiresIn: number | null = null;
  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });
    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`X token exchange failed: ${tokenRes.status} ${errText}`);
    }
    const tokenData = (await tokenRes.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
    };
    accessToken = tokenData.access_token;
    refreshToken = tokenData.refresh_token ?? null;
    expiresIn = tokenData.expires_in ?? null;
  } catch {
    return NextResponse.redirect(`${BASE_URL}/settings/connections?error=token_exchange_failed`);
  }

  // Fetch X user profile
  let platformUserId: string;
  let platformUsername: string | null = null;
  try {
    const profileRes = await fetch("https://api.twitter.com/2/users/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileRes.ok) throw new Error("Failed to fetch X profile");
    const profile = (await profileRes.json()) as {
      data: { id: string; username: string; name: string };
    };
    platformUserId = profile.data.id;
    platformUsername = `@${profile.data.username}`;
  } catch {
    return NextResponse.redirect(`${BASE_URL}/settings/connections?error=profile_fetch_failed`);
  }

  const tokenExpiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

  await prisma.connectedAccount.upsert({
    where: { userId_platform: { userId, platform: "x" } },
    create: {
      userId,
      platform: "x",
      platformUserId,
      platformUsername,
      accessToken: encrypt(accessToken),
      refreshToken: refreshToken ? encrypt(refreshToken) : null,
      tokenExpiresAt,
      isActive: true,
    },
    update: {
      platformUserId,
      platformUsername,
      accessToken: encrypt(accessToken),
      refreshToken: refreshToken ? encrypt(refreshToken) : null,
      tokenExpiresAt,
      isActive: true,
    },
  });

  return NextResponse.redirect(`${BASE_URL}/settings/connections?connected=x`);
}
