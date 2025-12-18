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
  initialTheme = "dark",
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

  const [platform, setPlatform] = useState<PreviewPlatform>(
    initialPlatform ?? output?.platform ?? "instagram",
  );
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

  return (
    <div className={cn("rounded-2xl border border-white/10 bg-black/40 p-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-white/70">Preview</div>
        <div className="flex flex-wrap items-center gap-2">
          <ThemeToggle value={theme} onChange={setTheme} />
          <DeviceToggle value={device} onChange={setDevice} />
        </div>
      </div>

      {output ? (
        <div className="mt-3 space-y-3">
          <PlatformToggle
            value={platform}
            onChange={(p) => {
              setPlatform(p);
            }}
          />

          <div className="w-full">
            {device === "mobile" ? <DeviceFrame>{preview}</DeviceFrame> : preview}
          </div>

          <details className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <summary className="cursor-pointer text-sm text-white/80">Raw JSON</summary>
            <pre className="mt-2 overflow-auto text-xs text-white/70">
              {JSON.stringify(outputJson, null, 2)}
            </pre>
          </details>
        </div>
      ) : (
        <div className="mt-3 text-sm text-white/60">
          {parsed.success ? "No output to preview." : "Invalid output JSON (schema mismatch)."}
          {!parsed.success ? (
            <details className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <summary className="cursor-pointer text-sm text-white/80">Raw JSON</summary>
              <pre className="mt-2 overflow-auto text-xs text-white/70">
                {JSON.stringify(outputJson, null, 2)}
              </pre>
            </details>
          ) : null}
        </div>
      )}
    </div>
  );
}
