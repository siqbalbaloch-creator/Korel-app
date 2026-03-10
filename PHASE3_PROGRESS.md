# Phase 3 Progress — Authority Distribution Engine

## Status
- **Part A** ✅ Complete
- **Part B** ✅ Complete
- **Part C** ✅ Complete (+ hardening pass done)
- **Part D** ✅ Complete
- **Part E** ⏳ Not started

---

## Database Schema Changes (Phase 3)

### `AuthorityPack` — added field:
```prisma
approveToken  String?  @unique
```
Generated via `randomUUID()` when RSS monitor creates a pack.
Used to grant token-based access to the approve page without login.
`prisma db push` already run — field live in Neon.

---

## Part A — Mobile Approve Page ✅

### New files:
- `app/approve/[packId]/page.tsx` — server component, no sidebar layout
  - Auth: `?token=xxx` validated against `pack.approveToken` OR session ownership
  - Falls back to `redirect("/signin?callbackUrl=...")` if neither
  - Fetches pack content + checks LinkedIn/X/Beehiiv connected accounts
- `app/approve/[packId]/ApproveClient.tsx` — client component
  - 3 tabs: LinkedIn / X / Twitter / Newsletter
  - LinkedIn + X: inline textarea editing, Publish now + Schedule buttons
  - Newsletter: inline editing + Beehiiv draft button
  - Token-based publish calls `/api/approve/[packId]/publish`
- `app/api/approve/[packId]/publish/route.ts` — token-aware publish endpoint
  - Accepts `approveToken` from body OR session auth
  - Calls existing LinkedIn/X publishers (`lib/publishers/linkedin.ts`, `lib/publishers/x.ts`)
  - Creates `PublishRecord` on success/failure

### Modified:
- `lib/rss/rss-monitor.service.ts` — added `approveToken: randomUUID()` when creating packs in `prisma.$transaction`
- `prisma/schema.prisma` — added `approveToken String? @unique` to `AuthorityPack`

### Key behaviour:
- `/approve/[packId]?token=xxx` — works without login (for mobile email link)
- `/approve/[packId]` — requires login + ownership
- Middleware (`middleware.ts`) does NOT protect `/approve` — intentional

---

## Part B — Redesigned Notification Email ✅

### Modified:
- `lib/rss/rss-notifications.ts` — full rewrite of both functions:

**`notifyFounderPackReady(user, episode, feed, pack)`**
- Rich table-based HTML email
- Purple gradient header with episode title + feed name
- LinkedIn post preview (first 160 chars of `highLeveragePosts.linkedinPosts[0]`)
- Checklist: LinkedIn post / X post / Newsletter section / Strategic hooks
- Big CTA button: "Review & Publish →" linking to `/approve/[packId]?token=[approveToken]`
- Falls back to `/history/[packId]` if no `approveToken`
- Helper `escapeHtml()` to prevent XSS in email

**`notifyFounderNeedsTranscript(user, episode, feed)`**
- Simpler HTML email
- Episode title card
- CTA: "Generate Pack →" linking to `/new?title=[encodedTitle]`

---

## Part C — Beehiiv Integration ✅

### New files:
- `lib/publishers/beehiiv.ts`
  - `validateBeehiivCredentials(apiKey, publicationId)` — calls `GET /v2/publications/{id}`
  - `createBeehiivDraft(apiKey, publicationId, title, contentHtml)` — calls `POST /v2/publications/{id}/posts` with `status: "draft"`
  - `textToHtml(text)` — converts plain-text paragraphs to `<p>` HTML
  - All errors are human-readable with actionable guidance (wrong API key, wrong pub ID, rate limit, network error)
- `app/api/settings/beehiiv/route.ts`
  - `POST` — validates credentials live against Beehiiv API, encrypts API key (AES-256-GCM via `lib/encryption.ts`), upserts `ConnectedAccount` with `platform="beehiiv"`
  - `DELETE` — soft-disconnects (sets `isActive: false`)
- `app/api/publish/beehiiv/route.ts`
  - `POST` — accepts `{ packId, content?, title?, approveToken? }`
  - Dual auth: `approveToken` OR session
  - Decrypts API key, calls `createBeehiivDraft`, returns `{ postId, webUrl, status }`

### Modified:
- `app/(product)/settings/connections/page.tsx` — fetches `beehiiv` account, passes as prop
- `app/(product)/settings/connections/ConnectionsClient.tsx`
  - Newsletter section: `BeehiivSection` component replaces "Coming soon"
  - API Key + Publication ID form with validation
  - `justConnectedName` state → shows "✅ Connected to [Publication Name]" banner on success
  - Substack stays as "Coming soon"
- `app/(product)/history/[id]/NewsletterSection.tsx`
  - Added `packId`, `packTitle`, `beehiivConnected` props
  - "Send to Beehiiv" button when connected; success shows "Open draft in Beehiiv →" button
- `app/(product)/history/[id]/page.tsx` — reads `beehiivConnected` from `connectedAccounts`, passes to `NewsletterSection`
- `app/(product)/new/AuthorityPackPreview.tsx` — passes `packId=""` `packTitle=""` `beehiivConnected={false}` to `NewsletterSection` (preview context, no publish)
- `app/approve/[packId]/ApproveClient.tsx` — Newsletter tab has Beehiiv draft button; success shows prominent "Open draft in Beehiiv →" button
- `app/approve/[packId]/page.tsx` — fetches `beehiivAccount`, passes `beehiivConnected` + `packTitle`

### Beehiiv storage model:
Stored in existing `ConnectedAccount` table:
- `platform`: `"beehiiv"`
- `platformUserId`: Publication ID (e.g. `pub_xxx`)
- `platformUsername`: Publication name (fetched from API on connect)
- `accessToken`: AES-256-GCM encrypted API key
- No OAuth flow — API key entered manually by user

---

## YouTube @handle Fix (done alongside Phase 3)

### Modified: `lib/rss/rss-monitor.service.ts`
- `resolveYouTubeFeedUrl()` — now handles:
  - Already-RSS URLs → pass through
  - `youtube.com/channel/UC...` → direct ID extraction
  - `youtube.com/@handle` or bare `@handle` → scrapes page for channel ID
  - `youtube.com/c/name` or `youtube.com/user/name` → scrapes page
  - If channel ID not found → throws clear error (not silent fallthrough)
- New `scrapeYouTubeChannelId(pageUrl)` — tries 5 patterns:
  1. `"channelId":"UC..."`
  2. `"externalChannelId":"UC..."`
  3. `"browseId":"UC..."` ← catches most modern handles
  4. `/channel/UC...`
  5. `"id":"UC..."`
  Uses real Chrome user-agent + `Accept-Language` headers
- `validateFeed()` — removed redundant double-call to `resolveYouTubeFeedUrl`

---

## Part D — Content Calendar Page ✅

### New files:
- `app/(product)/calendar/page.tsx` — server component
  - Fetches all `PublishRecord` rows for user: scheduled (any) + published/failed (last 30 days)
  - Serializes dates to ISO strings, passes to `CalendarClient`
- `app/(product)/calendar/CalendarClient.tsx` — client component
  - Stats strip: scheduled count, published last 30d, platforms active
  - List/calendar view toggle
  - `PostRow` — status icon, platform badge, content preview, pack link, inline reschedule form, cancel button
  - `CalendarGrid` — 7-day week view (Mon–Sun), prev/next/today navigation, dot indicators per platform, click-to-expand day panel
  - `ListView` — "Upcoming" (scheduled ASC) + "Recent" (published 30d DESC)
  - Optimistic local state: cancel filters record out, reschedule updates `scheduledFor` in place
- `app/api/publish/[recordId]/reschedule/route.ts` — PATCH endpoint
  - Validates date is in the future, updates `PublishRecord` scoped to `{ id, userId, status: "scheduled" }`

### Modified:
- `app/(product)/SidebarNavigation.tsx` — added Calendar nav item with `CalendarDays` icon (between All Packs and Billing)
- `middleware.ts` — added `/calendar` to `AUTH_PROTECTED_PREFIXES`

---

## Part E — What Still Needs Building

> **Part E** (not started — confirm scope before building)

Original spec mentioned Parts D and E but details were cut off before context reset.
**Ask user to confirm Part E scope before starting.**

---

## Key API Routes Summary

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/approve/[packId]/publish` | POST | token or session | Publish LinkedIn/X from approve page |
| `/api/publish/beehiiv` | POST | token or session | Create Beehiiv draft |
| `/api/settings/beehiiv` | POST | session | Save Beehiiv credentials |
| `/api/settings/beehiiv` | DELETE | session | Disconnect Beehiiv |
| `/api/feeds` | GET/POST | session | List/add RSS feeds |
| `/api/feeds/[id]` | PATCH/DELETE | session | Update/remove feed |
| `/api/cron/rss` | GET | CRON_SECRET | Daily RSS check |
| `/api/cron/rss/trigger` | POST | admin session | Manual RSS trigger |

## Key Lib Files

| File | Purpose |
|---|---|
| `lib/publishers/beehiiv.ts` | Beehiiv API client |
| `lib/publishers/linkedin.ts` | LinkedIn publish |
| `lib/publishers/x.ts` | X/Twitter publish |
| `lib/publishers/refresh.ts` | Token refresh for LinkedIn/X |
| `lib/rss/rss-monitor.service.ts` | RSS feed checking + pack generation |
| `lib/rss/rss-notifications.ts` | Email notifications (pack ready / needs transcript) |
| `lib/encryption.ts` | AES-256-GCM encrypt/decrypt for stored tokens |

## Environment Variables Required (all existing, no new ones added in Phase 3)

- `NEXTAUTH_SECRET` — NextAuth JWT
- `TOKEN_ENCRYPTION_KEY` — 32-byte base64 key for AES-256-GCM
- `RESEND_API_KEY` — email sending
- `NEXT_PUBLIC_APP_URL` — used in email links (e.g. `https://www.usekorel.com`)
- `DATABASE_URL` — Neon PostgreSQL pooled connection
- `OPENAI_API_KEY` — pack generation
