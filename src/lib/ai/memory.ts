import "server-only";

import { getOpenAIClient } from "@/lib/ai/client";
import { getServerEnv } from "@/lib/env/server";

export async function updateMemorySummary(params: {
  previousSummary: string;
  decision: "accept" | "reject";
  reason: string;
  contentType: string;
  platform: string;
  outputJson: unknown;
}) {
  const env = getServerEnv();
  const client = getOpenAIClient();

  const system = [
    "You maintain a compact per-account memory summary for a social content generator.",
    "Only store style/voice/tone/structure/topic preferences. Never store personal data.",
    "Keep it short and actionable (max ~10 bullet lines).",
    "Return plain text only.",
  ].join("\n");

  const user = [
    "Update the memory summary based on user feedback.",
    "",
    `Previous summary:\n${params.previousSummary || "(none)"}`,
    "",
    `Feedback decision: ${params.decision}`,
    `Reason: ${params.reason}`,
    `Content type: ${params.contentType}`,
    `Platform: ${params.platform}`,
    `Output JSON: ${JSON.stringify(params.outputJson)}`,
    "",
    "Produce the new updated summary.",
  ].join("\n");

  const completion = await client.chat.completions.create({
    model: env.OPENAI_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.2,
  });

  return (completion.choices[0]?.message?.content ?? "").trim();
}

