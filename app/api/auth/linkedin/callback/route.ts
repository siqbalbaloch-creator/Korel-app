import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(`${BASE_URL}/settings/connections?error=linkedin_denied`);
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

  const clientId = process.env.LINKEDIN_CLIENT_ID!;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI!;

  // Exchange code for access token
  let accessToken: string;
  let expiresIn: number;
  try {
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    if (!tokenRes.ok) {
      throw new Error(`LinkedIn token exchange failed: ${tokenRes.status}`);
    }
    const tokenData = (await tokenRes.json()) as {
      access_token: string;
      expires_in: number;
    };
    accessToken = tokenData.access_token;
    expiresIn = tokenData.expires_in;
  } catch {
    return NextResponse.redirect(`${BASE_URL}/settings/connections?error=token_exchange_failed`);
  }

  // Fetch LinkedIn profile (OpenID Connect userinfo)
  let platformUserId: string;
  let platformUsername: string | null = null;
  try {
    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileRes.ok) throw new Error("Failed to fetch LinkedIn profile");
    const profile = (await profileRes.json()) as {
      sub: string;
      name?: string;
    };
    platformUserId = profile.sub;
    platformUsername = profile.name ?? null;
  } catch {
    return NextResponse.redirect(`${BASE_URL}/settings/connections?error=profile_fetch_failed`);
  }

  const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

  await prisma.connectedAccount.upsert({
    where: { userId_platform: { userId, platform: "linkedin" } },
    create: {
      userId,
      platform: "linkedin",
      platformUserId,
      platformUsername,
      accessToken: encrypt(accessToken),
      tokenExpiresAt,
      isActive: true,
    },
    update: {
      platformUserId,
      platformUsername,
      accessToken: encrypt(accessToken),
      tokenExpiresAt,
      isActive: true,
    },
  });

  return NextResponse.redirect(`${BASE_URL}/settings/connections?connected=linkedin`);
}
