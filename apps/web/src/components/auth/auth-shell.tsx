"use client";

import {
  Building2,
  LockKeyhole,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main id="main-content" className="min-h-[100dvh] bg-slate-50 text-slate-950">
      <div className="grid min-h-[100dvh] lg:grid-cols-[minmax(0,0.95fr)_minmax(460px,0.75fr)]">
        <section className="qvks-auth-brand-enter relative hidden min-h-[100dvh] flex-col justify-between overflow-hidden px-10 py-8 text-white lg:flex xl:px-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#07111f_0%,#0b1730_58%,#103257_100%)]"
          />

          <div className="relative z-10">
            <div className="inline-flex h-10 items-center rounded-md border border-white/15 bg-white/5 px-4 text-xs font-black tracking-[0.22em] shadow-xl shadow-slate-950/20 backdrop-blur">
              QUANLYVKS
            </div>

            <div className="mt-20 max-w-2xl xl:mt-24">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200">
                Hệ thống nội bộ
              </p>
              <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight text-white xl:text-5xl">
                Quản lý hồ sơ, biểu mẫu và phiên làm việc nghiệp vụ.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">
                Xác thực người dùng trước khi truy cập dữ liệu hồ sơ, biểu mẫu
                và tài liệu nội bộ.
              </p>
            </div>

            <div className="mt-10 space-y-3">
              <TrustBadge icon={ShieldCheck} label="213 biểu mẫu đã khóa" />
              <TrustBadge icon={LockKeyhole} label="Phiên làm việc bảo mật" />
              <TrustBadge icon={Building2} label="Dữ liệu theo đơn vị" />
            </div>
          </div>

          <p className="relative z-10 text-sm font-medium leading-6 text-slate-400">
            Dành cho cán bộ được phân quyền trong hệ thống.
          </p>
        </section>

        <section className="flex min-h-[100dvh] items-center justify-center bg-[#f6f8fb] px-4 py-8 sm:px-6 lg:px-8">
          <div className="qvks-auth-card-enter w-full max-w-[430px]">
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#173E86]">
                QUANLYVKS
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {description}
              </p>
            </div>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}

function TrustBadge({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/10 shadow-xl backdrop-blur">
        <Icon className="h-4 w-4 text-slate-300" aria-hidden="true" />
      </div>
      <span className="text-sm font-semibold text-slate-300">{label}</span>
    </div>
  );
}
