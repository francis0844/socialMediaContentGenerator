"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

import { useAuth } from "@/components/auth/useAuth";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={[
        "rounded-xl px-3 py-2 text-sm transition-colors",
        active ? "bg-white text-black" : "text-white/70 hover:bg-white/10 hover:text-white",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { loading, user, account, logout, isAdmin } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-black text-white">
        <div className="mx-auto max-w-6xl px-6 py-12 text-sm text-white/70">
          Loading…
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-dvh bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm tracking-[0.3em] uppercase text-white/70">
              Lexus
            </div>
            <div className="mt-2 text-lg font-semibold tracking-tight">
              {account?.name ?? "Studio"}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-sm text-white/70 md:block">
              {user.email}
            </div>
            <button
              onClick={logout}
              className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        </header>

        <div className="mt-8 grid gap-6 md:grid-cols-[220px_1fr]">
          <nav className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="grid gap-1">
              <NavLink href="/app" label="Dashboard" />
              <NavLink href="/app/generate" label="Generate" />
              <NavLink href="/app/library/generated" label="Generated" />
              <NavLink href="/app/library/accepted" label="Accepted" />
              <NavLink href="/app/library/rejected" label="Rejected" />
              <NavLink href="/app/brand" label="Brand Profile" />
              <NavLink href="/app/billing" label="Billing" />
              {isAdmin ? <NavLink href="/app/admin" label="Admin" /> : null}
            </div>
          </nav>

          <main className="rounded-2xl border border-white/10 bg-white/5 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

