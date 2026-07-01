"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/app-shell";
import { buildSignInPath, isAuthBypassPath } from "@/lib/auth-routes";

/**
 * Gate: nếu user chưa đăng nhập, redirect tới /sign-in (giữ returnUrl).
 * Nếu đang loading, hiển thị fallback.
 */
export function AuthGate({
  children,
  loadingFallback,
}: {
  children: ReactNode;
  loadingFallback?: ReactNode;
}) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated" && !isAuthBypassPath(pathname)) {
      router.replace(buildSignInPath(pathname ?? "/"));
    }
  }, [status, router, pathname]);

  // Auth pages handle their own redirect → no gate.
  if (isAuthBypassPath(pathname)) {
    return <>{children}</>;
  }

  if (status === "loading") {
    return (
      <>
        {loadingFallback ?? (
          <div
            style={{
              display: "grid",
              placeItems: "center",
              minHeight: 240,
              color: "#64748B",
              fontSize: 14,
            }}
          >
            Đang tải phiên làm việc…
          </div>
        )}
      </>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return <AppShell>{children}</AppShell>;
}
