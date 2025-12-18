"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useSession } from "next-auth/react";

type UsageResponse = {
  ok: boolean;
  counts?: { generated: number; accepted: number; rejected: number };
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
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Generate content, review, and teach the studio what “on-brand” means for{" "}
            <span className="text-slate-900 font-semibold">your account</span>.
          </p>
        </div>
        <div className="text-sm text-slate-500">
          {status === "loading" ? "Loading…" : null}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-600">
            {usageData?.quota?.scope === "trial_daily"
              ? "Trial (daily quota)"
              : "This month"}
          </div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">
            {loading
              ? "…"
              : `${usageData?.quota?.used ?? 0} / ${usageData?.quota?.limit ?? 0}`}
          </div>
          <div className="mt-1 text-sm text-slate-500">Generations used</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-600">Libraries</div>
          <div className="mt-2 text-sm text-slate-600">
            Generated:{" "}
            <span className="font-semibold text-slate-900">
              {loading ? "…" : (usageData?.counts?.generated ?? 0)}
            </span>
            <br />
            Accepted:{" "}
            <span className="font-semibold text-slate-900">
              {loading ? "…" : (usageData?.counts?.accepted ?? 0)}
            </span>
            <br />
            Rejected:{" "}
            <span className="font-semibold text-slate-900">
              {loading ? "…" : (usageData?.counts?.rejected ?? 0)}
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-600">Access</div>
          <div className="mt-2 text-sm text-slate-600">
            Status:{" "}
            <span className="font-semibold text-slate-900">
              {loading ? "…" : (usageData?.billingStatus ?? "trialing")}
            </span>
            <br />
            Trial:{" "}
            <span className="font-semibold text-slate-900">
              {daysLeft === null
                ? "—"
                : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
            </span>
          </div>
          <div className="mt-3">
            <Link
              href="/app/billing"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-px hover:shadow-md"
            >
              Manage billing
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/app/generate"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-px hover:shadow-md"
        >
          Generate content
        </Link>
        <Link
          href="/app/brand"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-px hover:shadow-md"
        >
          Update brand profile
        </Link>
      </div>
    </div>
  );
}
