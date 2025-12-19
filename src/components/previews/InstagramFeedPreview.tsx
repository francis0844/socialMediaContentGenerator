"use client";

import { Bookmark, Heart, MessageCircle, MoreHorizontal, Send } from "lucide-react";

import { MediaPlaceholder } from "@/components/previews/MediaPlaceholder";
import { formatCaptionWithHashtags, toHandle, type BrandPreviewProfile, type PreviewDevice, type PreviewOutput, type PreviewTheme } from "@/components/previews/types";
import { cn } from "@/lib/utils";

function splitHashtags(text: string) {
  const parts = text.split(/(\#[A-Za-z0-9_]+)/g);
  return parts.filter((p) => p.length > 0);
}

export function InstagramFeedPreview({
  output,
  brand,
  device,
  theme,
  imageUrl,
}: {
  output: PreviewOutput;
  brand: BrandPreviewProfile | null;
  device: PreviewDevice;
  theme: PreviewTheme;
  imageUrl?: string | null;
}) {
  const name = brand?.brandName || "Lexus";
  const username = toHandle(name).slice(1);
  const src = brand?.logoUrl || "/lexus-mark.svg";

  const caption = formatCaptionWithHashtags(output);
  const hasMedia = output.type === "graphic" || output.type === "video" || output.type === "story";

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl",
        theme === "light" ? "bg-white text-zinc-900" : "bg-zinc-950 text-zinc-100",
      )}
    >
      <div className={cn("flex items-center justify-between px-4 py-3", device === "mobile" ? "px-3" : "px-4")}>
        <div className="flex items-center gap-3">
          <img
            src={src}
            alt={`${name} avatar`}
            className={cn(
              "h-9 w-9 rounded-full object-cover",
              theme === "light" ? "bg-black/5" : "bg-white/10",
            )}
          />
          <div className="text-sm font-semibold">{username}</div>
        </div>
        <MoreHorizontal className={cn("h-5 w-5", theme === "light" ? "text-black/60" : "text-white/60")} />
      </div>

      {hasMedia ? (
        <div className={cn("px-4", device === "mobile" ? "px-3" : "px-4")}>
          <MediaPlaceholder
            brand={brand}
            theme={theme}
            aspect={output.type === "story" || output.type === "video" ? "vertical" : "square"}
            imageUrl={output.type === "graphic" ? imageUrl : null}
            className="rounded-xl"
          />
          {output.type === "graphic" && output.visual_concept ? (
            <div
              className={cn(
                "mt-2 rounded-lg border px-3 py-2 text-xs",
                theme === "light"
                  ? "border-slate-200 bg-slate-50 text-slate-600"
                  : "border-white/10 bg-white/5 text-white/70",
              )}
            >
              <div className={cn("text-[10px] uppercase tracking-wide", theme === "light" ? "text-slate-500" : "text-white/60")}>
                Visual concept
              </div>
              <div className="mt-1">{output.visual_concept}</div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={cn("px-4 py-3", device === "mobile" ? "px-3" : "px-4")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Heart className={cn("h-5 w-5", theme === "light" ? "text-black/80" : "text-white/85")} />
            <MessageCircle className={cn("h-5 w-5", theme === "light" ? "text-black/80" : "text-white/85")} />
            <Send className={cn("h-5 w-5", theme === "light" ? "text-black/80" : "text-white/85")} />
          </div>
          <Bookmark className={cn("h-5 w-5", theme === "light" ? "text-black/80" : "text-white/85")} />
        </div>

        <div className={cn("mt-3 text-sm leading-relaxed", theme === "light" ? "text-black/85" : "text-white/85")}>
          <span className="font-semibold">{username}</span>{" "}
          {splitHashtags(caption).map((part, idx) =>
            part.startsWith("#") ? (
              <span key={idx} className={cn(theme === "light" ? "text-blue-600" : "text-blue-400")}>
                {part}
              </span>
            ) : (
              <span key={idx}>{part}</span>
            ),
          )}
        </div>

        <div className={cn("mt-2 text-xs", theme === "light" ? "text-black/50" : "text-white/50")}>
          View all comments
        </div>
      </div>
    </div>
  );
}
