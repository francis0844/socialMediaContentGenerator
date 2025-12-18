"use client";

import { Button } from "@/components/ui/button";
import type { PreviewDevice } from "@/components/previews/types";
import { cn } from "@/lib/utils";

export function DeviceToggle({
  value,
  onChange,
  className,
}: {
  value: PreviewDevice;
  onChange: (v: PreviewDevice) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <Button
        type="button"
        size="sm"
        variant={value === "desktop" ? "secondary" : "outline"}
        className={value === "desktop" ? "bg-white text-slate-900 border-slate-300" : undefined}
        onClick={() => onChange("desktop")}
      >
        Desktop
      </Button>
      <Button
        type="button"
        size="sm"
        variant={value === "mobile" ? "secondary" : "outline"}
        className={value === "mobile" ? "bg-white text-slate-900 border-slate-300" : undefined}
        onClick={() => onChange("mobile")}
      >
        Mobile
      </Button>
    </div>
  );
}
