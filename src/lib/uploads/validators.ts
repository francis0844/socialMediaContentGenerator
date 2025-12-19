import { z } from "zod";

export const allowedImageMimeTypes = ["image/png", "image/jpeg", "image/webp"];
export const maxImageSizeBytes = 10 * 1024 * 1024; // 10MB

export function validateImageFile(file: File) {
  const parsed = z
    .object({
      type: z.string(),
      size: z.number().int().nonnegative(),
    })
    .parse({ type: file.type, size: file.size });

  if (!allowedImageMimeTypes.includes(parsed.type)) {
    throw new Error("UNSUPPORTED_MIME_TYPE");
  }
  if (parsed.size > maxImageSizeBytes) {
    throw new Error("FILE_TOO_LARGE");
  }
}
