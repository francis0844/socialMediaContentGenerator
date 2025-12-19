import { useEffect } from "react";

export type GeneratingItem = {
  id: string;
};

type Updater = (id: string, update: { imageStatus: string; primaryImageUrl?: string | null; imageError?: string | null }) => void;

export function useImageStatusPoller(items: GeneratingItem[], updateItem: Updater) {
  useEffect(() => {
    let cancelled = false;
    let attempt = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (!items.length) return;
      for (const item of items) {
        try {
          const res = await fetch(`/api/generated-content/${item.id}`, { cache: "no-store" });
          const json = (await res.json()) as {
            ok?: boolean;
            imageStatus?: string;
            primaryImageUrl?: string | null;
            imageError?: string | null;
          };
          if (cancelled) return;
          if (res.ok && json.ok && json.imageStatus) {
            updateItem(item.id, {
              imageStatus: json.imageStatus,
              primaryImageUrl: json.primaryImageUrl ?? null,
              imageError: json.imageError ?? null,
            });
          }
        } catch {
          // ignore polling errors
        }
      }
      attempt += 1;
      if (attempt > 39) return; // stop after ~2 minutes
      const delay = attempt < 15 ? 2000 : 5000;
      timer = setTimeout(tick, delay);
    };

    tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [items, updateItem]);
}
