"use client";

import { useEffect, useMemo, useState } from "react";
import type { CompiledFormContract } from "@qllaw/form-contracts";
import { getRuntimeFormContract } from "@/lib/form-studio-api";
import { PublishedContractFormInputsPanel } from "@/components/documents/published-contract-form-inputs";
import {
  BM_PANEL_REGISTRY,
  type BM_PANEL_COUNT,
} from "./bm-panel-registry.generated";
import { GeneratedDocumentActionPanel } from "@/components/documents/generated-document-action-panel";
import { GenericTemplateFormInputsPanel } from "@/components/documents/generic-template-form-inputs";
import { getDocumentRenderPayload } from "@/lib/document-form-api";
import { SHOW_INTERNAL_IDS } from "@/lib/debug";
import {
  getDocumentHistory,
  type DocumentHistoryResponse,
} from "@/lib/generated-documents-api";
import { CasePayloadProvider } from "@/lib/case-payload-context";
import {
  buildCasePayloadFromRenderPayload,
  type RenderPayloadForCaseContext,
} from "@/lib/case-payload-normalizer";

// ─── History tab ─────────────────────────────────────────────────────────────

type HistoryTabProps = {
  documentId: string;
};

function formatEventDate(timestamp: string | null): string {
  if (!timestamp) return "--";
  const d = new Date(timestamp);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EventTypeIcon({
  type,
}: {
  type: DocumentHistoryResponse["events"][number]["type"];
}) {
  switch (type) {
    case "CREATED":
      return (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
          +
        </span>
      );
    case "REVIEW":
      return (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
          D
        </span>
      );
    case "FILE":
      return (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
          F
        </span>
      );
    case "AUDIT":
      return (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
          A
        </span>
      );
  }
}

function EventRow({
  event,
}: {
  event: DocumentHistoryResponse["events"][number];
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <EventTypeIcon type={event.type} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm font-semibold text-slate-900">
            {event.title}
          </span>
          {event.actor ? (
            <span className="text-xs text-slate-500">bởi {event.actor}</span>
          ) : null}
        </div>
        {event.description ? (
          <p className="mt-0.5 text-xs leading-5 text-slate-500">
            {event.description}
          </p>
        ) : null}
      </div>
      <time className="shrink-0 text-xs text-slate-400 tabular-nums">
        {formatEventDate(event.timestamp)}
      </time>
    </div>
  );
}

function HistoryTab({ documentId }: HistoryTabProps) {
  const [history, setHistory] = useState<DocumentHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void getDocumentHistory(documentId)
      .then((data) => {
        if (!cancelled) setHistory(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Không tải được lịch sử.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-950">Lịch sử xử lý</h2>
        <p className="mt-2 text-sm text-slate-500">Đang tải...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-950">Lịch sử xử lý</h2>
        <p className="mt-2 text-sm text-red-600">{error}</p>
      </section>
    );
  }

  if (!history) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-bold text-slate-950">Lịch sử xử lý</h2>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
          {history.templateCode ?? "?"} &mdash; {history.documentTitle}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">
          {history.reviewStatus}
        </span>
      </div>

      {history.events.length === 0 ? (
        <p className="text-sm text-slate-500">
          Chưa có lịch sử. Biểu mẫu được tạo lúc{" "}
          {formatEventDate(history.generatedAt)}.
        </p>
      ) : (
        <div className="divide-y divide-slate-100">
          {history.events.map((event, idx) => (
            <EventRow
              key={`${event.type}-${event.timestamp ?? idx}`}
              event={event}
            />
          ))}
        </div>
      )}

      <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
          <div>
            <dt className="text-slate-500">Mẫu</dt>
            <dd className="mt-0.5 font-medium text-slate-800">
              {history.templateCode ?? "--"} &mdash;{" "}
              {history.templateName ?? "--"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Người tạo</dt>
            <dd className="mt-0.5 font-medium text-slate-800">
              {history.generatedByName ?? "--"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Số biểu mẫu</dt>
            <dd className="mt-0.5 font-medium text-slate-800">
              {history.documentCode ?? "--"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Tổng sự kiện</dt>
            <dd className="mt-0.5 font-medium text-slate-800">
              {history.events.length}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

// ─── Workspace ───────────────────────────────────────────────────────────────

type GeneratedDocumentWorkspaceProps = {
  documentId: string;
};

type TabKey = "form" | "files" | "history";

type RenderPayloadResponse = RenderPayloadForCaseContext & {
  document?: {
    id?: string | null;
    documentTitle?: string | null;
    documentCode?: string | null;
    targetScope?: string | null;
    reviewStatus?: string | null;
  } | null;
  template?: {
    id?: string | null;
    templateCode?: string | null;
    templateNo?: string | null;
    templateName?: string | null;
    renderScope?: string | null;
    outputStrategy?: string | null;
  } | null;
  person?: {
    fullName?: string | null;
  } | null;
};

const TABS: Array<{
  key: TabKey;
  label: string;
  description: string;
}> = [
  {
    key: "form",
    label: "Dữ liệu biểu mẫu",
    description: "Nhập dữ liệu riêng theo từng loại biểu mẫu",
  },
  {
    key: "files",
    label: "Tệp đã xuất",
    description: "Tùy chỉnh trước khi xuất, tạo Word/PDF và tải tệp",
  },
  {
    key: "history",
    label: "Lịch sử xử lý",
    description: "Theo dõi các lần lưu, tạo DOCX và xuất PDF",
  },
];

// Use the generated registry. Regenerate with: node scripts/generate-bm-panel-registry.mjs
// Missing panels (if any) fall back to PublishedContractFormInputsPanel / GenericTemplateFormInputsPanel.
// bm-172 exports Bm172FormInputs (not Bm172FormInputsPanel) with incompatible props (Bm172FormInputsProps vs standard {documentId,onSaved}).
// Wrap it to satisfy the registry's ComponentType<{documentId,onSaved}> contract.
import { Bm172FormInputs as _Bm172FormInputsRaw } from "./bm-172-form-inputs";

function _Bm172FormInputsPanelAdapter({ documentId, onSaved }: { documentId: string; onSaved?: () => void }) {
  return (
    <_Bm172FormInputsRaw
      value={undefined}
      initialValue={undefined}
      disabled={false}
      isSaving={false}
      onChange={() => {}}
      onSave={() => {}}
      onReload={() => {}}
    />
  );
}

// Extend the registry with the alias so the same lookup works for BM-172
const _registryWith172 = {
  ...BM_PANEL_REGISTRY,
  "BM-172": _Bm172FormInputsPanelAdapter,
};
const BM_PANEL_BY_CODE = _registryWith172;

function getTemplateDescription(templateCode: string | null | undefined) {
  switch (templateCode) {
    case "BM-168":
      return "Form nhập dữ liệu riêng cho Biên bản giao nhận hồ sơ vụ án, vụ việc. Giao diện gom thành thời gian, địa điểm, bên giao, bên nhận, hồ sơ, vật chứng và chữ ký; các dòng dài được tự sinh.";
    case "BM-085":
      return "Form nhập dữ liệu riêng cho Quyết định chuyển vụ án hình sự để điều tra theo thẩm quyền. Dữ liệu được gom thành header, tên vụ án, tội danh, cơ quan đang điều tra, cơ quan nhận chuyển, Viện kiểm sát có thẩm quyền, nơi nhận và chữ ký.";
    case "BM-017":
      return "Form nhập dữ liệu riêng cho Yêu cầu khởi tố vụ án hình sự. Dữ liệu được gom thành header, cơ quan điều tra, vụ việc, tội danh, điều khoản BLHS, nơi nhận và chữ ký.";
    case "BM-007":
      return "Form nhập dữ liệu riêng cho Yêu cầu cung cấp tài liệu để kiểm sát việc giải quyết nguồn tin về tội phạm. Dữ liệu gồm cơ quan, số yêu cầu, lý do yêu cầu, danh mục tài liệu, thời hạn, nơi nhận và chữ ký.";
    case "BM-009":
      return "Form nhập dữ liệu riêng cho Quyết định gia hạn thời hạn giải quyết nguồn tin về tội phạm. Dữ liệu gồm căn cứ tiếp nhận nguồn tin, đề nghị gia hạn, lý do gia hạn, nội dung Điều 1/Điều 2, nơi nhận và chữ ký.";
    case "BM-030":
      return "Form nhập dữ liệu riêng cho Thông báo kết quả giải quyết nguồn tin về tội phạm. Dữ liệu gồm kính gửi, nguồn tin, quyết định/kết quả giải quyết, nơi nhận và chữ ký.";
    case "BM-170":
      return "Form nhập dữ liệu riêng cho Quyết định hủy bỏ Quyết định xử lý vật chứng. Dữ liệu gồm căn cứ khởi tố, quyết định xử lý vật chứng bị hủy, lý do hủy, Điều 1, Điều 2, nơi nhận và chữ ký.";
    case "BM-047":
      return "Form nhập dữ liệu riêng cho Quyết định về việc bảo lĩnh. Dữ liệu gồm bị can, người nhận bảo lĩnh, căn cứ khởi tố, thời hạn bảo lĩnh, Điều 1, Điều 2, nơi nhận và chữ ký.";
    case "BM-046":
      return "Form nhập dữ liệu riêng cho Quyết định không phê chuẩn Quyết định về việc bảo lĩnh. Dữ liệu gồm căn cứ khởi tố vụ án, khởi tố bị can, hồ sơ đề nghị bảo lĩnh, lý do không đủ căn cứ, Điều 1, Điều 2, nơi nhận và chữ ký.";
    case "BM-159":
      return "Form nhập dữ liệu riêng cho Quyết định phân công Viện kiểm sát cấp dưới thực hành quyền công tố, kiểm sát xét xử sơ thẩm vụ án hình sự. Dữ liệu gồm cáo trạng, Viện kiểm sát được phân công, vụ án, tội danh, Điều 1, Điều 2, nơi nhận và chữ ký.";
    case "BM-086":
      return "Form nhập dữ liệu riêng cho Quyết định chuyển việc thực hiện thẩm quyền thực hành quyền công tố, kiểm sát việc giải quyết vụ việc/vụ án hình sự. Dữ liệu gồm vụ án, VKS chuyển đi, VKS nhận, căn cứ thẩm quyền, Điều 1, Điều 2, nơi nhận và chữ ký.";
    case "BM-048":
      return "Form nhập dữ liệu riêng cho QĐ huỷ bỏ biện pháp bảo lĩnh. Dữ liệu gồm cơ quan, số QĐ bảo lĩnh bị hủy, thông tin bị can, tội danh, căn cứ pháp lý, lý do hủy bỏ, nơi nhận và chữ ký.";
    case "BM-049":
      return "Form nhập dữ liệu riêng cho QĐ phê chuẩn QĐ về việc đặt tiền để bảo đảm. Dữ liệu gồm cơ quan, số QĐ đặt tiền, thông tin người đặt tiền, số tiền, tội danh, nơi nhận và chữ ký.";
    case "BM-050":
      return "Form nhập dữ liệu riêng cho QĐ không phê chuẩn QĐ về việc đặt tiền để bảo đảm. Dữ liệu gồm cơ quan, số QĐ đặt tiền, lý do không phê chuẩn, thông tin cá nhân, tội danh, nơi nhận và chữ ký.";
    case "BM-018":
      return "Form nhập dữ liệu riêng cho Yêu cầu ra Quyết định thay đổi Quyết định khởi tố vụ án hình sự. Dữ liệu gồm quyết định cũ, tội danh cũ, căn cứ thay đổi, tội danh mới, cơ quan được yêu cầu, nơi nhận và chữ ký.";
    case "BM-016":
      return "Form nhập dữ liệu riêng cho Kết luận trực tiếp kiểm sát tiếp nhận, giải quyết nguồn tin về tội phạm. Dữ liệu gồm quyết định thực hiện, thống kê tiếp nhận/giải quyết, vi phạm, kiến nghị, nơi nhận và chữ ký.";
    case "BM-015":
      return "Form nhập dữ liệu riêng cho Kế hoạch trực tiếp kiểm sát tiếp nhận, giải quyết nguồn tin về tội phạm. Dữ liệu gồm mục đích/yêu cầu, nội dung thống kê, đánh giá, thời gian/phương pháp, nơi nhận và chữ ký.";
    case "BM-014":
      return "Form nhập dữ liệu riêng cho Quyết định trực tiếp kiểm sát tiếp nhận, giải quyết nguồn tin về tội phạm. Dữ liệu gồm thời gian trực tiếp kiểm sát, đoàn kiểm sát, yêu cầu chuẩn bị hồ sơ, nơi nhận và chữ ký.";
    case "BM-011":
      return "Form nhập dữ liệu riêng cho Quyết định hủy bỏ Quyết định tạm đình chỉ việc giải quyết nguồn tin về tội phạm. Dữ liệu gồm quyết định tạm đình chỉ bị hủy, xét thấy, Điều 1, Điều 2, nơi nhận và chữ ký.";
    case "BM-012":
      return "Form nhập dữ liệu riêng cho Quyết định phục hồi giải quyết nguồn tin về tội phạm. Dữ liệu gồm cơ quan, số quyết định, lý do phục hồi, quyết định tạm đình chỉ, vụ việc, nơi nhận và chữ ký.";
    case "BM-010":
      return "Form nhập dữ liệu riêng cho Quyết định tạm đình chỉ giải quyết nguồn tin về tội phạm. Dữ liệu gồm cơ quan, số quyết định, lý do tạm đình chỉ, vụ việc, ngày tiếp nhận, Điều 2, Điều 3, nơi nhận và chữ ký.";
    case "BM-008":
      return "Form nhập dữ liệu riêng cho Yêu cầu chuyển nguồn tin về tội phạm. Dữ liệu gồm cơ quan, số yêu cầu, lý do chuyển, cơ quan chuyển, cơ quan tiếp nhận, nơi nhận và chữ ký.";
    case "BM-006":
      return "Form nhập dữ liệu riêng cho Yêu cầu tiếp nhận, kiểm tra, xác minh, ra quyết định giải quyết nguồn tin về tội phạm. Dữ liệu gồm cơ quan, số yêu cầu, lý do xét thấy, cơ quan/người được yêu cầu, nội dung yêu cầu, nơi nhận và chữ ký.";
    case "BM-003":
      return "Form nhập dữ liệu riêng cho Quyết định phân công thực hành quyền công tố, kiểm sát việc tiếp nhận, giải quyết nguồn tin về tội phạm. Dữ liệu gồm cơ quan, số quyết định, Kiểm sát viên được phân công, Kiểm tra viên giúp việc nếu có, Điều 1/2/3, nơi nhận và chữ ký.";
    case "BM-005":
      return "Form nhập dữ liệu riêng cho Yêu cầu kiểm tra, xác minh nguồn tin về tội phạm. Dữ liệu gồm lần yêu cầu, căn cứ tố tụng, nhận định cần xác minh, cơ quan được yêu cầu, các vấn đề a/b/c/d, nơi nhận và Kiểm sát viên ký.";
    case "BM-001":
      return "Form nhập dữ liệu riêng cho Biên bản tiếp nhận nguồn tin về tội phạm. Dữ liệu gồm cơ quan lập biên bản, thời gian tiếp nhận, người tiếp nhận, người cung cấp nguồn tin, nội dung nguồn tin, tài liệu giao nộp và chữ ký.";
    case "BM-023":
      return "Form nhập dữ liệu riêng cho Quyết định khởi tố vụ án hình sự. Dữ liệu gồm số quyết định, căn cứ pháp lý, nội dung vụ việc, tội danh, yêu cầu điều tra, nơi nhận và chữ ký.";
    case "BM-027":
      return "Form nhập dữ liệu riêng cho Thông báo về việc huỷ bỏ QĐ khởi tố vụ án hình sự. Dữ liệu gồm số thông báo, căn cứ pháp lý, thông tin QĐ khởi tố bị huỷ, lý do hủy, nơi nhận và chữ ký.";
    case "BM-028":
      return "Form nhập dữ liệu riêng cho QĐ huỷ bỏ QĐ thay đổi QĐ khởi tố vụ án hình sự. Dữ liệu gồm số quyết định, căn cứ pháp lý, thông tin QĐ thay đổi bị hủy (từ tội, sang tội, điều/khoản), nơi nhận và chữ ký.";
    case "BM-031":
      return "Form nhập dữ liệu riêng cho Quyết định phê chuẩn Lệnh bắt người bị giữ trong trường hợp khẩn cấp. Dữ liệu gồm số quyết định, căn cứ phê chuẩn, nội dung Điều 1/2, nơi nhận và chữ ký.";
    case "BM-033":
      return "Form nhập dữ liệu riêng cho Quyết định phê chuẩn Quyết định gia hạn tạm giữ. Dữ liệu gồm căn cứ quyết định tạm giữ, quyết định gia hạn tạm giữ, hồ sơ đề nghị phê chuẩn, lý do phê chuẩn, Điều 1/2, nơi nhận và chữ ký.";
    case "BM-037":
      return "Form nhập dữ liệu riêng cho Quyết định phê chuẩn Lệnh bắt bị can để tạm giam. Dữ liệu gồm căn cứ khởi tố vụ án/bị can, đề nghị phê chuẩn, nội dung Điều 1/2, thời hạn tạm giam, nơi nhận và chữ ký.";
    case "BM-038":
      return "Form nhập dữ liệu riêng cho Quyết định không phê chuẩn Lệnh bắt bị can để tạm giam. Dữ liệu gồm tên bị can, tên tội, điều luật, căn cứ khởi tố, hồ sơ đề nghị phê chuẩn, lý do không phê chuẩn, Điều 1/2, nơi nhận và chữ ký.";
    case "BM-039":
      return "Form nhập dữ liệu riêng cho Lệnh bắt bị can để tạm giam. Dữ liệu gồm tên bị can, lý lịch, tội danh, căn cứ khởi tố, thời hạn tạm giam, cơ quan thi hành, cơ sở giam giữ, nơi nhận và chữ ký.";
    case "BM-045":
      return "Form nhập dữ liệu riêng cho Quyết định phê chuẩn Quyết định về việc bảo lĩnh. Có checkbox dòng người chưa thành niên và tự đồng bộ tên bị can, tội danh, quyết định bảo lĩnh, nơi nhận, chữ ký.";
    case "BM-044":
      return "Form nhập dữ liệu riêng cho Quyết định thay thế biện pháp tạm giam. Có checkbox dòng người chưa thành niên và checkbox dòng căn cứ gia hạn tạm giam nếu có.";
    case "BM-040":
      return "Form nhập dữ liệu riêng cho Quyết định phê chuẩn Lệnh tạm giam. Dữ liệu gồm căn cứ tố tụng, căn cứ khởi tố vụ án/bị can, đề nghị phê chuẩn Lệnh tạm giam, nội dung Điều 1/2, thời hạn tạm giam, nơi nhận và chữ ký.";
    case "BM-042":
      return "Form nhập dữ liệu riêng cho Quyết định gia hạn tạm giam. Dữ liệu gồm lần gia hạn, căn cứ lệnh tạm giam, căn cứ gia hạn trước đó nếu có, hồ sơ đề nghị gia hạn, Điều 1/2/3, nơi nhận và chữ ký.";
    case "BM-043":
      return "Form nhập dữ liệu riêng cho Quyết định hủy bỏ biện pháp tạm giam. Dữ liệu gồm căn cứ lệnh tạm giam, căn cứ quyết định gia hạn/truy tố nếu có, lý do hủy bỏ, Điều 1/2/3, nơi nhận và chữ ký.";
    case "BM-053":
      return "Form nhập dữ liệu riêng cho Lệnh cấm đi khỏi nơi cư trú. Dữ liệu được lưu trước, sau đó mới tạo DOCX/PDF để đảm bảo biểu mẫu xuất ra đúng nghiệp vụ.";
    case "BM-055":
      return "Form nhập dữ liệu riêng cho Quyết định hủy bỏ biện pháp cấm đi khỏi nơi cư trú. Dữ liệu gồm số quyết định, căn cứ lệnh cấm, lý do hủy bỏ, thông tin bị can, nơi nhận và chữ ký.";
    case "BM-056":
      return "Form nhập dữ liệu riêng cho Quyết định tạm hoãn xuất cảnh. Dữ liệu gồm số quyết định, thông tin người bị tạm hoãn xuất cảnh, thời hạn tạm hoãn, cơ quan quản lý xuất nhập cảnh, nơi nhận và chữ ký.";
    case "BM-057":
      return "Form nhập dữ liệu riêng cho Quyết định hủy bỏ biện pháp tạm hoãn xuất cảnh. Dữ liệu gồm số quyết định, căn cứ quyết định tạm hoãn xuất cảnh, lý do hủy bỏ, thông tin người liên quan, nơi nhận và chữ ký.";
    case "BM-058":
      return "Form nhập dữ liệu riêng cho Lệnh tạm giam. Dữ liệu gồm số lệnh, căn cứ khởi tố vụ án/bị can, thời hạn tạm giam, đơn vị thi hành, thông tin bị can, nơi nhận, giao nhận lệnh và chữ ký.";
    case "BM-059":
      return "Form nhập dữ liệu riêng cho Quyết định gia hạn thời hạn tạm giam để truy tố. Dữ liệu gồm số quyết định, căn cứ lệnh tạm giam, căn cứ gia hạn truy tố, thời hạn gia hạn, cơ sở giam giữ, thông tin bị can, nơi nhận, giao nhận quyết định và chữ ký.";
    case "BM-070":
      return "Form nhập dữ liệu riêng cho Quyết định phân công Phó Viện trưởng thực hành quyền công tố, kiểm sát việc giải quyết vụ án hình sự. Dữ liệu gồm người được phân công, căn cứ khởi tố vụ án, căn cứ pháp lý, nơi nhận và chữ ký.";
    case "BM-103":
      return "Form nhập dữ liệu riêng cho Đề nghị gia hạn thời hạn điều tra vụ án hình sự.";
    case "BM-104":
      return "Form nhập dữ liệu riêng cho Quyết định gia hạn thời hạn điều tra vụ án hình sự.";
    case "BM-141":
      return "Form nhập dữ liệu riêng cho BM-001 - Biên bản tiếp nhận nguồn tin về tội phạm. Dữ liệu gồm thời gian tiếp nhận, địa điểm tiếp nhận, người tiếp nhận, người cung cấp nguồn tin, nội dung nguồn tin và chữ ký.";
    case "BM-144":
      return "Form nhập dữ liệu riêng cho Quyết định gia hạn thời hạn quyết định việc truy tố. Dữ liệu gồm căn cứ khởi tố, kết luận điều tra, lý do gia hạn, thời hạn gia hạn, nơi nhận và chữ ký.";
    case "BM-145":
      return "Form nhập dữ liệu riêng cho Quyết định trả hồ sơ vụ án để điều tra bổ sung. Dữ liệu gồm căn cứ pháp lý, bản kết luận điều tra, quyết định trả hồ sơ của Tòa án nếu có, lý do điều tra bổ sung, nội dung Điều 1/2/3, nơi nhận và chữ ký.";
    case "BM-072":
      return "Form nhập dữ liệu riêng cho Quyết định thay đổi người thực hành quyền công tố, kiểm sát việc giải quyết vụ án hình sự. Dữ liệu gồm thông tin vụ án, người cũ, người mới, lý do thay đổi, nơi nhận và chữ ký.";
    case "BM-074":
      return "Form nhập dữ liệu riêng cho Yêu cầu cử người phiên dịch, người dịch thuật. Dữ liệu gồm thông tin vụ án, lý do, thông tin người phiên dịch, cơ quan được yêu cầu, nơi nhận và chữ ký.";
    case "BM-076":
      return "Form nhập dữ liệu riêng cho Quyết định thay đổi người phiên dịch, người dịch thuật. Dữ liệu gồm thông tin vụ án, người phiên dịch cũ, người mới, lý do thay đổi, nơi nhận và chữ ký.";
    case "BM-078":
      return "Form nhập dữ liệu riêng cho Thông báo người bào chữa. Dữ liệu gồm thông tin người bào chữa, bị can và nội dung thông báo.";
    case "BM-081":
      return "Form nhập dữ liệu riêng cho Quyết định thời điểm người bào chữa tham gia tố tụng. Dữ liệu gồm thông tin vụ án, người bào chữa và thời điểm bắt đầu tham gia, nơi nhận và chữ ký.";
    case "BM-083":
      return "Form nhập dữ liệu riêng cho Yêu cầu thay đổi người giám định, người định giá tài sản. Dữ liệu gồm thông tin vụ án, bị can, người giám định/định giá và lý do thay đổi, nơi nhận và chữ ký.";
    case "BM-084":
      return "Form nhập dữ liệu riêng cho Quyết định thay đổi người giám định, người định giá tài sản. Dữ liệu gồm thông tin vụ án, người giám định cũ, người mới, lý do thay đổi, nơi nhận và chữ ký.";
    case "BM-097":
      return "Form nhập dữ liệu riêng cho Quyết định khởi tố bị can. Dữ liệu gồm thông tin bị can, căn cứ khởi tố vụ án, tội danh, hành vi, cơ quan điều tra, nơi nhận và chữ ký.";
    case "BM-090":
      return "Form nhập dữ liệu riêng cho Quyết định phê chuẩn Quyết định khởi tố bị can.";
    case "BM-148":
      return "Form nhập dữ liệu riêng cho Quyết định tạm đình chỉ vụ án hình sự đối với bị can. Dữ liệu gồm căn cứ tố tụng, quyết định khởi tố vụ án/bị can, tên bị can, tội danh, nội dung tạm đình chỉ, nơi nhận và chữ ký.";
    case "BM-146":
      return "Form nhập dữ liệu riêng cho Quyết định tạm đình chỉ vụ án hình sự. Dữ liệu gồm căn cứ tố tụng, căn cứ khởi tố vụ án, lý do tạm đình chỉ, nội dung Điều 1-4, nơi nhận và chữ ký.";
    case "BM-087":
      return "Form nhập dữ liệu riêng cho Yêu cầu điều tra. Dữ liệu gồm cơ quan được yêu cầu, tên vụ án, tội danh, nội dung yêu cầu tự sinh, nơi nhận và chữ ký.";
    case "BM-091":
      return "Form nhập dữ liệu riêng cho QĐ phê chuẩn QĐ thay đổi QĐ khởi tố bị can. Dữ liệu gồm quyết định cũ, lý do thay đổi, thông tin bị can, tội danh, nội dung tự sinh, nơi nhận và chữ ký.";
    case "BM-092":
      return "Form nhập dữ liệu riêng cho QĐ phê chuẩn QĐ bổ sung QĐ khởi tố bị can. Dữ liệu gồm quyết định cũ, lý do bổ sung, thông tin bị can, tội danh, nội dung tự sinh, nơi nhận và chữ ký.";
    case "BM-099":
      return "Form nhập dữ liệu riêng cho QĐ thay đổi QĐ khởi tố bị can. Dữ liệu gồm quyết định cũ, lý do thay đổi, thông tin bị can, tội danh, nội dung tự sinh, nơi nhận và chữ ký.";
    case "BM-101":
      return "Form nhập dữ liệu riêng cho QĐ bổ sung QĐ khởi tố bị can. Dữ liệu gồm quyết định cũ, lý do bổ sung, thông tin bị can, tội danh, nội dung tự sinh, nơi nhận và chữ ký.";
    case "BM-102":
      return "Form nhập dữ liệu riêng cho QĐ hủy bỏ QĐ khởi tố bị can. Dữ liệu gồm quyết định bị hủy, lý do hủy, thông tin bị can, tội danh, nội dung tự sinh, nơi nhận và chữ ký.";
    case "BM-107":
      return "Form nhập dữ liệu riêng cho QĐ hủy bỏ QĐ tạm đình chỉ điều tra VAHS. Dữ liệu gồm quyết định tạm đình chỉ bị hủy, tên vụ án, tội danh, lý do hủy, nội dung tự sinh, nơi nhận và chữ ký.";
    case "BM-116":
      return "Form nhập dữ liệu riêng cho QĐ phục hồi điều tra vụ án hình sự. Dữ liệu gồm quyết định tạm đình chỉ, tên vụ án, tội danh, lý do phục hồi, nội dung tự sinh, nơi nhận và chữ ký.";
    case "BM-119":
      return "Form nhập dữ liệu riêng cho QĐ phê chuẩn Lệnh khám xét. Dữ liệu gồm lý do khám xét, địa điểm khám xét, nội dung khám xét tự sinh, nơi nhận và chữ ký.";
    case "BM-120":
      return "Form nhập dữ liệu riêng cho QĐ không phê chuẩn Lệnh khám xét. Dữ liệu gồm căn cứ tố tụng, lý do không phê chuẩn tự sinh, nơi nhận và chữ ký.";
    case "BM-126":
      return "Form nhập dữ liệu riêng cho QĐ trưng cầu giám định. Dữ liệu gồm tên người giám định, mô tả tang vật, yêu cầu giám định tự sinh, nơi nhận và chữ ký.";
    case "BM-134":
      return "Form nhập dữ liệu riêng cho BB ghi lời khai. Dữ liệu gồm thông tin người làm chứng, căn cứ điều tra tự sinh, nơi nhận và chữ ký.";
    case "BM-135":
      return "Form nhập dữ liệu riêng cho BB hỏi cung bị can. Dữ liệu gồm thông tin bị can, câu hỏi và trả lời (động), nơi nhận và chữ ký.";
    case "BM-123":
      return "Form nhập dữ liệu riêng cho QĐ thực nghiệm điều tra. Dữ liệu gồm quyết định điều tra, mục đích, thời gian, địa điểm, phương pháp thực nghiệm, kết quả dự kiến và chữ ký.";
    case "BM-124":
      return "Form nhập dữ liệu riêng cho BB thực nghiệm điều tra. Dữ liệu gồm quyết định thực nghiệm, thời gian, địa điểm, danh sách người tham dự, nội dung thực nghiệm, ghi chú quan sát, kết luận và chữ ký.";
    case "BM-136":
      return "Form nhập dữ liệu riêng cho BB đối chất. Dữ liệu gồm thông tin vụ án, hai người tham gia, lời khai từng người, mâu thuẫn ghi nhận, kết luận và chữ ký.";
    case "BM-137":
      return "Form nhập dữ liệu riêng cho BB xác minh - làm việc. Dữ liệu gồm thông tin vụ án, nội dung cần xác minh, phương pháp, kết quả xác minh, kết luận và người lập biên bản.";
    case "BM-139":
      return "Form nhập dữ liệu riêng cho Kiến nghị khắc phục, xử lý vi phạm trong hoạt động khởi tố, điều tra. Dữ liệu gồm vụ án, mô tả vi phạm, căn cứ pháp lý, biện pháp kiến nghị, thời hạn và chữ ký.";
    case "BM-140":
      return "Form nhập dữ liệu riêng cho Kiến nghị áp dụng biện pháp phòng ngừa tội phạm và vi phạm pháp luật. Dữ liệu gồm thông tin vụ án, đối tượng, biện pháp đề nghị, căn cứ pháp lý và chữ ký.";
    default:
      return "Khu vực xử lý dữ liệu biểu mẫu, tạo DOCX/PDF và quản lý tệp đã xuất.";
  }
}

export function GeneratedDocumentWorkspace({
  documentId,
}: GeneratedDocumentWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("form");
  const [refreshKey, setRefreshKey] = useState(0);
  const [payload, setPayload] = useState<RenderPayloadResponse | null>(null);
  const [isLoadingPayload, setIsLoadingPayload] = useState(true);
  const [payloadError, setPayloadError] = useState<string | null>(null);
  const [publishedRuntime, setPublishedRuntime] = useState<{
    source: string;
    contractHash: string;
    compiledContract: CompiledFormContract;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPayload() {
      try {
        setIsLoadingPayload(true);
        setPayloadError(null);

        const data = await getDocumentRenderPayload<RenderPayloadResponse>(documentId);

        if (isMounted) {
          setPayload(data);
        }
      } catch (error) {
        if (isMounted) {
          setPayloadError(
            error instanceof Error
              ? error.message
              : "Không tải được payload biểu mẫu.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingPayload(false);
        }
      }
    }

    void loadPayload();

    return () => {
      isMounted = false;
    };
  }, [documentId, refreshKey]);

  const templateCode = payload?.template?.templateCode ?? "UNKNOWN";
  const templateNo = payload?.template?.templateNo?.trim() ?? "";
  const templateName = payload?.template?.templateName ?? "Chưa xác định";
  const documentCode = payload?.document?.documentCode?.trim() ?? "";
  const caseCode = payload?.case?.caseCode?.trim() ?? "";
  const caseTitle = payload?.case?.caseTitle?.trim() ?? "";
  const personName = payload?.person?.fullName?.trim() ?? "";

  const canonicalPageTitle = templateNo
    ? `Mẫu số ${templateNo} - ${templateName}`
    : `${templateCode} - ${templateName}`.trim();

  const headerContextItems = [
    caseCode ? `Hồ sơ: ${caseCode}` : "",
    caseTitle ? `Tên vụ án: ${caseTitle}` : "",
    personName ? `Người liên quan: ${personName}` : "Cấp hồ sơ",
    documentCode ? `Số văn bản: ${documentCode}` : "",
  ].filter((value) => value.length > 0);

  const headerDescription = useMemo(
    () => getTemplateDescription(templateCode),
    [templateCode],
  );
  const isInitialPayloadLoading = isLoadingPayload && !payload;

  const casePayload = useMemo(
    () => buildCasePayloadFromRenderPayload(payload),
    [payload],
  );

  const Panel = templateCode
    ? BM_PANEL_BY_CODE[templateCode] ?? GenericTemplateFormInputsPanel
    : GenericTemplateFormInputsPanel;

  useEffect(() => {
    let active = true;
    if (!templateCode || templateCode === "UNKNOWN") {
      setPublishedRuntime(null);
      return;
    }
    void getRuntimeFormContract(templateCode)
      .then((result) => {
        if (!active) return;
        setPublishedRuntime(
          result.source === "LOCKED_FILE"
            ? null
            : {
                source: result.source,
                contractHash: result.contractHash,
                compiledContract: result.compiledContract,
              },
        );
      })
      .catch(() => {
        if (active) setPublishedRuntime(null);
      });
    return () => {
      active = false;
    };
  }, [templateCode]);

  return (
    <CasePayloadProvider value={casePayload}>
      <main className="qvks-document-workspace min-h-screen bg-slate-50 px-5 py-7 md:px-10">
        <div className="mx-auto w-full max-w-[1500px] space-y-7">
          <header className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              QUANLYVKS / Biểu mẫu đã tạo
            </p>

            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="rounded-full bg-slate-950 px-3.5 py-1.5 text-sm font-bold text-white">
                    {templateCode}
                  </span>

                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-sm font-semibold text-slate-600">
                    {payload?.template?.renderScope === "UNKNOWN_SCOPE"
                      ? "Cấp văn bản chưa xác định"
                      : payload?.template?.renderScope ?? "Cấp văn bản chưa xác định"}
                  </span>
                </div>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                  {isInitialPayloadLoading
                    ? "Đang tải biểu mẫu..."
                    : canonicalPageTitle}
                </h1>

                {!isInitialPayloadLoading && headerContextItems.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {headerContextItems.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-sm font-semibold text-slate-600"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                ) : null}

                <p className="mt-4 max-w-5xl text-base leading-7 text-slate-600">
                  {headerDescription}
                </p>

                {payloadError ? (
                  <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-base leading-7 text-red-700">
                    {payloadError}
                  </p>
                ) : null}
              </div>

              {SHOW_INTERNAL_IDS ? (
                <div className="min-w-[140px] rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-base">
                  <span className="text-slate-500">Mã hồ sơ nội bộ</span>
                  <div className="mt-1 font-mono text-lg font-bold text-slate-950">
                    #{documentId}
                  </div>
                </div>
              ) : null}
            </div>
          </header>

          <section className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
            <div className="grid gap-2 md:grid-cols-3">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={
                      isActive
                        ? "rounded-2xl bg-slate-950 px-4 py-3 text-left text-white shadow-sm"
                        : "rounded-2xl px-4 py-3 text-left text-slate-700 transition hover:bg-slate-50"
                    }
                  >
                    <span className="block text-sm font-bold">{tab.label}</span>
                    <span
                      className={
                        isActive
                          ? "mt-1 block text-xs text-slate-300"
                          : "mt-1 block text-xs text-slate-500"
                      }
                    >
                      {tab.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {activeTab === "form" ? (
            <>
              {isInitialPayloadLoading ? (
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm text-slate-600">
                    Đang tải dữ liệu biểu mẫu...
                  </p>
                </section>
              ) : null}

              {!isInitialPayloadLoading && publishedRuntime ? (
                <PublishedContractFormInputsPanel
                  documentId={documentId}
                  contract={publishedRuntime.compiledContract}
                  contractHash={publishedRuntime.contractHash}
                  onSaved={() => setRefreshKey((current) => current + 1)}
                />
              ) : null}

              {!isInitialPayloadLoading && !publishedRuntime && Panel ? (
                <Panel
                  documentId={documentId}
                  onSaved={() => setRefreshKey((current) => current + 1)}
                />
              ) : null}
            </>
          ) : null}

          {activeTab === "files" ? (
            <GeneratedDocumentActionPanel
              key={`document-files-${refreshKey}`}
              documentId={documentId}
            />
          ) : null}

          {activeTab === "history" ? (
            <HistoryTab documentId={documentId} />
          ) : null}
        </div>
      </main>
    </CasePayloadProvider>
  );
}
