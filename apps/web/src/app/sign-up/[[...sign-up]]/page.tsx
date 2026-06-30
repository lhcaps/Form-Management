"use client";

import { SignUp } from "@clerk/react";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-950/10">
        <div className="mb-6 text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-700">
            QUANLYVKS
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            Tạo tài khoản
          </h1>
        </div>
        <SignUp />
      </div>
    </main>
  );
}
