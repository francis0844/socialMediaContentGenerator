"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

type Status = "generated" | "accepted" | "rejected";

type Item = {
  id: string;
  status: Status;
  createdAt: string;
  title: string | null;
  platform: string;
  contentType: string;
  caption: string | null;
  hashtags: unknown;
  output: unknown;
};

export default function LibraryStatusPage() {
  const params = useParams<{ status: string }>();
  const status = (params.status as Status) ?? "generated";
  const { status: sessionStatus } = useSession();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [decision, setDecision] = useState<"accept" | "reject">("accept");
  const [reason, setReason] = useState("");
  const [selected, setSelected] = useState<Item | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const title = useMemo(() => {
    if (status === "accepted") return "Accepted";
    if (status === "rejected") return "Rejected";
    return "Generated";
  }, [status]);

  async function load() {
    if (sessionStatus !== "authenticated") return;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/content?status=${status}`, {
      cache: "no-store",
    });
    const raw: unknown = await res.json();
    const data = raw as { ok?: boolean; error?: string; items?: Item[] };
    if (!res.ok || !data?.ok) {
      setError(data?.error ?? "LOAD_FAILED");
      setItems([]);
      setLoading(false);
      return;
    }
    setItems(data.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus, status]);

  function openDecision(item: Item, nextDecision: "accept" | "reject") {
    setSelected(item);
    setDecision(nextDecision);
    setReason("");
    setAiResponse(null);
    setModalOpen(true);
  }

  async function submitDecision() {
    if (sessionStatus !== "authenticated" || !selected) return;
    setSubmitting(true);
    setAiResponse(null);
    try {
      const res = await fetch(`/api/content/${selected.id}/decision`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ decision, reason }),
      });
      const raw: unknown = await res.json();
      const data = raw as { ok?: boolean; error?: string; aiResponse?: string };
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "DECISION_FAILED");
      setAiResponse(data.aiResponse ?? null);
      await load();
    } catch (e) {
      setAiResponse(e instanceof Error ? e.message : "Decision failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-white/70">
            {status === "generated"
              ? "Review content and accept or reject with a reason."
              : "Browse your library."}
          </p>
        </div>
        <button
          onClick={load}
          className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="text-sm text-white/70">Loading…</div>
        ) : items.length ? (
          items.map((i) => (
            <div
              key={i.id}
              className="rounded-2xl border border-white/10 bg-black/40 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-white">
                    {i.title ?? `${i.contentType} • ${i.platform}`}
                  </div>
                  <div className="mt-1 text-xs text-white/60">
                    {new Date(i.createdAt).toLocaleString()} • {i.platform} •{" "}
                    {i.contentType}
                  </div>
                </div>
                {status === "generated" ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openDecision(i, "accept")}
                      className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => openDecision(i, "reject")}
                      className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
              </div>

              {i.caption ? (
                <pre className="mt-4 text-sm whitespace-pre-wrap text-white/80">
                  {i.caption}
                </pre>
              ) : null}
            </div>
          ))
        ) : (
          <div className="text-sm text-white/60">No items yet.</div>
        )}
      </div>

      {modalOpen && selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-black p-6">
            <div className="text-sm text-white/70">
              {decision === "accept" ? "Accept" : "Reject"} — include a short reason
            </div>
            <div className="mt-4 text-sm text-white">
              {selected.title ?? `${selected.contentType} • ${selected.platform}`}
            </div>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="mt-4 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30"
              placeholder={
                decision === "accept"
                  ? "What worked? (tone, structure, hook, clarity…) "
                  : "What didn’t work? What should we avoid next time?"
              }
            />

            {aiResponse ? (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                {aiResponse}
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
                disabled={submitting}
              >
                Close
              </button>
              <button
                onClick={submitDecision}
                disabled={submitting || reason.trim().length < 2}
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
