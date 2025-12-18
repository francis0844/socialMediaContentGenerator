"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Sparkles,
  Undo2,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = { href?: string; label: string; icon: ReactNode; onClick?: () => void };

function NavLink({ href, label, icon, onClick }: NavItem) {
  const pathname = usePathname();
  const active = href ? pathname === href : false;
  const Comp = (href ? Link : "button") as React.ElementType;
  const baseProps = href ? { href } : { type: "button" as const };

  return (
    <Comp
      {...baseProps}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all w-full",
        active
          ? "bg-teal-50 text-teal-700 shadow-[0_8px_24px_rgba(16,185,165,0.15)]"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
        "cursor-pointer",
      )}
    >
      <span
        className={cn(
          "grid h-9 w-9 place-items-center rounded-lg border text-teal-600 transition",
          active ? "border-teal-200 bg-white" : "border-slate-200 bg-white",
        )}
      >
        {icon}
      </span>
      <span className="flex-1 text-left">{label}</span>
    </Comp>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status, data } = useSession();
  const loading = status === "loading";
  const user = data?.user ?? null;
  const accountId = data?.accountId ?? null;
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
  const [settingsTab, setSettingsTab] = useState<"brand" | "billing">("brand");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    (async () => {
      try {
        const res = await fetch("/api/bootstrap", { cache: "no-store" });
        const raw: unknown = await res.json();
        const json = raw as { ok?: boolean; user?: { isAdmin?: boolean } };
        setIsAdmin(Boolean(json?.user?.isAdmin));
      } catch {
        setIsAdmin(false);
      }
    })();
  }, [status]);

  const navItems: NavItem[] = useMemo(() => {
    const base: NavItem[] = [
      { href: "/app", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
      { href: "/app/generate", label: "Generate", icon: <Sparkles className="h-4 w-4" /> },
      { href: "/app/library/generated", label: "Generated", icon: <BookOpen className="h-4 w-4" /> },
      { href: "/app/library/accepted", label: "Accepted", icon: <CheckCircle2 className="h-4 w-4" /> },
      { href: "/app/library/rejected", label: "Rejected", icon: <Undo2 className="h-4 w-4" /> },
      { label: "Settings", icon: <Settings className="h-4 w-4" />, onClick: () => setShowSettings(true) },
    ];
    return isAdmin
      ? [...base, { href: "/app/admin", label: "Admin", icon: <BarChart3 className="h-4 w-4" /> }]
      : base;
  }, [isAdmin]);

  useEffect(() => {
    async function loadSettings() {
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
    if (showSettings) void loadSettings();
  }, [showSettings]);

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

  if (loading) {
    return (
      <div className="min-h-dvh bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-screen-xl px-6 py-12 text-sm text-slate-600">Loading…</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <div className="flex min-h-dvh">
        <aside className="hidden w-[240px] flex-shrink-0 border-r border-slate-200 bg-white px-5 py-6 md:block">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-teal-500 text-white shadow-lg shadow-teal-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight text-slate-900">Lexus</div>
              <div className="text-xs font-medium uppercase tracking-[0.3em] text-teal-600">Studio</div>
            </div>
          </div>

          <div className="mt-8 space-y-2">
            {navItems.map((item, idx) => (
              <NavLink key={`${item.label}-${idx}`} {...item} />
            ))}
          </div>

          <div className="mt-auto pt-10 text-sm text-slate-500">
            {accountId ? <div className="text-xs">Account: {accountId}</div> : null}
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex flex-1 items-center gap-3">
              <button className="md:hidden rounded-lg border border-slate-200 bg-white p-2 text-slate-600">
                <Menu className="h-5 w-5" />
              </button>
              <form
                className="relative w-full max-w-xl"
                onSubmit={(e) => {
                  e.preventDefault();
                  const term = searchTerm.trim();
                  if (!term) return;
                  router.push(`/app/library/generated?q=${encodeURIComponent(term)}`);
                }}
              >
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-full border border-slate-200 bg-slate-50 px-10 py-2 text-sm outline-none transition focus:border-teal-300 focus:bg-white"
                  placeholder="Search content"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </form>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden flex-col text-right text-xs text-slate-600 md:flex">
                <span className="font-semibold text-slate-900">{user.email}</span>
                <span className="text-slate-500">Account</span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="inline-flex items-center gap-2 rounded-full bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-teal-200 transition hover:-translate-y-px hover:shadow-lg"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </header>

          <main className="flex-1 bg-slate-50 px-4 py-6 md:px-8">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </div>

      {showSettings ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-800">Settings</div>
                <div className="text-xs text-slate-500">Manage brand profile and billing</div>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
              >
                Close
              </button>
            </div>

            <div className="mt-4">
              <div className="mb-3 flex gap-2">
                <button
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm font-semibold",
                    settingsTab === "brand"
                      ? "bg-teal-500 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-700",
                  )}
                  onClick={() => setSettingsTab("brand")}
                >
                  Brand Profile
                </button>
                <button
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm font-semibold",
                    settingsTab === "billing"
                      ? "bg-teal-500 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-700",
                  )}
                  onClick={() => setSettingsTab("billing")}
                >
                  Billing
                </button>
              </div>

              {settingsTab === "brand" ? (
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-800">Brand Profile</div>
                    <Users className="h-4 w-4 text-teal-600" />
                  </div>
                  {brandLoading ? (
                    <div className="text-xs text-slate-500">Loading brand…</div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <input
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                        placeholder="Brand name"
                        value={brandForm.brandName}
                        onChange={(e) => setBrandForm((p) => ({ ...p, brandName: e.target.value }))}
                      />
                      <input
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                        placeholder="Niche / industry"
                        value={brandForm.niche}
                        onChange={(e) => setBrandForm((p) => ({ ...p, niche: e.target.value }))}
                      />
                      <textarea
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                        rows={3}
                        placeholder="Company overview"
                        value={brandForm.companyOverview}
                        onChange={(e) =>
                          setBrandForm((p) => ({ ...p, companyOverview: e.target.value }))
                        }
                      />
                      <input
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                        placeholder="Target audience"
                        value={brandForm.targetAudience}
                        onChange={(e) => setBrandForm((p) => ({ ...p, targetAudience: e.target.value }))}
                      />
                      <input
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                        placeholder="Goals"
                        value={brandForm.goals}
                        onChange={(e) => setBrandForm((p) => ({ ...p, goals: e.target.value }))}
                      />
                      <select
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                        value={brandForm.brandVoiceMode}
                        onChange={(e) =>
                          setBrandForm((p) => ({ ...p, brandVoiceMode: e.target.value }))
                        }
                      >
                        <option value="preset">Preset tone</option>
                        <option value="uploaded">Uploaded document</option>
                      </select>
                      {brandForm.brandVoiceMode === "preset" ? (
                        <select
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                          value={brandForm.voicePreset}
                          onChange={(e) =>
                            setBrandForm((p) => ({ ...p, voicePreset: e.target.value }))
                          }
                        >
                          <option value="professional">Professional</option>
                          <option value="friendly">Friendly</option>
                          <option value="bold">Bold</option>
                          <option value="playful">Playful</option>
                          <option value="inspirational">Inspirational</option>
                        </select>
                      ) : (
                        <div className="text-xs text-slate-500">
                          Uploaded voice doc required (manage via main Brand Profile page).
                        </div>
                      )}
                      <button
                        onClick={saveBrand}
                        disabled={brandSaving}
                        className="w-full rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-px hover:shadow-md disabled:opacity-50"
                      >
                        {brandSaving ? "Saving…" : "Save brand"}
                      </button>
                    </div>
                  )}
                </div>
              ) : null}

              {settingsTab === "billing" ? (
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-800">Billing</div>
                    <CreditCard className="h-4 w-4 text-teal-600" />
                  </div>
                  {billingLoading ? (
                    <div className="text-xs text-slate-500">Loading billing…</div>
                  ) : (
                    <>
                      <div className="text-sm text-slate-600">
                        Status: <span className="font-semibold text-slate-900">{billingStatus}</span>
                      </div>
                      <div className="text-sm text-slate-600">
                        Trial: <span className="font-semibold text-slate-900">{trialInfo ?? "—"}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <button
                          onClick={startCheckout}
                          className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-px hover:shadow-md"
                        >
                          Subscribe
                        </button>
                        <button
                          onClick={openPortal}
                          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-px hover:shadow-md"
                        >
                          Customer portal
                        </button>
                      </div>
                      {billingMessage ? (
                        <div className="text-xs text-slate-500">{billingMessage}</div>
                      ) : null}
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
