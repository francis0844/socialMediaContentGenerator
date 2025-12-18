"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Undo2,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: ReactNode };

function NavLink({ href, label, icon }: NavItem) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all",
        active
          ? "bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      )}
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/70 text-slate-700 shadow-sm">
        {icon}
      </span>
      {label}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status, data } = useSession();
  const loading = status === "loading";
  const user = data?.user ?? null;
  const accountId = data?.accountId ?? null;
  const [isAdmin, setIsAdmin] = useState(false);

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

  if (loading) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
        <div className="mx-auto max-w-screen-xl px-6 py-12 text-sm text-slate-600">
          Loading…
        </div>
      </div>
    );
  }

  if (!user) return null;

  const navItems: NavItem[] = [
    { href: "/app", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: "/app/generate", label: "Generate", icon: <Sparkles className="h-4 w-4" /> },
    { href: "/app/library/generated", label: "Generated", icon: <BookOpen className="h-4 w-4" /> },
    { href: "/app/library/accepted", label: "Accepted", icon: <CheckCircle2 className="h-4 w-4" /> },
    { href: "/app/library/rejected", label: "Rejected", icon: <Undo2 className="h-4 w-4" /> },
    { href: "/app/brand", label: "Brand Profile", icon: <Users className="h-4 w-4" /> },
    { href: "/app/billing", label: "Billing", icon: <CreditCard className="h-4 w-4" /> },
  ];

  if (isAdmin) {
    navItems.push({ href: "/app/admin", label: "Admin", icon: <BarChart3 className="h-4 w-4" /> });
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
      <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6 lg:px-10">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-indigo-100/50">
          <div className="grid gap-0 md:grid-cols-[260px_1fr]">
            <aside className="border-b border-slate-200 bg-slate-50/60 px-5 py-6 md:border-b-0 md:border-r">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">
                    Lexus
                  </div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">Studio</div>
                  {accountId ? (
                    <div className="mt-1 text-xs text-slate-500">Account: {accountId}</div>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 space-y-2">
                {navItems.map((item) => (
                  <NavLink key={item.href} {...item} />
                ))}
              </div>
            </aside>

            <div className="flex flex-col">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
                <div className="flex flex-col">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Lexus Content Engine
                  </span>
                  <span className="text-base font-semibold text-slate-900">
                    Social Media Magic Generator
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden text-sm text-slate-600 md:block">{user.email}</div>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-px hover:shadow-md"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </header>

              <main className="min-h-[70vh] bg-gradient-to-br from-white via-slate-50 to-white px-6 py-6">
                <div className="mx-auto max-w-5xl">{children}</div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
