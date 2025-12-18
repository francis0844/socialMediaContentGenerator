import "server-only";

import { BrandProfile } from "@prisma/client";

export type BrandProfileCompleteness = {
  complete: boolean;
  completedCount: number;
  requiredCount: number;
  missing: Array<
    | "brandName"
    | "companyOverview"
    | "niche"
    | "targetAudience"
    | "goals"
    | "brandVoice"
  >;
};

export function getBrandProfileCompleteness(
  profile: BrandProfile | null,
): BrandProfileCompleteness {
  const requiredCount = 6;
  if (!profile) {
    return {
      complete: false,
      completedCount: 0,
      requiredCount,
      missing: [
        "brandName",
        "companyOverview",
        "niche",
        "targetAudience",
        "goals",
        "brandVoice",
      ],
    };
  }

  const missing: BrandProfileCompleteness["missing"] = [];

  if (!profile.brandName.trim()) missing.push("brandName");
  if (!profile.about.trim()) missing.push("companyOverview");
  if (!profile.niche.trim()) missing.push("niche");
  if (!profile.targetAudience.trim()) missing.push("targetAudience");
  if (!profile.goals.trim()) missing.push("goals");

  if (profile.voiceMode === "uploaded") {
    if (!profile.voiceDocUrl) missing.push("brandVoice");
  } else {
    if (!profile.voicePreset?.trim()) missing.push("brandVoice");
  }

  const completedCount = requiredCount - missing.length;
  return {
    complete: missing.length === 0,
    completedCount,
    requiredCount,
    missing,
  };
}

