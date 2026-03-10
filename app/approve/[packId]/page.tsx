import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import ApproveClient from "./ApproveClient";

type Props = {
  params: Promise<{ packId: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function ApprovePage({ params, searchParams }: Props) {
  const { packId } = await params;
  const { token } = await searchParams;

  const pack = await prisma.authorityPack.findUnique({
    where: { id: packId },
    select: {
      id: true,
      userId: true,
      title: true,
      approveToken: true,
      highLeveragePosts: true,
      rssEpisode: { select: { title: true } },
    },
  });

  if (!pack) return notFound();

  // Determine if access is allowed
  let authorized = false;
  let authorizedUserId: string | null = null;

  // 1. Token-based auth (no login required)
  if (token && pack.approveToken && token === pack.approveToken) {
    authorized = true;
    authorizedUserId = pack.userId;
  }

  // 2. Session-based auth (logged in and owns pack)
  if (!authorized) {
    const session = await getServerAuthSession();
    if (session?.user?.id && session.user.id === pack.userId) {
      authorized = true;
      authorizedUserId = session.user.id;
    }
  }

  if (!authorized) {
    redirect(`/signin?callbackUrl=/approve/${packId}${token ? `?token=${token}` : ""}`);
  }

  // Extract post content
  const posts = pack.highLeveragePosts as Record<string, unknown> | null;
  const linkedinPosts = Array.isArray(posts?.linkedinPosts) ? posts!.linkedinPosts : [];
  const twitterThread = Array.isArray(posts?.twitterThread) ? posts!.twitterThread : [];
  const newsletterSummary = typeof posts?.newsletterSummary === "string" ? posts.newsletterSummary : "";

  const linkedinPost = linkedinPosts.length > 0 ? String(linkedinPosts[0]) : "";
  const twitterPost = twitterThread.length > 0 ? String(twitterThread[0]) : "";

  // Check connected accounts for the pack owner
  const [linkedInAccount, xAccount] = await Promise.all([
    prisma.connectedAccount.findFirst({
      where: { userId: authorizedUserId!, platform: "linkedin", isActive: true },
      select: { id: true },
    }),
    prisma.connectedAccount.findFirst({
      where: { userId: authorizedUserId!, platform: "x", isActive: true },
      select: { id: true },
    }),
  ]);

  const episodeTitle = pack.rssEpisode?.title ?? null;

  return (
    <ApproveClient
      packId={pack.id}
      approveToken={token ?? null}
      linkedinPost={linkedinPost}
      twitterPost={twitterPost}
      newsletter={newsletterSummary}
      linkedInConnected={!!linkedInAccount}
      xConnected={!!xAccount}
      episodeTitle={episodeTitle}
    />
  );
}
