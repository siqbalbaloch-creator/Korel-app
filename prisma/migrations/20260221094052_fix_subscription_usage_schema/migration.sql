/*
  Warnings:

  - You are about to drop the column `stripePriceId` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `stripeSubscriptionId` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `packsGenerated` on the `Usage` table. All the data in the column will be lost.
  - You are about to alter the column `month` on the `Usage` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - Added the required column `updatedAt` to the `Usage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `Usage` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubId" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "status" TEXT NOT NULL DEFAULT 'none',
    "currentPeriodEnd" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Subscription" ("createdAt", "currentPeriodEnd", "id", "plan", "status", "stripeCustomerId", "updatedAt", "userId") SELECT "createdAt", "currentPeriodEnd", "id", "plan", "status", "stripeCustomerId", "updatedAt", "userId" FROM "Subscription";
DROP TABLE "Subscription";
ALTER TABLE "new_Subscription" RENAME TO "Subscription";
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");
CREATE UNIQUE INDEX "Subscription_stripeCustomerId_key" ON "Subscription"("stripeCustomerId");
CREATE UNIQUE INDEX "Subscription_stripeSubId_key" ON "Subscription"("stripeSubId");
CREATE TABLE "new_Usage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "packsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Usage" ("id", "month", "userId") SELECT "id", "month", "userId" FROM "Usage";
DROP TABLE "Usage";
ALTER TABLE "new_Usage" RENAME TO "Usage";
CREATE UNIQUE INDEX "Usage_userId_month_year_key" ON "Usage"("userId", "month", "year");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
