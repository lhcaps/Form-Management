"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith("/admin/auth");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#F6F8FB",
        color: "#0F172A",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <Sidebar />
      <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column" }}>
        <Topbar />
        {/* Use div (not main) so each page can render its own <main>. */}
        <div
          style={
            isAdminPage ? { width: "100%", minWidth: 0, flex: 1 } : { flex: 1 }
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}
