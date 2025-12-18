"use client";

import { Button } from "@/components/ui/button";
import type { PreviewTheme } from "@/components/previews/types";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  value,
  onChange,
  className,
}: {
  value: PreviewTheme;
  onChange: (v: PreviewTheme) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <Button
        type="button"
        size="sm"
        variant={value === "light" ? "secondary" : "outline"}
        className={value === "light" ? "bg-white text-slate-900 border-slate-300" : "bg-white text-slate-800 hover:bg-slate-100"}
        onClick={() => onChange("light")}
      >
        Light
      </Button>
      <Button
        type="button"
        size="sm"
        variant={value === "dark" ? "secondary" : "outline"}
        className={value === "dark" ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-white text-slate-800 hover:bg-slate-100"}
        onClick={() => onChange("dark")}
      >
        Dark
      </Button>
    </div>
  );
}
