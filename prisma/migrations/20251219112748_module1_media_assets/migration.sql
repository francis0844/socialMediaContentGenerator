-- CreateEnum
CREATE TYPE "MediaAssetType" AS ENUM ('LOGO', 'PRODUCT_MOCKUP', 'STYLE_MIMIC', 'GENERATED_IMAGE');

-- CreateEnum
CREATE TYPE "StorageProvider" AS ENUM ('CLOUDINARY', 'S3');

-- CreateEnum
CREATE TYPE "UploadedImageKind" AS ENUM ('PRODUCT_MOCKUP', 'STYLE_MIMIC', 'LOGO_OVERRIDE');

-- CreateEnum
CREATE TYPE "ImageJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- AlterTable
ALTER TABLE "GeneratedContent" ADD COLUMN     "imageModelId" TEXT,
ADD COLUMN     "imagePrompt" TEXT,
ADD COLUMN     "imageVariantsRequested" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "primaryImageAssetId" TEXT;

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" "MediaAssetType" NOT NULL,
    "storageProvider" "StorageProvider" NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadedImageReference" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "mediaAssetId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kind" "UploadedImageKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadedImageReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageJob" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "generatedContentId" TEXT NOT NULL,
    "status" "ImageJobStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImageJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MediaAsset_accountId_type_createdAt_idx" ON "MediaAsset"("accountId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "UploadedImageReference_accountId_kind_createdAt_idx" ON "UploadedImageReference"("accountId", "kind", "createdAt");

-- CreateIndex
CREATE INDEX "UploadedImageReference_mediaAssetId_idx" ON "UploadedImageReference"("mediaAssetId");

-- CreateIndex
CREATE INDEX "ImageJob_accountId_status_createdAt_idx" ON "ImageJob"("accountId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ImageJob_generatedContentId_idx" ON "ImageJob"("generatedContentId");

-- AddForeignKey
ALTER TABLE "GeneratedContent" ADD CONSTRAINT "GeneratedContent_primaryImageAssetId_fkey" FOREIGN KEY ("primaryImageAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadedImageReference" ADD CONSTRAINT "UploadedImageReference_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadedImageReference" ADD CONSTRAINT "UploadedImageReference_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageJob" ADD CONSTRAINT "ImageJob_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageJob" ADD CONSTRAINT "ImageJob_generatedContentId_fkey" FOREIGN KEY ("generatedContentId") REFERENCES "GeneratedContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
