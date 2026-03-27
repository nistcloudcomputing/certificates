"use client";

import Card from "@/components/ui/Card";
import { BarChart3, LayoutDashboard, LogOut, Upload, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";

type AdminShellProps = {
  children: ReactNode;
};

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/upload", label: "Upload", icon: Upload },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/75 to-black/90" />
      <div className="absolute inset-x-0 top-0 h-[38vh] bg-gradient-to-b from-black/95 via-black/80 to-transparent" />
      <div className="noise-overlay absolute inset-0 opacity-15" />
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 md:flex-row md:gap-6 md:p-6">
        <aside className="w-full md:w-64">
          <Card className="h-full">
            <h2 className="mb-1 bg-gradient-to-r from-zinc-50 to-zinc-300 bg-clip-text text-lg font-semibold text-transparent">
              Admin Panel
            </h2>
            <p className="mb-4 text-xs text-zinc-400">Manage users, uploads and analytics</p>
            <nav className="space-y-2">
              {links.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                      active
                        ? "bg-zinc-800/85 text-zinc-100 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
                        : "text-zinc-300 hover:bg-white/10 hover:text-zinc-100"
                    }`}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <button
              onClick={handleLogout}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/8 px-3 py-2 text-sm text-zinc-100 transition hover:bg-white/14"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          </Card>
        </aside>
        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </div>
  );
}
