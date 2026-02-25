import { PrismaClient } from "@prisma/client";

const BATCH_SIZE = 500;

type CountMap = Record<string, number>;

type Args = {
  force: boolean;
  wipe: boolean;
};

function parseArgs(): Args {
  const args = new Set(process.argv.slice(2));
  return {
    force: args.has("--force"),
    wipe: args.has("--wipe"),
  };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function getCounts(client: PrismaClient): Promise<CountMap> {
  const [
    user,
    authorityPack,
    authorityPackRepurpose,
    supportTicket,
    usage,
    subscription,
    account,
    session,
    verificationToken,
  ] = await Promise.all([
    client.user.count(),
    client.authorityPack.count(),
    client.authorityPackRepurpose.count(),
    client.supportTicket.count(),
    client.usage.count(),
    client.subscription.count(),
    client.account.count(),
    client.session.count(),
    client.verificationToken.count(),
  ]);

  return {
    User: user,
    AuthorityPack: authorityPack,
    AuthorityPackRepurpose: authorityPackRepurpose,
    SupportTicket: supportTicket,
    Usage: usage,
    Subscription: subscription,
    Account: account,
    Session: session,
    VerificationToken: verificationToken,
  };
}

function sumCounts(counts: CountMap): number {
  return Object.values(counts).reduce((sum, value) => sum + value, 0);
}

async function wipeTarget(client: PrismaClient): Promise<void> {
  // Delete in reverse dependency order
  await client.authorityPackRepurpose.deleteMany();
  await client.authorityPack.deleteMany();
  await client.supportTicket.deleteMany();
  await client.usage.deleteMany();
  await client.subscription.deleteMany();
  await client.account.deleteMany();
  await client.session.deleteMany();
  await client.verificationToken.deleteMany();
  await client.user.deleteMany();
}

async function copyInBatches<T>(
  label: string,
  fetchBatch: (skip: number, take: number) => Promise<T[]>,
  insertBatch: (rows: T[]) => Promise<void>,
): Promise<number> {
  let skip = 0;
  let total = 0;
  while (true) {
    const rows = await fetchBatch(skip, BATCH_SIZE);
    if (!rows.length) break;
    await insertBatch(rows);
    total += rows.length;
    skip += rows.length;
    console.log(`[migrate] ${label}: copied ${total}`);
  }
  return total;
}

async function main() {
  const { force, wipe } = parseArgs();

  const sourceUrl = requireEnv("SQLITE_DATABASE_URL");
  const targetUrl = process.env.POSTGRES_DATABASE_URL || requireEnv("DATABASE_URL");

  if (sourceUrl === targetUrl) {
    throw new Error("Source and target DATABASE_URL are the same.");
  }

  const source = new PrismaClient({ datasourceUrl: sourceUrl });
  const target = new PrismaClient({ datasourceUrl: targetUrl });

  try {
    const sourceCounts = await getCounts(source);
    const targetCountsBefore = await getCounts(target);

    if (sumCounts(sourceCounts) === 0) {
      throw new Error("Source database is empty. Aborting.");
    }

    if (sumCounts(targetCountsBefore) > 0 && !force && !wipe) {
      throw new Error("Target database is not empty. Use --force or --wipe.");
    }

    if (wipe) {
      console.log("[migrate] Wiping target database...");
      await wipeTarget(target);
    }

    const effectiveTargetCountsBefore = wipe ? await getCounts(target) : targetCountsBefore;

    console.log("[migrate] Copying tables...");

    await copyInBatches(
      "User",
      (skip, take) => source.user.findMany({ skip, take, orderBy: { id: "asc" } }),
      (rows) => target.user.createMany({ data: rows as any[] }),
    );

    await copyInBatches(
      "AuthorityPack",
      (skip, take) => source.authorityPack.findMany({ skip, take, orderBy: { id: "asc" } }),
      (rows) => target.authorityPack.createMany({ data: rows as any[] }),
    );

    await copyInBatches(
      "AuthorityPackRepurpose",
      (skip, take) =>
        source.authorityPackRepurpose.findMany({ skip, take, orderBy: { id: "asc" } }),
      (rows) => target.authorityPackRepurpose.createMany({ data: rows as any[] }),
    );

    await copyInBatches(
      "SupportTicket",
      (skip, take) => source.supportTicket.findMany({ skip, take, orderBy: { id: "asc" } }),
      (rows) => target.supportTicket.createMany({ data: rows as any[] }),
    );

    await copyInBatches(
      "Usage",
      (skip, take) => source.usage.findMany({ skip, take, orderBy: { id: "asc" } }),
      (rows) => target.usage.createMany({ data: rows as any[] }),
    );

    await copyInBatches(
      "Subscription",
      (skip, take) => source.subscription.findMany({ skip, take, orderBy: { id: "asc" } }),
      (rows) => target.subscription.createMany({ data: rows as any[] }),
    );

    await copyInBatches(
      "Account",
      (skip, take) => source.account.findMany({ skip, take, orderBy: { id: "asc" } }),
      (rows) => target.account.createMany({ data: rows as any[] }),
    );

    await copyInBatches(
      "Session",
      (skip, take) => source.session.findMany({ skip, take, orderBy: { id: "asc" } }),
      (rows) => target.session.createMany({ data: rows as any[] }),
    );

    await copyInBatches(
      "VerificationToken",
      (skip, take) => source.verificationToken.findMany({ skip, take, orderBy: { token: "asc" } }),
      (rows) => target.verificationToken.createMany({ data: rows as any[] }),
    );

    const targetCountsAfter = await getCounts(target);
    const mismatches: string[] = [];

    for (const [table, sourceCount] of Object.entries(sourceCounts)) {
      const before = effectiveTargetCountsBefore[table] ?? 0;
      const after = targetCountsAfter[table] ?? 0;
      const delta = after - before;
      if (delta !== sourceCount) {
        mismatches.push(`${table} (source ${sourceCount}, inserted ${delta})`);
      }
    }

    if (mismatches.length > 0) {
      throw new Error(`Count mismatch: ${mismatches.join(", ")}`);
    }

    console.log("[migrate] Success. Row counts match.");
  } finally {
    await source.$disconnect();
    await target.$disconnect();
  }
}

main().catch((err) => {
  console.error(`[migrate] Failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
