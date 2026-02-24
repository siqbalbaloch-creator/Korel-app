-- CreateTable
CREATE TABLE "AuthorityProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "coreThesis" TEXT,
    "positioning" TEXT,
    "targetAudience" TEXT,
    "tone" TEXT NOT NULL DEFAULT 'MEASURED',
    "toneNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AuthorityProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthorityProfile_userId_key" ON "AuthorityProfile"("userId");
