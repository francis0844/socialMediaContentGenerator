import "server-only";

import { Readable } from "node:stream";

import { getCloudinary } from "@/lib/cloudinary";

export async function uploadImageBuffer(buffer: Buffer, folder = "generated-images") {
  const cloudinary = getCloudinary();
  return new Promise<{ secure_url: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("CLOUDINARY_UPLOAD_FAILED"));
          return;
        }
        resolve({ secure_url: result.secure_url });
      },
    );

    Readable.from(buffer).pipe(uploadStream);
  });
}
