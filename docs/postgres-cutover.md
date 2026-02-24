# Postgres Cutover Runbook

This runbook describes a controlled, low-risk cutover from SQLite to Postgres.
Scope: production only. No UI changes. No schema changes beyond provider switch.

## Preconditions
- All Prisma migrations are committed and applied in the current environment.
- `DATABASE_URL` is set for the target Postgres instance.
- `NEXTAUTH_SECRET` is set in the target environment.
- Deployment environment is confirmed (staging vs production).
- Backup / snapshot strategy is defined for both source and target.

## One-Time Postgres Bootstrap
1. Create the database and user (example):
   - `CREATE DATABASE korel_prod;`
   - `CREATE USER korel_user WITH PASSWORD '...';`
   - `GRANT ALL PRIVILEGES ON DATABASE korel_prod TO korel_user;`
2. Set `DATABASE_URL` to the Postgres connection string.
3. Set Prisma provider to `postgresql` in `prisma/schema.prisma`.
4. Run migrations:
   - `npx prisma migrate deploy`
5. Seed data (only if a seed script exists):
   - `npx prisma db seed`
6. Verify tables exist:
   - `npx prisma studio` or `psql` to confirm schema.

## Data Migration Plan (SQLite -> Postgres)
Two options:

### Option A: Prisma Script (recommended)
Pros: preserves IDs and timestamps, type-safe, deterministic.
Cons: slower for very large datasets.

- Set env vars:
  - `SQLITE_DATABASE_URL=file:./prisma/dev.db`
  - `POSTGRES_DATABASE_URL=postgresql://...`
- Run:
  - `node --no-warnings --loader ts-node/esm scripts/migrate-sqlite-to-postgres.ts`
  - If `ts-node` is not available: compile or run with `npx tsx`.

### Option B: sqlite3 dump + psql
Pros: fast for large datasets.
Cons: harder to preserve JSON and timestamps; risk of schema mismatch.

- `sqlite3 dev.db .dump > dump.sql`
- Manually adapt to Postgres syntax and import with `psql`.

## Verification Steps
Record counts for key tables (source vs target):
- User
- AuthorityPack
- AuthorityPackRepurpose
- SupportTicket
- Usage
- Subscription
- Account
- Session
- VerificationToken

Integrity checks:
- Orphaned rows (e.g., packs without users)
- Missing foreign keys
- Invalid enum values
- Spot-check JSON fields parse correctly (`coreThesis`, `strategicHooks`, `highLeveragePosts`)

## Rollback Plan
- If errors occur:
  - Revert `DATABASE_URL` to the previous DB.
  - Redeploy the previous build.
  - Restore the prior DB snapshot.
- Prisma has no down migrations by default:
  - Always take DB snapshots before `migrate deploy`.

## Production Cutover Sequence (Minimal Downtime)
1. Schedule a short maintenance window.
2. Pause deployments and avoid new writes during cutover.
3. Apply Postgres migrations (`prisma migrate deploy`).
4. Run data migration script (or import).
5. Switch `DATABASE_URL` to Postgres.
6. Deploy.
7. Run verification checks and spot tests.
8. Keep rollback plan ready (DB snapshot + env rollback).
