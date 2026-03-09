/**
 * Quick smoke test for the Indie Hackers scraper.
 * Run with:  node scripts/test-indie-hackers.mjs
 */

import { load } from "cheerio";

const IH_BASE = "https://www.indiehackers.com";
const SITEMAP_BASE =
  "https://storage.googleapis.com/indie-hackers.appspot.com/sitemaps";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const HEADERS = {
  "User-Agent": UA,
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

function parseRevenueFromSlug(slug) {
  const m1 = slug.match(/(\d+)k-mo/i);
  if (m1) return parseInt(m1[1]) * 1000;
  const m2 = slug.match(/(\d+)-(\d{3})-mo/);
  if (m2) return parseInt(m2[1]) * 1000 + parseInt(m2[2]);
  const m3 = slug.match(/(\d{4,})-mo/);
  if (m3) return parseInt(m3[1]);
  return null;
}

function parseRevenue(text) {
  const m = text.match(/\$([0-9,.]+)\s*([kKmM]?)(?:\/mo|\/month)?/i);
  if (!m) return 0;
  const num = parseFloat(m[1].replace(/,/g, ""));
  if (isNaN(num)) return 0;
  const suffix = (m[2] || "").toLowerCase();
  if (suffix === "m") return Math.round(num * 1_000_000);
  if (suffix === "k") return Math.round(num * 1_000);
  return Math.round(num);
}

async function scrapeIndex() {
  console.log("\n━━━ STEP 1: Fetching IH sitemap ━━━\n");

  const res = await fetch(`${SITEMAP_BASE}/ih-sitemap-1.xml`, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(20000),
  });
  console.log(`Status: ${res.status}`);
  if (!res.ok) return [];

  const xml = await res.text();
  const postUrls = (xml.match(/<loc>[^<]+\/post\/[^<]+<\/loc>/g) ?? []).map(
    (m) => m.replace(/<\/?loc>/g, ""),
  );
  console.log(`Total post URLs: ${postUrls.length}`);

  const qualifying = [];
  for (const url of postUrls) {
    const slug = url.split("/post/")[1] ?? "";
    if (!/-mo/.test(slug)) continue;
    const revenue = parseRevenueFromSlug(slug);
    if (revenue === null || revenue < 5000) continue;
    const firebaseId = slug.split("-").pop() ?? "";
    const titleSlug = slug.slice(0, slug.lastIndexOf("-" + firebaseId));
    const title = titleSlug.replace(/-/g, " ").slice(0, 100);
    qualifying.push({ url, title, revenue });
  }

  // Shuffle for variety
  for (let i = qualifying.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [qualifying[i], qualifying[j]] = [qualifying[j], qualifying[i]];
  }

  console.log(`Qualifying posts (>=$5k/mo): ${qualifying.length}`);
  console.log("\nFirst 5:");
  qualifying.slice(0, 5).forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.title || "(no title)"}`);
    console.log(`     URL: ${s.url.slice(-60)}`);
    console.log(`     Revenue (from slug): $${s.revenue}/mo`);
  });

  return qualifying;
}

async function scrapeInterview(url) {
  console.log(`\n━━━ STEP 2: Fetching interview ━━━`);
  console.log(`URL: ${url}\n`);

  const res = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(15000),
  });
  console.log(`Status: ${res.status}`);
  if (!res.ok) return null;

  const html = await res.text();
  const $ = load(html);

  // Q&A via H2 headings
  const qaFromH2 = [];
  $("h2").each((_, el) => {
    const q = $(el).text().trim();
    if (!q || q.length < 10 || q.length > 300) return;
    const answers = [];
    let sib = $(el).next();
    while (sib.length && !sib.is("h1,h2,h3,h4")) {
      const t = sib.text().trim();
      if (t.length > 20) answers.push(t);
      sib = sib.next();
    }
    if (answers.length > 0) qaFromH2.push(`Q: ${q}\nA: ${answers.join(" ")}`);
  });

  let interviewText = qaFromH2.length >= 3 ? qaFromH2.join("\n\n") : "";
  if (!interviewText) {
    const paras = [];
    $("p").each((_, el) => {
      const t = $(el).text().trim();
      if (t.length > 50) paras.push(t);
    });
    interviewText = paras.join("\n\n");
  }

  const ogTitle =
    $("meta[property='og:title']").attr("content") || $("title").text() || "";
  const pageText = $.text();
  const revFromTitle = ogTitle.match(/\$[0-9,.]+\s*[kKmM]?(?:\/mo|\/month)/i);
  const revenueText = revFromTitle?.[0]?.trim() ?? "";
  const revenue = revenueText ? parseRevenue(revenueText) : 0;

  // Founder name
  const firstPara = $("p").first().text().trim();
  const nameMatch = firstPara.match(
    /^(?:Hi[^!]*!?\s+)?(?:I'm|my name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
  );
  const founderName = nameMatch ? nameMatch[1] : "(not found)";

  // Social links
  let websiteUrl = null,
    twitterUrl = null;
  $("a[href]").each((_, el) => {
    const href = ($(el).attr("href") ?? "").trim();
    if (!href.startsWith("http") || href.includes("indiehackers.com")) return;
    if (
      !twitterUrl &&
      /(?:twitter|x)\.com\/(?!search|intent)[a-z0-9_]{2,50}/i.test(href) &&
      !/\/indiehackers/i.test(href)
    )
      twitterUrl = href.split("?")[0];
    if (
      !websiteUrl &&
      !/(twitter|x|linkedin|facebook|instagram|youtube)\.com/.test(href)
    )
      websiteUrl = href.split("?")[0];
  });

  const INVALID_FRAG = ["noreply", "no-reply", "@example", "sentry", "indiehackers", "support@"];
  const emailCandidates = pageText.match(EMAIL_RE) ?? [];
  const email =
    emailCandidates.find(
      (e) => !INVALID_FRAG.some((f) => e.toLowerCase().includes(f)),
    ) ?? null;

  console.log(`Page title: ${ogTitle.slice(0, 100)}`);
  console.log(`\nExtraction:`);
  console.log(`  H2 Q&A blocks: ${qaFromH2.length}`);
  console.log(`  Chosen method: ${qaFromH2.length >= 3 ? "H2 Q&A" : "paragraphs"}`);
  console.log(`  Interview text length: ${interviewText.length} chars`);
  console.log(`  Founder name: ${founderName}`);
  console.log(`  Revenue: ${revenueText || "(not found)"} → $${revenue}/mo`);
  console.log(`  Website: ${websiteUrl ?? "(not found)"}`);
  console.log(`  Twitter: ${twitterUrl ?? "(not found)"}`);
  console.log(`  Email on page: ${email ?? "(not found)"}`);
  console.log(
    `\nInterview preview:\n  ${interviewText.slice(0, 300).replace(/\n/g, "\n  ")}`,
  );

  return { interviewText, founderName, revenue, revenueText, websiteUrl, twitterUrl, email };
}

async function main() {
  console.log("🚀 Indie Hackers Scraper Test\n");
  try {
    const stories = await scrapeIndex();
    if (!stories.length) {
      console.log("\n⚠️  No qualifying posts found — check sitemap URL or revenue filter.");
      return;
    }

    const testStory = stories[0];
    const interview = await scrapeInterview(testStory.url);

    if (!interview) {
      console.log("\n❌ Could not fetch interview — check URL and network");
      return;
    }

    console.log("\n━━━ SUMMARY ━━━");
    console.log(
      interview.interviewText.length >= 300
        ? `✅ Interview text: ${interview.interviewText.length} chars — GOOD`
        : `⚠️  Interview text: ${interview.interviewText.length} chars — TOO SHORT (need 300+)`,
    );
    console.log(
      interview.email
        ? `✅ Email found directly on page: ${interview.email}`
        : `ℹ️  No email on page — will use waterfall`,
    );
    console.log(
      interview.twitterUrl
        ? `✅ Twitter: ${interview.twitterUrl}`
        : `ℹ️  No Twitter found`,
    );
    console.log(
      interview.websiteUrl
        ? `✅ Website: ${interview.websiteUrl}`
        : `ℹ️  No website found`,
    );

    console.log("\n✅ IH scraper is working.");
  } catch (err) {
    console.error("\n❌ Test failed:", err);
  }
}

main();
