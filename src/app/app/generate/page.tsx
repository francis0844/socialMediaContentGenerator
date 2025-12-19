"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PreviewSwitcher } from "@/components/previews/PreviewSwitcher";
import { cn } from "@/lib/utils";

type ContentType = "graphic" | "story" | "text" | "video";
type Platform = "facebook" | "instagram" | "pinterest" | "x";
type Tone = "brand_voice" | "professional" | "friendly" | "bold" | "playful" | "inspirational";
type CaptionLength = "short" | "medium" | "long";
type HashtagMode = "optional" | "required";
type AspectRatio = "1:1" | "4:5" | "9:16";
type RefKind = "PRODUCT_MOCKUP" | "STYLE_MIMIC" | "LOGO_OVERRIDE";
type RefItem = {
  assetId: string | null;
  url: string | null;
  label: string;
  uploading?: boolean;
  error?: string | null;
};

type GenerateResponse =
  | {
      ok: true;
      content: {
        id: string;
        status: string;
        createdAt: string;
        title: string | null;
        output: unknown;
        caption: string | null;
        hashtags: unknown;
      };
    }
  | { ok: false; error: string; missing?: string[] };

export default function GeneratePage() {
  const [contentType, setContentType] = useState<ContentType>("text");
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [mainMessage, setMainMessage] = useState("");
  const [tone, setTone] = useState<Tone>("brand_voice");
  const [captionLength, setCaptionLength] = useState<CaptionLength>("medium");
  const [hashtagMode, setHashtagMode] = useState<HashtagMode>("required");
  const [hashtagCount, setHashtagCount] = useState(8);
  const [keywordsInclude, setKeywordsInclude] = useState("");
  const [keywordsAvoid, setKeywordsAvoid] = useState("");
  const [cta, setCta] = useState("");
  const [imageIdea, setImageIdea] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [useBrandLogo, setUseBrandLogo] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);

  const [productRefs, setProductRefs] = useState<RefItem[]>([{ assetId: null, url: null, label: "" }]);
  const [styleRefs, setStyleRefs] = useState<RefItem[]>([{ assetId: null, url: null, label: "" }]);
  const [logoOverrideRefs, setLogoOverrideRefs] = useState<RefItem[]>([{ assetId: null, url: null, label: "" }]);

  const totalRefs =
    productRefs.filter((r) => r.assetId).length +
    styleRefs.filter((r) => r.assetId).length +
    logoOverrideRefs.filter((r) => r.assetId).length;

  const maxRefsReached = totalRefs >= 10;

  function latestSlot(list: RefItem[]) {
    return list[list.length - 1];
  }

  function canAddSlot(list: RefItem[]) {
    const last = latestSlot(list);
    return !!last.assetId && last.label.trim().length > 0 && !maxRefsReached;
  }

  function addSlot(kind: RefKind) {
    if (kind === "PRODUCT_MOCKUP") setProductRefs((l) => [...l, { assetId: null, url: null, label: "" }]);
    if (kind === "STYLE_MIMIC") setStyleRefs((l) => [...l, { assetId: null, url: null, label: "" }]);
    if (kind === "LOGO_OVERRIDE") setLogoOverrideRefs((l) => [...l, { assetId: null, url: null, label: "" }]);
  }

  function updateLabel(kind: RefKind, idx: number, label: string) {
    const updater = (list: RefItem[]) => list.map((r, i) => (i === idx ? { ...r, label } : r));
    if (kind === "PRODUCT_MOCKUP") setProductRefs(updater);
    if (kind === "STYLE_MIMIC") setStyleRefs(updater);
    if (kind === "LOGO_OVERRIDE") setLogoOverrideRefs(updater);
  }

  function removeRef(kind: RefKind, idx: number) {
    const updater = (list: RefItem[]) => {
      const next = [...list];
      next.splice(idx, 1);
      if (!next.length) next.push({ assetId: null, url: null, label: "" });
      return next;
    };
    if (kind === "PRODUCT_MOCKUP") setProductRefs(updater);
    if (kind === "STYLE_MIMIC") setStyleRefs(updater);
    if (kind === "LOGO_OVERRIDE") setLogoOverrideRefs(updater);
  }

  async function uploadRef(kind: RefKind, idx: number, file: File) {
    const setList =
      kind === "PRODUCT_MOCKUP"
        ? setProductRefs
        : kind === "STYLE_MIMIC"
          ? setStyleRefs
          : setLogoOverrideRefs;

    setList((list) =>
      list.map((r, i) => (i === idx ? { ...r, uploading: true, error: null } : r)),
    );

    try {
      const signRes = await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "smm/refs", resourceType: "image" }),
      });
      const sign = (await signRes.json()) as {
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
      const uploaded = (await uploadRes.json()) as { secure_url?: string; error?: { message?: string } };
      if (!uploadRes.ok || !uploaded.secure_url) {
        throw new Error(uploaded?.error?.message ?? "UPLOAD_FAILED");
      }

      const assetRes = await fetch("/api/media-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: uploaded.secure_url,
          mimeType: file.type || "image/png",
          storageProvider: "CLOUDINARY",
          type: kind === "PRODUCT_MOCKUP" ? "PRODUCT_MOCKUP" : kind === "STYLE_MIMIC" ? "STYLE_MIMIC" : "LOGO",
        }),
      });
      const assetJson = (await assetRes.json()) as { ok?: boolean; error?: string; assetId?: string };
      if (!assetRes.ok || !assetJson.ok || !assetJson.assetId) {
        throw new Error(assetJson.error ?? "ASSET_CREATE_FAILED");
      }

      const nextAssetId: string = assetJson.assetId ?? "";
      setList((list) =>
        list.map((r, i) =>
          i === idx
            ? {
                ...r,
                assetId: nextAssetId || null,
                url: uploaded.secure_url ?? null,
                uploading: false,
              }
            : r,
        ),
      );
    } catch (e) {
      setList((list) =>
        list.map((r, i) =>
          i === idx ? { ...r, uploading: false, error: e instanceof Error ? e.message : "Upload failed" } : r,
        ),
      );
    }
  }

  const invalidRefs =
    productRefs.some((r) => r.assetId && !r.label.trim()) ||
    styleRefs.some((r) => r.assetId && !r.label.trim()) ||
    logoOverrideRefs.some((r) => r.assetId && !r.label.trim());

  async function generate() {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType,
          platform,
          direction: {
            mainMessage,
            tone,
            captionLength,
            hashtags: { mode: hashtagMode, count: hashtagCount },
            keywordsInclude: keywordsInclude || null,
            keywordsAvoid: keywordsAvoid || null,
            cta: cta || null,
            imageIdea: contentType === "graphic" ? imageIdea || null : null,
            aspectRatio: contentType === "graphic" ? aspectRatio : null,
            useBrandLogo: contentType === "graphic" ? useBrandLogo : null,
            references:
              contentType === "graphic"
                ? [
                    ...productRefs
                      .filter((r) => r.assetId)
                      .map((r) => ({ mediaAssetId: r.assetId, kind: "PRODUCT_MOCKUP", label: r.label.trim() })),
                    ...styleRefs
                      .filter((r) => r.assetId)
                      .map((r) => ({ mediaAssetId: r.assetId, kind: "STYLE_MIMIC", label: r.label.trim() })),
                    ...logoOverrideRefs
                      .filter((r) => r.assetId)
                      .map((r) => ({ mediaAssetId: r.assetId, kind: "LOGO_OVERRIDE", label: r.label.trim() })),
                  ]
                : [],
          },
        }),
      });
      const raw: unknown = await res.json();
      const data = raw as GenerateResponse;
      if (!res.ok || !data.ok) {
        const msg =
          "error" in data && data.error
            ? data.error
            : "Generation failed. Please try again.";
        setError(msg);
        setResult(data);
        return;
      }
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  const uploadDisabled = (kindList: RefItem[]) =>
    maxRefsReached || kindList.some((r) => r.uploading) || loading;

  function ReferenceUploader({
    title,
    kind,
    items,
    addSlot,
    canAddSlot,
    updateLabel,
    removeItem,
    onUpload,
    totalRefs,
    maxReached,
  }: {
    title: string;
    kind: RefKind;
    items: RefItem[];
    addSlot: () => void;
    canAddSlot: boolean;
    updateLabel: (idx: number, val: string) => void;
    removeItem: (idx: number) => void;
    onUpload: (idx: number, file: File) => void;
    totalRefs: number;
    maxReached: boolean;
  }) {
    return (
      <div className="space-y-3">
        <div className="text-sm font-semibold text-slate-800">{title}</div>
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={`${kind}-${idx}`}
              className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-600">Upload #{idx + 1}</div>
                {item.assetId ? (
                  <button
                    type="button"
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                    onClick={() => removeItem(idx)}
                  >
                    Remove
                  </button>
                ) : null}
              </div>

              <div className="mt-2 flex items-center gap-3">
                <label
                  className={cn(
                    "inline-flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold",
                    item.uploading
                      ? "border-slate-300 bg-slate-100 text-slate-500"
                      : "border-slate-200 bg-white text-slate-800 hover:border-teal-300 hover:text-teal-700",
                    (uploadDisabled(items) || maxReached) && "opacity-50 cursor-not-allowed",
                  )}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadDisabled(items) || maxReached}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onUpload(idx, file);
                    }}
                  />
                  {item.uploading ? "Uploading…" : item.assetId ? "Replace" : "Upload image"}
                </label>
                {item.url ? (
                  <img src={item.url} alt="upload" className="h-12 w-12 rounded-lg object-cover" />
                ) : (
                  <div className="text-xs text-slate-500">No image yet.</div>
                )}
              </div>

              {item.error ? (
                <div className="mt-1 text-xs text-rose-600">{item.error}</div>
              ) : null}

              <div className="mt-3 space-y-1">
                <Label className="text-xs">What is this image? (required)</Label>
                <Input
                  value={item.label}
                  onChange={(e) => updateLabel(idx, e.target.value)}
                  placeholder="Describe the image so the AI knows how to use it."
                />
              </div>
            </div>
          ))}
        </div>

        {canAddSlot && !maxReached ? (
          <button
            type="button"
            onClick={addSlot}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800"
          >
            + Add another
          </button>
        ) : (
          <div className="text-xs text-slate-500">
            Total references used: {totalRefs} / 10. Fill current slot to add more.
          </div>
        )}
      </div>
    );
  }

  function fillTest() {
    setContentType("graphic");
    setPlatform("instagram");
    setMainMessage("Launch our summer milk tea with a bright, refreshing message.");
    setTone("professional");
    setCaptionLength("medium");
    setHashtagMode("required");
    setHashtagCount(8);
    setKeywordsInclude("milk tea, summer, refreshing, cozy cafe");
    setKeywordsAvoid("alcohol, politics");
    setCta("Shop now");
    setImageIdea("Bright cafe scene, iced milk tea with fruit garnish, soft gradients, bold CTA button.");
    setAspectRatio("1:1");
    setUseBrandLogo(true);
  }

  return (
    <div className="text-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Generate</h1>
          <p className="mt-1 text-sm text-slate-600">
            Create platform-ready content. Outputs are saved to the Generated library.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={fillTest} disabled={loading}>
            Fill test data
          </Button>
          <Button
            onClick={generate}
            disabled={
              loading ||
              !mainMessage.trim() ||
              (contentType === "graphic" && invalidRefs) ||
              (contentType === "graphic" && totalRefs > 10)
            }
          >
            {loading ? "Generating…" : "Generate"}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          {result && "missing" in result && result.missing?.length ? (
            <div className="mt-2 text-xs text-red-600">
              Missing brand profile fields: {result.missing.join(", ")}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Content type</Label>
              <select
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                value={contentType}
                onChange={(e) => setContentType(e.target.value as ContentType)}
              >
                <option value="graphic">Graphic post</option>
                <option value="story">Story</option>
                <option value="text">Text-only post</option>
                <option value="video">Video/Reels idea</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Platform</Label>
              <select
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform)}
              >
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="pinterest">Pinterest</option>
                <option value="x">X</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Main message *</Label>
            <Textarea
              value={mainMessage}
              onChange={(e) => setMainMessage(e.target.value)}
              placeholder="What’s the key idea for this post?"
              rows={6}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tone</Label>
              <select
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                value={tone}
                onChange={(e) => setTone(e.target.value as Tone)}
              >
                <option value="brand_voice">Use my brand voice</option>
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="bold">Bold</option>
                <option value="playful">Playful</option>
                <option value="inspirational">Inspirational</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Caption length</Label>
              <select
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                value={captionLength}
                onChange={(e) => setCaptionLength(e.target.value as CaptionLength)}
              >
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="long">Long</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-slate-800">Hashtags</div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Mode</Label>
                <select
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  value={hashtagMode}
                  onChange={(e) => setHashtagMode(e.target.value as HashtagMode)}
                >
                  <option value="required">Required</option>
                  <option value="optional">Optional</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Count</Label>
                <Input
                  type="number"
                  value={hashtagCount}
                  onChange={(e) => setHashtagCount(Number(e.target.value))}
                  min={1}
                  max={30}
                />
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-600">
              Hashtags are supported on all platforms.
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Keywords to include</Label>
            <Input
              value={keywordsInclude}
              onChange={(e) => setKeywordsInclude(e.target.value)}
              placeholder="Comma-separated (optional)"
            />
          </div>
          <div className="space-y-2">
            <Label>Words/topics to avoid</Label>
            <Input
              value={keywordsAvoid}
              onChange={(e) => setKeywordsAvoid(e.target.value)}
              placeholder="Comma-separated (optional)"
            />
          </div>
          <div className="space-y-2">
            <Label>Call-to-action (optional)</Label>
            <Input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="Shop now, Learn more, DM us…" />
          </div>

          {contentType === "graphic" ? (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-slate-800">Image generation</div>

              <div className="space-y-2">
                <Label>Image idea / visual direction (optional)</Label>
                <Textarea
                  value={imageIdea}
                  onChange={(e) => setImageIdea(e.target.value)}
                  placeholder="Describe the visual mood, layout, elements, and brand cues you want."
                  rows={4}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Aspect ratio</Label>
                  <select
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                  >
                    <option value="1:1">1:1 (default)</option>
                    <option value="4:5">4:5</option>
                    <option value="9:16">9:16</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={useBrandLogo}
                      onChange={(e) => setUseBrandLogo(e.target.checked)}
                    />
                    <span>Use brand logo</span>
                  </Label>
                  <div className="text-xs text-slate-600">Default ON. Toggle off to omit brand logo.</div>
                </div>
              </div>

              <ReferenceUploader
                title="Product / mockup images"
                kind="PRODUCT_MOCKUP"
                items={productRefs}
                canAddSlot={canAddSlot(productRefs)}
                addSlot={() => addSlot("PRODUCT_MOCKUP")}
                updateLabel={(idx, val) => updateLabel("PRODUCT_MOCKUP", idx, val)}
                removeItem={(idx) => removeRef("PRODUCT_MOCKUP", idx)}
                onUpload={(idx, file) => uploadRef("PRODUCT_MOCKUP", idx, file)}
                totalRefs={totalRefs}
                maxReached={maxRefsReached}
              />

              <ReferenceUploader
                title="Sample graphics to mimic"
                kind="STYLE_MIMIC"
                items={styleRefs}
                canAddSlot={canAddSlot(styleRefs)}
                addSlot={() => addSlot("STYLE_MIMIC")}
                updateLabel={(idx, val) => updateLabel("STYLE_MIMIC", idx, val)}
                removeItem={(idx) => removeRef("STYLE_MIMIC", idx)}
                onUpload={(idx, file) => uploadRef("STYLE_MIMIC", idx, file)}
                totalRefs={totalRefs}
                maxReached={maxRefsReached}
              />

              <ReferenceUploader
                title="Logo override (optional)"
                kind="LOGO_OVERRIDE"
                items={logoOverrideRefs}
                canAddSlot={canAddSlot(logoOverrideRefs)}
                addSlot={() => addSlot("LOGO_OVERRIDE")}
                updateLabel={(idx, val) => updateLabel("LOGO_OVERRIDE", idx, val)}
                removeItem={(idx) => removeRef("LOGO_OVERRIDE", idx)}
                onUpload={(idx, file) => uploadRef("LOGO_OVERRIDE", idx, file)}
                totalRefs={totalRefs}
                maxReached={maxRefsReached}
              />

              <div className="text-xs text-slate-600">
                Max 10 reference images total. Each uploaded image requires a short context label.
              </div>
            </div>
          ) : null}

          {result && result.ok ? (
            <PreviewSwitcher
              outputJson={result.content.output}
              imageUrl={result.content.imageUrl}
              initialPlatform={platform}
            />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
              Generate to see a preview here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
