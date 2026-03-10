import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { createBeehiivDraft, textToHtml } from "@/lib/publishers/beehiiv";

type Body = {
  packId: string;
  content?: string;       // optional override; defaults to pack's newsletterSummary
  title?: string;         // optional override; defaults to pack title
  approveToken?: string;  // for token-based access from approve page
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { packId, approveToken } = body;

  if (!packId) {
    return NextResponse.json({ error: "packId is required" }, { status: 400 });
  }

  // Fetch pack
  const pack = await prisma.authorityPack.findUnique({
    where: { id: packId },
    select: {
      id: true,
      userId: true,
      title: true,
      approveToken: true,
      highLeveragePosts: true,
    },
  });

  if (!pack) {
    return NextResponse.json({ error: "Pack not found" }, { status: 404 });
  }

  // Auth: token-based or session
  let userId: string | null = null;
  if (approveToken && pack.approveToken && approveToken === pack.approveToken) {
    userId = pack.userId;
  } else {
    const session = await getServerAuthSession();
    if (session?.user?.id === pack.userId) userId = session.user.id;
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get Beehiiv account
  const account = await prisma.connectedAccount.findFirst({
    where: { userId, platform: "beehiiv", isActive: true },
  });

  if (!account) {
    return NextResponse.json(
      { error: "Beehiiv not connected. Go to Settings → Connected Accounts to add your API key." },
      { status: 422 },
    );
  }

  // Resolve content
  const posts = pack.highLeveragePosts as Record<string, unknown> | null;
  const defaultContent =
    typeof posts?.newsletterSummary === "string" ? posts.newsletterSummary : "";
  const content = (body.content ?? defaultContent).trim();

  if (!content) {
    return NextResponse.json({ error: "No newsletter content available." }, { status: 422 });
  }

  const title = (body.title ?? pack.title).trim();
  const contentHtml = textToHtml(content);

  // Decrypt API key and publish
  let apiKey: string;
  try {
    apiKey = decrypt(account.accessToken);
  } catch {
    return NextResponse.json(
      { error: "Could not decrypt Beehiiv credentials. Please reconnect your account." },
      { status: 500 },
    );
  }

  try {
    const post = await createBeehiivDraft(apiKey, account.platformUserId, title, contentHtml);
    return NextResponse.json({ postId: post.id, webUrl: post.webUrl, status: post.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Beehiiv publish failed" },
      { status: 502 },
    );
  }
}
