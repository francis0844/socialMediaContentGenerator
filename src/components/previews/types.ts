"use client";

import { z } from "zod";

import { aiOutputSchema, type AIOutput, socialPlatformSchema } from "@/lib/ai/schemas";

export type PreviewDevice = "desktop" | "mobile";
export type PreviewTheme = "light" | "dark";
export type PreviewPlatform = z.infer<typeof socialPlatformSchema>;

export const previewOutputSchema = aiOutputSchema;
export type PreviewOutput = AIOutput;

export type BrandPreviewProfile = {
  brandName: string;
  logoUrl: string | null;
  colors?: Array<{ name: string; hex: string }> | null;
};

export function normalizeHashtag(tag: string) {
  const trimmed = tag.trim();
  if (!trimmed) return "";
  const withoutLeading = trimmed.replace(/^#+/, "");
  return `#${withoutLeading}`;
}

export function formatCaptionWithHashtags(output: PreviewOutput) {
  const caption = output.caption?.trim() ?? "";
  const hashtags =
    output.hashtags?.map(normalizeHashtag).filter(Boolean) ?? [];
  const hashtagsText = hashtags.length ? `\n\n${hashtags.join(" ")}` : "";
  return `${caption}${hashtagsText}`.trim();
}

export function getVisualOverlay(output: PreviewOutput) {
  if (output.type === "graphic") return output.visual_concept;
  return null;
}

export function toHandle(name: string) {
  const raw = name.trim().toLowerCase();
  const cleaned = raw.replace(/[^a-z0-9_ ]/g, "").replace(/\s+/g, "_");
  return cleaned ? `@${cleaned}` : "@brand";
}

