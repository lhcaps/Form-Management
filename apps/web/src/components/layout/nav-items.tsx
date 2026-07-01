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
import { useState } from "react";
import { useClerk, useUser as useClerkUser } from "@clerk/react";
import { useAuth } from "@/lib/auth-context";
import { canOpenFormStudio } from "@/lib/permissions";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

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

// ─── Identity helpers ────────────────────────────────────────────────────────

function getClerkDisplayIdentity(clerkUser: ReturnType<typeof useClerkUser>["user"]) {
  if (!clerkUser) return null;
  const name =
    clerkUser.fullName?.trim() ||
    [clerkUser.firstName, clerkUser.lastName]
      .map((p) => p?.trim())
      .filter(Boolean)
      .join(" ") ||
    null;
  const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
  return { name, email };
}

function getStatusLabel(
  clerkUser: ReturnType<typeof useClerkUser>["user"],
  apiUser: ReturnType<typeof useAuth>["user"],
): string {
  if (clerkUser) return "Đã xác thực";
  if (apiUser) return apiUser.email ?? apiUser.positionTitle ?? apiUser.role ?? "Đã xác thực";
  return "Chưa đăng nhập";
}

// ─── Desktop Sidebar (full export) ──────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const { user: apiUser, logout } = useAuth();
  const { user: clerkUser } = useClerkUser();
  const { openUserProfile } = useClerk();

  const identity = getClerkDisplayIdentity(clerkUser);
  const apiIdentity = apiUser
    ? { name: apiUser.fullName, email: apiUser.email ?? null }
    : null;

  // Prefer Clerk native identity; fall back to API identity; then fallback label.
  const displayName =
    identity?.name ?? apiIdentity?.name ?? "Người dùng";
  const displayEmail =
    identity?.email ?? apiIdentity?.email ?? null;
  const statusLabel = getStatusLabel(clerkUser, apiUser);
  const initials = getInitials(displayName) || "QL";
  const avatarUrl = clerkUser?.imageUrl ?? null;

  const visibleMenuItems = canOpenFormStudio(apiUser)
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
        {/* Template-first: card is now a real account button. */}
        <button
          type="button"
          onClick={() => void openUserProfile()}
          title="Quản lý tài khoản"
          aria-label={`Tài khoản: ${displayName}. Nhấn để quản lý hoặc đăng xuất.`}
          className="flex w-full items-center gap-3 rounded-[18px] bg-slate-50 p-3 text-left transition hover:bg-slate-100"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-10 w-10 shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[13px] font-black text-blue-700">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-black text-slate-950">
              {displayName}
            </div>
            <div className="truncate text-[12px] font-medium text-slate-500">
              {displayEmail ?? statusLabel}
            </div>
          </div>
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        </button>

        {/* Sign-out remains a separate accessible control. */}
        <button
          type="button"
          aria-label="Đăng xuất"
          title="Đăng xuất"
          onClick={() => {
            void logout();
          }}
          className="mt-1 flex w-full items-center gap-2 rounded-[18px] p-3 text-[13px] font-medium text-slate-400 transition hover:bg-red-50 hover:text-rose-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}

// ─── Mobile Sheet Navigation ─────────────────────────────────────────────────

/**
 * MobileNav renders both the hamburger button and the Sheet it controls.
 *
 * Why not "children = trigger"? Earlier the parent passed a <button> as
 * `children`, and we wrapped it in a <div role="button"> to forward clicks.
 * That produces nested interactive elements (a real <button> inside a div
 * that pretends to be a button), which is invalid for assistive tech.
 *
 * The correct Radix/shadcn pattern is: render the trigger yourself, then
 * let Sheet's own controlled open state + built-in a11y wire everything.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user: apiUser, logout } = useAuth();
  const { user: clerkUser } = useClerkUser();
  const { openUserProfile } = useClerk();

  const identity = getClerkDisplayIdentity(clerkUser);
  const apiIdentity = apiUser
    ? { name: apiUser.fullName, email: apiUser.email ?? null }
    : null;

  const displayName =
    identity?.name ?? apiIdentity?.name ?? "Người dùng";
  const displayEmail =
    identity?.email ?? apiIdentity?.email ?? null;
  const statusLabel = getStatusLabel(clerkUser, apiUser);
  const initials = getInitials(displayName) || "QL";
  const avatarUrl = clerkUser?.imageUrl ?? null;

  const visibleMenuItems = canOpenFormStudio(apiUser)
    ? [...BASE_MENU_ITEMS, FORM_STUDIO_ITEM]
    : BASE_MENU_ITEMS;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        type="button"
        aria-label="Mở menu điều hướng"
        onClick={() => setOpen(true)}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-600 transition hover:bg-slate-100 lg:hidden"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </button>

      <SheetContent side="left" className="flex flex-col p-0">
        {/* Accessible title + description (visually hidden — branding already shows context). */}
        <SheetTitle className="sr-only">Menu điều hướng</SheetTitle>
        <SheetDescription className="sr-only">
          Điều hướng chính của hệ thống QUANLYVKS
        </SheetDescription>

        {/* Branding */}
        <div className="border-b border-slate-200">
          {QUANLYVKS_LOGO}
        </div>

        {/* User block — opens Clerk profile on click */}
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            void openUserProfile();
          }}
          className="flex w-full items-center gap-3 border-b border-slate-100 px-5 py-4 text-left transition hover:bg-slate-50"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-10 w-10 shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[13px] font-black text-blue-700">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-black text-slate-950">
              {displayName}
            </div>
            <div className="truncate text-[12px] font-medium text-slate-500">
              {displayEmail ?? statusLabel}
            </div>
          </div>
        </button>

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
  );
}
