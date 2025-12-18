"use client";

import { useEffect, useState } from "react";

import type { BrandPreviewProfile } from "@/components/previews/types";

type ApiResponse =
  | {
      ok: true;
      profile: {
        brandName: string;
        logoUrl: string | null;
        colors?: Array<{ name: string; hex: string }> | null;
      } | null;
    }
  | { ok: false; error: string };

export function useBrandPreviewProfile(initial?: BrandPreviewProfile | null) {
  const [profile, setProfile] = useState<BrandPreviewProfile | null>(initial ?? null);
  const [loading, setLoading] = useState(initial ? false : true);

  useEffect(() => {
    if (initial) return;

    let cancelled = false;
    async function run() {
      try {
        setLoading(true);
        const res = await fetch("/api/brand-profile", { method: "GET" });
        const data = (await res.json()) as ApiResponse;
        if (!res.ok || !data.ok) return;
        if (!data.profile) return;
        if (cancelled) return;
        setProfile({
          brandName: data.profile.brandName,
          logoUrl: data.profile.logoUrl ?? null,
          colors: data.profile.colors ?? null,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [initial]);

  return { profile, loading };
}

