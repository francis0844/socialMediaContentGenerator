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
  options,
  className,
}: {
  value: PreviewPlatform;
  onChange: (v: PreviewPlatform) => void;
  options?: PreviewPlatform[];
  className?: string;
}) {
  const list = options && options.length ? options : (Object.keys(platformLabel) as Array<PreviewPlatform>);
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {list.map((p) => (
        <Button
          key={p}
          type="button"
          size="sm"
          variant={value === p ? "secondary" : "outline"}
          className={value === p ? "bg-white text-slate-900 border-slate-300" : "bg-white text-slate-800 hover:bg-slate-100"}
          onClick={() => onChange(p)}
          disabled={list.length === 1}
        >
          {platformLabel[p]}
        </Button>
      ))}
    </div>
  );
}
