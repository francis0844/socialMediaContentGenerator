"use client";

import { useMemo, useState } from "react";

import { useAuth } from "@/components/auth/useAuth";

type ContentType = "graphic" | "story" | "text" | "video";
type Platform = "facebook" | "instagram" | "pinterest" | "x";

export default function GeneratePage() {
  const { idToken } = useAuth();
  const [contentType, setContentType] = useState<ContentType>("text");
  const [platform, setPlatform] = useState<Platform>("instagram");

  const [mainMessage, setMainMessage] = useState("");
  const [tone, setTone] = useState("Professional");
  const [captionLength, setCaptionLength] = useState("Short & punchy");
  const [hashtagsEnabled, setHashtagsEnabled] = useState(true);
  const [hashtagCount, setHashtagCount] = useState(8);
  const [keywordsInclude, setKeywordsInclude] = useState("");
  const [keywordsAvoid, setKeywordsAvoid] = useState("");
  const [cta, setCta] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    id: string;
    status: string;
    createdAt: string;
    title: string | null;
    output: unknown;
    caption: string | null;
    hashtags: unknown;
  } | null>(null);

  const requestBody = useMemo(
    () => ({
      contentType,
      platform,
      direction: {
        mainMessage,
        tone,
        captionLength,
        hashtags: { enabled: hashtagsEnabled, count: hashtagCount },
        keywordsInclude: keywordsInclude || undefined,
        keywordsAvoid: keywordsAvoid || undefined,
        cta: cta || undefined,
      },
    }),
    [
      contentType,
      platform,
      mainMessage,
      tone,
      captionLength,
      hashtagsEnabled,
      hashtagCount,
      keywordsInclude,
      keywordsAvoid,
      cta,
    ],
  );

  async function generate() {
    if (!idToken) return;
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(requestBody),
      });
      const raw: unknown = await res.json();
      const data = raw as {
        ok?: boolean;
        error?: string;
        content?: {
          id: string;
          status: string;
          createdAt: string;
          title: string | null;
          output: unknown;
          caption: string | null;
          hashtags: unknown;
        };
      };
      if (!res.ok || !data?.ok || !data.content) {
        throw new Error(data?.error ?? "GENERATE_FAILED");
      }
      setResult(data.content);
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
            Provide direction. The studio uses your brand profile + memory summary.
          </p>
        </div>
        <button
          onClick={generate}
          disabled={loading || !mainMessage}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate"}
        </button>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error === "BRAND_PROFILE_REQUIRED" ? (
            <>
              Brand profile required. Go to <a className="underline" href="/app/brand">Brand Profile</a> and add the minimum fields.
            </>
          ) : (
            error
          )}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm">
              <div className="mb-2 text-white/70">Content type</div>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as ContentType)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30"
              >
                <option value="graphic">Graphic post</option>
                <option value="story">Story</option>
                <option value="text">Text-only</option>
                <option value="video">Video/Reels idea</option>
              </select>
            </label>

            <label className="block text-sm">
              <div className="mb-2 text-white/70">Platform</div>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30"
              >
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="pinterest">Pinterest</option>
                <option value="x">X</option>
              </select>
            </label>
          </div>

          <label className="block text-sm">
            <div className="mb-2 text-white/70">Main message / key idea *</div>
            <textarea
              value={mainMessage}
              onChange={(e) => setMainMessage(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30"
              placeholder="What should the post communicate?"
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm">
              <div className="mb-2 text-white/70">Tone</div>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30"
              >
                <option>Professional</option>
                <option>Friendly</option>
                <option>Bold</option>
                <option>Playful</option>
                <option>Inspirational</option>
              </select>
            </label>

            <label className="block text-sm">
              <div className="mb-2 text-white/70">Caption length</div>
              <select
                value={captionLength}
                onChange={(e) => setCaptionLength(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30"
              >
                <option>Short & punchy</option>
                <option>Medium</option>
                <option>Long-form</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm">
              <div className="mb-2 text-white/70">Keywords to include</div>
              <input
                value={keywordsInclude}
                onChange={(e) => setKeywordsInclude(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30"
                placeholder="e.g. premium, reliable, modern"
              />
            </label>
            <label className="block text-sm">
              <div className="mb-2 text-white/70">Words/topics to avoid</div>
              <input
                value={keywordsAvoid}
                onChange={(e) => setKeywordsAvoid(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30"
                placeholder="e.g. cheap, cringe"
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm">
              <div className="mb-2 text-white/70">CTA preference</div>
              <input
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30"
                placeholder="e.g. Learn more, Shop now, DM us"
              />
            </label>

            <div className="text-sm">
              <div className="mb-2 text-white/70">Hashtags</div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hashtagsEnabled}
                    onChange={(e) => setHashtagsEnabled(e.target.checked)}
                  />
                  <span className="text-white/70">Enable</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={hashtagCount}
                  onChange={(e) => setHashtagCount(Number(e.target.value))}
                  className="w-24 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/30"
                  disabled={!hashtagsEnabled}
                />
                <span className="text-white/70">count</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="text-sm text-white/70">Output</div>
          <div className="mt-3 rounded-2xl border border-white/10 bg-black/40 p-4">
            {result ? (
              <div className="space-y-4">
                <div className="text-sm text-white/70">
                  Saved to <span className="text-white">Generated</span> library.
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs uppercase tracking-wider text-white/60">
                    Caption
                  </div>
                  <pre className="mt-2 whitespace-pre-wrap text-sm">{result.caption}</pre>
                </div>
                {Array.isArray(result.hashtags) && result.hashtags.length ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs uppercase tracking-wider text-white/60">
                      Hashtags
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-sm text-white/80">
                      {(result.hashtags as string[]).map((h) => (
                        <span
                          key={h}
                          className="rounded-full border border-white/15 px-3 py-1"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs uppercase tracking-wider text-white/60">
                    Full JSON
                  </div>
                  <pre className="mt-2 overflow-auto text-xs text-white/80">
                    {JSON.stringify(result.output, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-sm text-white/60">
                Generate content to see structured output here.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
