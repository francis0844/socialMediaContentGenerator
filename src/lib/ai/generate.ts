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

export const tonePresetSchema = z.enum([
  "professional",
  "friendly",
  "bold",
  "playful",
  "inspirational",
  "brand_voice",
]);

export const captionLengthSchema = z.enum(["short", "medium", "long"]);

const hashtagsSchema = z.object({
  mode: z.enum(["optional", "required"]).default("required"),
  count: z.number().int().min(1).max(30).default(8),
});

const directionSchema = z.object({
  mainMessage: z.string().min(1),
  tone: tonePresetSchema.default("brand_voice"),
  captionLength: captionLengthSchema.default("medium"),
  hashtags: hashtagsSchema.default({ mode: "required", count: 8 }),
  keywordsInclude: z.string().optional().nullable(),
  keywordsAvoid: z.string().optional().nullable(),
  cta: z.string().optional().nullable(),
  imageIdea: z.string().optional().nullable(),
  aspectRatio: z.enum(["1:1", "4:5", "9:16"]).optional().nullable(),
  useBrandLogo: z.boolean().optional().nullable(),
  references: z
    .array(
      z.object({
        mediaAssetId: z.string().min(1),
        label: z.string().min(1),
        kind: z.enum(["PRODUCT_MOCKUP", "STYLE_MIMIC", "LOGO_OVERRIDE"]),
      }),
    )
    .optional()
    .nullable(),
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

function clampContext(text: string, maxChars: number) {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return trimmed.slice(0, maxChars);
}

function buildPrompt(input: GenerationInput) {
  const { contentType, platform, direction, brand, memorySummary } = input;

  const system = [
    "You are a social media content generator for businesses.",
    "Return ONLY valid JSON. Do not wrap in markdown.",
    "Follow the required schema exactly for the selected content type.",
    "No sensitive personal data. Keep outputs brand-safe and platform-appropriate.",
    "Hard safety rules: no explicit sexual content, no NSFW content, no hate or harassment, no content involving minors in a sexual context.",
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
    `Tone: ${direction.tone === "brand_voice" ? "Use the brand voice" : direction.tone}`,
    `Caption length: ${direction.captionLength}`,
    direction.keywordsInclude
      ? `Keywords to include: ${direction.keywordsInclude}`
      : null,
    direction.keywordsAvoid ? `Words/topics to avoid: ${direction.keywordsAvoid}` : null,
    direction.cta ? `Call-to-action preference: ${direction.cta}` : null,
    `Hashtags: required on all platforms. Mode: ${direction.hashtags.mode}. Aim for ${direction.hashtags.count}.`,
  ]
    .filter(Boolean)
    .join("\n");

  const memoryBlock = memorySummary?.trim()
    ? `Memory summary (what has worked/failed so far):\n${clampContext(memorySummary, 1200)}`
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

  const maxAttempts = 3;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model: env.OPENAI_MODEL,
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content:
              attempt === 1
                ? user
                : `${user}\n\nIMPORTANT: Your last response did not match the required schema. Fix it and return ONLY valid JSON.`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: attempt === 1 ? 0.7 : 0.4,
      });

      const text = completion.choices[0]?.message?.content ?? "{}";
      const parsedJson = JSON.parse(text);
      const output = aiOutputSchema.parse(parsedJson);

      if (input.direction.hashtags.mode === "required" && output.hashtags.length === 0) {
        throw new Error("HASHTAGS_REQUIRED");
      }

      return output;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("AI_SCHEMA_VALIDATION_FAILED");
}

export const generationDirectionSchema = directionSchema;
