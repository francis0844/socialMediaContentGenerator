import "server-only";

import OpenAI from "openai";

import { getServerEnv } from "@/lib/env/server";

export function getOpenAIClient() {
  const env = getServerEnv();
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}
