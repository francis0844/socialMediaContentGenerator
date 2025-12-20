"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [tab, setTab] = useState<"brand" | "preferences" | "billing">("brand");

  const [brandForm, setBrandForm] = useState({
    brandName: "",
    companyOverview: "",
    niche: "",
    targetAudience: "",
    goals: "",
    brandVoiceMode: "preset",
    voicePreset: "professional",
    voiceDocUrl: null as string | null,
  });
  const [brandLoading, setBrandLoading] = useState(false);
  const [brandSaving, setBrandSaving] = useState(false);
  const [voiceUploading, setVoiceUploading] = useState(false);

  const [billingLoading, setBillingLoading] = useState(false);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);
  const [billingStatus, setBillingStatus] = useState<string>("trialing");
  const [trialInfo, setTrialInfo] = useState<string | null>(null);

  const [preferences, setPreferences] = useState<
    Array<{
      id: string;
      decision: "accept" | "reject";
      reason: string;
      aiResponse: string;
      createdAt: string;
      title: string | null;
      platform: string | null;
      contentType: string | null;
    }>
  >([]);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [prefModalOpen, setPrefModalOpen] = useState(false);
  const [prefModalResponse, setPrefModalResponse] = useState<string | null>(null);
  const [prefRemovingId, setPrefRemovingId] = useState<string | null>(null);
  const [prefConfirmOpen, setPrefConfirmOpen] = useState(false);
  const [prefConfirmId, setPrefConfirmId] = useState<string | null>(null);

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
            voiceDocUrl: json.profile.voiceDocUrl ?? null,
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

      try {
        setPrefsLoading(true);
        const res = await fetch("/api/feedback", { cache: "no-store" });
        const json = await res.json();
        if (json?.ok && Array.isArray(json.items)) {
          setPreferences(json.items);
        } else {
          setPrefsError("Failed to load preferences.");
        }
      } catch {
        setPrefsError("Failed to load preferences.");
      } finally {
        setPrefsLoading(false);
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

  async function uploadVoiceDoc(file: File) {
    setBillingMessage(null);
    setVoiceUploading(true);
    try {
      const signRes = await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folder: "smm/brand-voice",
          resourceType: "raw",
          allowedFormats: ["pdf", "docx", "txt"],
        }),
      });
      const signRaw: unknown = await signRes.json();
      const sign = signRaw as {
        ok?: boolean;
        error?: string;
        timestamp?: number;
        signature?: string;
        folder?: string;
        apiKey?: string;
        cloudName?: string;
        resourceType?: string;
        allowedFormats?: string[] | null;
      };
      if (
        !signRes.ok ||
        !sign?.ok ||
        !sign.apiKey ||
        !sign.signature ||
        !sign.cloudName ||
        !sign.timestamp ||
        !sign.folder
      ) {
        throw new Error(sign?.error ?? "SIGN_FAILED");
      }

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sign.apiKey);
      form.append("timestamp", String(sign.timestamp));
      form.append("signature", sign.signature);
      form.append("folder", sign.folder);
      if (sign.resourceType) form.append("resource_type", sign.resourceType);
      if (sign.allowedFormats?.length) {
        form.append("allowed_formats", sign.allowedFormats.join(","));
      }

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sign.cloudName}/${sign.resourceType ?? "raw"}/upload`,
        { method: "POST", body: form },
      );
      const uploadedRaw: unknown = await uploadRes.json();
      const uploaded = uploadedRaw as { secure_url?: string; error?: { message?: string } };
      if (!uploadRes.ok) {
        throw new Error(uploaded?.error?.message ?? "UPLOAD_FAILED");
      }

      setBrandForm((p) => ({ ...p, voiceDocUrl: uploaded.secure_url ?? null }));
    } catch (e) {
      setBillingMessage(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setVoiceUploading(false);
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

  async function removePreference(id: string) {
    setPrefRemovingId(id);
    setPrefModalResponse(null);
    setPrefsError(null);
    try {
      const res = await fetch(`/api/feedback/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error ?? "REMOVE_FAILED");
      setPreferences((prev) => prev.filter((p) => p.id !== id));
      setPrefModalResponse(json.aiResponse ?? "Preference removed.");
      setPrefModalOpen(true);
    } catch (e) {
      setPrefsError(e instanceof Error ? e.message : "Remove failed");
    } finally {
      setPrefRemovingId(null);
    }
  }

  function openPrefConfirm(id: string) {
    setPrefConfirmId(id);
    setPrefConfirmOpen(true);
  }

  function closePrefConfirm() {
    setPrefConfirmOpen(false);
    setPrefConfirmId(null);
  }

  return (
    <div className="space-y-6 text-slate-900">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">Manage brand profile and billing.</p>
      </div>

      <div className="grid grid-cols-1 gap-0 rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-[260px_minmax(0,1fr)]">
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
                tab === "preferences"
                  ? "bg-teal-500 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:text-slate-900",
              )}
              onClick={() => setTab("preferences")}
            >
              Preference Customization
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
                    onChange={(e) =>
                      setBrandForm((p) => ({
                        ...p,
                        brandVoiceMode: e.target.value,
                        voiceDocUrl: e.target.value === "preset" ? null : p.voiceDocUrl,
                      }))
                    }
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
                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
                    <div className="font-semibold text-slate-700">Upload voice document</div>
                    <div className="mt-1 text-slate-500">PDF, DOCX, or TXT. Required in uploaded mode.</div>
                    <div className="mt-3">
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt"
                        disabled={voiceUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void uploadVoiceDoc(file);
                        }}
                        className="block w-full text-xs text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-50 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-slate-700"
                      />
                    </div>
                    {brandForm.voiceDocUrl ? (
                      <div className="mt-2 break-all text-[11px] text-slate-500">
                        Uploaded: {brandForm.voiceDocUrl}
                      </div>
                    ) : (
                      <div className="mt-2 text-[11px] text-slate-500">
                        {voiceUploading ? "Uploading…" : "No document uploaded yet."}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Button onClick={saveBrand} disabled={brandSaving} className="w-full md:w-auto">
                {brandSaving ? "Saving…" : "Save brand"}
              </Button>
              {billingMessage ? <div className="text-xs text-slate-600">{billingMessage}</div> : null}
            </div>
          ) : null}

          {tab === "preferences" ? (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-800">Preference Customization</div>
                  <div className="text-xs text-slate-500">
                    The AI lists learned likes and dislikes here. You can only remove items.
                  </div>
                </div>
                {prefsLoading ? <div className="text-xs text-slate-500">Loading…</div> : null}
              </div>

              {prefsError ? (
                <div className="text-xs text-rose-600">{prefsError}</div>
              ) : null}

              {preferences.length ? (
                <div className="divide-y divide-slate-100">
                  {preferences.map((pref) => (
                    <div key={pref.id} className="py-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            {pref.decision === "accept" ? "Like" : "Don't like"} •{" "}
                            {pref.platform ?? "platform"} • {pref.contentType ?? "content"}
                          </div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">
                            {pref.title ?? "Untitled content"}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">{new Date(pref.createdAt).toLocaleString()}</div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          disabled={prefRemovingId === pref.id}
                          onClick={() => openPrefConfirm(pref.id)}
                        >
                          {prefRemovingId === pref.id ? "Removing…" : "Remove"}
                        </Button>
                      </div>
                      <div className="mt-2 text-sm text-slate-600">
                        {pref.reason}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500">No preferences logged yet.</div>
              )}
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

          {prefModalOpen ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
              <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
                <div className="text-sm text-slate-600">Preference updated</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">AI response</div>
                <div className="mt-3 flex items-start gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                    AI
                  </div>
                  <div className="max-w-[85%]">
                    <div className="mt-1 rounded-2xl rounded-tl-sm border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-slate-800 shadow-sm">
                      {prefModalResponse ?? "Preference removed."}
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-end">
                  <Button variant="outline" onClick={() => setPrefModalOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {prefConfirmOpen ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
              <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
                <div className="text-sm text-slate-600">Remove preference</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">
                  This will remove the selected preference from memory.
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  The AI will update its memory and confirm the change.
                </div>
                <div className="mt-6 flex items-center justify-end gap-2">
                  <Button variant="outline" onClick={closePrefConfirm} disabled={!!prefRemovingId}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="rounded-full bg-rose-600 text-white hover:bg-rose-700"
                    onClick={async () => {
                      if (prefConfirmId) {
                        await removePreference(prefConfirmId);
                      }
                      closePrefConfirm();
                    }}
                    disabled={!!prefRemovingId}
                  >
                    {prefRemovingId ? "Removing…" : "Remove"}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
