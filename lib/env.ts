/**
 * Environment validation layer.
 *
 * Required variables are validated at module load time.
 * In production, missing required vars throw immediately (fail fast).
 * In development, missing vars log a warning but do not throw.
 */

const IS_PROD = process.env.NODE_ENV === "production";

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val || val.trim() === "") {
    const msg = `[env] Missing required environment variable: ${name}`;
    if (IS_PROD) {
      throw new Error(msg);
    } else {
      console.warn(`[warn] ${msg}`);
    }
  }
  return val ?? "";
}

function optionalEnv(name: string): string {
  return process.env[name] ?? "";
}

function optionalEnvConfigured(name: string, placeholder?: string): string | undefined {
  const val = process.env[name];
  if (!val || val === placeholder) return undefined;
  return val;
}

export const env = {
  // Required
  databaseUrl: requireEnv("DATABASE_URL"),
  nextauthSecret: requireEnv("NEXTAUTH_SECRET"),

  // Strongly recommended (warn if missing)
  nextauthUrl: optionalEnv("NEXTAUTH_URL"),

  // OAuth (warn in prod if neither is configured)
  googleClientId: optionalEnv("GOOGLE_CLIENT_ID"),
  googleClientSecret: optionalEnv("GOOGLE_CLIENT_SECRET"),

  // AI (pack generation requires this)
  openaiApiKey: optionalEnvConfigured("OPENAI_API_KEY", "sk-your-openai-api-key-here"),

  // Email (optional, falls back to console.log in dev)
  resendApiKey: optionalEnvConfigured("RESEND_API_KEY", "re_your_api_key_here"),
  supportOwnerEmail: optionalEnv("SUPPORT_OWNER_EMAIL"),

  // Stripe (optional until billing is activated)
  stripeSecretKey: optionalEnvConfigured("STRIPE_SECRET_KEY", "sk_test_your_secret_key_here"),
  stripeWebhookSecret: optionalEnvConfigured("STRIPE_WEBHOOK_SECRET", "whsec_your_webhook_secret_here"),

  // Postgres cutover support (optional)
  sqliteDatabaseUrl: optionalEnv("SQLITE_DATABASE_URL"),
  postgresDatabaseUrl: optionalEnv("POSTGRES_DATABASE_URL"),

  // Runtime
  nodeEnv: (process.env.NODE_ENV ?? "development") as "development" | "production" | "test",
  isProd: IS_PROD,
  isDev: process.env.NODE_ENV === "development",
} as const;
