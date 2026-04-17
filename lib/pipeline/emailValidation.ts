/**
 * Email quality gate for the outreach pipeline.
 *
 * Rejects:
 *   - malformed addresses (format regex)
 *   - role/group inboxes (info@, support@, hello@, etc.) — useless for founder outreach
 *   - placeholder/test patterns (test@, @example.com, @wixpress.com, etc.)
 *   - known disposable/temporary domains
 *   - domains with no MX record (catches typos like gmial.com and dead domains)
 *   - results below the per-source confidence floor
 *
 * Enforced on EVERY branch of the waterfall in pipeline.service.ts so that
 * Prospeo / Snov / Apollo / Hunter / Twitter results go through the same gate
 * as the website scrape, not just the website branch.
 */
import { resolveMx } from "node:dns/promises";

/** Strict(er) format: local@label(.label)+ with sane character classes. */
const STRICT_EMAIL_RE =
  /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?)+$/;

/**
 * Local-parts that indicate a role/group inbox, not a founder.
 * Kept as a Set so lookups are O(1).
 * NOTE: founder@, ceo@, cto@, cfo@ are INTENTIONALLY kept — at indie scale
 * these often route to the actual person.
 */
const ROLE_LOCALS = new Set<string>([
  "info", "hello", "contact", "contactus", "getintouch",
  "admin", "administrator", "team", "office", "general",
  "sales", "support", "help", "helpdesk", "customerservice",
  "careers", "jobs", "hr", "recruitment", "recruiting",
  "press", "media", "pr", "marketing",
  "legal", "compliance", "privacy", "security",
  "accounts", "accounting", "billing", "finance",
  "noreply", "no-reply", "donotreply", "do-not-reply",
  "mailer", "postmaster", "webmaster", "hostmaster", "abuse",
  "feedback", "enquiries", "inquiries", "enquiry", "inquiry",
  "partnerships", "partners",
  "invest", "investors", "ir",
  "hi", "hey", "hola",
  "news", "newsletter", "updates", "notifications",
]);

/**
 * Substrings that indicate a placeholder, fake, or platform-generated address.
 * Case-insensitive substring match.
 */
const TEST_FRAGMENTS = [
  "test@",
  "demo@",
  "@example.com",
  "@example.org",
  "@example.net",
  "@test.com",
  "@test.org",
  "@domain.com",
  "@yourdomain.com",
  "@yoursite.com",
  "@placeholder.com",
  "@sentry.io",
  "@sentry-next.wixpress.com",
  "@wixpress.com",
  "@wix.com",
  "support@github",
] as const;

/** Common disposable-email domains. Not exhaustive — targets the obvious. */
const DISPOSABLE_DOMAINS = new Set<string>([
  "tempmail.com",
  "tempmail.net",
  "temp-mail.org",
  "10minutemail.com",
  "10minutemail.net",
  "guerrillamail.com",
  "guerrillamail.info",
  "mailinator.com",
  "mailinator.net",
  "throwaway.email",
  "yopmail.com",
  "dispostable.com",
  "getairmail.com",
  "maildrop.cc",
  "trashmail.com",
  "trashmail.net",
  "fakeinbox.com",
  "tempmailaddress.com",
  "getnada.com",
  "sharklasers.com",
  "mohmal.com",
  "emailondeck.com",
]);

export type EmailVerdict =
  | { ok: true; email: string }
  | { ok: false; reason: string };

/** Synchronous checks: format + role + placeholder + disposable. */
export function classifyEmailFormat(raw: string | null | undefined): EmailVerdict {
  if (!raw) return { ok: false, reason: "empty" };
  const email = raw.trim().toLowerCase();
  if (!email) return { ok: false, reason: "empty" };
  if (!STRICT_EMAIL_RE.test(email)) return { ok: false, reason: "invalid format" };

  const atIdx = email.indexOf("@");
  const local = email.slice(0, atIdx);
  const domain = email.slice(atIdx + 1);

  if (ROLE_LOCALS.has(local)) {
    return { ok: false, reason: `role inbox (${local}@)` };
  }
  if (TEST_FRAGMENTS.some((frag) => email.includes(frag))) {
    return { ok: false, reason: "placeholder/test pattern" };
  }
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { ok: false, reason: `disposable domain (${domain})` };
  }

  return { ok: true, email };
}

// ─── MX cache (per-process, 24h TTL) ──────────────────────────────────────────

const MX_TTL_MS = 24 * 60 * 60 * 1000;
const mxCache = new Map<string, { hasMx: boolean; expiresAt: number }>();

async function domainHasMx(domain: string): Promise<boolean> {
  const cached = mxCache.get(domain);
  if (cached && Date.now() < cached.expiresAt) return cached.hasMx;

  let hasMx = false;
  try {
    const records = await resolveMx(domain);
    hasMx = records.length > 0;
  } catch {
    // NXDOMAIN / SERVFAIL / timeout — treat as no MX.
    hasMx = false;
  }
  mxCache.set(domain, { hasMx, expiresAt: Date.now() + MX_TTL_MS });
  return hasMx;
}

/**
 * Full gate: format + MX + confidence floor. Use this inside the waterfall.
 * Default confidence floor of 70 is tight enough to reject Snov "unknown"
 * (65) and Apollo "not found" (0) while letting every other source through.
 */
export async function validateEmail(
  raw: string | null | undefined,
  confidence: number,
  minConfidence = 70,
): Promise<EmailVerdict> {
  const format = classifyEmailFormat(raw);
  if (!format.ok) return format;

  if (confidence < minConfidence) {
    return { ok: false, reason: `confidence ${confidence} < floor ${minConfidence}` };
  }

  const domain = format.email.split("@")[1];
  const hasMx = await domainHasMx(domain);
  if (!hasMx) return { ok: false, reason: `no MX for ${domain}` };

  return { ok: true, email: format.email };
}
