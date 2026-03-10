import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { getServerAuthSession } from "@/lib/auth";
import { cookies } from "next/headers";

function base64url(input: Buffer): string {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/signin", process.env.NEXTAUTH_URL!));
  }

  const clientId = process.env.X_CLIENT_ID;
  const redirectUri = process.env.X_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: "X OAuth not configured" }, { status: 500 });
  }

  // PKCE: generate code_verifier and code_challenge
  const codeVerifier = base64url(randomBytes(64));
  const codeChallenge = base64url(
    createHash("sha256").update(codeVerifier).digest(),
  );

  // State encodes userId for retrieval on callback
  const state = Buffer.from(
    JSON.stringify({ userId: session.user.id, nonce: Math.random().toString(36) }),
  ).toString("base64url");

  // Store verifier in httpOnly cookie (30 min TTL)
  const cookieStore = await cookies();
  cookieStore.set("x_pkce_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1800,
    path: "/",
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "tweet.read tweet.write users.read offline.access",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return NextResponse.redirect(
    `https://twitter.com/i/oauth2/authorize?${params.toString()}`,
  );
}
