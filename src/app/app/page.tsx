"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook, faInstagram, faPinterest, faXTwitter } from "@fortawesome/free-brands-svg-icons";

import { useSession } from "next-auth/react";
import { useImageStatusPoller } from "@/hooks/useImageStatusPoller";

type UsageResponse = {
  ok: boolean;
  counts?: { generated: number; accepted: number; rejected: number };
  platformCounts?: { facebook: number; instagram: number; pinterest: number; x: number };
  recent?: Array<{ id: string; title: string | null; platform: string; contentType: string; createdAt: string }>;
  quota?:
    | {
        scope: "trial_daily";
        used: number;
        limit: number;
        resetsAt: string;
      }
    | {
        scope: "monthly";
        used: number;
        limit: number;
        monthStart: string;
        monthEnd: string;
      };
  billingStatus?: string;
  trialEndsAt?: string | null;
  trialDaysLeft?: number | null;
  error?: string;
};

export default function DashboardPage() {
  const { data } = useSession();
  const user = data?.user ?? null;
  const accountId = data?.accountId ?? null;
  const [usageData, setUsageData] = useState<UsageResponse | null>(null);
  const [recentContent, setRecentContent] = useState<
    Array<{
      id: string;
      title: string | null;
      platform: string;
      contentType: string;
      createdAt: string;
      imageStatus?: string;
      imageUrl?: string | null;
      imageError?: string | null;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function run() {
      if (!accountId) return;
      setLoading(true);
      const res = await fetch("/api/usage", { cache: "no-store" });
      const json = (await res.json()) as UsageResponse;
      setUsageData(json);
      setLoading(false);
    }
    run();
  }, [accountId]);

  useEffect(() => {
    async function loadRecent() {
      if (!accountId) return;
      const res = await fetch("/api/content?status=generated&take=6", { cache: "no-store" });
      const json = (await res.json()) as {
        ok?: boolean;
        items?: Array<any>;
      };
      if (res.ok && json.ok && json.items) {
        setRecentContent(
          json.items.map((i) => ({
            id: i.id,
            title: i.title,
            platform: i.platform,
            contentType: i.contentType,
            createdAt: i.createdAt,
            imageStatus: i.imageStatus,
            imageUrl: i.imageUrl ?? i.primaryImageUrl ?? null,
            imageError: i.imageError ?? null,
          })),
        );
      }
    }
    loadRecent();
  }, [accountId]);

  const daysLeft = usageData?.trialDaysLeft ?? null;

  useImageStatusPoller(
    recentContent.filter((i) => i.imageStatus === "generating").map((i) => ({ id: i.id })),
    (id, update) => {
      setRecentContent((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                imageStatus: update.imageStatus,
                imageUrl: update.primaryImageUrl ?? item.imageUrl,
                imageError: update.imageError ?? item.imageError,
              }
            : item,
        ),
      );
    },
  );

  const statCards = [
    {
      label: usageData?.quota?.scope === "trial_daily" ? "Trial (daily quota)" : "This month",
      value: loading ? "…" : `${usageData?.quota?.used ?? 0} / ${usageData?.quota?.limit ?? 0}`,
      helper: "Generations used",
    },
    {
      label: "Libraries",
      value: loading
        ? "…"
        : `${usageData?.counts?.generated ?? 0} • ${usageData?.counts?.accepted ?? 0} • ${usageData?.counts?.rejected ?? 0}`,
      helper: "Generated • Accepted • Rejected",
    },
    {
      label: "Access",
      value: loading ? "…" : usageData?.billingStatus ?? "trialing",
      helper: daysLeft === null ? "No trial" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`,
    },
  ];

  return (
    <div className="text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quick snapshot of your content studio. Manage generation, reviews, and billing in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/app/generate"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-px hover:shadow-lg"
          >
            Create content
          </Link>
          <Link
            href="/app/brand"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:-translate-y-px hover:shadow-md"
          >
            Brand profile
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {statCards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="text-sm font-semibold text-muted-foreground">{c.label}</div>
            <div className="mt-2 text-3xl font-semibold text-foreground">{c.value}</div>
            <div className="mt-1 text-sm text-muted-foreground">{c.helper}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-foreground">Platforms</div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {["facebook", "instagram", "pinterest", "x"].map((platform) => (
              <div
                key={platform}
                className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-5 text-center shadow-sm"
              >
                <div className="grid h-12 w-12 place-items-center rounded-full bg-teal-50 text-teal-600">
                  {platform === "facebook" ? (
                    <FontAwesomeIcon icon={faFacebook} className="h-5 w-5" />
                  ) : platform === "instagram" ? (
                    <FontAwesomeIcon icon={faInstagram} className="h-5 w-5" />
                  ) : platform === "pinterest" ? (
                    <FontAwesomeIcon icon={faPinterest} className="h-5 w-5" />
                  ) : (
                    <FontAwesomeIcon icon={faXTwitter} className="h-5 w-5" />
                  )}
                </div>
                <div className="mt-3 text-base font-semibold text-foreground">
                  {platform === "x" ? "X" : platform.charAt(0).toUpperCase() + platform.slice(1)}
                </div>
                <div className="mt-2 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {loading
                    ? "…"
                    : `${usageData?.platformCounts?.[platform as keyof NonNullable<UsageResponse["platformCounts"]>] ?? 0} items`}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-foreground">Recent activity</div>
            <Link href="/app/library/generated" className="text-sm font-semibold text-teal-600 hover:text-teal-700">
              See more
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(recentContent.length
              ? recentContent
              : [1, 2, 3].map((i) => ({
                  id: `${i}`,
                  title: `Latest generated idea ${i}`,
                  platform: "facebook",
                  contentType: "text",
                  createdAt: "",
                  imageStatus: "none",
                  imageUrl: null as string | null,
                  imageError: null as string | null,
                }))
            ).slice(0, 3).map((item, idx) => (
              <div key={item.id ?? idx} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="bg-muted">
                  <div className="relative w-full aspect-square overflow-hidden">
                    {item.imageStatus === "ready" && item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title ?? "Generated"}
                        className="h-full w-full object-contain bg-muted"
                      />
                    ) : item.imageStatus === "generating" ? (
                      <div className="flex h-full w-full items-center justify-center bg-muted text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Generating image…
                      </div>
                    ) : item.imageStatus === "failed" ? (
                      <div className="flex h-full w-full items-center justify-center bg-rose-500/10 px-4 text-center text-xs font-semibold text-rose-700">
                        Image failed
                      </div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted via-muted/70 to-muted text-muted-foreground">
                        Preview coming soon
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-xs text-muted-foreground">
                    {item.platform ? `#${item.platform}` : "#Content"} • {item.contentType ? `#${item.contentType}` : "#Preview"}
                  </div>
                  <div className="mt-2 text-base font-semibold text-foreground">
                    {item.title ?? `Latest generated idea ${idx + 1}`}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Quick look at your most recent outputs. Accept or reject to teach the AI.
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="text-sm font-semibold text-muted-foreground">Account</div>
            <div className="mt-3 flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-teal-100 text-teal-700">
                {user?.email?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold text-foreground">{user?.email}</div>
                <div className="text-xs text-muted-foreground">Lexus Studio</div>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <div>Status: {loading ? "…" : usageData?.billingStatus ?? "trialing"}</div>
              <div>
                Trial:{" "}
                {daysLeft === null ? "—" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
              </div>
            </div>
            <div className="mt-4">
              <Link
                href="/app/billing"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:-translate-y-px hover:shadow-md"
              >
                Billing
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="text-sm font-semibold text-muted-foreground">Recent libraries</div>
            <div className="mt-3 space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Generated</span>
                <span className="font-semibold text-foreground">
                  {loading ? "…" : usageData?.counts?.generated ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Accepted</span>
                <span className="font-semibold text-foreground">
                  {loading ? "…" : usageData?.counts?.accepted ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Rejected</span>
                <span className="font-semibold text-foreground">
                  {loading ? "…" : usageData?.counts?.rejected ?? 0}
                </span>
              </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              Tip: Accept/Reject with reasons to improve personalization.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
