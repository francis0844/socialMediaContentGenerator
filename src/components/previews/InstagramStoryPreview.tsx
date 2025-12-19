"use client";

import { MoreHorizontal } from "lucide-react";

import { MediaPlaceholder } from "@/components/previews/MediaPlaceholder";
import { toHandle, type BrandPreviewProfile, type PreviewDevice, type PreviewOutput, type PreviewTheme } from "@/components/previews/types";
import { cn } from "@/lib/utils";

export function InstagramStoryPreview({
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

  const frames =
    output.type === "story"
      ? output.frames
      : [{ frame: 1, on_screen_text: output.caption ?? "Story" }];

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl",
        theme === "light" ? "bg-white text-zinc-900" : "bg-zinc-950 text-zinc-100",
      )}
    >
      <div className={cn(device === "mobile" ? "p-3" : "p-4")}>
        <MediaPlaceholder
          brand={brand}
          theme={theme}
          aspect="vertical"
          imageUrl={output.type === "graphic" ? imageUrl : null}
          className="rounded-2xl"
        />
      </div>

      <div className="pointer-events-none absolute inset-0">
        <div className={cn("px-5 pt-4", device === "mobile" ? "px-4 pt-3" : "px-5 pt-4")}>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-full bg-white/25 p-0.5">
              <div className="h-1.5 w-3/5 rounded-full bg-white/70" />
            </div>
            <div className={cn("text-[10px]", theme === "light" ? "text-black/60" : "text-white/70")}>0:05</div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src={src}
                alt={`${name} avatar`}
                className={cn(
                  "h-7 w-7 rounded-full object-cover",
                  theme === "light" ? "bg-black/5" : "bg-white/10",
                )}
              />
              <div className="text-xs font-semibold">{username}</div>
              <div className={cn("text-xs", theme === "light" ? "text-black/50" : "text-white/60")}>Just now</div>
            </div>
            <MoreHorizontal className={cn("h-5 w-5", theme === "light" ? "text-black/70" : "text-white/75")} />
          </div>
        </div>

        <div className="absolute inset-x-0 top-24 px-8">
          <div className={cn("space-y-3", device === "mobile" ? "space-y-2" : "space-y-3")}>
            {frames.slice(0, 3).map((f) => (
              <div
                key={f.frame}
                className={cn(
                  "rounded-xl px-4 py-3 text-center text-sm font-semibold backdrop-blur",
                  theme === "light" ? "bg-white/70 text-black/85" : "bg-black/45 text-white/90",
                )}
              >
                {f.on_screen_text}
              </div>
            ))}
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 px-5 pb-5">
          <div className={cn("flex items-center gap-3", device === "mobile" ? "gap-2" : "gap-3")}>
            <div
              className={cn(
                "flex-1 rounded-full px-4 py-3 text-xs backdrop-blur",
                theme === "light" ? "bg-white/80 text-black/60" : "bg-black/45 text-white/60",
              )}
            >
              Send message
            </div>
            <div
              className={cn(
                "h-11 w-11 rounded-full backdrop-blur",
                theme === "light" ? "bg-white/80" : "bg-black/45",
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
