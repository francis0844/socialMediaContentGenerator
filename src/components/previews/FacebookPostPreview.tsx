"use client";

import { useState } from "react";
import { Heart, MessageCircle, MoreHorizontal, Share2 } from "lucide-react";

import { MediaPlaceholder } from "@/components/previews/MediaPlaceholder";
import { formatCaptionWithHashtags, toHandle, type BrandPreviewProfile, type PreviewDevice, type PreviewOutput, type PreviewTheme } from "@/components/previews/types";
import { cn } from "@/lib/utils";

export function FacebookPostPreview({
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
  const [expanded, setExpanded] = useState(false);
  const name = brand?.brandName || "Lexus";
  const handle = toHandle(name).replace(/^@/, "");
  const src = brand?.logoUrl || "/lexus-mark.svg";

  const hasMedia = output.type === "graphic" || output.type === "video" || output.type === "story";
  const overlay = output.type === "graphic" ? output.visual_concept : null;
  const fullCaption = formatCaptionWithHashtags(output);
  const max = device === "mobile" ? 200 : 260;
  const showSeeMore = fullCaption.length > max;
  const displayCaption = expanded || !showSeeMore ? fullCaption : `${fullCaption.slice(0, max).trim()}…`;

  return (
    <div
      className={cn(
        "w-full rounded-2xl",
        theme === "light"
          ? "bg-white text-zinc-900 shadow-[0_18px_60px_-30px_rgba(15,23,42,0.35)]"
          : "bg-zinc-950 text-zinc-100",
      )}
    >
      <div className={cn("p-4", device === "mobile" ? "p-3" : "p-4")}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={src}
              alt={`${name} avatar`}
              className={cn(
                "h-10 w-10 rounded-full object-cover",
                theme === "light" ? "bg-black/5" : "bg-white/10",
              )}
            />
            <div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold">{name}</div>
                <div className={cn("text-xs", theme === "light" ? "text-black/50" : "text-white/50")}>
                  · {handle}
                </div>
              </div>
              <div className={cn("text-xs", theme === "light" ? "text-black/50" : "text-white/50")}>
                Just now · Public
              </div>
            </div>
          </div>
          <MoreHorizontal className={cn("h-5 w-5", theme === "light" ? "text-black/60" : "text-white/60")} />
        </div>

        <div className={cn("mt-3 text-sm leading-relaxed", theme === "light" ? "text-black/80" : "text-white/85")}>
          <span>{displayCaption}</span>
          {!expanded && showSeeMore ? (
            <button
              type="button"
              className={cn(
                "ml-2 font-semibold underline-offset-2",
                theme === "light" ? "text-blue-600 hover:text-blue-700" : "text-blue-300 hover:text-blue-200",
              )}
              onClick={() => setExpanded(true)}
            >
              See more
            </button>
          ) : null}
        </div>
      </div>

      {hasMedia ? (
        <div className="px-4 pb-2">
          <MediaPlaceholder
            brand={brand}
            theme={theme}
            aspect={output.type === "story" || output.type === "video" ? "vertical" : "square"}
            overlayText={overlay}
          />
        </div>
      ) : null}

      <div className={cn("px-4 pb-4", device === "mobile" ? "px-3 pb-3" : "px-4 pb-4")}>
        <div className={cn("mt-2 h-px", theme === "light" ? "bg-black/10" : "bg-white/10")} />
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-lg px-2 py-2",
              theme === "light" ? "hover:bg-black/5" : "hover:bg-white/5",
            )}
          >
            <Heart className="h-4 w-4" />
            Like
          </button>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-lg px-2 py-2",
              theme === "light" ? "hover:bg-black/5" : "hover:bg-white/5",
            )}
          >
            <MessageCircle className="h-4 w-4" />
            Comment
          </button>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-lg px-2 py-2",
              theme === "light" ? "hover:bg-black/5" : "hover:bg-white/5",
            )}
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
