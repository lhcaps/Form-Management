"use client";

/**
 * BM-027 — Thông báo về việc huỷ bỏ QĐ khởi tố vụ án hình sự
 * Stage: TIEP_NHAN (G01), Group: 01
 *
 * Mẫu số 27/HS · Thông tư 03/2026/TT-VKSTC
 *
 * DOCX source: 27-Thông báo về việc huỷ bỏ QĐ khởi tố vụ án hình sự.doc
 * DOCX verified field map (June 2026):
 *
 * P0001  VIỆN KIỂM SÁT
 * P0002  [tên VKS]
 * P0003  Số: [số TB]
 * P0004  /TB-VKS
 * P0005  CỘNG HÒA...
 * P0012  THÔNG BÁO
 * P0013  Về việc hủy bỏ QĐ khởi tố vụ án hình sự
 * P0014  Kính gửi: [người/nơi nhận]
 * P0015  Căn cứ Điều 41 và Điều 158 BLTTHS
 * P0016  Xét QĐ khởi tố số [số QĐ gốc]
 * P0017-19  ngày/tháng/năm [ngày QĐ gốc]
 * P0020  của [cơ quan ra QĐ gốc]
 * P0021  về tội [tội]
 * P0022  quy định tại khoản [khoản]
 * P0023  Điều [Điều BLHS]
 * P0024  của BLHS là không có căn cứ vì [lý do hủy]
 * P0025  [chi tiết lý do]
 * P0026  Viện kiểm sát [tên VKS]
 * P0027  đã ra QĐ số [số QĐ hủy]
 * P0028-30  ngày/tháng/năm [ngày QĐ hủy]
 * P0031  hủy bỏ QĐ khởi tố số [số QĐ gốc]
 * P0043  Nơi nhận: [danh sách nơi nhận]
 * P0044  - Lưu: HSVA, HSKS, VP.
 * P0045  KIỂM SÁT VIÊN
 * P0046  (Ký, ghi rõ họ tên, đóng dấu)
 */
import { useEffect, useState } from "react";
import { absoluteApiUrl, extractApiError } from "@/lib/api-client";
import { BmFormSection, BmFormMetaBar } from "@/components/documents/bm-form";
import { useCasePayload } from "@/lib/case-payload-context";
import { applyCasePayloadToGenericForm, type GenericCaseFormInputs } from "@/lib/bm-auto-populate/generic-case-defaults";

/**
 * BM-027 form shape mirrors the DOCX layout exactly:
 * - Sections 1-2: standard agency+document header
 * - Section 3: original decision being cancelled (P0016-P0023)
 * - Section 4: cancellation reason (P0024-P0025)
 * - Section 5: this decision (P0027-P0031) — VKS confirms cancellation
 * - Section 6: recipients + signature
 */
type Bm027Form = {
  agency: {
    name: string;
    parentName: string;
    issuePlace: string;
  };
  document: {
    documentCode: string;
    issueDate: string;
  };
  recipients: {
    recipientTo: string;
    recipientLine: string;
    archiveLine: string;
  };
  content: {
    legalBasisLine: string;
  };
  originalDecision: {
    decisionCode: string;
    decisionDate: string;
    issuingAgency: string;
    offenseName: string;
    articleNumber: string;
    articleClause: string;
  };
  cancellation: {
    reason: string;
    decisionCode: string;
    decisionDate: string;
  };
  signature: {
    signMode: string;
    positionTitle: string;
    signerName: string;
  };
};

const EMPTY: Bm027Form = {
  agency: { name: "", parentName: "", issuePlace: "" },
  document: { documentCode: "", issueDate: "" },
  recipients: { recipientTo: "", recipientLine: "", archiveLine: "Lưu: HSVA, HSKS, VP." },
  content: { legalBasisLine: "" },
  originalDecision: { decisionCode: "", decisionDate: "", issuingAgency: "", offenseName: "", articleNumber: "", articleClause: "" },
  cancellation: { reason: "", decisionCode: "", decisionDate: "" },
  signature: { signMode: "KT. VIỆN TRƯỞNG", positionTitle: "PHÓ VIỆN TRƯỞNG", signerName: "" },
};

function isRecord(v: unknown): v is Record<string, unknown> { return typeof v === "object" && v !== null && !Array.isArray(v); }
function text(v: unknown): string { return v == null ? "" : String(v).trim(); }

function normalizePayload(payload: Record<string, unknown> | null): Bm027Form {
  if (!payload) return EMPTY;
  const saved = ((payload.formInputs as Record<string, unknown>) ?? {});
  const overrides = ((payload.payloadOverrides as Record<string, unknown>) ?? {});
  const merged = { ...saved, ...overrides };
  const sec = (k: string): Record<string, unknown> => { const v = merged[k]; return isRecord(v) ? v : {}; };

  const agency = sec("agency");
  const document = sec("document");
  const recipients = sec("recipients");
  const content = sec("content");
  const od = sec("originalDecision");
  const cancel = sec("cancellation");
  const sig = sec("signature");

  return {
    agency: { name: text(agency.name), parentName: text(agency.parentName), issuePlace: text(agency.issuePlace) },
    document: { documentCode: text(document.documentCode), issueDate: text(document.issueDate) },
    recipients: {
      recipientTo: text(recipients.recipientTo),
      recipientLine: text(recipients.recipientLine),
      archiveLine: text(recipients.archiveLine) || EMPTY.recipients.archiveLine,
    },
    content: { legalBasisLine: text(content.legalBasisLine) },
    originalDecision: {
      decisionCode: text(od.decisionCode),
      decisionDate: text(od.decisionDate),
      issuingAgency: text(od.issuingAgency),
      offenseName: text(od.offenseName),
      articleNumber: text(od.articleNumber),
      articleClause: text(od.articleClause),
    },
    cancellation: {
      reason: text(cancel.reason),
      decisionCode: text(cancel.decisionCode),
      decisionDate: text(cancel.decisionDate),
    },
    signature: {
      signMode: text(sig.signMode) || EMPTY.signature.signMode,
      positionTitle: text(sig.positionTitle) || EMPTY.signature.positionTitle,
      signerName: text(sig.signerName),
    },
  };
}

function Field({
  label, value, onChange, type = "text", multiline, className = "",
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: "text" | "date" | "number"; multiline?: boolean; className?: string;
}) {
  const cls =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-700">{label}</span>
      {multiline
        ? <textarea className={`${cls} min-h-[88px] resize-none`} value={value} onChange={(e) => onChange(e.target.value)} />
        : <input className={cls} type={type} value={value} onChange={(e) => onChange(e.target.value)} />}
    </label>
  );
}

export function Bm027FormInputsPanel({
  documentId, onSaved,
}: {
  documentId: string | number; onSaved?: () => void;
}) {
  const [form, setForm] = useState<Bm027Form>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const casePayload = useCasePayload();

  function patch(section: "agency" | "document" | "recipients" | "content" | "originalDecision" | "cancellation" | "signature", field: string, value: string) {
    setIsDirty(true);
    setForm((current) => ({
      ...current,
      [section]: { ...current[section], [field]: value },
    }));
  }

  async function load() {
    setIsLoading(true); setError(null);
    try {
      const res = await fetch(
        absoluteApiUrl(`/documents/generated/${documentId}/render-payload`),
        { method: "GET", credentials: "include", headers: { Accept: "application/json" }, cache: "no-store" },
      );
      if (res.ok) {
        setForm(normalizePayload((await res.json()) as Record<string, unknown>));
      }
    } catch { /* keep defaults */ } finally { setIsLoading(false); }
  }

  useEffect(() => { void load(); }, [documentId]);

  async function handleSave() {
    setIsSaving(true); setError(null); setSuccess(null);
    try {
      const body = {
        ...form,
        formInputs: form,
        payloadOverrides: form,
        renderPayloadOverrides: form,
      };
      const res = await fetch(
        absoluteApiUrl(`/documents/generated/${documentId}/form-inputs`),
        { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
      );
      if (!res.ok) {
        throw new Error(extractApiError(await res.text().catch(() => ""), `Lỗi HTTP ${res.status}`));
      }
      setIsDirty(false);
      setSuccess("Đã lưu biểu mẫu BM-027.");
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi khi lưu.");
    } finally { setIsSaving(false); }
  }

  function handleApplyFromCase() {
    if (!casePayload) { setError("Chưa có dữ liệu vụ án để điền tự động."); return; }
    const result = applyCasePayloadToGenericForm({
      form: form as unknown as GenericCaseFormInputs,
      casePayload,
    });
    setIsDirty(true);
    setForm(result.form as unknown as Bm027Form);
    setSuccess(`Đã lấy ${result.appliedFields.length} trường từ vụ án.`);
  }

  return (
    <div className="space-y-5">
      <BmFormMetaBar
        title="Thông báo về việc huỷ bỏ QĐ khởi tố vụ án hình sự"
        subtitle="Mẫu số 27/HS · Thông tư 03/2026-VKSTC · G01 TIEP_NHAN"
        templateCode="BM-027"
        isDirty={isDirty}
        isLoading={isLoading}
        errorMessage={error}
        savedAt={null}
        meta={
          <div className="flex gap-3 text-xs text-slate-500">
            <span>Stage: <span className="font-mono">TIEP_NHAN</span></span>
            <span>Group: <span className="font-mono">G01</span></span>
          </div>
        }
      />

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{success}</div>
      ) : null}

      {/* 1. Agency header — mirrors P0001-P0002 and annotation notes */}
      <BmFormSection title="1. Cơ quan ban hành">
        <Field
          label="Tên Viện kiểm sát"
          value={form.agency.name}
          onChange={(v) => patch("agency", "name", v)}
          className="md:col-span-2"
        />
        <Field
          label="Cơ quan cấp trên"
          value={form.agency.parentName}
          onChange={(v) => patch("agency", "parentName", v)}
        />
        <Field
          label="Địa danh"
          value={form.agency.issuePlace}
          onChange={(v) => patch("agency", "issuePlace", v)}
        />
      </BmFormSection>

      {/* 2. Document info — mirrors P0003-P0011 */}
      <BmFormSection title="2. Thông tin văn bản">
        <Field
          label="Số thông báo"
          value={form.document.documentCode}
          onChange={(v) => patch("document", "documentCode", v)}
        />
        <Field
          label="Ngày ban hành"
          value={form.document.issueDate}
          onChange={(v) => patch("document", "issueDate", v)}
          type="date"
        />
      </BmFormSection>

      {/* 3. Kinh gui — mirrors P0014 */}
      <BmFormSection title="3. Kính gửi">
        <Field
          label="Kính gửi (người/nơi nhận thông báo)"
          value={form.recipients.recipientTo}
          onChange={(v) => patch("recipients", "recipientTo", v)}
          className="md:col-span-2"
        />
      </BmFormSection>

      {/* 4. Căn cứ pháp lý — mirrors P0015 */}
      <BmFormSection title="4. Căn cứ pháp lý">
        <Field
          label="Căn cứ Điều luật (VD: Căn cứ Điều 41 và Điều 158 của Bộ luật Tố tụng hình sự)"
          value={form.content.legalBasisLine}
          onChange={(v) => patch("content", "legalBasisLine", v)}
          multiline
          className="md:col-span-2"
        />
      </BmFormSection>

      {/* 5. Quyết định khởi tố bị huỷ — mirrors P0016-P0023 */}
      <BmFormSection title="5. Quyết định khởi tố bị huỷ (P0016-P0023)">
        <Field
          label="Số QĐ khởi tố"
          value={form.originalDecision.decisionCode}
          onChange={(v) => patch("originalDecision", "decisionCode", v)}
        />
        <Field
          label="Ngày QĐ khởi tố"
          value={form.originalDecision.decisionDate}
          onChange={(v) => patch("originalDecision", "decisionDate", v)}
          type="date"
        />
        <Field
          label="Cơ quan đã ra QĐ khởi tố"
          value={form.originalDecision.issuingAgency}
          onChange={(v) => patch("originalDecision", "issuingAgency", v)}
          className="md:col-span-2"
        />
        <Field
          label="Về tội"
          value={form.originalDecision.offenseName}
          onChange={(v) => patch("originalDecision", "offenseName", v)}
          className="md:col-span-2"
        />
        <Field
          label="Khoản"
          value={form.originalDecision.articleNumber}
          onChange={(v) => patch("originalDecision", "articleNumber", v)}
        />
        <Field
          label="Điều (BLHS)"
          value={form.originalDecision.articleClause}
          onChange={(v) => patch("originalDecision", "articleClause", v)}
        />
      </BmFormSection>

      {/* 6. Lý do hủy — mirrors P0024-P0025 */}
      <BmFormSection title="6. Lý do huỷ bỏ (P0024-P0025)">
        <Field
          label="Căn cứ không có (Điều 157 BLTTHS)"
          value={form.cancellation.reason}
          onChange={(v) => patch("cancellation", "reason", v)}
          multiline
          className="md:col-span-2"
        />
      </BmFormSection>

      {/* 7. Quyết định hủy này — mirrors P0026-P0031 */}
      <BmFormSection title="7. QĐ hủy này (P0026-P0031)">
        <Field
          label="Số QĐ hủy (do VKS ban hành)"
          value={form.cancellation.decisionCode}
          onChange={(v) => patch("cancellation", "decisionCode", v)}
        />
        <Field
          label="Ngày QĐ hủy"
          value={form.cancellation.decisionDate}
          onChange={(v) => patch("cancellation", "decisionDate", v)}
          type="date"
        />
      </BmFormSection>

      {/* 8. Nơi nhận + lưu HS */}
      <BmFormSection title="8. Nơi nhận">
        <Field
          label="Danh sách nơi nhận"
          value={form.recipients.recipientLine}
          onChange={(v) => patch("recipients", "recipientLine", v)}
          multiline
          className="md:col-span-2"
        />
        <Field
          label="Lưu hồ sơ"
          value={form.recipients.archiveLine}
          onChange={(v) => patch("recipients", "archiveLine", v)}
        />
      </BmFormSection>

      {/* 9. Chữ ký */}
      <BmFormSection title="9. Chữ ký">
        <Field
          label="Chế độ ký"
          value={form.signature.signMode}
          onChange={(v) => patch("signature", "signMode", v)}
        />
        <Field
          label="Chức vụ"
          value={form.signature.positionTitle}
          onChange={(v) => patch("signature", "positionTitle", v)}
        />
        <Field
          label="Người ký"
          value={form.signature.signerName}
          onChange={(v) => patch("signature", "signerName", v)}
          className="md:col-span-2"
        />
      </BmFormSection>

      {/* Actions */}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleApplyFromCase}
            disabled={!casePayload}
            className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Lấy từ vụ án
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Tải lại
          </button>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSaving ? "Đang lưu..." : "Lưu BM-027"}
        </button>
      </div>
    </div>
  );
}
