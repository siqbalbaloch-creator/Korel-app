// lib/openai.ts

import "server-only";
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY?.trim();

if (!apiKey) {
  throw new Error("OPENAI_API_KEY is not set in environment variables.");
}

export const openai = new OpenAI({
  apiKey,
});
