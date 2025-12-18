"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UsageResponse = {
  ok: boolean;
  billingStatus?: string;
  trialEndsAt?: string | null;
  trialDaysLeft?: number | null;
  quota?:
    | { scope: "trial_daily"; used: number; limit: number; resetsAt: string }
    | {
        scope: "monthly";
        used: number;
        limit: number;
        monthStart: string;
        monthEnd: string;
      };
  error?: string;
};

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const trialActive = useMemo(() => {
    if (!usage?.trialEndsAt) return false;
    return new Date(usage.trialEndsAt).getTime() > Date.now();
  }, [usage?.trialEndsAt]);

  async function refresh() {
    setLoading(true);
    const res = await fetch("/api/usage", { cache: "no-store" });
    const json = (await res.json()) as UsageResponse;
    setUsage(json);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function startCheckout() {
    setMessage(null);
    setActionLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const raw: unknown = await res.json();
      const data = raw as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !data.ok || !data.url) {
        throw new Error(data.error ?? "CHECKOUT_FAILED");
      }
      window.location.href = data.url;
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function openPortal() {
    setMessage(null);
    setActionLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const raw: unknown = await res.json();
      const data = raw as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !data.ok || !data.url) {
        throw new Error(data.error ?? "PORTAL_FAILED");
      }
      window.location.href = data.url;
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Portal failed");
    } finally {
      setActionLoading(false);
    }
  }

  const billingStatus = usage?.billingStatus ?? "trialing";
  const isActive = billingStatus === "active";

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Billing</h1>
          <p className="mt-1 text-sm text-slate-600">
            Full Access: $120/month • 1000 generations per month
          </p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={loading}>
          Refresh
        </Button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-600">Status</div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                isActive
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-slate-200 bg-slate-50 text-slate-800",
              )}
            >
              {loading ? "…" : billingStatus}
            </span>
            {trialActive ? (
              <span className="text-xs text-slate-500">
                Trial: {usage?.trialDaysLeft ?? "—"} days left
              </span>
            ) : null}
          </div>

          <div className="mt-4 text-sm text-slate-600">
            {loading ? (
              "Loading…"
            ) : usage?.quota?.scope === "trial_daily" ? (
              <>
                Trial daily quota:{" "}
                <span className="text-slate-900">
                  {usage.quota.used} / {usage.quota.limit}
                </span>
              </>
            ) : (
              <>
                Monthly quota:{" "}
                <span className="text-slate-900">
                  {usage?.quota?.used ?? 0} / {usage?.quota?.limit ?? 1000}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-600">Manage</div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={startCheckout} disabled={actionLoading}>
              Subscribe
            </Button>
            <Button variant="outline" onClick={openPortal} disabled={actionLoading}>
              Customer Portal
            </Button>
          </div>

          <div className="mt-3 text-xs text-slate-500">
            Trial does not require payment. When trial ends, generation is blocked until
            you subscribe.
          </div>

          {message ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {message}
            </div>
          ) : null}
        </div>
      </div>

      {!loading && !trialActive && !isActive ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your trial has ended. Subscribe to continue generating content.
        </div>
      ) : null}
    </div>
  );
}
