/*
  Warnings:

  - The `voiceMode` column on the `BrandProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `targetAudience` on table `BrandProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `goals` on table `BrandProfile` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "BrandVoiceMode" AS ENUM ('preset', 'uploaded');

-- AlterTable
ALTER TABLE "BrandProfile" ADD COLUMN     "voicePreset" TEXT,
ALTER COLUMN "targetAudience" SET NOT NULL,
ALTER COLUMN "targetAudience" SET DEFAULT '',
ALTER COLUMN "goals" SET NOT NULL,
ALTER COLUMN "goals" SET DEFAULT '',
DROP COLUMN "voiceMode",
ADD COLUMN     "voiceMode" "BrandVoiceMode" NOT NULL DEFAULT 'preset';
