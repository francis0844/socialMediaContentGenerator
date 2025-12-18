"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PreviewSwitcher } from "@/components/previews/PreviewSwitcher";

type ContentType = "graphic" | "story" | "text" | "video";
type Platform = "facebook" | "instagram" | "pinterest" | "x";
type Tone = "brand_voice" | "professional" | "friendly" | "bold" | "playful" | "inspirational";
type CaptionLength = "short" | "medium" | "long";
type HashtagMode = "optional" | "required";

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);

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

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Generate</h1>
          <p className="mt-1 text-sm text-white/70">
            Create platform-ready content. Outputs are saved to the Generated library.
          </p>
        </div>
        <Button onClick={generate} disabled={loading || !mainMessage.trim()}>
          {loading ? "Generating…" : "Generate"}
        </Button>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
          {result && "missing" in result && result.missing?.length ? (
            <div className="mt-2 text-xs text-red-200/90">
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
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={captionLength}
                onChange={(e) => setCaptionLength(e.target.value as CaptionLength)}
              >
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="long">Long</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="text-sm text-white/70">Hashtags</div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Mode</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
            <div className="mt-2 text-xs text-white/60">
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

          {result && result.ok ? (
            <PreviewSwitcher outputJson={result.content.output} initialPlatform={platform} />
          ) : (
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/60">
              Generate to see a preview here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
