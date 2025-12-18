import "server-only";

import { v2 as cloudinary } from "cloudinary";

import { getServerEnv } from "@/lib/env/server";

export function getCloudinary() {
  const env = getServerEnv();
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error("CLOUDINARY_NOT_CONFIGURED");
  }
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
  return cloudinary;
}
