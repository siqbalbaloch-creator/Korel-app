-- Paddle billing migration
-- 1. Add STARTER + PROFESSIONAL to Plan enum
-- 2. Backfill existing PRO rows -> STARTER (PRO was labelled "Starter" in UI at $49)
-- 3. Remove PRO from Plan enum
-- 4. Rename Stripe-specific columns on Subscription to Paddle equivalents

-- Postgres requires a multi-step dance to remove an enum value safely.

BEGIN;

-- 1. Add the new enum values
ALTER TYPE "Plan" ADD VALUE IF NOT EXISTS 'STARTER';
ALTER TYPE "Plan" ADD VALUE IF NOT EXISTS 'PROFESSIONAL';

COMMIT;

BEGIN;

-- 2. Backfill existing PRO -> STARTER
UPDATE "Subscription" SET "plan" = 'STARTER' WHERE "plan" = 'PRO';

-- 3. Rebuild the Plan enum without PRO
ALTER TYPE "Plan" RENAME TO "Plan_old";
CREATE TYPE "Plan" AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE');
ALTER TABLE "Subscription" ALTER COLUMN "plan" DROP DEFAULT;
ALTER TABLE "Subscription"
  ALTER COLUMN "plan" TYPE "Plan"
  USING ("plan"::text::"Plan");
ALTER TABLE "Subscription" ALTER COLUMN "plan" SET DEFAULT 'FREE';
DROP TYPE "Plan_old";

-- 4. Swap Stripe columns for Paddle columns on Subscription.
--    (Stripe was never live — UAE-blocked — so there is no production data to preserve.)
ALTER TABLE "Subscription" DROP CONSTRAINT IF EXISTS "Subscription_stripeCustomerId_key";
ALTER TABLE "Subscription" DROP CONSTRAINT IF EXISTS "Subscription_stripeSubId_key";
ALTER TABLE "Subscription" DROP COLUMN IF EXISTS "stripeCustomerId";
ALTER TABLE "Subscription" DROP COLUMN IF EXISTS "stripeSubId";

ALTER TABLE "Subscription" ADD COLUMN "paddleCustomerId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "paddleSubscriptionId" TEXT;

CREATE UNIQUE INDEX "Subscription_paddleCustomerId_key"
  ON "Subscription"("paddleCustomerId");
CREATE UNIQUE INDEX "Subscription_paddleSubscriptionId_key"
  ON "Subscription"("paddleSubscriptionId");

COMMIT;
