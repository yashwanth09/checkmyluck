"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminSecretProvider } from "@/lib/admin-context";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [secret, setSecret] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const pathname = usePathname();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetch("/api/admin/summary?date=" + new Date().toISOString().slice(0, 10), {
      headers: { "x-admin-secret": secret },
    })
      .then((r) => {
        if (r.ok) setAuthenticated(true);
        else alert("Invalid secret");
      })
      .catch(() => alert("Failed to connect"));
  };

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Admin Login
          </h2>
          <input
            type="password"
            placeholder="Admin secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          />
          <button
            type="submit"
            className="mt-4 w-full rounded-lg bg-violet-600 py-2 font-medium text-white hover:bg-violet-700"
          >
            Enter
          </button>
        </form>
      </div>
    );
  }

  const nav = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/analytics", label: "Analytics" },
    { href: "/admin/groups", label: "Groups" },
    { href: "/admin/payments", label: "Payments" },
    { href: "/admin/refunds", label: "Refunds" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <h1 className="font-semibold text-violet-600 dark:text-violet-400">
            BingoBids Admin
          </h1>
          <nav className="flex gap-4">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`text-sm ${
                  pathname === n.href
                    ? "font-medium text-violet-600 dark:text-violet-400"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {n.label}
              </Link>
            ))}
            <Link
              href="/"
              className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Site
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <AdminSecretProvider secret={secret}>{children}</AdminSecretProvider>
      </main>
    </div>
  );
}
