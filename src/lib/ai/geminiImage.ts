import "server-only";

import { z } from "zod";

import { getServerEnv } from "@/lib/env/server";
import { appConfig } from "@/lib/config";

export type InlineImage = { data: string; mimeType: string };

export type GeminiImageRequest = {
  prompt: string;
  images?: InlineImage[];
  model?: string;
};

export type GeminiImageResult = {
  bytes: Buffer;
  mimeType: string;
};

export class GeminiImageClient {
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  public modelId: string;

  constructor() {
    const env = getServerEnv();
    const apiKey = env.GOOGLE_AI_STUDIO_API_KEY || env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY missing");
    this.apiKey = apiKey;
    this.model = appConfig.gemini.imageModelId;
    this.modelId = this.model;
    this.baseUrl = appConfig.gemini.apiBaseUrl;
  }

  async generate(request: GeminiImageRequest): Promise<GeminiImageResult> {
    const model = request.model ?? this.model;
    const url = `${this.baseUrl}/v1beta/models/${model}:generateContent`;

    const refs = request.images ?? [];
    if (refs.length > appConfig.gemini.maxReferenceImages) throw new Error("TOO_MANY_REFERENCE_IMAGES");

    const parts: Array<Record<string, unknown>> = [{ text: request.prompt }];
    for (const img of refs) {
      parts.push({
        inlineData: {
          mimeType: img.mimeType,
          data: img.data,
        },
      });
    }

    const body = {
      contents: [
        {
          role: "user",
          parts,
        },
      ],
      safetySettings: appConfig.gemini.safetySettings,
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`GEMINI_IMAGE_FAILED: ${res.status} ${errText}`);
    }

    const json = (await res.json()) as any;
    const candidates = Array.isArray(json?.candidates) ? json.candidates : [];
    if (!candidates.length) {
      throw new Error("GEMINI_IMAGE_NO_CANDIDATES");
    }
    const parts = Array.isArray(candidates[0]?.content?.parts)
      ? candidates[0].content.parts.map((p: any) => {
          // Normalize inline_data -> inlineData
          if (p?.inline_data && !p.inlineData) {
            return { ...p, inlineData: p.inline_data };
          }
          return p;
        })
      : [];

    const imgPart = parts.find((p: any) => p?.inlineData?.data);
    if (!imgPart) {
      throw new Error("GEMINI_IMAGE_NO_DATA");
    }

    return {
      bytes: Buffer.from(imgPart.inlineData.data, "base64"),
      mimeType: imgPart.inlineData.mimeType,
    };
  }
}

export function getGeminiImageClient() {
  return new GeminiImageClient();
}
