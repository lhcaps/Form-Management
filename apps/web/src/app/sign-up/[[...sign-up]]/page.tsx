"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { buildSignInPath, returnPathFromSearchParams } from "@/lib/auth-routes";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const returnPath = useMemo(() => {
    const currentOrigin =
      typeof window === "undefined" ? null : window.location.origin;
    return (
      returnPathFromSearchParams(searchParams, { currentOrigin }) ??
      "/templates"
    );
  }, [searchParams]);
  const signInUrl = useMemo(() => buildSignInPath(returnPath), [returnPath]);

  return (
    <AuthShell
      title="Tạo tài khoản"
      description="Đăng ký tài khoản để bắt đầu truy cập hệ thống quản lý hồ sơ nội bộ."
    >
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl={signInUrl}
        forceRedirectUrl={returnPath}
        fallbackRedirectUrl="/templates"
        appearance={clerkAppearance}
      />
    </AuthShell>
  );
}

const clerkAppearance = {
  variables: {
    colorPrimary: "#173E86",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full border-0 bg-transparent shadow-none",
    card: "w-full border-0 bg-transparent p-0 shadow-none",
    header: "hidden",
    socialButtonsBlockButton:
      "h-11 rounded-md border-slate-200 text-sm font-semibold text-slate-700 shadow-none",
    formFieldLabel: "text-sm font-bold text-slate-800",
    formFieldInput:
      "h-11 rounded-md border-slate-300 text-sm text-slate-950 shadow-none focus:border-[#173E86] focus:ring-[#173E86]",
    formButtonPrimary:
      "h-11 rounded-md bg-[#173E86] text-sm font-bold shadow-none hover:bg-[#0f2d5e] focus-visible:ring-2 focus-visible:ring-blue-500",
    footer: "bg-transparent",
    footerActionLink: "font-bold text-[#173E86] hover:text-[#0f2d5e]",
  },
} as const;
