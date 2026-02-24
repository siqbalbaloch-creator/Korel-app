/**
 * Thin email abstraction over Resend.
 * Falls back to console.log in dev / when RESEND_API_KEY is not configured.
 * All callers should treat this as fire-and-forget (non-fatal).
 */
import { Resend } from "resend";

const RESEND_KEY = process.env.RESEND_API_KEY ?? "";
const CONFIGURED =
  RESEND_KEY.length > 0 && RESEND_KEY !== "re_your_api_key_here";

const resend = CONFIGURED ? new Resend(RESEND_KEY) : null;

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!resend) {
    console.log(`[email:dev] To: ${to} | Subject: ${subject}`);
    return;
  }

  await resend.emails
    .send({
      from: "Korel <onboarding@resend.dev>",
      to,
      subject,
      html,
    })
    .catch((err) => {
      console.error("[email] Send failed:", err);
    });
}
