"use client";

import { useEffect, useMemo, useState } from "react";

import { DeviceFrame } from "@/components/previews/DeviceFrame";
import { DeviceToggle } from "@/components/previews/DeviceToggle";
import { FacebookPostPreview } from "@/components/previews/FacebookPostPreview";
import { InstagramFeedPreview } from "@/components/previews/InstagramFeedPreview";
import { InstagramStoryPreview } from "@/components/previews/InstagramStoryPreview";
import { PinterestPinPreview } from "@/components/previews/PinterestPinPreview";
import { PlatformToggle } from "@/components/previews/PlatformToggle";
import { ThemeToggle } from "@/components/previews/ThemeToggle";
import { useBrandPreviewProfile } from "@/components/previews/useBrandPreviewProfile";
import { XPostPreview } from "@/components/previews/XPostPreview";
import {
  previewOutputSchema,
  type BrandPreviewProfile,
  type PreviewDevice,
  type PreviewOutput,
  type PreviewPlatform,
  type PreviewTheme,
} from "@/components/previews/types";
import { cn } from "@/lib/utils";

export function PreviewSwitcher({
  outputJson,
  initialPlatform,
  initialDevice = "desktop",
  initialTheme = "light",
  brandProfile,
  className,
}: {
  outputJson: unknown;
  initialPlatform?: PreviewPlatform;
  initialDevice?: PreviewDevice;
  initialTheme?: PreviewTheme;
  brandProfile?: BrandPreviewProfile | null;
  className?: string;
}) {
  const parsed = useMemo(() => previewOutputSchema.safeParse(outputJson), [outputJson]);

  const output: PreviewOutput | null = parsed.success ? parsed.data : null;

  const availablePlatforms: PreviewPlatform[] =
    (initialPlatform ? [initialPlatform] : output?.platform ? [output.platform] : null) ??
    ["facebook", "instagram", "pinterest", "x"];

  const [platform, setPlatform] = useState<PreviewPlatform>(availablePlatforms[0]);
  const [device, setDevice] = useState<PreviewDevice>(initialDevice);
  const [theme, setTheme] = useState<PreviewTheme>(initialTheme);

  const { profile } = useBrandPreviewProfile(brandProfile ?? null);
  const brand = profile ?? brandProfile ?? null;

  useEffect(() => {
    if (!output) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlatform(initialPlatform ?? output.platform);
  }, [initialPlatform, output]);

  const preview = useMemo(() => {
    if (!output) return null;
    const props = { output, brand, device, theme };

    switch (platform) {
      case "facebook":
        return <FacebookPostPreview {...props} />;
      case "instagram":
        return output.type === "story" ? <InstagramStoryPreview {...props} /> : <InstagramFeedPreview {...props} />;
      case "pinterest":
        return <PinterestPinPreview {...props} />;
      case "x":
        return <XPostPreview {...props} />;
      default:
        return null;
    }
  }, [brand, device, output, platform, theme]);

  const containerStyles =
    theme === "light"
      ? "rounded-2xl border border-slate-200 bg-white p-4 shadow-md text-slate-900"
      : "rounded-2xl border border-white/10 bg-black/40 p-4 text-white";

  const summaryText = theme === "light" ? "text-slate-700" : "text-white/80";
  const jsonText = theme === "light" ? "text-slate-700" : "text-white/70";

  return (
    <div className={cn(containerStyles, className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm opacity-80">Preview</div>
        <div className="flex flex-wrap items-center gap-2">
          <ThemeToggle value={theme} onChange={setTheme} />
          <DeviceToggle value={device} onChange={setDevice} />
        </div>
      </div>

      {output ? (
        <div className="mt-3 space-y-3">
          {availablePlatforms.length > 1 ? (
            <PlatformToggle
              value={platform}
              options={availablePlatforms}
              onChange={(p) => {
                setPlatform(p);
              }}
            />
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
              {availablePlatforms[0].charAt(0).toUpperCase() + availablePlatforms[0].slice(1)}
            </div>
          )}

          <div className="w-full">
            {device === "mobile" ? <DeviceFrame>{preview}</DeviceFrame> : preview}
          </div>

          <details
            className={cn(
              "rounded-xl border px-3 py-2",
              theme === "light" ? "border-slate-200 bg-slate-50" : "border-white/10 bg-white/5",
            )}
          >
            <summary className={cn("cursor-pointer text-sm", summaryText)}>Raw JSON</summary>
            <pre className={cn("mt-2 overflow-auto text-xs", jsonText)}>
              {JSON.stringify(outputJson, null, 2)}
            </pre>
          </details>
        </div>
      ) : (
        <div className="mt-3 text-sm opacity-70">
          {parsed.success ? "No output to preview." : "Invalid output JSON (schema mismatch)."}
          {!parsed.success ? (
            <details
              className={cn(
                "mt-3 rounded-xl border px-3 py-2",
                theme === "light" ? "border-slate-200 bg-slate-50" : "border-white/10 bg-white/5",
              )}
            >
              <summary className={cn("cursor-pointer text-sm", summaryText)}>Raw JSON</summary>
              <pre className={cn("mt-2 overflow-auto text-xs", jsonText)}>
                {JSON.stringify(outputJson, null, 2)}
              </pre>
            </details>
          ) : null}
        </div>
      )}
    </div>
  );
}
