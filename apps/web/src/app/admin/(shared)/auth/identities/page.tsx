"use client";

import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Check, Link2, RefreshCw, Search, Unlink } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ErrorBanner } from "@/components/common/error-banner";
import { useAuth } from "@/lib/auth-context";
import {
  linkAuthIdentity,
  listAuthIdentities,
  searchActiveOfficials,
  type IdentitySummary,
  type OfficialSearchResult,
  unlinkAuthIdentity,
} from "@/lib/admin-auth-identities-api";
import { cn } from "@/lib/utils";

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
    } catch {
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
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-slate-200 px-6 py-4 pr-12">
          <DialogTitle>Liên kết tài khoản</DialogTitle>
          <DialogDescription>
            Chọn cán bộ đang hoạt động để gán Clerk user này vào quyền truy cập nghiệp vụ tương ứng.
          </DialogDescription>
        </DialogHeader>

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

        <div className="border-b border-slate-100 px-6 py-4">
          <label className="block text-sm font-bold text-slate-700" htmlFor="official-search">
            Tìm cán bộ
          </label>
          <div className="relative mt-1.5">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <Input
              id="official-search"
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelected(null);
              }}
              placeholder="Tên, email, tài khoản, cơ quan…"
              className="min-h-11 pl-9 text-sm"
            />
          </div>

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
            {results.map((official) => {
              const isSelected = selected?.officialId === official.officialId;

              return (
                <Button
                  key={official.officialId}
                  type="button"
                  variant="ghost"
                  onClick={() => setSelected(official)}
                  disabled={official.alreadyLinked}
                  aria-pressed={isSelected}
                  className={cn(
                    "h-auto w-full justify-start rounded-none border-b border-slate-100 px-4 py-3 text-left text-sm font-normal last:border-b-0 whitespace-normal",
                    official.alreadyLinked && "cursor-not-allowed bg-slate-50 opacity-60",
                    !official.alreadyLinked && isSelected && "bg-primary/10 hover:bg-primary/10",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900">{official.fullName}</span>
                      {official.alreadyLinked && (
                        <Badge variant="warning" className="rounded">
                          Đã liên kết
                        </Badge>
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
                  {isSelected && (
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" aria-hidden="true" />
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="border-b border-slate-100 px-6 py-4">
          <label className="block text-sm font-bold text-slate-700" htmlFor="link-reason">
            Ghi chú (tuỳ chọn)
          </label>
          <Textarea
            id="link-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Lý do liên kết…"
            rows={2}
            maxLength={500}
            className="mt-1.5 min-h-20 resize-none text-sm"
          />
        </div>

        <div className="bg-amber-50 px-6 py-3 text-xs font-semibold text-amber-800">
          Thao tác này sẽ cấp cho Clerk user quyền truy cập nghiệp vụ tương ứng với cán bộ được chọn.
        </div>

        <DialogFooter className="gap-2 px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!selected || submitting}
          >
            {submitting ? "Đang liên kết…" : "Xác nhận liên kết"}
          </Button>
        </DialogFooter>

        {error && (
          <ErrorBanner
            error={error}
            title="Không thể liên kết"
            className="mx-6 mb-4"
          />
        )}
      </DialogContent>
    </Dialog>
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
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-md">
        <AlertDialogHeader className="border-b border-slate-200 px-6 py-4">
          <AlertDialogTitle>Huỷ liên kết tài khoản</AlertDialogTitle>
          <AlertDialogDescription>
            Gỡ liên kết giữa Clerk user và cán bộ hiện tại. Thao tác này không xoá hồ sơ cán bộ.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Clerk user</div>
          <div className="mt-1 font-bold text-slate-900">
            {identity.fullName ?? identity.email ?? identity.username ?? "—"}
          </div>
          <div className="mt-0.5 text-sm text-slate-600">{identity.email}</div>
          <div className="mt-0.5 font-mono text-xs text-slate-400">{identity.providerUserId}</div>
        </div>

        <div className="border-b border-slate-100 bg-destructive/10 px-6 py-4">
          <div className="text-xs font-bold uppercase tracking-wider text-destructive">
            Đang liên kết với
          </div>
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

        <div className="border-b border-slate-100 px-6 py-4">
          <label className="block text-sm font-bold text-slate-700" htmlFor="unlink-reason">
            Ghi chú (tuỳ chọn)
          </label>
          <Textarea
            id="unlink-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Lý do huỷ liên kết…"
            rows={2}
            maxLength={500}
            className="mt-1.5 min-h-20 resize-none text-sm"
          />
        </div>

        <div className="bg-amber-50 px-6 py-3 text-xs font-semibold text-amber-800">
          Sau khi huỷ liên kết, Clerk user sẽ mất quyền truy cập nghiệp vụ tương ứng.
        </div>

        <AlertDialogFooter className="gap-2 px-6 py-4">
          <AlertDialogCancel disabled={submitting}>Huỷ</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              type="button"
              variant="destructive"
              onClick={(event) => {
                event.preventDefault();
                void handleSubmit();
              }}
              disabled={submitting}
            >
              {submitting ? "Đang huỷ liên kết…" : "Xác nhận huỷ liên kết"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>

        {error && (
          <ErrorBanner
            error={error}
            title="Không thể huỷ liên kết"
            className="mx-6 mb-4"
          />
        )}
      </AlertDialogContent>
    </AlertDialog>
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
    } catch {
      setError("Không tải được danh sách identity.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) void loadData();
  }, [isAdmin, page, searchQuery, linkedFilter]);

  function handleSearch(e: ChangeEvent<HTMLInputElement>) {
    setSearchQuery(e.target.value);
    setPage(1);
  }

  function handleFilterChange(value: "all" | "linked" | "unlinked") {
    setLinkedFilter(value);
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
        <header className="flex items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-950">
              Liên kết tài khoản đăng nhập
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Gán tài khoản Clerk đã đồng bộ với cán bộ nội bộ để cấp quyền truy cập nghiệp vụ.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadData()}
            disabled={loading}
            className="bg-white font-bold"
          >
            <RefreshCw
              className={cn("h-4 w-4", loading && "animate-spin")}
              aria-hidden="true"
            />
            Làm mới
          </Button>
        </header>

        {success && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {success}
          </div>
        )}

        {error && (
          <ErrorBanner
            error={error}
            title="Không tải được danh sách identity"
            className="mt-4"
          />
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <Input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Tìm theo tên, email, username…"
              className="min-h-11 bg-white pl-9 text-sm"
            />
          </div>
          <Select value={linkedFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="min-h-11 w-[180px] bg-white font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="linked">Đã liên kết</SelectItem>
              <SelectItem value="unlinked">Chưa liên kết</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-slate-500">
            {total} kết quả
          </span>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <Table className="text-left text-sm">
            <TableHeader className="bg-slate-50 text-xs uppercase text-slate-500">
              <TableRow className="hover:bg-transparent">
                <TableHead scope="col" className="px-4 py-3 font-bold">Tài khoản đăng nhập</TableHead>
                <TableHead scope="col" className="px-4 py-3 font-bold">Trạng thái</TableHead>
                <TableHead scope="col" className="px-4 py-3 font-bold">Cán bộ liên kết</TableHead>
                <TableHead scope="col" className="px-4 py-3 font-bold">Đồng bộ lần cuối</TableHead>
                <TableHead scope="col" className="px-4 py-3 text-right font-bold">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && identities.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    Đang tải…
                  </TableCell>
                </TableRow>
              )}
              {!loading && identities.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    Không có kết quả.
                  </TableCell>
                </TableRow>
              )}
              {identities.map((identity) => (
                <TableRow key={identity.id} className="border-slate-100">
                  <TableCell className="px-4 py-3">
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
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {identity.linkedOfficial ? (
                      <Badge variant="success" className="rounded">
                        Đã liên kết
                      </Badge>
                    ) : (
                      <Badge variant="muted" className="rounded">
                        Chưa liên kết
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {identity.linkedOfficial ? (
                      <div>
                        <div className="font-bold text-slate-900">
                          {identity.linkedOfficial.fullName}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {identity.linkedOfficial.email}
                          {identity.linkedOfficial.agencyName && ` · ${identity.linkedOfficial.agencyName}`}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-600">
                            {identity.linkedOfficial.role}
                          </span>
                          {!identity.linkedOfficial.isActive && (
                            <Badge variant="destructive" className="rounded">
                              Không hoạt động
                            </Badge>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-xs text-slate-500">
                    {formatDate(identity.lastSyncedAt)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {identity.linkedOfficial ? (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setUnlinkTarget(identity)}
                          className="text-xs font-bold"
                        >
                          <Unlink className="h-4 w-4" aria-hidden="true" />
                          Hủy liên kết
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setLinkTarget(identity)}
                          className="text-xs font-bold"
                        >
                          <Link2 className="h-4 w-4" aria-hidden="true" />
                          Liên kết
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              ← Trước
            </Button>
            <span className="px-4 text-sm text-slate-600">
              Trang {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Sau →
            </Button>
          </div>
        )}
      </div>

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
