-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AuthorityPack" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "originalInput" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inputType" TEXT NOT NULL DEFAULT 'INTERVIEW',
    "angle" TEXT NOT NULL DEFAULT 'THOUGHT_LEADERSHIP',
    "coreThesis" JSONB,
    "strategicHooks" JSONB,
    "highLeveragePosts" JSONB,
    "insightBreakdown" JSONB,
    "repurposingMatrix" JSONB,
    "executiveSummary" JSONB,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "regenerationCount" INTEGER NOT NULL DEFAULT 0,
    "lastGeneratedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "qualityScore" REAL,
    "qualityBreakdown" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuthorityPack_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AuthorityPack" ("coreThesis", "createdAt", "executiveSummary", "highLeveragePosts", "id", "inputType", "insightBreakdown", "lastGeneratedAt", "originalInput", "published", "publishedAt", "qualityBreakdown", "qualityScore", "regenerationCount", "repurposingMatrix", "status", "strategicHooks", "title", "userId") SELECT "coreThesis", "createdAt", "executiveSummary", "highLeveragePosts", "id", "inputType", "insightBreakdown", "lastGeneratedAt", "originalInput", "published", "publishedAt", "qualityBreakdown", "qualityScore", "regenerationCount", "repurposingMatrix", "status", "strategicHooks", "title", "userId" FROM "AuthorityPack";
DROP TABLE "AuthorityPack";
ALTER TABLE "new_AuthorityPack" RENAME TO "AuthorityPack";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
