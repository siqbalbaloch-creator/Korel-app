export type DeploymentFingerprint = {
  nodeVersion: string;
  nodeEnv: string;
  databaseProvider: string;
  buildId?: string;
  commitHash?: string;
};

function detectProvider(databaseUrl?: string): string {
  if (!databaseUrl) return "unknown";
  const lower = databaseUrl.toLowerCase();
  if (lower.startsWith("postgres")) return "postgresql";
  if (lower.startsWith("file:")) return "sqlite";
  return "unknown";
}

export async function getDeploymentFingerprint(): Promise<DeploymentFingerprint> {
  const databaseUrl = process.env.DATABASE_URL;
  const buildId = process.env.BUILD_ID || process.env.VERCEL_DEPLOYMENT_ID;
  const commitHash =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GIT_COMMIT_SHA ||
    process.env.SOURCE_VERSION;

  return {
    nodeVersion: process.version,
    nodeEnv: process.env.NODE_ENV ?? "development",
    databaseProvider: detectProvider(databaseUrl),
    buildId: buildId || undefined,
    commitHash: commitHash || undefined,
  };
}
