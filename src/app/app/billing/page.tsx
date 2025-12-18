"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/components/auth/useAuth";

export default function BillingPage() {
  const { idToken, account, refresh } = useAuth();
  const search = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const success = search.get("success") === "1";
  const canceled = search.get("canceled") === "1";

  const trialDaysLeft = account?.trialDaysLeft ?? null;

  const status = account?.billingStatus ?? "trialing";
  const isActive = status === "active";

  async function startCheckout() {
    if (!idToken) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const raw: unknown = await res.json();
      const data = raw as { ok?: boolean; error?: string; url?: string };
      if (!res.ok || !data?.ok || !data?.url) {
        throw new Error(data?.error ?? "CHECKOUT_FAILED");
      }
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  async function openPortal() {
    if (!idToken) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const raw: unknown = await res.json();
      const data = raw as { ok?: boolean; error?: string; url?: string };
      if (!res.ok || !data?.ok || !data?.url) {
        throw new Error(data?.error ?? "PORTAL_FAILED");
      }
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Portal failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Billing</h1>
          <p className="mt-1 text-sm text-white/70">
            Full Access — $120/month — 1000 generations/month.
          </p>
        </div>
        <button
          onClick={refresh}
          className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
        >
          Refresh
        </button>
      </div>

      {success ? (
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          Subscription created. It can take a few seconds for status to update.
        </div>
      ) : null}
      {canceled ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
          Checkout canceled.
        </div>
      ) : null}
      {error ? (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-5">
        <div className="text-sm text-white/70">Status</div>
        <div className="mt-2 text-lg font-semibold">{status}</div>
        <div className="mt-1 text-sm text-white/70">
          Trial:{" "}
          {trialDaysLeft === null ? "—" : `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left`}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {isActive ? (
            <button
              onClick={openPortal}
              disabled={loading}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black disabled:opacity-50"
            >
              {loading ? "Opening…" : "Manage subscription"}
            </button>
          ) : (
            <button
              onClick={startCheckout}
              disabled={loading}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black disabled:opacity-50"
            >
              {loading ? "Redirecting…" : "Subscribe"}
            </button>
          )}
          <div className="text-sm text-white/60 self-center">
            Access is allowed during trial, then requires an active subscription.
          </div>
        </div>
      </div>
    </div>
  );
}
