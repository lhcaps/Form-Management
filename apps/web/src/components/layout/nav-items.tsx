"use client";

/**
 * nav-items.tsx — shared navigation definitions.
 *
 * Used by both the desktop Sidebar and the mobile Sheet.
 * Do NOT duplicate menu items in two places.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { canOpenFormStudio } from "@/lib/permissions";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useState } from "react";

// ─── Icon helpers ────────────────────────────────────────────────────────────

function SvgIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.15"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function IconShell({ children }: { children: ReactNode }) {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-600 transition group-hover:bg-blue-100 group-hover:text-blue-700 group-[.is-active]:bg-blue-100 group-[.is-active]:text-blue-700">
      {children}
    </span>
  );
}

// ─── Menu item type ──────────────────────────────────────────────────────────

export type MenuItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

// ─── Menu definitions ────────────────────────────────────────────────────────

const QUANLYVKS_LOGO = (
  <div className="flex h-[72px] items-center gap-3 border-b border-slate-200 px-5">
    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0B1F3A] text-lg font-black text-white shadow-sm">
      ⚖
    </div>
    <div>
      <div className="text-[15px] font-black tracking-[-0.02em] text-slate-950">
        QUANLYVKS
      </div>
      <div className="mt-0.5 text-[12px] font-medium text-slate-500">
        Quản lý hồ sơ vụ án
      </div>
    </div>
  </div>
);

const FORM_STUDIO_ITEM: MenuItem = {
  href: "/admin/form-studio",
  label: "Form Studio",
  icon: (
    <SvgIcon>
      <path d="M4 5h16v14H4z" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
      <path d="M17 12v5" />
      <path d="M14.5 14.5h5" />
    </SvgIcon>
  ),
};

const BASE_MENU_ITEMS: MenuItem[] = [
  {
    href: "/",
    label: "Tổng quan",
    icon: (
      <SvgIcon>
        <path d="M4 11.5 12 5l8 6.5" />
        <path d="M6.5 10.5V19h11v-8.5" />
        <path d="M10 19v-5h4v5" />
      </SvgIcon>
    ),
  },
  {
    href: "/cases",
    label: "Hồ sơ vụ án",
    icon: (
      <SvgIcon>
        <path d="M7 4h7l3 3v13H7z" />
        <path d="M14 4v4h4" />
        <path d="M9.5 12h5" />
        <path d="M9.5 16h5" />
      </SvgIcon>
    ),
  },
  {
    href: "/documents",
    label: "Tạo biểu mẫu",
    icon: (
      <SvgIcon>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </SvgIcon>
    ),
  },
  {
    href: "/templates",
    label: "Duyệt biểu mẫu",
    icon: (
      <SvgIcon>
        <path d="m5 13 4 4L19 7" />
      </SvgIcon>
    ),
  },
  {
    href: "/imports",
    label: "Import dữ liệu",
    icon: (
      <SvgIcon>
        <path d="M12 4v11" />
        <path d="m7.5 9 4.5-5 4.5 5" />
        <path d="M5 19h14" />
      </SvgIcon>
    ),
  },
  {
    href: "/reports",
    label: "Báo cáo",
    icon: (
      <SvgIcon>
        <path d="M5 19V9" />
        <path d="M12 19V5" />
        <path d="M19 19v-7" />
      </SvgIcon>
    ),
  },
  {
    href: "/settings",
    label: "Cấu hình",
    icon: (
      <SvgIcon>
        <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.05a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.05A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.05a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 0 1 0 4h-.05A1.7 1.7 0 0 0 19.4 15Z" />
      </SvgIcon>
    ),
  },
];

// ─── Active path helper ─────────────────────────────────────────────────────

export function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

// ─── Initials helper ───────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

// ─── Desktop Sidebar (full export) ──────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const displayName = user?.fullName ?? "Chưa đăng nhập";
  const subtitle = user?.agencyName ?? user?.positionTitle ?? user?.role ?? "";
  const initials = getInitials(displayName) || "QL";

  const visibleMenuItems = canOpenFormStudio(user)
    ? [...BASE_MENU_ITEMS, FORM_STUDIO_ITEM]
    : BASE_MENU_ITEMS;

  return (
    <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      {QUANLYVKS_LOGO}

      <div className="px-4 pb-3 pt-5 text-[12px] font-black uppercase tracking-[0.08em] text-slate-500">
        Nghiệp vụ
      </div>

      <nav className="grid gap-2 px-3">
        {visibleMenuItems.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={[
                "group flex min-h-[52px] items-center gap-3 rounded-[18px] px-3.5 text-[15px] font-bold tracking-[-0.01em] transition-all duration-200",
                "hover:-translate-y-0.5 hover:bg-blue-50 hover:text-blue-800 hover:shadow-[0_10px_24px_rgba(30,64,175,0.10)]",
                active
                  ? "is-active bg-slate-100 text-slate-950 shadow-[0_8px_20px_rgba(15,23,42,0.06)]"
                  : "text-slate-700",
              ].join(" ")}
            >
              <IconShell>{item.icon}</IconShell>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-200 p-4">
        <div className="flex items-center gap-3 rounded-[18px] bg-slate-50 p-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-[13px] font-black text-blue-700">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-black text-slate-950">
              {displayName}
            </div>
            {subtitle ? (
              <div className="mt-0.5 truncate text-[12px] font-medium text-slate-500">
                {subtitle}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Đăng xuất"
            title="Đăng xuất"
            onClick={() => {
              void logout();
            }}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-500 transition hover:bg-white hover:text-rose-600"
          >
            <SvgIcon>
              <path d="M10 17l5-5-5-5" />
              <path d="M15 12H4" />
              <path d="M12 20h6a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-6" />
            </SvgIcon>
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── Mobile Sheet Navigation ─────────────────────────────────────────────────

interface MobileNavProps {
  children: ReactNode;
}

export function MobileNav({ children }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const displayName = user?.fullName ?? "Chưa đăng nhập";
  const subtitle = user?.agencyName ?? user?.positionTitle ?? user?.role ?? "";
  const initials = getInitials(displayName) || "QL";

  const visibleMenuItems = canOpenFormStudio(user)
    ? [...BASE_MENU_ITEMS, FORM_STUDIO_ITEM]
    : BASE_MENU_ITEMS;

  return (
    <>
      {/* Trigger — rendered by parent (e.g. Topbar hamburger) */}
      <div onClick={() => setOpen(true)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpen(true); }}
        role="button"
        tabIndex={0}
        aria-label="Mở menu điều hướng"
        className="cursor-pointer"
      >
        {children}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex flex-col p-0">
          {/* Branding */}
          <div className="border-b border-slate-200">
            {QUANLYVKS_LOGO}
          </div>

          {/* User block */}
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[13px] font-black text-blue-700">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-black text-slate-950">
                {displayName}
              </div>
              {subtitle ? (
                <div className="truncate text-[12px] font-medium text-slate-500">
                  {subtitle}
                </div>
              ) : null}
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-2">
            <div className="mb-2 px-4 pb-2 text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">
              Nghiệp vụ
            </div>
            {visibleMenuItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={[
                    "mb-1 flex min-h-[48px] items-center gap-3 rounded-xl px-3.5 text-[15px] font-bold tracking-[-0.01em] transition-colors",
                    active
                      ? "bg-blue-50 font-black text-blue-800"
                      : "text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <IconShell>{item.icon}</IconShell>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="border-t border-slate-200 p-4">
            <button
              type="button"
              aria-label="Đăng xuất"
              title="Đăng xuất"
              onClick={() => {
                setOpen(false);
                void logout();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] font-bold text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-600">
                <SvgIcon>
                  <path d="M10 17l5-5-5-5" />
                  <path d="M15 12H4" />
                  <path d="M12 20h6a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-6" />
                </SvgIcon>
              </span>
              Đăng xuất
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
