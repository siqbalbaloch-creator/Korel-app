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

  const name = user.name?.split(" ")[0] ?? "there";
  const feedLabel = feed.feedName ?? "your feed";

  // Build approve URL — use token if available, otherwise fall back to history page
  const approveUrl = pack.approveToken
    ? `${APP_URL}/approve/${pack.id}?token=${pack.approveToken}`
    : `${APP_URL}/history/${pack.id}`;

  // Extract a preview of the LinkedIn post
  const posts = pack.highLeveragePosts as Record<string, unknown> | null;
  const linkedinPosts = Array.isArray(posts?.linkedinPosts) ? posts!.linkedinPosts : [];
  const linkedinPreview = linkedinPosts.length > 0
    ? String(linkedinPosts[0]).slice(0, 160).replace(/\n/g, " ").trim() + "…"
    : null;

  await sendEmail({
    to: user.email,
    subject: `New pack ready — ${episode.title}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F8FAFC;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;">

          <!-- Logo header -->
          <tr>
            <td style="padding-bottom:24px;">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="background:linear-gradient(135deg,#6D5EF3 0%,#8B7CFF 100%);width:32px;height:32px;border-radius:8px;text-align:center;vertical-align:middle;">
                    <span style="font-size:18px;line-height:32px;">&#9685;</span>
                  </td>
                  <td style="padding-left:10px;font-size:16px;font-weight:700;color:#0F172A;letter-spacing:0.5px;">
                    <span style="color:#6D5EF3;">K</span>OREL
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden;">

              <!-- Green top bar -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);padding:20px 28px;">
                    <p style="margin:0;font-size:12px;font-weight:600;color:rgba(255,255,255,0.75);letter-spacing:0.08em;text-transform:uppercase;">New content pack ready</p>
                    <p style="margin:6px 0 0;font-size:20px;font-weight:700;color:#ffffff;line-height:1.3;">
                      ${escapeHtml(episode.title)}
                    </p>
                    <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.7);">from ${escapeHtml(feedLabel)}</p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:24px 28px;">

                <!-- Greeting -->
                <tr>
                  <td style="padding-bottom:16px;">
                    <p style="margin:0;font-size:15px;color:#1E293B;">
                      Hi ${escapeHtml(name)}, your latest episode has been turned into a full content pack — ready to publish.
                    </p>
                  </td>
                </tr>

                ${linkedinPreview ? `
                <!-- LinkedIn preview -->
                <tr>
                  <td style="padding-bottom:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F1F5F9;border-radius:10px;border-left:3px solid #0A66C2;">
                      <tr>
                        <td style="padding:14px 16px;">
                          <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#0A66C2;text-transform:uppercase;letter-spacing:0.06em;">LinkedIn post preview</p>
                          <p style="margin:0;font-size:13px;color:#334155;line-height:1.6;">${escapeHtml(linkedinPreview)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ` : ""}

                <!-- What's ready list -->
                <tr>
                  <td style="padding-bottom:24px;">
                    <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:0.06em;">What's included</p>
                    <table cellpadding="0" cellspacing="0" role="presentation">
                      ${["LinkedIn post", "X / Twitter post", "Newsletter section", "Strategic hooks & insights"].map(item => `
                      <tr>
                        <td style="padding:3px 0;">
                          <table cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td style="width:18px;font-size:13px;color:#4F46E5;">&#10003;</td>
                              <td style="font-size:13px;color:#334155;">${item}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>`).join("")}
                    </table>
                  </td>
                </tr>

                <!-- CTA button -->
                <tr>
                  <td style="padding-bottom:8px;">
                    <table cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);border-radius:10px;">
                          <a href="${approveUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.01em;">
                            Review &amp; Publish &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding-top:8px;">
                    <p style="margin:0;font-size:12px;color:#94A3B8;">One tap to publish to LinkedIn, X, or schedule for later.</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:20px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94A3B8;">
                You're receiving this because you added a content feed to Korel.<br />
                <a href="${APP_URL}/settings/feeds" style="color:#6D5EF3;text-decoration:none;">Manage feeds</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });
}

export async function notifyFounderNeedsTranscript(
  user: User,
  episode: RssEpisode,
  feed: RssFeed,
) {
  if (!user.email) return;

  const name = user.name?.split(" ")[0] ?? "there";
  const feedLabel = feed.feedName ?? "your feed";
  const newPackUrl = `${APP_URL}/new?title=${encodeURIComponent(episode.title)}`;

  await sendEmail({
    to: user.email,
    subject: `New episode detected — paste transcript to generate pack`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F8FAFC;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;">

          <tr>
            <td style="padding-bottom:24px;">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="background:linear-gradient(135deg,#6D5EF3 0%,#8B7CFF 100%);width:32px;height:32px;border-radius:8px;text-align:center;vertical-align:middle;">
                    <span style="font-size:18px;line-height:32px;">&#9685;</span>
                  </td>
                  <td style="padding-left:10px;font-size:16px;font-weight:700;color:#0F172A;letter-spacing:0.5px;">
                    <span style="color:#6D5EF3;">K</span>OREL
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background:#ffffff;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden;">

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:28px;">

                <tr>
                  <td style="padding-bottom:16px;">
                    <p style="margin:0;font-size:15px;font-weight:700;color:#1E293B;">New episode detected</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding-bottom:16px;">
                    <p style="margin:0;font-size:14px;color:#334155;">
                      Hi ${escapeHtml(name)}, Korel detected a new episode from <strong>${escapeHtml(feedLabel)}</strong>:
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding-bottom:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F1F5F9;border-radius:10px;">
                      <tr>
                        <td style="padding:14px 16px;font-size:14px;font-weight:600;color:#1E293B;">
                          ${escapeHtml(episode.title)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding-bottom:20px;">
                    <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">
                      We couldn&apos;t auto-fetch enough content to generate a pack. Paste the transcript or show notes to create your content pack.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);border-radius:10px;">
                          <a href="${newPackUrl}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">
                            Generate Pack &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <tr>
            <td style="padding-top:20px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94A3B8;">
                <a href="${APP_URL}/settings/feeds" style="color:#6D5EF3;text-decoration:none;">Manage feeds</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
