"use client";

import { cn } from "@/lib/utils";

export function DeviceFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[420px] rounded-[34px] border border-white/15 bg-black/50 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.55)]",
        className,
      )}
    >
      <div className="mx-auto mb-3 h-6 w-32 rounded-full bg-white/10" />
      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-black">
        {children}
      </div>
    </div>
  );
}

