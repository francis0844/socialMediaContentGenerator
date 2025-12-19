import { z } from "zod";

import type { GraphicOutput } from "@/types/imagePromptTypes";

export type MarketingPromptInput = {
  brand: {
    name: string;
    niche?: string | null;
    targetAudience?: string | null;
    goals?: string | null;
    colors?: Record<string, unknown> | null;
    voice?: string | null;
  };
  content: GraphicOutput & { mainMessage?: string; cta?: string | null; keywordsAvoid?: string | null };
  imageIdea?: string | null;
  aspectRatio?: string | null;
  useBrandLogo?: boolean | null;
  references?: Array<{ label: string; kind: string }> | null;
  styleMimics?: Array<{ label: string }> | null;
};

function deriveCopy(input: MarketingPromptInput) {
  const headline = input.content.headline_options?.[0] ?? input.content.visual_concept ?? "On-brand offer";
  const subhead = input.content.caption ?? input.content.mainMessage ?? "Keep it short and clear.";
  const cta = input.content.cta ?? "Shop now";
  return { headline, subhead, cta };
}

export function buildMarketingGraphicPrompt(input: MarketingPromptInput) {
  const { brand, content, imageIdea, aspectRatio, useBrandLogo, references, styleMimics } = input;
  const { headline, subhead, cta } = deriveCopy(input);

  const refLines =
    references?.map((r) => `Reference (${r.kind}): ${r.label}`) ?? [];
  const styleLines = styleMimics?.map((s) => `Style sample: ${s.label}`) ?? [];

  const brandColors =
    brand.colors && typeof brand.colors === "object" ? JSON.stringify(brand.colors) : "Use brand colors if provided.";

  const lines = [
    "You are generating a vibrant marketing graphic for social media.",
    `Platform: ${content.platform ?? "social"}. Aspect ratio: ${aspectRatio ?? "1:1"}.`,
    `Headline on image: ${headline}`,
    `Subhead on image: ${subhead}`,
    `CTA on image: ${cta} (make it button-like or emphasized).`,
    `Brand: ${brand.name}`,
    brand.niche ? `Niche: ${brand.niche}` : null,
    brand.targetAudience ? `Target audience: ${brand.targetAudience}` : null,
    brand.goals ? `Goals: ${brand.goals}` : null,
    brand.voice ? `Tone/voice: ${brand.voice}` : "Use the brand voice.",
    `Brand colors: ${brandColors}`,
    content.visual_concept ? `Visual concept: ${content.visual_concept}` : null,
    imageIdea ? `Extra image direction: ${imageIdea}` : null,
    useBrandLogo === false ? "Do NOT place the logo." : "Include the brand logo unless told otherwise.",
    refLines.length ? `Product/mockup references:\n${refLines.join("\n")}` : null,
    styleLines.length ? `Style samples to mimic vibe (not copy trademarks):\n${styleLines.join("\n")}` : null,
    content.keywordsAvoid ? `Avoid: ${content.keywordsAvoid}` : null,
    "Layout guidance: keep safe margins; avoid text touching edges; ensure legible contrast between text and background; place CTA with clear separation.",
    "If product/mockup images exist, feature them prominently.",
    "Mimic the composition/typography vibe of style samples without copying logos or trademarks.",
    "No NSFW, explicit, or unsafe content.",
  ]
    .filter(Boolean)
    .join("\n");

  return lines;
}
