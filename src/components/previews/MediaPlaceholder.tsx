"use client";

import { Image as ImageIcon } from "lucide-react";

import type { BrandPreviewProfile, PreviewTheme } from "@/components/previews/types";
import { cn } from "@/lib/utils";

function getGradient(colors?: BrandPreviewProfile["colors"] | null) {
  const first = colors?.[0]?.hex;
  const second = colors?.[1]?.hex;
  if (first && second) return `linear-gradient(135deg, ${first}, ${second})`;
  if (first) return `linear-gradient(135deg, ${first}, #0b1220)`;
  return "linear-gradient(135deg, #0b1220, #111827)";
}

export function MediaPlaceholder({
  brand,
  theme,
  aspect = "square",
  overlayText,
  className,
}: {
  brand: BrandPreviewProfile | null;
  theme: PreviewTheme;
  aspect?: "square" | "vertical" | "pin";
  overlayText?: string | null;
  className?: string;
}) {
  const bg = getGradient(brand?.colors ?? null);
  const src = brand?.logoUrl || "/lexus-mark.svg";

  const aspectClass =
    aspect === "vertical"
      ? "aspect-[9/16]"
      : aspect === "pin"
        ? "aspect-[2/3]"
        : "aspect-square";

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl",
        theme === "light" ? "border border-black/10" : "border border-white/10",
        aspectClass,
        className,
      )}
      style={{ backgroundImage: bg }}
    >
      <div
        className={cn(
          "absolute inset-0",
          theme === "light" ? "bg-white/10" : "bg-black/20",
        )}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <img
            src={src}
            alt={brand?.brandName ? `${brand.brandName} logo` : "Logo"}
            className={cn(
              "h-14 w-14 rounded-full object-contain",
              theme === "light" ? "bg-white/70" : "bg-black/30",
            )}
          />
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs",
              theme === "light"
                ? "bg-white/70 text-black/70"
                : "bg-black/30 text-white/80",
            )}
          >
            <ImageIcon className={cn("h-3.5 w-3.5", theme === "light" ? "text-black/60" : "text-white/70")} />
            Mock image
          </div>
        </div>
      </div>

      {overlayText ? (
        <div className="absolute inset-x-0 bottom-0 p-3">
          <div
            className={cn(
              "rounded-lg px-3 py-2 text-xs leading-snug backdrop-blur",
              theme === "light"
                ? "bg-white/75 text-black/80"
                : "bg-black/45 text-white/85",
            )}
          >
            <div className={cn("text-[10px] uppercase tracking-wide", theme === "light" ? "text-black/50" : "text-white/60")}>
              Visual concept
            </div>
            <div className="mt-1">{overlayText}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

