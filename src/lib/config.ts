import { getServerEnv } from "@/lib/env/server";

const env = getServerEnv();

export const appConfig = {
  gemini: {
    imageModelId: env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image",
    apiBaseUrl: env.GEMINI_API_BASE_URL ?? "https://generativelanguage.googleapis.com",
    maxReferenceImages: 10,
    safetySettings: [
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
    ],
  },
  images: {
    variantsDefault: 1,
    defaultAspectRatio: "1:1",
    allowedAspectRatios: ["1:1", "4:5", "9:16"],
  },
  polling: {
    fastMs: 2000,
    slowMs: 5000,
    maxTicks: 40, // ~2 minutes
    fastTicks: 15,
  },
  queue: {
    maxAttempts: 3,
    backoffBaseMs: 2000,
    backoffMaxMs: 30000,
  },
  safety: {
    nsfwPromptLine: "No NSFW, explicit, or unsafe content.",
  },
};
