"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PreviewSwitcher } from "@/components/previews/PreviewSwitcher";
import { useImageStatusPoller } from "@/hooks/useImageStatusPoller";

type Status = "generated" | "accepted" | "rejected";
type Platform = "" | "facebook" | "instagram" | "pinterest" | "x";
type ContentType = "" | "graphic" | "story" | "text" | "video";

type Item = {
  id: string;
  status: Status;
  imageStatus?: "none" | "generating" | "ready" | "failed";
  imageUrl?: string | null;
  imageAspectRatio?: string | null;
  imageModel?: string | null;
  imagePrompt?: string | null;
  imageError?: string | null;
  createdAt: string;
  title: string | null;
  platform: string;
  contentType: string;
  caption: string | null;
  hashtags: unknown;
  output: unknown;
};

type ContentResponse = { ok: true; items: Item[] } | { ok: false; error: string };

export function LibraryPage({ status }: { status: Status }) {
  const title = useMemo(() => {
    if (status === "accepted") return "Accepted";
    if (status === "rejected") return "Rejected";
    return "Generated";
  }, [status]);

  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";

  const [platform, setPlatform] = useState<Platform>("");
  const [type, setType] = useState<ContentType>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [selected, setSelected] = useState<Item | null>(null);

  const [decisionOpen, setDecisionOpen] = useState(false);
  const [decision, setDecision] = useState<"accept" | "reject">("accept");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const [undoOpen, setUndoOpen] = useState(false);
  const [undoReason, setUndoReason] = useState("");
  const [undoing, setUndoing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"delete" | "regenerate" | null>(null);

  function toIsoEndOfDay(dateStr: string) {
    const d = new Date(dateStr);
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  }

  async function load(forceLoading = false) {
    if (forceLoading) setLoading(true);
    setError(null);

    const params = new URLSearchParams({ status });
    if (platform) params.set("platform", platform);
    if (type) params.set("type", type);
    if (from) params.set("from", new Date(from).toISOString());
    if (to) params.set("to", toIsoEndOfDay(to));

    if (query) params.set("q", query);

    const res = await fetch(`/api/content?${params.toString()}`, { cache: "no-store" });
    const raw: unknown = await res.json();
    const data = raw as ContentResponse;

    if (!res.ok || !data.ok) {
      setError("error" in data ? data.error : "LOAD_FAILED");
      setItems([]);
      setLoading(false);
      return;
    }

    setItems(data.items);
    if (forceLoading) setLoading(false);
  }

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, platform, type, from, to, query]);

  const updateItem = useCallback(
    (id: string, update: { imageStatus: string; primaryImageUrl?: string | null; imageError?: string | null }) => {
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                imageStatus: update.imageStatus as any,
                imageUrl: update.primaryImageUrl ?? i.imageUrl,
                imageError: update.imageError ?? i.imageError,
              }
            : i,
        ),
      );
    },
    [],
  );

  const generatingItems = items.filter((i) => i.imageStatus === "generating");
  useImageStatusPoller(
    generatingItems.map((i) => ({ id: i.id })),
    updateItem,
  );

  function openPreview(item: Item) {
    setSelected(item);
    setPreviewOpen(true);
  }

  function openDecision(item: Item, nextDecision: "accept" | "reject") {
    setSelected(item);
    setDecision(nextDecision);
    setReason("");
    setAiResponse(null);
    setDecisionOpen(true);
  }

  function updateItemLocal(id: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    setSelected((prev) => (prev?.id === id ? { ...prev, ...patch } : prev));
  }

  function removeItemLocal(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selected?.id === id) {
      setPreviewOpen(false);
      setDecisionOpen(false);
      setUndoOpen(false);
      setSelected(null);
    }
  }

  async function submitDecision() {
    if (!selected) return;
    setSubmitting(true);
    setAiResponse(null);
    try {
      const res = await fetch(`/api/content/${selected.id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reason }),
      });
      const raw: unknown = await res.json();
      const data = raw as { ok?: boolean; error?: string; aiResponse?: string };
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "DECISION_FAILED");
      setAiResponse(data.aiResponse ?? null);
      const nextStatus = decision === "accept" ? "accepted" : "rejected";
      updateItemLocal(selected.id, { status: nextStatus as Status });
      if (status === "generated") {
        removeItemLocal(selected.id);
      }
    } catch (e) {
      setAiResponse(e instanceof Error ? e.message : "Decision failed");
    } finally {
      setSubmitting(false);
    }
  }

  function openUndo(item: Item) {
    setSelected(item);
    setUndoReason("");
    setUndoOpen(true);
  }

  function openConfirm(action: "delete" | "regenerate", item: Item) {
    setSelected(item);
    setConfirmAction(action);
    setConfirmOpen(true);
  }

  function closeConfirm() {
    setConfirmOpen(false);
    setConfirmAction(null);
  }

  async function submitUndo() {
    if (!selected) return;
    setUndoing(true);
    try {
      const res = await fetch(`/api/content/${selected.id}/undo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: undoReason || undefined }),
      });
      const raw: unknown = await res.json();
      const data = raw as { ok?: boolean; error?: string };
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "UNDO_FAILED");
      setUndoOpen(false);
      if (status !== "generated") {
        removeItemLocal(selected.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Undo failed");
    } finally {
      setUndoing(false);
    }
  }

  async function deleteContent(item: Item) {
    setDeletingId(item.id);
    try {
      const res = await fetch(`/api/content/${item.id}`, { method: "DELETE" });
      const raw: unknown = await res.json();
      const data = raw as { ok?: boolean; error?: string };
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "DELETE_FAILED");
      if (selected?.id === item.id) {
        setPreviewOpen(false);
        setDecisionOpen(false);
        setUndoOpen(false);
        setSelected(null);
      }
      removeItemLocal(item.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  async function regenerateImage(item: Item, mode: "retry" | "regenerate" = "regenerate") {
    setRegeneratingId(item.id);
    updateItemLocal(item.id, { imageStatus: "generating", imageError: null });
    try {
      const res = await fetch(`/api/generated-content/${item.id}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const raw: unknown = await res.json();
      const data = raw as { ok?: boolean; error?: string };
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "REGENERATE_FAILED");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Regenerate failed");
      updateItemLocal(item.id, { imageStatus: "failed", imageError: "Regenerate failed" });
    } finally {
      setRegeneratingId(null);
    }
  }

  async function confirmActionHandler() {
    if (!selected || !confirmAction) return;
    if (confirmAction === "delete") {
      await deleteContent(selected);
    } else {
      await regenerateImage(selected);
    }
    closeConfirm();
  }

  return (
    <div className="text-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {status === "generated"
              ? "Review content and accept or reject with a reason."
              : "Browse your library. You can undo back to Generated."}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => load(true)}
          className="border-slate-200 bg-white text-slate-800 hover:bg-teal-50 hover:text-teal-700"
        >
          Refresh
        </Button>
      </div>

      <div className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
        <div className="space-y-2">
          <Label>Platform</Label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={platform}
            onChange={(e) => setPlatform(e.target.value as Platform)}
          >
            <option value="">All</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="pinterest">Pinterest</option>
            <option value="x">X</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value as ContentType)}
          >
            <option value="">All</option>
            <option value="graphic">Graphic</option>
            <option value="story">Story</option>
            <option value="text">Text</option>
            <option value="video">Video</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>From</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>To</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="text-sm text-slate-600">Loading…</div>
        ) : items.length ? (
          items.map((i) => (
            <div key={i.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-slate-100">
                <div className="relative aspect-square overflow-hidden">
                  {i.imageStatus === "ready" && i.imageUrl ? (
                    <img
                      src={i.imageUrl}
                      alt={i.title ?? "Generated image"}
                      className="h-full w-full object-contain bg-slate-100"
                    />
                  ) : i.imageStatus === "generating" ? (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Generating image…
                    </div>
                  ) : i.imageStatus === "failed" ? (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-rose-50 px-4 text-center text-xs font-semibold text-rose-700">
                      <div>Image failed. {i.imageError ?? ""}</div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-rose-200 bg-white text-rose-700 hover:bg-rose-100"
                        onClick={async () => {
                          await regenerateImage(i, "retry");
                        }}
                      >
                        Retry image
                      </Button>
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Preview coming soon
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 space-y-2">
                <div className="text-xs text-slate-500">
                  #{i.platform} • #{i.contentType}
                </div>
                <button
                  onClick={() => openPreview(i)}
                  className="block text-left text-base font-semibold text-slate-900 underline-offset-4 hover:underline"
                >
                  {i.title ?? `${i.contentType} • ${i.platform}`}
                </button>
                <div className="text-xs text-slate-500">
                  {new Date(i.createdAt).toLocaleString()}
                </div>
                <div className="text-sm text-slate-600 line-clamp-3">
                  {i.caption ?? "Quick look at your most recent outputs. Accept or reject to teach the AI."}
                </div>

                <div className="pt-2 flex flex-wrap gap-2">
                  <Button
                    onClick={() => openPreview(i)}
                    size="sm"
                    variant="outline"
                    className="rounded-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    Preview
                  </Button>
                  <Button
                    onClick={() => openConfirm("regenerate", i)}
                    size="sm"
                    variant="outline"
                    className="rounded-full border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    disabled={regeneratingId === i.id}
                  >
                    {regeneratingId === i.id ? "Regenerating..." : "Regenerate image"}
                  </Button>
                  <Button
                    onClick={() => openConfirm("delete", i)}
                    size="sm"
                    variant="destructive"
                    className="rounded-full bg-rose-600 text-white hover:bg-rose-700"
                    disabled={deletingId === i.id}
                  >
                    {deletingId === i.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>

                <div className="pt-2 flex flex-wrap gap-2">
                  {status === "generated" ? (
                    <>
                      <Button
                        onClick={() => openDecision(i, "accept")}
                        size="sm"
                        className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full border-rose-200 bg-white text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                        onClick={() => openDecision(i, "reject")}
                      >
                        Reject
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      onClick={() => openUndo(i)}
                    >
                      Move back to Generated
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-slate-600">No items yet.</div>
        )}
      </div>

      {previewOpen && selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 sm:px-6">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-slate-600">Preview</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {selected.title ?? `${selected.contentType} • ${selected.platform}`}
                </div>
                <div className="mt-1 break-all text-xs text-slate-500">{selected.id}</div>
              </div>
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                Close
              </Button>
            </div>

            <div className="mt-4">
              <PreviewSwitcher
                outputJson={selected.output}
                imageUrl={selected.imageUrl}
                initialPlatform={selected.platform as "facebook" | "instagram" | "pinterest" | "x"}
              />
            </div>

            {selected.status === "generated" ? (
              <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
                <Button
                  onClick={() => openDecision(selected, "accept")}
                  className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Accept
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                  onClick={() => openDecision(selected, "reject")}
                >
                  Reject
                </Button>
                <Button
                  variant="destructive"
                  className="rounded-full bg-rose-600 text-white hover:bg-rose-700"
                  onClick={() => openConfirm("delete", selected)}
                  disabled={deletingId === selected.id}
                >
                  {deletingId === selected.id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            ) : (
              <div className="mt-6 flex items-center justify-end">
                <Button
                  variant="outline"
                  className="rounded-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  onClick={() => openUndo(selected)}
                >
                  Move back to Generated
                </Button>
                <Button
                  variant="destructive"
                  className="ml-2 rounded-full bg-rose-600 text-white hover:bg-rose-700"
                  onClick={() => openConfirm("delete", selected)}
                  disabled={deletingId === selected.id}
                >
                  {deletingId === selected.id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {decisionOpen && selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="text-sm text-slate-600">
              {decision === "accept" ? "Accept" : "Reject"} — reason required
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-900">
              {selected.title ?? `${selected.contentType} • ${selected.platform}`}
            </div>

            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="mt-4"
              placeholder={
                decision === "accept"
                  ? "What worked? (tone, structure, hook, clarity…) "
                  : "What didn’t work? What should we avoid next time?"
              }
            />

            {aiResponse ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
                {aiResponse}
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setDecisionOpen(false)} disabled={submitting}>
                Close
              </Button>
              <Button
                onClick={submitDecision}
                disabled={submitting || reason.trim().length < 2}
              >
                {submitting ? "Saving…" : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {undoOpen && selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="text-sm text-slate-600">
              Move back to Generated — this will revert the learning snapshot
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-900">
              {selected.title ?? `${selected.contentType} • ${selected.platform}`}
            </div>

            <Textarea
              value={undoReason}
              onChange={(e) => setUndoReason(e.target.value)}
              rows={3}
              className="mt-4"
              placeholder="Optional: why are you undoing?"
            />

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setUndoOpen(false)} disabled={undoing}>
                Cancel
              </Button>
              <Button onClick={submitUndo} disabled={undoing}>
                {undoing ? "Undoing…" : "Move back"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmOpen && selected && confirmAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="text-sm text-slate-600">
              {confirmAction === "delete" ? "Delete content" : "Regenerate image"}
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-900">
              {selected.title ?? `${selected.contentType} • ${selected.platform}`}
            </div>
            <div className="mt-3 text-sm text-slate-600">
              {confirmAction === "delete"
                ? "This will permanently remove the content and its related assets. This cannot be undone."
                : "This will generate a new image for this content. The current image will be replaced once complete."}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={closeConfirm} disabled={deletingId === selected.id || regeneratingId === selected.id}>
                Cancel
              </Button>
              <Button
                variant={confirmAction === "delete" ? "destructive" : "default"}
                className={confirmAction === "delete" ? "rounded-full bg-rose-600 text-white hover:bg-rose-700" : "rounded-full"}
                onClick={confirmActionHandler}
                disabled={deletingId === selected.id || regeneratingId === selected.id}
              >
                {confirmAction === "delete"
                  ? deletingId === selected.id
                    ? "Deleting..."
                    : "Delete"
                  : regeneratingId === selected.id
                    ? "Regenerating..."
                    : "Regenerate"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
