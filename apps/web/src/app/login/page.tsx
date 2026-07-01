import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { buildSignInPath, firstSearchParamValue } from "@/lib/auth-routes";

export const metadata: Metadata = {
  title: "Đăng nhập — QUANLYVKS",
};

type LoginPageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const returnPath =
    firstSearchParamValue(params?.returnUrl) ??
    firstSearchParamValue(params?.redirect_url);

  redirect(buildSignInPath(returnPath));
}
