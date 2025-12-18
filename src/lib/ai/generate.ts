import "server-only";

import { z } from "zod";

import { getOpenAIClient } from "@/lib/ai/client";
import {
  AIOutput,
  aiOutputSchema,
  contentTypeSchema,
  socialPlatformSchema,
} from "@/lib/ai/schemas";
import { getServerEnv } from "@/lib/env/server";

const directionSchema = z.object({
  mainMessage: z.string().min(1),
  tone: z.string().optional(),
  captionLength: z.string().optional(),
  hashtags: z
    .object({
      enabled: z.boolean().default(true),
      count: z.number().int().min(0).max(30).default(8),
    })
    .optional(),
  keywordsInclude: z.string().optional(),
  keywordsAvoid: z.string().optional(),
  cta: z.string().optional(),
});

export type GenerationInput = {
  contentType: z.infer<typeof contentTypeSchema>;
  platform: z.infer<typeof socialPlatformSchema>;
  direction: z.infer<typeof directionSchema>;
  brand: {
    brandName: string;
    about: string;
    niche: string;
    targetAudience?: string | null;
    goals?: string | null;
    colors?: unknown | null;
    voiceMode?: string | null;
    voiceDocText?: string | null;
  };
  memorySummary: string;
};

function buildPrompt(input: GenerationInput) {
  const { contentType, platform, direction, brand, memorySummary } = input;

  const system = [
    "You are a social media content generator for businesses.",
    "Return ONLY valid JSON. Do not wrap in markdown.",
    "Follow the required schema exactly for the selected content type.",
    "No sensitive personal data. Keep outputs brand-safe and platform-appropriate.",
  ].join("\n");

  const brandBlock = [
    `Brand name: ${brand.brandName}`,
    `Niche/industry: ${brand.niche}`,
    `About: ${brand.about}`,
    brand.targetAudience ? `Target audience: ${brand.targetAudience}` : null,
    brand.goals ? `Goals: ${brand.goals}` : null,
    brand.voiceMode ? `Voice mode: ${brand.voiceMode}` : null,
    brand.voiceDocText ? `Brand voice doc: ${brand.voiceDocText}` : null,
    brand.colors ? `Brand colors (JSON): ${JSON.stringify(brand.colors)}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const directionBlock = [
    `Platform: ${platform}`,
    `Content type: ${contentType}`,
    `Main message/key idea: ${direction.mainMessage}`,
    direction.tone ? `Tone: ${direction.tone}` : null,
    direction.captionLength ? `Caption length: ${direction.captionLength}` : null,
    direction.keywordsInclude
      ? `Keywords to include: ${direction.keywordsInclude}`
      : null,
    direction.keywordsAvoid ? `Words/topics to avoid: ${direction.keywordsAvoid}` : null,
    direction.cta ? `Call-to-action preference: ${direction.cta}` : null,
    direction.hashtags
      ? `Hashtags: ${direction.hashtags.enabled ? `enabled (aim for ${direction.hashtags.count})` : "disabled"}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const memoryBlock = memorySummary?.trim()
    ? `Memory summary (what has worked/failed so far):\n${memorySummary.trim()}`
    : "Memory summary: (none yet)";

  const schemaHint = [
    "Output schema examples:",
    'graphic: {"type":"graphic","platform":"instagram","visual_concept":"...","headline_options":["..."],"caption":"...","hashtags":["#..."],"alt_text":"..."}',
    'story: {"type":"story","platform":"instagram","frames":[{"frame":1,"on_screen_text":"..."}],"caption":"...","hashtags":["#..."]}',
    'text: {"type":"text","platform":"x","post_body":"...","caption":"...","hashtags":["#..."]}',
    'video: {"type":"video","platform":"instagram","hook":"...","scene_beats":["..."],"on_screen_text":["..."],"suggested_broll":["..."],"cta":"...","caption":"...","hashtags":["#..."]}',
  ].join("\n");

  const user = [
    "Generate platform-ready content using the brand profile, direction, and memory summary.",
    "",
    brandBlock,
    "",
    directionBlock,
    "",
    memoryBlock,
    "",
    schemaHint,
  ].join("\n");

  return { system, user };
}

export async function generateAIOutput(input: GenerationInput): Promise<AIOutput> {
  const env = getServerEnv();
  const client = getOpenAIClient();
  const { system, user } = buildPrompt(input);

  const completion = await client.chat.completions.create({
    model: env.OPENAI_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const text = completion.choices[0]?.message?.content ?? "{}";
  const parsedJson = JSON.parse(text);
  return aiOutputSchema.parse(parsedJson);
}

export const generationDirectionSchema = directionSchema;
