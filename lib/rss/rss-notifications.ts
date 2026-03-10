import { sendEmail } from "@/lib/email";
import type { User, RssFeed, RssEpisode, AuthorityPack } from "@prisma/client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.usekorel.com";

export async function notifyFounderPackReady(
  user: User,
  episode: RssEpisode,
  feed: RssFeed,
  pack: AuthorityPack,
) {
  if (!user.email) return;

  const packUrl = `${APP_URL}/history/${pack.id}`;
  const feedLabel = feed.feedName ?? "your feed";
  const name = user.name ?? "there";

  await sendEmail({
    to: user.email,
    subject: `New content pack ready — ${episode.title}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111;">
        <p style="font-size:16px;">Hi ${name},</p>
        <p>Your latest episode just dropped and Korel has already turned it into a full content pack.</p>
        <table style="border-collapse:collapse;width:100%;margin:20px 0;background:#f8fafc;border-radius:8px;">
          <tr>
            <td style="padding:16px;">
              <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Episode</p>
              <p style="margin:0;font-weight:600;">${episode.title}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 16px 16px;">
              <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">From</p>
              <p style="margin:0;">${feedLabel}</p>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 8px;font-weight:600;">What&apos;s ready:</p>
        <ul style="margin:0 0 24px;padding-left:20px;">
          <li>LinkedIn post</li>
          <li>X / Twitter post</li>
          <li>Newsletter section</li>
          <li>Strategic hooks &amp; insights</li>
        </ul>
        <a href="${packUrl}" style="display:inline-block;background:#4F46E5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
          View &amp; Publish Your Pack
        </a>
        <p style="margin-top:32px;font-size:13px;color:#64748b;">
          One click to publish to all your connected platforms.<br>
          — Korel
        </p>
      </div>
    `,
  });
}

export async function notifyFounderNeedsTranscript(
  user: User,
  episode: RssEpisode,
  feed: RssFeed,
) {
  if (!user.email) return;

  const newPackUrl = `${APP_URL}/new?title=${encodeURIComponent(episode.title)}`;
  const feedLabel = feed.feedName ?? "your feed";
  const name = user.name ?? "there";

  await sendEmail({
    to: user.email,
    subject: `New episode detected — paste transcript to generate pack`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111;">
        <p style="font-size:16px;">Hi ${name},</p>
        <p>Korel detected a new episode from <strong>${feedLabel}</strong>:</p>
        <p style="background:#f8fafc;padding:16px;border-radius:8px;font-weight:600;">${episode.title}</p>
        <p>
          We couldn&apos;t auto-fetch enough content to generate a pack.
          Paste the transcript or show notes below to create your content pack:
        </p>
        <a href="${newPackUrl}" style="display:inline-block;background:#4F46E5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
          Generate Pack
        </a>
        <p style="margin-top:32px;font-size:13px;color:#64748b;">— Korel</p>
      </div>
    `,
  });
}
