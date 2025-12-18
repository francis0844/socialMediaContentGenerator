"use client";

import { BarChart3, Heart, MessageCircle, Repeat2 } from "lucide-react";

import { MediaPlaceholder } from "@/components/previews/MediaPlaceholder";
import { formatCaptionWithHashtags, toHandle, type BrandPreviewProfile, type PreviewDevice, type PreviewOutput, type PreviewTheme } from "@/components/previews/types";
import { cn } from "@/lib/utils";

function highlightHashtags(text: string) {
  const parts = text.split(/(\#[A-Za-z0-9_]+)/g);
  return parts.filter((p) => p.length > 0);
}

export function XPostPreview({
  output,
  brand,
  device,
  theme,
}: {
  output: PreviewOutput;
  brand: BrandPreviewProfile | null;
  device: PreviewDevice;
  theme: PreviewTheme;
}) {
  const name = brand?.brandName || "Lexus";
  const handle = toHandle(name);
  const src = brand?.logoUrl || "/lexus-mark.svg";

  const text = formatCaptionWithHashtags(output);
  const hasMedia = output.type === "graphic" || output.type === "video";
  const overlay = output.type === "graphic" ? output.visual_concept : null;

  return (
    <div
      className={cn(
        "w-full rounded-2xl",
        theme === "light" ? "bg-white text-zinc-900" : "bg-zinc-950 text-zinc-100",
      )}
    >
      <div className={cn("p-4", device === "mobile" ? "p-3" : "p-4")}>
        <div className="flex gap-3">
          <img
            src={src}
            alt={`${name} avatar`}
            className={cn(
              "h-10 w-10 rounded-full object-cover",
              theme === "light" ? "bg-black/5" : "bg-white/10",
            )}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <div className="text-sm font-semibold">{name}</div>
              <div className={cn("text-sm", theme === "light" ? "text-black/50" : "text-white/55")}>
                {handle} · 1h
              </div>
            </div>
            <div className={cn("mt-2 text-sm leading-relaxed", theme === "light" ? "text-black/85" : "text-white/85")}>
              {highlightHashtags(text).map((part, idx) =>
                part.startsWith("#") ? (
                  <span key={idx} className={cn(theme === "light" ? "text-blue-600" : "text-blue-400")}>
                    {part}
                  </span>
                ) : (
                  <span key={idx}>{part}</span>
                ),
              )}
            </div>

            {hasMedia ? (
              <div className="mt-3">
                <MediaPlaceholder
                  brand={brand}
                  theme={theme}
                  aspect="square"
                  overlayText={overlay}
                  className="rounded-2xl"
                />
              </div>
            ) : null}

            <div className={cn("mt-3 h-px", theme === "light" ? "bg-black/10" : "bg-white/10")} />

            <div className={cn("mt-3 grid grid-cols-4 gap-3 text-xs", theme === "light" ? "text-black/60" : "text-white/60")}>
              <div className="inline-flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                12
              </div>
              <div className="inline-flex items-center gap-2">
                <Repeat2 className="h-4 w-4" />
                4
              </div>
              <div className="inline-flex items-center gap-2">
                <Heart className="h-4 w-4" />
                88
              </div>
              <div className="inline-flex items-center gap-2 justify-end">
                <BarChart3 className="h-4 w-4" />
                3.2K
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

