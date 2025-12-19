"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [tab, setTab] = useState<"brand" | "billing">("brand");

  const [brandForm, setBrandForm] = useState({
    brandName: "",
    companyOverview: "",
    niche: "",
    targetAudience: "",
    goals: "",
    brandVoiceMode: "preset",
    voicePreset: "professional",
  });
  const [brandLoading, setBrandLoading] = useState(false);
  const [brandSaving, setBrandSaving] = useState(false);

  const [billingLoading, setBillingLoading] = useState(false);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);
  const [billingStatus, setBillingStatus] = useState<string>("trialing");
  const [trialInfo, setTrialInfo] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setBrandLoading(true);
      setBillingLoading(true);
      try {
        const res = await fetch("/api/brand-profile", { cache: "no-store" });
        const json = await res.json();
        if (json?.profile) {
          setBrandForm({
            brandName: json.profile.brandName ?? "",
            companyOverview: json.profile.companyOverview ?? "",
            niche: json.profile.niche ?? "",
            targetAudience: json.profile.targetAudience ?? "",
            goals: json.profile.goals ?? "",
            brandVoiceMode: json.profile.brandVoiceMode ?? "preset",
            voicePreset: json.profile.voicePreset ?? "professional",
          });
        }
      } catch {
        // ignore
      } finally {
        setBrandLoading(false);
      }

      try {
        const res = await fetch("/api/usage", { cache: "no-store" });
        const json = await res.json();
        if (json?.billingStatus) setBillingStatus(json.billingStatus);
        if (json?.trialDaysLeft !== undefined && json?.trialDaysLeft !== null) {
          setTrialInfo(`${json.trialDaysLeft} day${json.trialDaysLeft === 1 ? "" : "s"} left`);
        }
      } catch {
        // ignore
      } finally {
        setBillingLoading(false);
      }
    }

    void load();
  }, []);

  async function saveBrand() {
    setBrandSaving(true);
    setBillingMessage(null);
    try {
      const res = await fetch("/api/brand-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brandForm),
      });
      if (!res.ok) throw new Error("Save failed");
      setBillingMessage("Brand profile saved.");
    } catch (e) {
      setBillingMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBrandSaving(false);
    }
  }

  async function startCheckout() {
    setBillingMessage(null);
    setBillingLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
    } catch (e) {
      setBillingMessage(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBillingLoading(false);
    }
  }

  async function openPortal() {
    setBillingMessage(null);
    setBillingLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
    } catch (e) {
      setBillingMessage(e instanceof Error ? e.message : "Portal failed");
    } finally {
      setBillingLoading(false);
    }
  }

  return (
    <div className="space-y-6 text-slate-900">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">Manage brand profile and billing.</p>
      </div>

      <div className="grid gap-0 rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-[240px,1fr]">
        <div className="border-b border-slate-200 bg-slate-50 p-4 md:border-b-0 md:border-r">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Sections</div>
          <div className="mt-3 space-y-2">
            <button
              className={cn(
                "w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition",
                tab === "brand"
                  ? "bg-teal-500 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:text-slate-900",
              )}
              onClick={() => setTab("brand")}
            >
              Brand Profile
            </button>
            <button
              className={cn(
                "w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition",
                tab === "billing"
                  ? "bg-teal-500 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:text-slate-900",
              )}
              onClick={() => setTab("billing")}
            >
              Billing
            </button>
          </div>
        </div>

        <div className="p-6">
          {tab === "brand" ? (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-800">Brand Profile</div>
                  <div className="text-xs text-slate-500">Required to generate on-brand content.</div>
                </div>
                {brandLoading ? <div className="text-xs text-slate-500">Loading…</div> : null}
              </div>

              <div className="grid gap-3 text-sm md:grid-cols-2">
                <Label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-600">Brand name</span>
                  <Input
                    value={brandForm.brandName}
                    onChange={(e) => setBrandForm((p) => ({ ...p, brandName: e.target.value }))}
                    placeholder="Brand name"
                  />
                </Label>
                <Label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-600">Niche / industry</span>
                  <Input
                    value={brandForm.niche}
                    onChange={(e) => setBrandForm((p) => ({ ...p, niche: e.target.value }))}
                    placeholder="Food and Beverages"
                  />
                </Label>
              </div>

              <Label className="space-y-1">
                <span className="text-xs font-semibold text-slate-600">Company overview</span>
                <Textarea
                  rows={6}
                  value={brandForm.companyOverview}
                  onChange={(e) => setBrandForm((p) => ({ ...p, companyOverview: e.target.value }))}
                  placeholder="Describe your brand, offering, and voice."
                />
              </Label>

              <div className="grid gap-3 text-sm md:grid-cols-2">
                <Label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-600">Target audience</span>
                  <Input
                    value={brandForm.targetAudience}
                    onChange={(e) => setBrandForm((p) => ({ ...p, targetAudience: e.target.value }))}
                    placeholder="e.g., Gen Z boba lovers"
                  />
                </Label>
                <Label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-600">Goals</span>
                  <Input
                    value={brandForm.goals}
                    onChange={(e) => setBrandForm((p) => ({ ...p, goals: e.target.value }))}
                    placeholder="Create sales, grow community…"
                  />
                </Label>
              </div>

              <div className="grid gap-3 text-sm md:grid-cols-2">
                <Label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-600">Brand voice mode</span>
                  <select
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={brandForm.brandVoiceMode}
                    onChange={(e) => setBrandForm((p) => ({ ...p, brandVoiceMode: e.target.value }))}
                  >
                    <option value="preset">Preset tone</option>
                    <option value="uploaded">Uploaded document</option>
                  </select>
                </Label>

                {brandForm.brandVoiceMode === "preset" ? (
                  <Label className="space-y-1">
                    <span className="text-xs font-semibold text-slate-600">Tone preset</span>
                    <select
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                      value={brandForm.voicePreset}
                      onChange={(e) => setBrandForm((p) => ({ ...p, voicePreset: e.target.value }))}
                    >
                      <option value="professional">Professional</option>
                      <option value="friendly">Friendly</option>
                      <option value="bold">Bold</option>
                      <option value="playful">Playful</option>
                      <option value="inspirational">Inspirational</option>
                    </select>
                  </Label>
                ) : (
                  <div className="text-xs text-slate-500">
                    Upload a voice document on the main Brand Profile page (S3/Cloudinary).
                  </div>
                )}
              </div>

              <Button onClick={saveBrand} disabled={brandSaving} className="w-full md:w-auto">
                {brandSaving ? "Saving…" : "Save brand"}
              </Button>
              {billingMessage ? <div className="text-xs text-slate-600">{billingMessage}</div> : null}
            </div>
          ) : null}

          {tab === "billing" ? (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-800">Billing</div>
                  <div className="text-xs text-slate-500">Manage your subscription and customer portal.</div>
                </div>
                {billingLoading ? <div className="text-xs text-slate-500">Loading…</div> : null}
              </div>

              <div className="text-sm text-slate-600">
                Status: <span className="font-semibold text-slate-900">{billingStatus}</span>
              </div>
              <div className="text-sm text-slate-600">
                Trial: <span className="font-semibold text-slate-900">{trialInfo ?? "—"}</span>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button onClick={startCheckout} disabled={billingLoading}>
                  Subscribe
                </Button>
                <Button
                  variant="outline"
                  onClick={openPortal}
                  disabled={billingLoading}
                  className="border-slate-200 bg-white text-slate-800 hover:bg-slate-100"
                >
                  Customer portal
                </Button>
              </div>

              {billingMessage ? <div className="text-xs text-slate-600">{billingMessage}</div> : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
