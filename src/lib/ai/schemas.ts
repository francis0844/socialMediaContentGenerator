import { z } from "zod";

export const socialPlatformSchema = z.enum(["facebook", "instagram", "pinterest", "x"]);

export const contentTypeSchema = z.enum(["graphic", "story", "text", "video"]);

export const graphicOutputSchema = z.object({
  type: z.literal("graphic"),
  platform: socialPlatformSchema,
  visual_concept: z.string().min(1),
  headline_options: z.array(z.string().min(1)).min(1),
  caption: z.string().min(1),
  hashtags: z.array(z.string().min(1)).default([]),
  alt_text: z.string().optional(),
});

export const storyOutputSchema = z.object({
  type: z.literal("story"),
  platform: socialPlatformSchema,
  frames: z
    .array(
      z.object({
        frame: z.number().int().min(1),
        on_screen_text: z.string().min(1),
      }),
    )
    .min(3)
    .max(6),
  caption: z.string().min(1),
  hashtags: z.array(z.string().min(1)).default([]),
});

export const textOutputSchema = z.object({
  type: z.literal("text"),
  platform: socialPlatformSchema,
  post_body: z.string().min(1),
  caption: z.string().min(1),
  hashtags: z.array(z.string().min(1)).default([]),
});

export const videoOutputSchema = z.object({
  type: z.literal("video"),
  platform: socialPlatformSchema,
  hook: z.string().min(1),
  scene_beats: z.array(z.string().min(1)).min(3),
  on_screen_text: z.array(z.string().min(1)).min(2),
  suggested_broll: z.array(z.string().min(1)).min(2),
  cta: z.string().min(1),
  caption: z.string().min(1),
  hashtags: z.array(z.string().min(1)).default([]),
});

export const aiOutputSchema = z.discriminatedUnion("type", [
  graphicOutputSchema,
  storyOutputSchema,
  textOutputSchema,
  videoOutputSchema,
]);

export type AIOutput = z.infer<typeof aiOutputSchema>;
