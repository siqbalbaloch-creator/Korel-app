-- CreateTable
CREATE TABLE "MarketingEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "eventType" TEXT NOT NULL,
    "meta" TEXT
);

-- CreateIndex
CREATE INDEX "MarketingEvent_eventType_idx" ON "MarketingEvent"("eventType");

-- CreateIndex
CREATE INDEX "MarketingEvent_createdAt_idx" ON "MarketingEvent"("createdAt");

-- CreateIndex
CREATE INDEX "MarketingEvent_sessionId_idx" ON "MarketingEvent"("sessionId");
