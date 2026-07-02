"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { KeyboardEvent } from "react";
import { SignInButton } from "@clerk/react";
import { useAuth as useAppAuth } from "@/lib/auth-context";
import { MobileNav } from "./nav-items";

const QUICK_CREATE_OPTIONS = [
  { label: "Tạo hồ sơ vụ án", href: "/cases" },
  { label: "Import dữ liệu", href: "/imports" },
  { label: "Chọn biểu mẫu", href: "/documents" },
] as const;

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const { status } = useAppAuth();

  useEffect(() => {
    setCreateOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!createOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(event.target as Node)) {
        setCreateOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [createOpen]);

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    const value = event.currentTarget.value.trim();
    if (!value) return;
    router.push(`/cases?q=${encodeURIComponent(value)}`);
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      {/* Mobile: hamburger | Desktop: search */}
      <div className="flex items-center gap-3">
        <MobileNav />

        {/* Search — hidden on small mobile, visible on tablet+ */}
        <div className="hidden sm:block">
          <input
            onKeyDown={onSearchKeyDown}
            placeholder="Tìm hồ sơ, biểu mẫu, bị can..."
            aria-label="Tìm kiếm nhanh"
            className="h-9 w-44 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white lg:w-64 xl:w-80"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {status === "unauthenticated" ? (
          <SignInButton mode="modal">
            <button
              type="button"
              className="flex h-9 items-center gap-1.5 rounded-xl bg-[#173E86] px-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0f2d5e]"
            >
              Đăng nhập
            </button>
          </SignInButton>
        ) : null}
        <div ref={wrapRef} className="relative">
          <button
            type="button"
            onClick={() => setCreateOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={createOpen}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-[#173E86] px-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0f2d5e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span aria-hidden="true">＋</span>
            <span className="hidden sm:inline">Tạo mới</span>
          </button>
          {createOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-full z-20 mt-1.5 min-w-56 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl"
            >
              {QUICK_CREATE_OPTIONS.map((option) => (
                <button
                  key={option.href}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setCreateOpen(false);
                    router.push(option.href);
                  }}
                  className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
