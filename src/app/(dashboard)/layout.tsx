"use client";

import { usePathname } from "next/navigation";

import { AuthGuard } from "@/components/layout/auth-guard";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { PageTransition } from "@/components/layout/page-transition";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activo = NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"));

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar titulo={activo?.label ?? "Panel"} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
