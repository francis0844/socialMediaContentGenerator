"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

type BrandColor = { name: string; hex: string };
type BrandProfile = {
  brandName: string;
  logoUrl: string | null;
  companyOverview: string;
  niche: string;
  colors: BrandColor[] | null;
  targetAudience: string;
  goals: string;
  brandVoiceMode: "preset" | "uploaded";
  voicePreset: "professional" | "friendly" | "bold" | "playful" | "inspirational" | null;
  voiceDocUrl: string | null;
};

type Completeness = {
  complete: boolean;
  completedCount: number;
  requiredCount: number;
  missing: string[];
};

export default function BrandProfilePage() {
  const { data } = useSession();
  const accountId = data?.accountId ?? null;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completeness, setCompleteness] = useState<Completeness | null>(null);
  const [profile, setProfile] = useState<BrandProfile>({
    brandName: "",
    logoUrl: null,
    companyOverview: "",
    niche: "",
    colors: [],
    targetAudience: "",
    goals: "",
    brandVoiceMode: "preset",
    voicePreset: "professional",
    voiceDocUrl: null,
  });

  const colorCount = useMemo(() => (profile.colors ?? []).length, [profile.colors]);

  useEffect(() => {
    async function run() {
      if (!accountId) return;
      setLoading(true);
      const res = await fetch("/api/brand-profile", { cache: "no-store" });
      const raw: unknown = await res.json();
      const data = raw as {
        ok?: boolean;
        profile?: Partial<BrandProfile> | null;
        completeness?: Completeness;
      };
      if (data?.ok && data.profile) {
        setProfile({
          brandName: data.profile.brandName ?? "",
          logoUrl: data.profile.logoUrl ?? null,
          companyOverview: data.profile.companyOverview ?? "",
          niche: data.profile.niche ?? "",
          colors: (data.profile.colors as BrandColor[] | null) ?? [],
          targetAudience: data.profile.targetAudience ?? "",
          goals: data.profile.goals ?? "",
          brandVoiceMode: (data.profile.brandVoiceMode as "preset" | "uploaded") ?? "preset",
          voicePreset:
            (data.profile.voicePreset as BrandProfile["voicePreset"]) ?? "professional",
          voiceDocUrl: data.profile.voiceDocUrl ?? null,
        });
      }
      if (data?.completeness) setCompleteness(data.completeness);
      setLoading(false);
    }
    run();
  }, [accountId]);

  async function save() {
    if (!accountId) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/brand-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...profile,
          colors: (profile.colors ?? []).filter((c) => c.name && c.hex),
        }),
      });
      const raw: unknown = await res.json();
      const data = raw as {
        ok?: boolean;
        error?: string;
        profile?: BrandProfile;
        completeness?: Completeness;
      };
      if (!res.ok || !data?.ok || !data.profile) {
        throw new Error(data?.error ?? "SAVE_FAILED");
      }
      setProfile({
        brandName: data.profile.brandName,
        logoUrl: data.profile.logoUrl,
        companyOverview: data.profile.companyOverview,
        niche: data.profile.niche,
        colors: data.profile.colors ?? [],
        targetAudience: data.profile.targetAudience ?? "",
        goals: data.profile.goals ?? "",
        brandVoiceMode: data.profile.brandVoiceMode ?? "preset",
        voicePreset: data.profile.voicePreset ?? "professional",
        voiceDocUrl: data.profile.voiceDocUrl ?? null,
      });
      if (data.completeness) setCompleteness(data.completeness);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function uploadLogo(file: File) {
    if (!accountId) return;
    setError(null);
    setUploading(true);
    try {
      const signRes = await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folder: "smm/logos", resourceType: "image" }),
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

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sign.cloudName}/${sign.resourceType ?? "auto"}/upload`,
        { method: "POST", body: form },
      );
      const uploadedRaw: unknown = await uploadRes.json();
      const uploaded = uploadedRaw as {
        secure_url?: string;
        error?: { message?: string };
      };
      if (!uploadRes.ok) {
        throw new Error(uploaded?.error?.message ?? "UPLOAD_FAILED");
      }

      setProfile((p) => ({ ...p, logoUrl: uploaded.secure_url ?? null }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function uploadVoiceDoc(file: File) {
    if (!accountId) return;
    setError(null);
    setUploading(true);
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

      setProfile((p) => ({ ...p, voiceDocUrl: uploaded.secure_url ?? null }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return <div className="text-sm text-white/70">Loading brand profile…</div>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Brand Profile</h1>
          <p className="mt-1 text-sm text-white/70">
            Set your brand once. The generator uses this profile every time.
          </p>
          {completeness ? (
            <p className="mt-2 text-sm text-white/60">
              Completeness:{" "}
              <span className="text-white">
                {completeness.completedCount}/{completeness.requiredCount}
              </span>
              {completeness.complete ? " (ready)" : null}
            </p>
          ) : null}
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <label className="block text-sm">
          <div className="mb-2 text-white/70">Brand name *</div>
          <input
            value={profile.brandName}
            onChange={(e) => setProfile((p) => ({ ...p, brandName: e.target.value }))}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-white/30"
          />
        </label>

        <label className="block text-sm">
          <div className="mb-2 text-white/70">Niche / industry *</div>
          <input
            value={profile.niche}
            onChange={(e) => setProfile((p) => ({ ...p, niche: e.target.value }))}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-white/30"
          />
        </label>

        <label className="block text-sm md:col-span-2">
          <div className="mb-2 text-white/70">Company overview *</div>
          <textarea
            value={profile.companyOverview}
            onChange={(e) =>
              setProfile((p) => ({ ...p, companyOverview: e.target.value }))
            }
            rows={5}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-white/30"
          />
        </label>

        <div className="md:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-white/70">Logo (optional)</div>
            <label className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadLogo(file);
                }}
                disabled={uploading}
              />
              {uploading ? "Uploading…" : "Upload logo"}
            </label>
          </div>
          {profile.logoUrl ? (
            <div className="mt-3 text-sm break-all text-white/70">
              <span className="text-white">Current:</span> {profile.logoUrl}
            </div>
          ) : (
            <div className="mt-3 text-sm text-white/60">
              Upload will store a URL in your brand profile.
            </div>
          )}
        </div>

        <label className="block text-sm">
          <div className="mb-2 text-white/70">Target audience *</div>
          <input
            value={profile.targetAudience}
            onChange={(e) =>
              setProfile((p) => ({ ...p, targetAudience: e.target.value }))
            }
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-white/30"
            placeholder="Demographics + psychographics"
          />
        </label>

        <label className="block text-sm">
          <div className="mb-2 text-white/70">Primary goals *</div>
          <input
            value={profile.goals}
            onChange={(e) => setProfile((p) => ({ ...p, goals: e.target.value }))}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-white/30"
            placeholder="Awareness, leads, sales, community…"
          />
        </label>

        <div className="md:col-span-2">
          <div className="text-sm text-white/70">Brand voice *</div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="block text-sm">
              <div className="mb-2 text-white/70">Mode</div>
              <select
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30"
                value={profile.brandVoiceMode}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    brandVoiceMode: e.target.value as "preset" | "uploaded",
                  }))
                }
              >
                <option value="preset">Preset tone</option>
                <option value="uploaded">Upload document</option>
              </select>
            </label>

            {profile.brandVoiceMode === "preset" ? (
              <label className="block text-sm">
                <div className="mb-2 text-white/70">Preset</div>
                <select
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30"
                  value={profile.voicePreset ?? "professional"}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      voicePreset: e.target.value as BrandProfile["voicePreset"],
                      voiceDocUrl: null,
                    }))
                  }
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="bold">Bold</option>
                  <option value="playful">Playful</option>
                  <option value="inspirational">Inspirational</option>
                </select>
              </label>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <div className="text-sm text-white/70">
                  Upload voice doc (pdf, docx, txt)
                </div>
                <div className="mt-3">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadVoiceDoc(file);
                    }}
                    className="block w-full text-sm text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-black"
                  />
                </div>
                {profile.voiceDocUrl ? (
                  <div className="mt-3 text-xs text-white/60 break-all">
                    Uploaded: {profile.voiceDocUrl}
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-white/60">
                    Required in uploaded mode.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/70">Brand colors</div>
            <button
              type="button"
              onClick={() =>
                setProfile((p) => ({
                  ...p,
                  colors: [...(p.colors ?? []), { name: "", hex: "" }],
                }))
              }
              className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
            >
              Add color
            </button>
          </div>

          {colorCount ? (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {(profile.colors ?? []).map((c, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    value={c.name}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        colors: (p.colors ?? []).map((x, i) =>
                          i === idx ? { ...x, name: e.target.value } : x,
                        ),
                      }))
                    }
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30"
                    placeholder="Name"
                  />
                  <input
                    value={c.hex}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        colors: (p.colors ?? []).map((x, i) =>
                          i === idx ? { ...x, hex: e.target.value } : x,
                        ),
                      }))
                    }
                    className="w-40 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30"
                    placeholder="#000000"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setProfile((p) => ({
                        ...p,
                        colors: (p.colors ?? []).filter((_, i) => i !== idx),
                      }))
                    }
                    className="rounded-xl border border-white/15 px-3 text-sm text-white/70 hover:bg-white/10"
                    aria-label="Remove color"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 text-sm text-white/60">
              Optional — add hex codes and names (e.g., “Gold #C9A227”).
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
