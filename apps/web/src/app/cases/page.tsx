"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { readApi } from "@/lib/api-client";
import { ErrorBanner } from "@/components/common/error-banner";
import { PageHeader, PageSection, PageShell } from "@/components/common/page-shell";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

type CaseItem = {
  id: string;
  caseCode: string;
  nationalCaseCode: string | null;
  caseTitle: string;
  caseSummary: string | null;
  currentStage: string;
  currentStatus: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT" | string;
  receivedDate: string | null;
  createdByName: string | null;
  updatedByName: string | null;
  createdAt: string;
  updatedAt: string;
};

type CasesResponse = {
  items: CaseItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

const stageOptions = [
  { value: "", label: "Tất cả giai đoạn" },
  { value: "RECEPTION", label: "Tiếp nhận" },
  { value: "INVESTIGATION", label: "Điều tra" },
  { value: "PROSECUTION", label: "Truy tố" },
  { value: "TRIAL_PREPARATION", label: "Chuẩn bị xét xử" },
  { value: "CLOSED", label: "Kết thúc" },
];

const statusOptions = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "DRAFT", label: "Nháp" },
  { value: "RECEIVED", label: "Đã tiếp nhận" },
  { value: "IN_PROGRESS", label: "Đang xử lý" },
  { value: "WAITING_REVIEW", label: "Chờ duyệt" },
  { value: "CLOSED", label: "Đã đóng" },
];

const ALL_FILTER_VALUE = "__all__";

function toSelectFilterValue(value: string) {
  return value || ALL_FILTER_VALUE;
}

function fromSelectFilterValue(value: string) {
  return value === ALL_FILTER_VALUE ? "" : value;
}

function formatDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN").format(date);
}

export default function CasesPage() {
  return (
    <Suspense fallback={null}>
      <CasesPageContent />
    </Suspense>
  );
}

function CasesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [pagination, setPagination] = useState<CasesResponse["pagination"] | null>(null);
  const [q, setQ] = useState(initialQ);
  const [stage, setStage] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<unknown>("");
  const [draft, setDraft] = useState({
    caseCode: "",
    caseTitle: "",
    caseSummary: "",
    receivedDate: "",
    priority: "NORMAL",
  });

  const loadCases = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (stage) params.set("stage", stage);
      if (status) params.set("status", status);
      params.set("pageSize", "20");

      const data = await readApi<CasesResponse>(`/cases?${params.toString()}`, {
        noStore: true,
      });
      setCases(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [q, stage, status]);

  useEffect(() => {
    void loadCases();
  }, [loadCases]);

  useEffect(() => {
    if (q === initialQ) return;
    const next = new URLSearchParams(searchParams.toString());
    if (q.trim()) {
      next.set("q", q.trim());
    } else {
      next.delete("q");
    }
    const qs = next.toString();
    router.replace(`/cases${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [q, initialQ, router, searchParams]);

  const totalLabel = useMemo(() => {
    if (!pagination) return "0 hồ sơ";
    return `${pagination.total} hồ sơ`;
  }, [pagination]);

  async function createCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.caseTitle.trim()) return;

    setIsCreating(true);
    setError("");
    try {
      await readApi<CaseItem>("/cases", {
        method: "POST",
        body: JSON.stringify({
          caseCode: draft.caseCode.trim() || undefined,
          caseTitle: draft.caseTitle.trim(),
          caseSummary: draft.caseSummary.trim() || undefined,
          receivedDate: draft.receivedDate || undefined,
          currentStage: "RECEPTION",
          currentStatus: "DRAFT",
          priority: draft.priority,
        }),
      });
      setDraft({
        caseCode: "",
        caseTitle: "",
        caseSummary: "",
        receivedDate: "",
        priority: "NORMAL",
      });
      await loadCases();
    } catch (err) {
      setError(err);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <PageShell className="bg-slate-50">
      <PageHeader className="border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-950">Hồ sơ vụ án</h1>
          <p className="mt-1 text-sm text-slate-600">
            Quản lý danh sách hồ sơ, lọc theo giai đoạn/trạng thái và tạo hồ sơ mới.
          </p>
        </div>
        <Badge variant="outline" className="w-fit bg-white px-3 py-1 text-xs font-semibold text-slate-700">
          {totalLabel}
        </Badge>
      </PageHeader>

      {error ? (
        <ErrorBanner error={error} />
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <PageSection className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void loadCases();
              }}
              placeholder="Tìm mã hồ sơ, tên vụ án, mô tả..."
              className="flex-1 text-sm"
            />
            <Select
              value={toSelectFilterValue(stage)}
              onValueChange={(value) => setStage(fromSelectFilterValue(value))}
            >
              <SelectTrigger className="md:w-48">
                <SelectValue placeholder="Tất cả giai đoạn" />
              </SelectTrigger>
              <SelectContent>
                {stageOptions.map((item) => (
                  <SelectItem key={item.value || ALL_FILTER_VALUE} value={item.value || ALL_FILTER_VALUE}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={toSelectFilterValue(status)}
              onValueChange={(value) => setStatus(fromSelectFilterValue(value))}
            >
              <SelectTrigger className="md:w-48">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((item) => (
                  <SelectItem key={item.value || ALL_FILTER_VALUE} value={item.value || ALL_FILTER_VALUE}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" onClick={() => void loadCases()}>
              Lọc
            </Button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <Table className="min-w-[920px]">
              <TableHeader className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <TableRow>
                  <TableHead className="font-black">Mã hồ sơ</TableHead>
                  <TableHead className="font-black">Tên vụ án</TableHead>
                  <TableHead className="font-black">Giai đoạn</TableHead>
                  <TableHead className="font-black">Trạng thái</TableHead>
                  <TableHead className="font-black">Ưu tiên</TableHead>
                  <TableHead className="font-black">Ngày nhận</TableHead>
                  <TableHead className="font-black text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-slate-500">
                      Đang tải hồ sơ...
                    </TableCell>
                  </TableRow>
                ) : null}

                {!isLoading && cases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-slate-500">
                      Chưa có hồ sơ phù hợp.
                    </TableCell>
                  </TableRow>
                ) : null}

                {!isLoading &&
                  cases.map((item) => (
                    <TableRow key={item.id} className="align-top">
                      <TableCell className="font-bold text-slate-950">
                        {item.caseCode}
                        {item.nationalCaseCode ? (
                          <div className="mt-1 text-xs font-medium text-slate-500">
                            {item.nationalCaseCode}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="font-semibold text-slate-900">{item.caseTitle}</div>
                        {item.caseSummary ? (
                          <div className="mt-1 line-clamp-2 text-xs text-slate-500">
                            {item.caseSummary}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="whitespace-nowrap align-middle text-slate-600">{item.currentStage}</TableCell>
                      <TableCell className="whitespace-nowrap align-middle">
                        <StatusBadge type="case" value={item.currentStatus} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap align-middle">
                        <StatusBadge type="priority" value={item.priority} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap align-middle text-slate-600">{formatDate(item.receivedDate)}</TableCell>
                      <TableCell className="text-right align-middle">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => router.push(`/cases/${item.id}`)}
                        >
                          Mở
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </PageSection>

        <PageSection className="h-fit p-5">
          <form onSubmit={createCase}>
            <h2 className="text-base font-black text-slate-950">Tạo hồ sơ mới</h2>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-bold text-slate-600">Mã hồ sơ</span>
                <Input
                  value={draft.caseCode}
                  onChange={(event) => setDraft((value) => ({ ...value, caseCode: event.target.value }))}
                  placeholder="Để trống để tự sinh"
                  className="mt-1 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-600">Tên vụ án</span>
                <Input
                  required
                  value={draft.caseTitle}
                  onChange={(event) => setDraft((value) => ({ ...value, caseTitle: event.target.value }))}
                  className="mt-1 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-600">Ngày tiếp nhận</span>
                <Input
                  type="date"
                  value={draft.receivedDate}
                  onChange={(event) => setDraft((value) => ({ ...value, receivedDate: event.target.value }))}
                  className="mt-1 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-600">Ưu tiên</span>
                <Select
                  value={draft.priority}
                  onValueChange={(value) => setDraft((current) => ({ ...current, priority: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Chọn mức ưu tiên" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Thấp</SelectItem>
                    <SelectItem value="NORMAL">Bình thường</SelectItem>
                    <SelectItem value="HIGH">Cao</SelectItem>
                    <SelectItem value="URGENT">Khẩn</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-600">Tóm tắt</span>
                <Textarea
                  value={draft.caseSummary}
                  onChange={(event) => setDraft((value) => ({ ...value, caseSummary: event.target.value }))}
                  rows={4}
                  className="mt-1 text-sm"
                />
              </label>
            </div>
            <Button
              type="submit"
              disabled={isCreating || !draft.caseTitle.trim()}
              className="mt-4 w-full"
            >
              {isCreating ? "Đang tạo..." : "Tạo hồ sơ"}
            </Button>
          </form>
        </PageSection>
      </section>
    </PageShell>
  );
}
