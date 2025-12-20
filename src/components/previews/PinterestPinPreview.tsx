"use client";

import { MoreHorizontal } from "lucide-react";

import { MediaPlaceholder } from "@/components/previews/MediaPlaceholder";
import { formatCaptionWithHashtags, toHandle, type BrandPreviewProfile, type PreviewDevice, type PreviewOutput, type PreviewTheme } from "@/components/previews/types";
import { cn } from "@/lib/utils";

function getPinTitle(output: PreviewOutput) {
  if (output.type === "graphic") return output.headline_options[0] ?? "Pin title";
  if (output.type === "video") return output.hook ?? "Video idea";
  const firstLine = output.caption.split("\n").find(Boolean);
  return (firstLine ?? "Pin title").slice(0, 60);
}

export function PinterestPinPreview({
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
  const src = brand?.logoUrl || "/lexus-mark.svg";

  const title = getPinTitle(output);
  const desc = formatCaptionWithHashtags(output);

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl",
        theme === "light" ? "bg-white text-zinc-900" : "bg-zinc-950 text-zinc-100",
      )}
    >
      <div className={cn("p-4", device === "mobile" ? "p-3" : "p-4")}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className={cn("text-sm font-semibold", theme === "light" ? "text-black/85" : "text-white/85")}>
              Pinterest
            </div>
            <div className={cn("text-xs", theme === "light" ? "text-black/50" : "text-white/50")}>· Home feed</div>
          </div>
          <MoreHorizontal className={cn("h-5 w-5", theme === "light" ? "text-black/60" : "text-white/60")} />
        </div>

        <div className="mt-3">
          <MediaPlaceholder
            brand={brand}
            theme={theme}
            aspect="pin"
            imageUrl={output.type === "graphic" ? imageUrl : null}
            className="rounded-2xl"
          />
          {null}
        </div>

        <div className="mt-4">
          <div className="text-sm font-semibold">{title}</div>
          <div className={cn("mt-2 text-sm leading-relaxed", theme === "light" ? "text-black/75" : "text-white/75")}>
            {desc}
          </div>
        </div>

        <div className={cn("mt-4 flex items-center gap-3 rounded-xl p-3", theme === "light" ? "bg-black/5" : "bg-white/5")}>
          <img
            src={src}
            alt={`${name} avatar`}
            className={cn(
              "h-9 w-9 rounded-full object-cover",
              theme === "light" ? "bg-black/5" : "bg-white/10",
            )}
          />
          <div className="min-w-0">
            <div className="text-sm font-semibold">{name}</div>
            <div className={cn("text-xs", theme === "light" ? "text-black/50" : "text-white/55")}>
              {toHandle(name)}
            </div>
          </div>
          <div className="ml-auto">
            <button
              type="button"
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold",
                theme === "light" ? "bg-red-600 text-white" : "bg-red-500 text-white",
              )}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
