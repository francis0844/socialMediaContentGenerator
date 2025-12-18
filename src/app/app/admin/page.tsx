"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type AccountRow = {
  id: string;
  name: string;
  plan: string;
  billingStatus: string;
  trialEndsAt: string | null;
  createdAt: string;
  members: { email: string; role: string }[];
};

export default function AdminPage() {
  const { status } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AccountRow[]>([]);

  useEffect(() => {
    async function run() {
      if (status !== "authenticated") return;
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/accounts", { cache: "no-store" });
      const raw: unknown = await res.json();
      const data = raw as { ok?: boolean; error?: string; accounts?: AccountRow[] };
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "LOAD_FAILED");
        setAccounts([]);
        setLoading(false);
        return;
      }
      setAccounts(data.accounts ?? []);
      setLoading(false);
    }
    run();
  }, [status]);

  if (error === "FORBIDDEN") {
    return (
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-2 text-sm text-white/70">
          Access denied. Add your email to `ADMIN_EMAIL_ALLOWLIST` to enable admin mode.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Admin</h1>
      <p className="mt-1 text-sm text-white/70">Accounts overview (first 100).</p>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mt-6 overflow-auto rounded-2xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/5 text-white/70">
            <tr>
              <th className="px-4 py-3 font-medium">Account</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Trial ends</th>
              <th className="px-4 py-3 font-medium">Members</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-4 text-white/70" colSpan={5}>
                  Loading…
                </td>
              </tr>
            ) : accounts.length ? (
              accounts.map((a) => (
                <tr key={a.id} className="border-t border-white/10">
                  <td className="px-4 py-3">
                    <div className="text-white">{a.name}</div>
                    <div className="text-xs text-white/60">{a.id}</div>
                  </td>
                  <td className="px-4 py-3 text-white/80">{a.billingStatus}</td>
                  <td className="px-4 py-3 text-white/80">
                    {a.trialEndsAt ? new Date(a.trialEndsAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-white/80">
                    {a.members.map((m) => `${m.email} (${m.role})`).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-white/80">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-4 text-white/70" colSpan={5}>
                  No accounts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
