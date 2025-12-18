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
        variant={value === "dark" ? "secondary" : "outline"}
        onClick={() => onChange("dark")}
      >
        Dark
      </Button>
      <Button
        type="button"
        size="sm"
        variant={value === "light" ? "secondary" : "outline"}
        onClick={() => onChange("light")}
      >
        Light
      </Button>
    </div>
  );
}

