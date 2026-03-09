import Anthropic from "@anthropic-ai/sdk";

const globalForAnthropic = global as unknown as { anthropic: Anthropic };

function createClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export const anthropic = globalForAnthropic.anthropic ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForAnthropic.anthropic = anthropic;
}
