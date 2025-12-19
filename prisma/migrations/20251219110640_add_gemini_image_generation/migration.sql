-- CreateEnum
CREATE TYPE "ImageStatus" AS ENUM ('none', 'generating', 'ready', 'failed');

-- AlterTable
ALTER TABLE "GeneratedContent" ADD COLUMN     "imageAspectRatio" TEXT DEFAULT '1:1',
ADD COLUMN     "imageError" TEXT,
ADD COLUMN     "imageModel" TEXT,
ADD COLUMN     "imageStatus" "ImageStatus" NOT NULL DEFAULT 'none',
ADD COLUMN     "imageUrl" TEXT;
