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
    "Memory summary should be a growing list of short bullet preference statements derived ONLY from the user's reason.",
    "Do not add new details or inferred rationale. Avoid platform-specific mentions unless explicitly stated by the user.",
    "Each bullet should start with 'User prefers...' or 'User avoids...'. Keep each bullet to one sentence.",
    "Do NOT merge, dedupe, or rewrite prior bullets. Preserve all existing bullets and add exactly one new bullet per feedback.",
    "Return ONLY valid JSON.",
    'Schema: {"memory_summary":"...","user_response":"..."}',
    'user_response should be a friendly 1-2 sentence reply that sounds human. Start with a learning statement like "I learned that..." or "I will prioritize...". Then state a generalized learning (a preference statement like "I will favor vibrant, high-contrast visuals" or "I will avoid long captions") and how you will apply it next time. Do NOT repeat or paraphrase the user\'s reason verbatim.',
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
    "If decision is accept, add exactly one 'User prefers...' bullet that mirrors the user's reason.",
    "If decision is reject, add exactly one 'User avoids...' bullet that mirrors the user's reason.",
    "The new bullet must explicitly mention the key issue(s) from the reason (e.g., text accuracy, readability, tone). Do not generalize beyond the reason.",
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

export async function removeMemoryPreferenceByText(params: {
  previousSummary: string;
  preferenceText: string;
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
    "Remove the preference line below from the memory summary.",
    "Do NOT add new preferences. Only remove or soften conflicting items.",
    "",
    `Preference to remove: ${params.preferenceText}`,
    "",
    `Previous summary:\n${params.previousSummary || "(none)"}`,
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
