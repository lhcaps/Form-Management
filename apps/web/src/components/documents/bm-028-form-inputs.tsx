"use client";

/**
 * BM-028 — QĐ huỷ bỏ QĐ thay đổi QĐ khởi tố vụ án hình sự
 * Stage: TIEP_NHAN (G01), Group: 01
 *
 * Mẫu số 28/HS · Ban hành theo Thông tư số 03/2026/TT-VKSTC
 *
 * DOCX source: 28-QĐ huỷ bỏ QĐ thay đổi QĐ khởi tố vụ án hình sự.doc
 */
import { useEffect, useState } from "react";
import { absoluteApiUrl, extractApiError } from "@/lib/api-client";
import {
  BmFormSection,
  BmFormMetaBar,
} from "@/components/documents/bm-form";
import { useCasePayload } from "@/lib/case-payload-context";
import { applyCasePayloadToGenericForm, type GenericCaseFormInputs } from "@/lib/bm-auto-populate/generic-case-defaults";

type Bm028Form = {
  agency: {
    name: string;
    parentName: string;
    issuePlace: string;
  };
  document: {
    documentCode: string;
    issueDate: string;
  };
  changeDecision: {
    decisionCode: string;
    decisionDate: string;
    issuingAgency: string;
    fromOffense: string;
    toOffense: string;
    articleNumber: string;
    articleClause: string;
  };
  caseInfo: {
    caseCode: string;
    caseTitle: string;
  };
  content: {
    legalBasisLine: string;
    summaryLine: string;
    yeuCauLine: string;
  };
  recipients: {
    recipientLine: string;
    archiveLine: string;
  };
  signature: {
    signMode: string;
    positionTitle: string;
    signerName: string;
  };
};

const EMPTY_FORM: Bm028Form = {
  agency: { name: "", parentName: "", issuePlace: "" },
  document: { documentCode: "", issueDate: "" },
  changeDecision: {
    decisionCode: "",
    decisionDate: "",
    issuingAgency: "",
    fromOffense: "",
    toOffense: "",
    articleNumber: "",
    articleClause: "",
  },
  caseInfo: { caseCode: "", caseTitle: "" },
  content: { legalBasisLine: "", summaryLine: "", yeuCauLine: "" },
  recipients: { recipientLine: "", archiveLine: "Lưu: HSVA, HSKS, VP." },
  signature: {
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: "",
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizePayload(payload: Record<string, unknown> | null): Bm028Form {
  if (!payload) return EMPTY_FORM;
  const saved = ((payload.formInputs as Record<string, unknown>) ?? {});
  const overrides = ((payload.payloadOverrides as Record<string, unknown>) ?? {});
  const merged = { ...saved, ...overrides };
  const section = (key: string): Record<string, unknown> => {
    const v = merged[key];
    return isRecord(v) ? v : {};
  };

  const changeDecision = section("changeDecision");
  const agency = section("agency");
  const document = section("document");
  const caseInfo = section("caseInfo");
  const content = section("content");
  const recipients = section("recipients");
  const signature = section("signature");

  return {
    agency: { name: text(agency.name), parentName: text(agency.parentName), issuePlace: text(agency.issuePlace) },
    document: { documentCode: text(document.documentCode), issueDate: text(document.issueDate) },
    changeDecision: {
      decisionCode: text(changeDecision.decisionCode),
      decisionDate: text(changeDecision.decisionDate),
      issuingAgency: text(changeDecision.issuingAgency),
      fromOffense: text(changeDecision.fromOffense),
      toOffense: text(changeDecision.toOffense),
      articleNumber: text(changeDecision.articleNumber),
      articleClause: text(changeDecision.articleClause),
    },
    caseInfo: { caseCode: text(caseInfo.caseCode), caseTitle: text(caseInfo.caseTitle) },
    content: { legalBasisLine: text(content.legalBasisLine), summaryLine: text(content.summaryLine), yeuCauLine: text(content.yeuCauLine) },
    recipients: {
      recipientLine: text(recipients.recipientLine),
      archiveLine: text(recipients.archiveLine) || EMPTY_FORM.recipients.archiveLine,
    },
    signature: {
      signMode: text(signature.signMode) || EMPTY_FORM.signature.signMode,
      positionTitle: text(signature.positionTitle) || EMPTY_FORM.signature.positionTitle,
      signerName: text(signature.signerName),
    },
  };
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  multiline,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "date";
  multiline?: boolean;
  className?: string;
}) {
  const cls =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-700">{label}</span>
      {multiline ? (
        <textarea className={`${cls} min-h-[88px] resize-none`} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={cls} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

export function Bm028FormInputsPanel({
  documentId,
  onSaved,
}: {
  documentId: string | number;
  onSaved?: () => void;
}) {
  const [form, setForm] = useState<Bm028Form>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const casePayload = useCasePayload();

  function patch(section: keyof Bm028Form, field: string, value: string) {
    setIsDirty(true);
    setForm((current) => ({
      ...current,
      [section]: { ...current[section], [field]: value },
    }));
  }

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        absoluteApiUrl(`/documents/generated/${documentId}/render-payload`),
        { method: "GET", credentials: "include", headers: { Accept: "application/json" }, cache: "no-store" },
      );
      if (res.ok) {
        const data = normalizePayload((await res.json()) as Record<string, unknown>);
        if (!isSaving) {
          setForm(data);
        }
      }
    } catch {
      // keep defaults on load failure
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [documentId]);

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const body = {
        ...form,
        formInputs: form,
        payloadOverrides: form,
        renderPayloadOverrides: form,
      };
      const res = await fetch(
        absoluteApiUrl(`/documents/generated/${documentId}/form-inputs`),
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const err = await res.text().catch(() => "");
        throw new Error(extractApiError(err, `Không lưu được [HTTP ${res.status}]`));
      }
      setIsDirty(false);
      setSuccess("Đã lưu biểu mẫu BM-028.");
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi khi lưu.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleApplyFromCase() {
    if (!casePayload) {
      setError("Chưa có dữ liệu vụ án để điền tự động.");
      return;
    }
    const result = applyCasePayloadToGenericForm({
      form: form as unknown as GenericCaseFormInputs,
      casePayload,
    });
    setIsDirty(true);
    setForm(result.form as unknown as Bm028Form);
    setSuccess(`Đã lấy ${result.appliedFields.length} trường từ vụ án.`);
  }

  return (
    <div className="space-y-5">
      <BmFormMetaBar
        title="QĐ huỷ bỏ QĐ thay đổi QĐ khởi tố vụ án hình sự"
        subtitle="Mẫu số 28/HS · Thông tư 03/2026-VKSTC · G01 TIEP_NHAN"
        templateCode="BM-028"
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
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {success}
        </div>
      ) : null}

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

      <BmFormSection title="2. Thông tin văn bản">
        <Field
          label="Số quyết định"
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

      <BmFormSection title="4. Căn cứ pháp lý (P0014)">
        <Field
          label="Căn cứ Điều luật (VD: Căn cứ các điều 41, 156, 161 và 165 của BLTTHS)"
          value={form.content.legalBasisLine}
          onChange={(v) => patch("content", "legalBasisLine", v)}
          multiline
          className="md:col-span-2"
        />
      </BmFormSection>

      <BmFormSection title="5. Nội dung quyết định (P0015-P0021)">
        <Field
          label="Số QĐ thay đổi (P0015)"
          value={form.changeDecision.decisionCode}
          onChange={(v) => patch("changeDecision", "decisionCode", v)}
        />
        <Field
          label="Ngày QĐ thay đổi (P0016-18)"
          value={form.changeDecision.decisionDate}
          onChange={(v) => patch("changeDecision", "decisionDate", v)}
          type="date"
        />
        <Field
          label="Cơ quan ra QĐ thay đổi (P0019)"
          value={form.changeDecision.issuingAgency}
          onChange={(v) => patch("changeDecision", "issuingAgency", v)}
          className="md:col-span-2"
        />
        <Field
          label="Từ tội (P0019)"
          value={form.changeDecision.fromOffense}
          onChange={(v) => patch("changeDecision", "fromOffense", v)}
        />
        <Field
          label="Sang tội (P0019)"
          value={form.changeDecision.toOffense}
          onChange={(v) => patch("changeDecision", "toOffense", v)}
        />
        <Field
          label="Khoản (P0020)"
          value={form.changeDecision.articleNumber}
          onChange={(v) => patch("changeDecision", "articleNumber", v)}
        />
        <Field
          label="Điều BLHS (P0020)"
          value={form.changeDecision.articleClause}
          onChange={(v) => patch("changeDecision", "articleClause", v)}
        />
        <Field
          label="Lý do không có căn cứ và trái pháp luật (P0021)"
          value={form.content.summaryLine}
          onChange={(v) => patch("content", "summaryLine", v)}
          multiline
          className="md:col-span-2"
        />
      </BmFormSection>

      <BmFormSection title="6. Điều 1 + Điều 2 (P0023-P0029)">
        <Field
          label="Điều 1: Số QĐ thay đổi bị hủy (P0023)"
          value={form.caseInfo.caseCode}
          onChange={(v) => patch("caseInfo", "caseCode", v)}
        />
        <Field
          label="Ngày QĐ thay đổi bị hủy (P0024-26)"
          value={form.caseInfo.caseTitle}
          onChange={(v) => patch("caseInfo", "caseTitle", v)}
          type="date"
        />
        <Field
          label="Cơ quan ban hành QĐ thay đổi (P0027)"
          value={form.recipients.recipientLine}
          onChange={(v) => patch("recipients", "recipientLine", v)}
          className="md:col-span-2"
        />
        <Field
          label="Điều 2: Yêu cầu tiến hành điều tra (P0028-29)"
          value={form.content.yeuCauLine}
          onChange={(v) => patch("content", "yeuCauLine", v)}
          multiline
          className="md:col-span-2"
        />
      </BmFormSection>

      <BmFormSection title="6. Nơi nhận">
        <Field
          label="Nơi nhận"
          value={form.recipients.recipientLine}
          onChange={(v) => patch("recipients", "recipientLine", v)}
        />
        <Field
          label="Lưu hồ sơ"
          value={form.recipients.archiveLine}
          onChange={(v) => patch("recipients", "archiveLine", v)}
        />
      </BmFormSection>

      <BmFormSection title="7. Chữ ký">
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
          {isSaving ? "Đang lưu..." : "Lưu BM-028"}
        </button>
      </div>
    </div>
  );
}
