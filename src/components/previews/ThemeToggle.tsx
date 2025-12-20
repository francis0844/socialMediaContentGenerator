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
        className={
          value === "light"
            ? "bg-[color:#00bba7] text-white border-[color:#00bba7] hover:bg-[color:#00a390]"
            : "bg-card text-foreground hover:bg-muted"
        }
        onClick={() => onChange("light")}
      >
        Light
      </Button>
      <Button
        type="button"
        size="sm"
        variant={value === "dark" ? "secondary" : "outline"}
        className={
          value === "dark"
            ? "bg-[color:#00bba7] text-white border-[color:#00bba7] hover:bg-[color:#009c8d]"
            : "bg-card text-foreground hover:bg-muted"
        }
        onClick={() => onChange("dark")}
      >
        Dark
      </Button>
    </div>
  );
}
