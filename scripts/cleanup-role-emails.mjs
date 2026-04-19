/**
 * One-off cleanup: re-validate every OutreachLead.email against the pipeline
 * quality gate (role inboxes, placeholders, disposable domains, bad format)
 * and null out the ones that fail, so:
 *   - the admin pipeline queue stops surfacing them
 *   - the retry-pipeline cron picks them up tomorrow with the new gate in place
 *
 * Requires DATABASE_URL in .env.local (same DB the app points at).
 * Pull from Vercel with `vercel env pull` if needed.
 *
 * Usage:
 *   node scripts/cleanup-role-emails.mjs            # dry run — prints what would change
 *   node scripts/cleanup-role-emails.mjs --apply    # actually updates the DB
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ───────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = resolve(__dirname, "../.env.local");
  let raw;
  try {
    raw = readFileSync(envPath, "utf-8");
  } catch {
    console.error("❌ Could not read .env.local");
    process.exit(1);
  }
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    // Strip surrounding quotes if present
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv();

// ── Validation (inlined from lib/pipeline/emailValidation.ts) ─────────────────

const STRICT_EMAIL_RE =
  /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?)+$/;

const ROLE_LOCALS = new Set([
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

const TEST_FRAGMENTS = [
  "test@", "demo@",
  "@example.com", "@example.org", "@example.net",
  "@test.com", "@test.org",
  "@domain.com", "@yourdomain.com", "@yoursite.com",
  "@placeholder.com",
  "@sentry.io", "@sentry-next.wixpress.com", "@wixpress.com", "@wix.com",
  "support@github",
];

const DISPOSABLE_DOMAINS = new Set([
  "tempmail.com", "tempmail.net", "temp-mail.org",
  "10minutemail.com", "10minutemail.net",
  "guerrillamail.com", "guerrillamail.info",
  "mailinator.com", "mailinator.net",
  "throwaway.email", "yopmail.com", "dispostable.com",
  "getairmail.com", "maildrop.cc",
  "trashmail.com", "trashmail.net",
  "fakeinbox.com", "tempmailaddress.com",
  "getnada.com", "sharklasers.com", "mohmal.com", "emailondeck.com",
]);

function classifyEmailFormat(raw) {
  if (!raw) return { ok: false, reason: "empty" };
  const email = String(raw).trim().toLowerCase();
  if (!email) return { ok: false, reason: "empty" };
  if (!STRICT_EMAIL_RE.test(email)) return { ok: false, reason: "invalid format" };

  const atIdx = email.indexOf("@");
  const local = email.slice(0, atIdx);
  const domain = email.slice(atIdx + 1);

  if (ROLE_LOCALS.has(local)) return { ok: false, reason: `role inbox (${local}@)` };
  if (TEST_FRAGMENTS.some((frag) => email.includes(frag))) {
    return { ok: false, reason: "placeholder/test pattern" };
  }
  if (DISPOSABLE_DOMAINS.has(domain)) return { ok: false, reason: `disposable domain (${domain})` };

  return { ok: true, email };
}

// ── Main ──────────────────────────────────────────────────────────────────────

const APPLY = process.argv.includes("--apply");

async function main() {
  const prisma = new PrismaClient();

  console.log(`Mode: ${APPLY ? "APPLY (writing to DB)" : "DRY RUN (no writes)"}\n`);

  const leads = await prisma.outreachLead.findMany({
    where: { email: { not: null } },
    select: {
      id: true,
      email: true,
      emailSource: true,
      emailConfidence: true,
      status: true,
      firstName: true,
      lastName: true,
      company: true,
      emailAttemptLog: true,
    },
  });

  console.log(`Inspecting ${leads.length} leads with a stored email…\n`);

  const toFix = [];
  for (const lead of leads) {
    const verdict = classifyEmailFormat(lead.email);
    if (!verdict.ok) {
      toFix.push({ lead, reason: verdict.reason });
    }
  }

  if (toFix.length === 0) {
    console.log("✅ No bad emails found. Nothing to clean up.");
    await prisma.$disconnect();
    return;
  }

  console.log(`Found ${toFix.length} lead(s) with invalid/role/placeholder emails:\n`);
  for (const { lead, reason } of toFix) {
    const name = [lead.firstName, lead.lastName].filter(Boolean).join(" ");
    console.log(
      `  • ${lead.email.padEnd(40)} — ${reason.padEnd(30)} (${name} @ ${lead.company})`,
    );
  }

  if (!APPLY) {
    console.log(
      `\nDry run complete. Re-run with --apply to null these emails and mark them NO_EMAIL.`,
    );
    await prisma.$disconnect();
    return;
  }

  console.log(`\nApplying updates…`);
  let updated = 0;
  for (const { lead, reason } of toFix) {
    const oldLog = Array.isArray(lead.emailAttemptLog) ? lead.emailAttemptLog : [];
    const newLog = [
      ...oldLog,
      {
        source: "cleanup",
        result: "rejected",
        detail: `manual cleanup: ${reason} (was: ${lead.email})`,
      },
    ];
    await prisma.outreachLead.update({
      where: { id: lead.id },
      data: {
        email: null,
        emailSource: null,
        emailConfidence: null,
        status: "NO_EMAIL",
        emailAttemptLog: newLog,
      },
    });
    updated += 1;
  }

  console.log(`✅ Updated ${updated} row(s). These leads will be retried by the next cron run.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
