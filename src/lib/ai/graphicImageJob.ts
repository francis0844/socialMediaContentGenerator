"use server";

import { Buffer } from "node:buffer";

import { getGeminiImageClient } from "@/lib/ai/geminiImage";
import { prisma } from "@/lib/db";
import { log } from "@/lib/observability/log";
import { uploadImageBuffer } from "@/lib/uploads/uploadImageBuffer";
import type { graphicOutputSchema } from "@/lib/ai/schemas";
import type { z } from "zod";

type GraphicOutput = z.infer<typeof graphicOutputSchema>;

export async function triggerGraphicImageGeneration({
  contentId,
  accountId,
  platform,
  output,
}: {
  contentId: string;
  accountId: string;
  platform: string;
  output: GraphicOutput;
}) {
  // Mark generating
  await prisma.generatedContent.update({
    where: { id: contentId },
    data: { imageStatus: "generating", imageError: null },
  });

  try {
    const brand = await prisma.brandProfile.findUnique({ where: { accountId } });

    const promptParts = [
      `Create a branded social media graphic for ${platform}.`,
      `Aspect ratio: 1:1.`,
      `Visual concept: ${output.visual_concept}`,
      output.headline_options?.length ? `Headline: ${output.headline_options[0]}` : null,
      output.caption ? `Caption tone: ${output.caption}` : null,
      brand?.brandName ? `Brand: ${brand.brandName}` : null,
      brand?.niche ? `Niche: ${brand.niche}` : null,
      brand?.about ? `About: ${brand.about}` : null,
      brand?.colorsJson ? `Brand colors: ${JSON.stringify(brand.colorsJson)}` : null,
      "Do not include NSFW or unsafe content.",
    ]
      .filter(Boolean)
      .join("\n");

    const client = getGeminiImageClient();
    const result = await client.generate({
      prompt: promptParts,
      images: [],
    });

    const buffer = Buffer.from(result.dataBase64, "base64");
    const uploaded = await uploadImageBuffer(buffer, "generated-images");

    await prisma.generatedContent.update({
      where: { id: contentId },
      data: {
        imageStatus: "ready",
        imageUrl: uploaded.secure_url,
        imageModel: client.modelId,
        imageAspectRatio: "1:1",
        imageError: null,
      },
    });
  } catch (err) {
    log("error", "ai.image.generate.failed", { contentId, error: `${err}` });
    await prisma.generatedContent.update({
      where: { id: contentId },
      data: {
        imageStatus: "failed",
        imageError: err instanceof Error ? err.message.slice(0, 500) : "Image generation failed",
      },
    });
  }
}
