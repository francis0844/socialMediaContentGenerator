import "server-only";

import { getServerEnv } from "@/lib/env/server";

type InlineImage = { data: string; mimeType: string; context?: string };

export type GeminiImageRequest = {
  prompt: string;
  images?: InlineImage[];
  model?: string;
};

export type GeminiImageResult = {
  mimeType: string;
  dataBase64: string;
};

export class GeminiImageClient {
  private apiKey: string;
  private model: string;
  private baseUrl = "https://generativelanguage.googleapis.com";

  constructor() {
    const env = getServerEnv();
    if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");
    this.apiKey = env.GEMINI_API_KEY;
    this.model = env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image";
  }

  get modelId() {
    return this.model;
  }

  async generate(request: GeminiImageRequest): Promise<GeminiImageResult> {
    const model = request.model ?? this.model;
    const url = `${this.baseUrl}/v1beta/models/${model}:generateContent`;

    const parts: Array<Record<string, unknown>> = [{ text: request.prompt }];
    if (request.images?.length) {
      for (const img of request.images) {
        parts.push({
          inlineData: {
            mimeType: img.mimeType,
            data: img.data,
          },
        });
        if (img.context) {
          parts.push({ text: `Reference context: ${img.context}` });
        }
      }
    }

    const body = {
      contents: [
        {
          role: "user",
          parts,
        },
      ],
      safetySettings: [
        {
          category: "HARM_CATEGORY_SEXUAL",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
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

    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { mimeType: string; data: string } }> } }>;
    };

    const candidate = json.candidates?.[0];
    const part = candidate?.content?.parts?.find((p) => p.inlineData?.data);
    if (!part?.inlineData?.data || !part.inlineData.mimeType) {
      throw new Error("GEMINI_IMAGE_NO_DATA");
    }

    return {
      mimeType: part.inlineData.mimeType,
      dataBase64: part.inlineData.data,
    };
  }
}

export function getGeminiImageClient() {
  return new GeminiImageClient();
}
