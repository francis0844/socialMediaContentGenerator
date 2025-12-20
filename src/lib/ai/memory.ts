import "server-only";

import { getOpenAIClient } from "@/lib/ai/client";
import { getServerEnv } from "@/lib/env/server";

type MemoryUpdateResult = {
  memory_summary: string;
  user_response: string;
};

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
    "Keep it short and actionable (max ~10 bullet lines, <= 1200 characters).",
    "Return ONLY valid JSON.",
    'Schema: {"memory_summary":"...","user_response":"..."}',
    'user_response should be a friendly 1-2 sentence reply that sounds human and starts with either "I like this content..." or "I don\'t like this content..." followed by what was learned and why.',
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
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const text = completion.choices[0]?.message?.content ?? "{}";
  const json = JSON.parse(text) as Partial<MemoryUpdateResult>;
  const memory_summary = (json.memory_summary ?? "").trim();
  const user_response = (json.user_response ?? "").trim();

  if (!memory_summary) throw new Error("MEMORY_UPDATE_FAILED");
  if (!user_response) throw new Error("MEMORY_RESPONSE_FAILED");

  return {
    memorySummary: memory_summary.slice(0, 1200),
    aiResponse: user_response.slice(0, 400),
  };
}

export async function removeMemoryPreference(params: {
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
    "Keep it short and actionable (max ~10 bullet lines, <= 1200 characters).",
    "Return ONLY valid JSON.",
    'Schema: {"memory_summary":"...","user_response":"..."}',
    'user_response should be a friendly 1-2 sentence reply that sounds human and starts with "I removed that preference..." and confirms what changed.',
  ].join("\n");

  const user = [
    "Remove preferences learned from the feedback below from the memory summary.",
    "Do NOT add new preferences. Only remove or soften conflicting items.",
    "",
    `Previous summary:\n${params.previousSummary || "(none)"}`,
    "",
    `Feedback decision to remove: ${params.decision}`,
    `Reason to remove: ${params.reason}`,
    `Content type: ${params.contentType}`,
    `Platform: ${params.platform}`,
    `Output JSON: ${JSON.stringify(params.outputJson)}`,
    "",
    "Produce the updated summary.",
  ].join("\n");

  const completion = await client.chat.completions.create({
    model: env.OPENAI_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const text = completion.choices[0]?.message?.content ?? "{}";
  const json = JSON.parse(text) as Partial<MemoryUpdateResult>;
  const memory_summary = (json.memory_summary ?? "").trim();
  const user_response = (json.user_response ?? "").trim();

  if (!memory_summary) throw new Error("MEMORY_UPDATE_FAILED");
  if (!user_response) throw new Error("MEMORY_RESPONSE_FAILED");

  return {
    memorySummary: memory_summary.slice(0, 1200),
    aiResponse: user_response.slice(0, 400),
  };
}
