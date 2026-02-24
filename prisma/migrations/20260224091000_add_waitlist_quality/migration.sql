-- AlterTable: add interestQuality column to WaitlistEntry
ALTER TABLE "WaitlistEntry" ADD COLUMN "interestQuality" TEXT NOT NULL DEFAULT 'UNREVIEWED';
