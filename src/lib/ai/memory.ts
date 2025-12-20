import "server-only";

import { getOpenAIClient } from "@/lib/ai/client";
import { getServerEnv } from "@/lib/env/server";

type MemoryResponseResult = {
  user_response: string;
};

type MemorySummaryResult = {
  memory_summary: string;
  user_response: string;
};

function buildPreferenceBullet(decision: "accept" | "reject", reason: string) {
  let text = reason.trim();
  text = text.replace(/^reason:\s*/i, "");
  text = text.replace(/^i\s+(do\s+not|don't)\s+like\s+/i, "");
  text = text.replace(/^i\s+like\s+/i, "");
  text = text.replace(/^because\s+/i, "");
  text = text.replace(/\s+/g, " ");
  text = text.replace(/[.?!]+$/g, "");

  const prefix = decision === "reject" ? "User avoids " : "User prefers ";
  if (!text) {
    return `${prefix}this approach.`;
  }
  return `${prefix}${text}.`;
}

export async function updateMemorySummary(params: {
  previousSummary: string;
  decision: "accept" | "reject";
  reason: string;
}) {
  const env = getServerEnv();
  const client = getOpenAIClient();

  const system = [
    "You maintain a compact per-account memory summary for a social content generator.",
    "Only store style/voice/tone/structure/topic preferences. Never store personal data.",
    "Return ONLY valid JSON.",
    'Schema: {"user_response":"..."}',
    'user_response should be a friendly 1-2 sentence reply that sounds human. Start with a learning statement like "I learned that..." or "I will prioritize...". Then state how you will apply it next time. Do NOT repeat or paraphrase the user\'s reason verbatim.',
  ].join("\n");

  const user = [
    "Write a brief response acknowledging what was learned from the user's reason.",
    "",
    `Feedback decision: ${params.decision}`,
    `Reason: ${params.reason}`,
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
  const json = JSON.parse(text) as Partial<MemoryResponseResult>;
  const user_response = (json.user_response ?? "").trim();

  if (!user_response) throw new Error("MEMORY_RESPONSE_FAILED");

  const bullet = buildPreferenceBullet(params.decision, params.reason);

  const nextSummary = [params.previousSummary.trim(), `- ${bullet}`]
    .filter(Boolean)
    .join("\n")
    .slice(0, 1200);

  return {
    memorySummary: nextSummary,
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
  const json = JSON.parse(text) as Partial<MemorySummaryResult>;
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
  const json = JSON.parse(text) as Partial<MemorySummaryResult>;
  const memory_summary = (json.memory_summary ?? "").trim();
  const user_response = (json.user_response ?? "").trim();

  if (!memory_summary) throw new Error("MEMORY_UPDATE_FAILED");
  if (!user_response) throw new Error("MEMORY_RESPONSE_FAILED");

  return {
    memorySummary: memory_summary.slice(0, 1200),
    aiResponse: user_response.slice(0, 400),
  };
}
