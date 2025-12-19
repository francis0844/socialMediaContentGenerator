"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { BarChart3, BookOpen, CheckCircle2, LayoutDashboard, LogOut, Menu, Search, Settings, Sparkles, Undo2 } from "lucide-react";

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
      { href: "/app/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
    ];
    return isAdmin
      ? [...base, { href: "/app/admin", label: "Admin", icon: <BarChart3 className="h-4 w-4" /> }]
      : base;
  }, [isAdmin]);

  // settings data now loads within settings page (see /app/settings)

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

    </div>
  );
}
