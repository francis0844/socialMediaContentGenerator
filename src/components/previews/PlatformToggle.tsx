"use client";

import { Button } from "@/components/ui/button";
import type { PreviewPlatform } from "@/components/previews/types";
import { cn } from "@/lib/utils";

const platformLabel: Record<PreviewPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  pinterest: "Pinterest",
  x: "X",
};

export function PlatformToggle({
  value,
  onChange,
  className,
}: {
  value: PreviewPlatform;
  onChange: (v: PreviewPlatform) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {(Object.keys(platformLabel) as Array<PreviewPlatform>).map((p) => (
        <Button
          key={p}
          type="button"
          size="sm"
          variant={value === p ? "secondary" : "outline"}
          onClick={() => onChange(p)}
        >
          {platformLabel[p]}
        </Button>
      ))}
    </div>
  );
}

