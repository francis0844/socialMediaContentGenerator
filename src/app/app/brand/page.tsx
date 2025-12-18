"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth/useAuth";

type BrandColor = { name: string; hex: string };
type BrandProfile = {
  brandName: string;
  logoUrl: string | null;
  about: string;
  niche: string;
  colors: BrandColor[] | null;
  targetAudience: string | null;
  goals: string | null;
  voiceMode: string | null;
  voiceDocUrl: string | null;
};

export default function BrandProfilePage() {
  const { idToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<BrandProfile>({
    brandName: "",
    logoUrl: null,
    about: "",
    niche: "",
    colors: [],
    targetAudience: "",
    goals: "",
    voiceMode: "preset:professional",
    voiceDocUrl: null,
  });

  const colorCount = useMemo(() => (profile.colors ?? []).length, [profile.colors]);

  useEffect(() => {
    async function run() {
      if (!idToken) return;
      setLoading(true);
      const res = await fetch("/api/brand-profile", {
        headers: { Authorization: `Bearer ${idToken}` },
        cache: "no-store",
      });
      const raw: unknown = await res.json();
      const data = raw as { ok?: boolean; profile?: Partial<BrandProfile> | null };
      if (data?.ok && data.profile) {
        setProfile({
          brandName: data.profile.brandName ?? "",
          logoUrl: data.profile.logoUrl ?? null,
          about: data.profile.about ?? "",
          niche: data.profile.niche ?? "",
          colors: (data.profile.colors as BrandColor[] | null) ?? [],
          targetAudience: data.profile.targetAudience ?? "",
          goals: data.profile.goals ?? "",
          voiceMode: data.profile.voiceMode ?? "preset:professional",
          voiceDocUrl: data.profile.voiceDocUrl ?? null,
        });
      }
      setLoading(false);
    }
    run();
  }, [idToken]);

  async function save() {
    if (!idToken) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/brand-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          ...profile,
          colors: (profile.colors ?? []).filter((c) => c.name && c.hex),
        }),
      });
      const raw: unknown = await res.json();
      const data = raw as { ok?: boolean; error?: string; profile?: BrandProfile };
      if (!res.ok || !data?.ok || !data.profile) {
        throw new Error(data?.error ?? "SAVE_FAILED");
      }
      setProfile({
        brandName: data.profile.brandName,
        logoUrl: data.profile.logoUrl,
        about: data.profile.about,
        niche: data.profile.niche,
        colors: data.profile.colors ?? [],
        targetAudience: data.profile.targetAudience ?? "",
        goals: data.profile.goals ?? "",
        voiceMode: data.profile.voiceMode ?? "preset:professional",
        voiceDocUrl: data.profile.voiceDocUrl ?? null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function uploadLogo(file: File) {
    if (!idToken) return;
    setError(null);
    setUploading(true);
    try {
      const signRes = await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ folder: "smm/logos" }),
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

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sign.cloudName}/auto/upload`,
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
          <div className="mb-2 text-white/70">Company overview / about *</div>
          <textarea
            value={profile.about}
            onChange={(e) => setProfile((p) => ({ ...p, about: e.target.value }))}
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
            <div className="mt-3 break-all text-sm text-white/70">
              <span className="text-white">Current:</span> {profile.logoUrl}
            </div>
          ) : (
            <div className="mt-3 text-sm text-white/60">
              Upload will store a URL in your brand profile.
            </div>
          )}
        </div>

        <label className="block text-sm">
          <div className="mb-2 text-white/70">Target audience</div>
          <input
            value={profile.targetAudience ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, targetAudience: e.target.value }))}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-white/30"
            placeholder="Demographics + psychographics"
          />
        </label>

        <label className="block text-sm">
          <div className="mb-2 text-white/70">Primary goals</div>
          <input
            value={profile.goals ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, goals: e.target.value }))}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-white/30"
            placeholder="Awareness, leads, sales, community…"
          />
        </label>

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
