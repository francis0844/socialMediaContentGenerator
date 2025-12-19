"use server";

import { Buffer } from "node:buffer";

import { Redis } from "@upstash/redis";

import { getGeminiImageClient } from "@/lib/ai/geminiImage";
import { prisma } from "@/lib/db";
import { getServerEnv } from "@/lib/env/server";
import { log } from "@/lib/observability/log";
import { uploadImageBuffer } from "@/lib/uploads/uploadImageBuffer";
import { buildMarketingGraphicPrompt } from "@/lib/ai/marketingGraphicPrompt";
import type { GraphicOutput } from "@/types/imagePromptTypes";
import { appConfig } from "@/lib/config";

const QUEUE_KEY = "image:queue";

function getRedis() {
  const env = getServerEnv();
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) return null;
  return new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export async function enqueueImageJob(params: { jobId: string }) {
  const redis = getRedis();
  if (!redis) {
    // No redis available; process inline as fallback
    await processJob(params.jobId);
    return;
  }
  await redis.rpush(QUEUE_KEY, params.jobId);
}

export async function processImageQueue() {
  const redis = getRedis();
  if (!redis) return;
  const jobId = await redis.lpop<string>(QUEUE_KEY);
  if (!jobId) return;
  await processJob(jobId);
}

async function processJob(jobId: string) {
  const job = await prisma.imageJob.findUnique({
    where: { id: jobId },
    include: { generatedContent: { include: { account: true, request: true } } },
  });
  if (!job) return;
  if (job.status === "SUCCEEDED") return;
  if (job.attempts >= appConfig.queue.maxAttempts) return;

  const content = job.generatedContent;
  if (!content || content.imageStatus === "ready") return;
  if (content.request.contentType !== "graphic") return;

  const attempt = job.attempts + 1;
  await prisma.imageJob.update({
    where: { id: jobId },
    data: { status: "RUNNING", attempts: attempt },
  });

  try {
    const output = content.output as GraphicOutput;
    const reqDir = content.request.direction as any;

    const brand = await prisma.brandProfile.findUnique({ where: { accountId: content.accountId } });
    const prompt = buildMarketingGraphicPrompt({
      brand: {
        name: brand?.brandName ?? "Brand",
        niche: brand?.niche,
        targetAudience: brand?.targetAudience,
        goals: brand?.goals,
        colors: (brand?.colorsJson as any) ?? null,
        voice: brand?.voiceMode ? `voice:${brand.voiceMode}` : null,
      },
      content: {
        ...output,
        mainMessage: reqDir?.mainMessage ?? "",
        cta: reqDir?.cta ?? null,
        keywordsAvoid: reqDir?.keywordsAvoid ?? null,
        platform: output.platform,
      },
      imageIdea: reqDir?.imageIdea ?? null,
      aspectRatio: reqDir?.aspectRatio ?? "1:1",
      useBrandLogo: reqDir?.useBrandLogo ?? true,
      references: (reqDir?.references as any)?.map((r: any) => ({
        label: r.label ?? "",
        kind: r.kind ?? "",
      })),
      styleMimics: (reqDir?.references as any)?.filter((r: any) => r.kind === "STYLE_MIMIC"),
    });

    const client = getGeminiImageClient();
    const result = await client.generate({
      prompt,
      images: [], // references can be added in future when wiring refs
    });

    const uploaded = await uploadImageBuffer(result.bytes, "generated-images");

    const media = await prisma.mediaAsset.create({
      data: {
        accountId: content.accountId,
        type: "GENERATED_IMAGE",
        storageProvider: "CLOUDINARY",
        url: uploaded.secure_url,
        thumbnailUrl: null,
        mimeType: result.mimeType,
        width: null,
        height: null,
      },
    });

    await prisma.generatedContent.update({
      where: { id: content.id },
      data: {
        imageStatus: "ready",
        primaryImageAssetId: media.id,
        imageUrl: uploaded.secure_url,
        imageModel: client.modelId,
        imageModelId: client.modelId,
        imagePrompt: prompt,
        imageError: null,
      },
    });

    await prisma.imageJob.update({
      where: { id: jobId },
      data: { status: "SUCCEEDED", lastError: null },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "IMAGE_JOB_FAILED";
    log("error", "image.job.failed", { jobId, error: message });
    const failed = attempt >= appConfig.queue.maxAttempts;

    await prisma.imageJob.update({
      where: { id: jobId },
      data: {
        status: failed ? "FAILED" : "QUEUED",
        lastError: message.slice(0, 500),
      },
    });

    await prisma.generatedContent.update({
      where: { id: content.id },
      data: {
        imageStatus: failed ? "failed" : "generating",
        imageError: failed ? "Image generation failed. Please retry." : null,
      },
    });

    if (!failed) {
      const redis = getRedis();
      if (redis) {
        const delay = Math.min(
          appConfig.queue.backoffMaxMs,
          appConfig.queue.backoffBaseMs * attempt * attempt,
        );
        setTimeout(() => {
          redis.rpush(QUEUE_KEY, jobId).catch(() => {});
        }, delay);
      } else {
        await processJob(jobId);
      }
    }
  }
}

function buildImagePrompt(output: any, accountId: string) {
  const visual = output?.visual_concept ?? "Branded social graphic";
  const headline = output?.headline_options?.[0] ?? "";
  const caption = output?.caption ?? "";
  const platform = output?.platform ?? "social";
  return [
    `Create a branded graphic for platform: ${platform}.`,
    `Aspect ratio: ${output?.imageAspectRatio ?? "1:1"}.`,
    `Visual concept: ${visual}`,
    headline ? `Headline: ${headline}` : null,
    caption ? `Caption tone: ${caption}` : null,
    "Do not produce NSFW or unsafe content.",
    `Account: ${accountId}`,
  ]
    .filter(Boolean)
    .join("\n");
}
