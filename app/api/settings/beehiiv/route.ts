import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { validateBeehiivCredentials } from "@/lib/publishers/beehiiv";

type SaveBody = {
  apiKey: string;
  publicationId: string;
};

/** POST /api/settings/beehiiv — save or update Beehiiv credentials */
export async function POST(req: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: SaveBody;
  try {
    body = (await req.json()) as SaveBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { apiKey, publicationId } = body;

  if (!apiKey?.trim() || !publicationId?.trim()) {
    return NextResponse.json(
      { error: "API key and Publication ID are required." },
      { status: 400 },
    );
  }

  // Validate credentials against Beehiiv API
  let publication;
  try {
    publication = await validateBeehiivCredentials(apiKey.trim(), publicationId.trim());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Validation failed" },
      { status: 422 },
    );
  }

  const encryptedKey = encrypt(apiKey.trim());

  await prisma.connectedAccount.upsert({
    where: { userId_platform: { userId, platform: "beehiiv" } },
    create: {
      userId,
      platform: "beehiiv",
      platformUserId: publication.id,
      platformUsername: publication.name,
      accessToken: encryptedKey,
      isActive: true,
    },
    update: {
      platformUserId: publication.id,
      platformUsername: publication.name,
      accessToken: encryptedKey,
      isActive: true,
      connectedAt: new Date(),
    },
  });

  return NextResponse.json({ publicationName: publication.name });
}

/** DELETE /api/settings/beehiiv — disconnect Beehiiv */
export async function DELETE() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.connectedAccount.updateMany({
    where: { userId: session.user.id, platform: "beehiiv" },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}
