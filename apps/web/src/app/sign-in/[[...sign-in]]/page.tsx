"use client";

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { buildSignUpPath, returnPathFromSearchParams } from "@/lib/auth-routes";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const returnPath = useMemo(() => {
    const currentOrigin =
      typeof window === "undefined" ? null : window.location.origin;
    return (
      returnPathFromSearchParams(searchParams, { currentOrigin }) ??
      "/templates"
    );
  }, [searchParams]);
  const signUpUrl = useMemo(() => buildSignUpPath(returnPath), [returnPath]);

  return (
    <AuthShell
      title="Đăng nhập hệ thống"
      description="Dùng tài khoản nội bộ để truy cập đúng dữ liệu hồ sơ, biểu mẫu và đơn vị."
    >
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl={signUpUrl}
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
