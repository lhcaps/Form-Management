"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  linkAuthIdentity,
  listAuthIdentities,
  searchActiveOfficials,
  type IdentitySummary,
  type OfficialSearchResult,
  unlinkAuthIdentity,
} from "@/lib/admin-auth-identities-api";

// ─── Icons ────────────────────────────────────────────────────────────────────

function RefreshIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function UnlinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71" />
      <path d="m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71" />
      <line x1="8" y1="2" x2="8" y2="5" />
      <line x1="2" y1="8" x2="5" y2="8" />
      <line x1="16" y1="19" x2="16" y2="22" />
      <line x1="19" y1="16" x2="22" y2="16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Link Modal ───────────────────────────────────────────────────────────────

interface LinkModalProps {
  identity: IdentitySummary;
  onClose: () => void;
  onSuccess: () => void;
}

function LinkModal({ identity, onClose, onSuccess }: LinkModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OfficialSearchResult[]>([]);
  const [selected, setSelected] = useState<OfficialSearchResult | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchActiveOfficials({ q, pageSize: "10" });
      setResults(data.items);
    } catch (e) {
      setError("Không tải được danh sách cán bộ.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void search(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  async function handleSubmit() {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      await linkAuthIdentity(identity.id, {
        officialId: selected.officialId,
        reason: reason.trim() || undefined,
      });
      onSuccess();
    } catch (e) {
      if (e && typeof e === "object" && "message" in e) {
        setError(String((e as { message: unknown }).message));
      } else {
        setError("Liên kết thất bại.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-black text-slate-950">Liên kết Clerk Identity</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Đóng"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Identity info */}
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Clerk user</div>
          <div className="mt-1 font-bold text-slate-900">
            {identity.fullName ?? identity.email ?? identity.username ?? "—"}
          </div>
          <div className="mt-0.5 text-sm text-slate-600">
            {identity.email && <span>{identity.email}</span>}
            {identity.email && identity.username && <span> · </span>}
            {identity.username && <span>@{identity.username}</span>}
          </div>
          <div className="mt-0.5 font-mono text-xs text-slate-400">
            {identity.providerUserId}
          </div>
        </div>

        {/* Search */}
        <div className="border-b border-slate-100 px-6 py-4">
          <label className="block text-sm font-bold text-slate-700">
            Tìm cán bộ
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <SearchIcon />
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelected(null);
                }}
                placeholder="Tên, email, tài khoản, cơ quan…"
                className="min-h-11 w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </label>

          {/* Results */}
          <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-slate-200">
            {loading && (
              <div className="flex items-center justify-center py-6 text-sm text-slate-500">
                Đang tải…
              </div>
            )}
            {!loading && results.length === 0 && (
              <div className="flex items-center justify-center py-6 text-sm text-slate-500">
                Không tìm thấy cán bộ.
              </div>
            )}
            {results.map((official) => (
              <button
                key={official.officialId}
                type="button"
                onClick={() => setSelected(official)}
                disabled={official.alreadyLinked}
                className={[
                  "flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm transition last:border-b-0",
                  official.alreadyLinked
                    ? "cursor-not-allowed bg-slate-50 opacity-60"
                    : selected?.officialId === official.officialId
                      ? "bg-blue-50"
                      : "hover:bg-slate-50",
                ].join(" ")}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{official.fullName}</span>
                    {official.alreadyLinked && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-700">
                        Đã liên kết
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {official.email}
                    {(official.email || official.username) && " · "}
                    {official.agencyName}
                    {(official.email || official.agencyName) && " · "}
                    {official.role}
                  </div>
                </div>
                {selected?.officialId === official.officialId && (
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-600 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Reason */}
        <div className="border-b border-slate-100 px-6 py-4">
          <label className="block text-sm font-bold text-slate-700">
            Ghi chú (tuỳ chọn)
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Lý do liên kết…"
              rows={2}
              maxLength={500}
              className="mt-1.5 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>

        {/* Confirm */}
        <div className="bg-amber-50 px-6 py-3 text-xs font-semibold text-amber-800">
          Thao tác này sẽ cấp cho Clerk user quyền truy cập nghiệp vụ tương ứng với cán bộ được chọn.
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!selected || submitting}
            className="min-h-10 rounded-xl bg-[#123B66] px-5 text-sm font-extrabold text-white transition hover:bg-[#0d2f52] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Đang liên kết…" : "Xác nhận liên kết"}
          </button>
        </div>

        {error && (
          <div className="mx-6 mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Unlink Modal ─────────────────────────────────────────────────────────────

interface UnlinkModalProps {
  identity: IdentitySummary;
  onClose: () => void;
  onSuccess: () => void;
}

function UnlinkModal({ identity, onClose, onSuccess }: UnlinkModalProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await unlinkAuthIdentity(identity.id, { reason: reason.trim() || undefined });
      onSuccess();
    } catch (e) {
      if (e && typeof e === "object" && "message" in e) {
        setError(String((e as { message: unknown }).message));
      } else {
        setError("Huỷ liên kết thất bại.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-black text-slate-950">Huỷ liên kết Clerk Identity</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Đóng"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Identity + current link */}
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Clerk user</div>
          <div className="mt-1 font-bold text-slate-900">
            {identity.fullName ?? identity.email ?? identity.username ?? "—"}
          </div>
          <div className="mt-0.5 text-sm text-slate-600">{identity.email}</div>
          <div className="mt-0.5 font-mono text-xs text-slate-400">{identity.providerUserId}</div>
        </div>

        <div className="border-b border-slate-100 bg-rose-50 px-6 py-4">
          <div className="text-xs font-bold uppercase tracking-wider text-rose-600">Đang liên kết với</div>
          {identity.linkedOfficial && (
            <>
              <div className="mt-1 font-bold text-slate-900">
                {identity.linkedOfficial.fullName}
              </div>
              <div className="mt-0.5 text-sm text-slate-600">
                {identity.linkedOfficial.email}
                {identity.linkedOfficial.agencyName && ` · ${identity.linkedOfficial.agencyName}`}
                {` · ${identity.linkedOfficial.role}`}
              </div>
            </>
          )}
        </div>

        {/* Reason */}
        <div className="border-b border-slate-100 px-6 py-4">
          <label className="block text-sm font-bold text-slate-700">
            Ghi chú (tuỳ chọn)
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Lý do huỷ liên kết…"
              rows={2}
              maxLength={500}
              className="mt-1.5 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>

        {/* Confirm warning */}
        <div className="bg-amber-50 px-6 py-3 text-xs font-semibold text-amber-800">
          Sau khi huỷ liên kết, Clerk user sẽ mất quyền truy cập nghiệp vụ tương ứng.
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="min-h-10 rounded-xl bg-rose-600 px-5 text-sm font-extrabold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Đang huỷ liên kết…" : "Xác nhận huỷ liên kết"}
          </button>
        </div>

        {error && (
          <div className="mx-6 mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminAuthIdentitiesPage() {
  const { user } = useAuth();

  const [identities, setIdentities] = useState<IdentitySummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [linkedFilter, setLinkedFilter] = useState<"all" | "linked" | "unlinked">("all");

  const [linkTarget, setLinkTarget] = useState<IdentitySummary | null>(null);
  const [unlinkTarget, setUnlinkTarget] = useState<IdentitySummary | null>(null);

  const isAdmin = user?.role === "ADMIN";

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const data = await listAuthIdentities({
        q: searchQuery.trim() || undefined,
        linked: linkedFilter,
        page: String(page),
        pageSize: String(pageSize),
      });
      setIdentities(data.items);
      setTotal(data.total);
    } catch (e) {
      setError("Không tải được danh sách identity.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) void loadData();
  }, [isAdmin, page, searchQuery, linkedFilter]);

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchQuery(e.target.value);
    setPage(1);
  }

  function handleFilterChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setLinkedFilter(e.target.value as "all" | "linked" | "unlinked");
    setPage(1);
  }

  function showSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  }

  function handleLinkSuccess() {
    setLinkTarget(null);
    void loadData();
    showSuccess("Liên kết thành công.");
  }

  function handleUnlinkSuccess() {
    setUnlinkTarget(null);
    void loadData();
    showSuccess("Đã huỷ liên kết.");
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-slate-50 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
            <div className="mb-2 text-2xl font-black text-rose-700">Không có quyền truy cập</div>
            <div className="text-sm text-rose-600">
              Trang này chỉ dành cho tài khoản ADMIN.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-[calc(100vh-72px)] bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="flex items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <Link
              href="/admin/form-studio"
              className="text-sm font-bold text-blue-700"
            >
              ← Form Studio
            </Link>
            <h1 className="mt-2 text-2xl font-black text-slate-950">
              Liên kết Clerk Identity
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Liên kết Clerk user đã đồng bộ với cán bộ nội bộ. Liên kết cấp quyền truy cập nghiệp vụ.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshIcon />
            Làm mới
          </button>
        </header>

        {/* Success */}
        {success && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {success}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Tìm theo tên, email, username…"
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <select
            value={linkedFilter}
            onChange={handleFilterChange}
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">Tất cả</option>
            <option value="linked">Đã liên kết</option>
            <option value="unlinked">Chưa liên kết</option>
          </select>
          <span className="text-sm text-slate-500">
            {total} kết quả
          </span>
        </div>

        {/* Table */}
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-bold">Clerk user</th>
                <th className="px-4 py-3 font-bold">Trạng thái</th>
                <th className="px-4 py-3 font-bold">Cán bộ liên kết</th>
                <th className="px-4 py-3 font-bold">Đồng bộ lần cuối</th>
                <th className="px-4 py-3 font-bold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && identities.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    Đang tải…
                  </td>
                </tr>
              )}
              {!loading && identities.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    Không có kết quả.
                  </td>
                </tr>
              )}
              {identities.map((identity) => (
                <tr key={identity.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">
                      {identity.fullName ?? identity.email ?? identity.username ?? "—"}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {identity.email}
                      {identity.email && identity.username && " · "}
                      {identity.username && `@${identity.username}`}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-slate-400">
                      {identity.providerUserId}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {identity.linkedOfficial ? (
                      <span className="inline-flex items-center rounded bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                        Đã liên kết
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                        Chưa liên kết
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {identity.linkedOfficial ? (
                      <div>
                        <div className="font-bold text-slate-900">
                          {identity.linkedOfficial.fullName}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {identity.linkedOfficial.email}
                          {identity.linkedOfficial.agencyName && ` · ${identity.linkedOfficial.agencyName}`}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-600">
                            {identity.linkedOfficial.role}
                          </span>
                          {!identity.linkedOfficial.isActive && (
                            <span className="text-[11px] font-bold text-rose-600">Không hoạt động</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {formatDate(identity.lastSyncedAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {identity.linkedOfficial ? (
                        <button
                          type="button"
                          onClick={() => setUnlinkTarget(identity)}
                          className="flex items-center gap-1.5 rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
                        >
                          <UnlinkIcon />
                          Unlink
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setLinkTarget(identity)}
                          className="flex items-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                        >
                          <LinkIcon />
                          Link
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="min-h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
            >
              ← Trước
            </button>
            <span className="px-4 text-sm text-slate-600">
              Trang {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="min-h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
            >
              Sau →
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {linkTarget && (
        <LinkModal
          identity={linkTarget}
          onClose={() => setLinkTarget(null)}
          onSuccess={handleLinkSuccess}
        />
      )}
      {unlinkTarget && (
        <UnlinkModal
          identity={unlinkTarget}
          onClose={() => setUnlinkTarget(null)}
          onSuccess={handleUnlinkSuccess}
        />
      )}
    </div>
  );
}
