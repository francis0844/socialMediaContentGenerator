import "server-only";

import OpenAI from "openai";

import { getServerEnv } from "@/lib/env/server";

export function getOpenAIClient() {
  const env = getServerEnv();
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_NOT_CONFIGURED");
  }
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}
