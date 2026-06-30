import type { Metadata } from "next";

import { AuthProvider } from "@/lib/auth-context";
import { AuthGate } from "@/components/auth/auth-gate";
import "./globals.css";

export const metadata: Metadata = {
  title: "QUANLYVKS",
  description: "Hệ thống quản lý hồ sơ và biểu mẫu Viện kiểm sát",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body style={{ margin: 0 }}>
        <a
          href="#main-content"
          className="sr-only z-[100] rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Bỏ qua điều hướng
        </a>
        <AuthProvider>
          <AuthGate>
            {children}
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
