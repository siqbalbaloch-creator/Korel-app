import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var sqliteAdapter: PrismaBetterSqlite3 | undefined;
}

const databaseUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter =
  global.sqliteAdapter ?? new PrismaBetterSqlite3({ url: databaseUrl });

export const prisma =
  global.prisma ||
  new PrismaClient({
    adapter,
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
  global.sqliteAdapter = adapter;
}
