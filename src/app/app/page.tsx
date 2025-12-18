"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useSession } from "next-auth/react";

type UsageResponse = {
  ok: boolean;
  counts?: { generated: number; accepted: number; rejected: number };
  monthGenerations?: number;
  monthLimit?: number;
  billingStatus?: string;
  trialEndsAt?: string | null;
  trialDaysLeft?: number | null;
  error?: string;
};

export default function DashboardPage() {
  const { status, data } = useSession();
  const accountId = data?.accountId ?? null;
  const [usageData, setUsageData] = useState<UsageResponse | null>(null);
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

  const daysLeft = usageData?.trialDaysLeft ?? null;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-white/70">
            Generate content, review, and teach the studio what “on-brand” means for{" "}
            <span className="text-white">your account</span>.
          </p>
        </div>
        <div className="text-sm text-white/60">
          {status === "loading" ? "Loading…" : null}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="text-sm text-white/70">This month</div>
          <div className="mt-2 text-2xl font-semibold">
            {loading
              ? "…"
              : `${usageData?.monthGenerations ?? 0} / ${usageData?.monthLimit ?? 1000}`}
          </div>
          <div className="mt-1 text-sm text-white/60">Generations used</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="text-sm text-white/70">Libraries</div>
          <div className="mt-2 text-sm text-white/70">
            Generated:{" "}
            <span className="text-white">
              {loading ? "…" : (usageData?.counts?.generated ?? 0)}
            </span>
            <br />
            Accepted:{" "}
            <span className="text-white">
              {loading ? "…" : (usageData?.counts?.accepted ?? 0)}
            </span>
            <br />
            Rejected:{" "}
            <span className="text-white">
              {loading ? "…" : (usageData?.counts?.rejected ?? 0)}
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="text-sm text-white/70">Access</div>
          <div className="mt-2 text-sm text-white/70">
            Status:{" "}
            <span className="text-white">
              {loading ? "…" : (usageData?.billingStatus ?? "trialing")}
            </span>
            <br />
            Trial:{" "}
            <span className="text-white">
              {daysLeft === null
                ? "—"
                : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
            </span>
          </div>
          <div className="mt-3">
            <Link
              href="/app/billing"
              className="inline-flex rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
            >
              Manage billing
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/app/generate"
          className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-white/90"
        >
          Generate content
        </Link>
        <Link
          href="/app/brand"
          className="rounded-full border border-white/20 px-5 py-2.5 text-sm hover:bg-white/10"
        >
          Update brand profile
        </Link>
      </div>
    </div>
  );
}
