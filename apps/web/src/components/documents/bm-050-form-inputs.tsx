"use client";

/**
 * BM-050 — QĐ không phê chuẩn QĐ về việc đặt tiền để bảo đảm
 * Stage: BP_NGAN_CHAN (G02), Group: 02
 *
 * Mẫu số 50/HS · Thông tư 03/2026/TT-VKSTC
 *
 * DOCX source: 50-QĐ không phê chuẩn QĐ về việc đặt tiền để bảo đảm.doc
 * DOCX verified field map (June 2026):
 * Giống BM-049 nhưng:
 * - P0011: "KHÔNG PHÊ CHUẨN" thay vì "PHÊ CHUẨN"
 * - P0047: "Nhận thấy không có đủ căn cứ" thay vì "Nhận thấy có đủ căn cứ"
 * - P0049: "Điều 1. Không phê chuẩn..." (không có "đối với bị can" ở cuối)
 * - P0057: 2 dòng nơi nhận (không có "người thân")
 */
import { useEffect, useState } from "react";
import { extractApiError } from "@/lib/api-client";
import { getDocumentRenderPayload, saveDocumentFormInputs } from "@/lib/document-form-api";
import { BmFormSection, BmFormMetaBar } from "@/components/documents/bm-form";
import { useCasePayload } from "@/lib/case-payload-context";
import { applyCasePayloadToGenericForm, type GenericCaseFormInputs } from "@/lib/bm-auto-populate/generic-case-defaults";

type Bm050Form = {
  agency: { name: string; parentName: string; issuePlace: string };
  document: { documentCode: string; issueDate: string };
  legalBasis: { bltthsArticles: string; luatphapArticle: string };
  caseDecision: {
    decisionCode: string; decisionDate: string; decisionChangeCode: string; decisionChangeDate: string;
    issuingAgency: string; offenseName: string; articleNumber: string; articleClause: string;
  };
  accusedDecision: {
    decisionCode: string; decisionDate: string; decisionChangeCode: string; decisionChangeDate: string;
    issuingAgency: string; offenseName: string; articleNumber: string; articleClause: string; personName: string;
  };
  guaranteeDecision: { decisionCode: string; decisionDate: string; issuingAgency: string };
  content: { requirementLine: string };
  recipients: { accusedLine: string; archiveLine: string };
  signature: { signMode: string; positionTitle: string; signerName: string };
};

const EMPTY: Bm050Form = {
  agency: { name: "", parentName: "", issuePlace: "" },
  document: { documentCode: "", issueDate: "" },
  legalBasis: { bltthsArticles: "Căn cứ các điều 41, 121 và 165 của Bộ luật Tố tụng hình sự;", luatphapArticle: "" },
  caseDecision: { decisionCode: "", decisionDate: "", decisionChangeCode: "", decisionChangeDate: "", issuingAgency: "", offenseName: "", articleNumber: "", articleClause: "" },
  accusedDecision: { decisionCode: "", decisionDate: "", decisionChangeCode: "", decisionChangeDate: "", issuingAgency: "", offenseName: "", articleNumber: "", articleClause: "", personName: "" },
  guaranteeDecision: { decisionCode: "", decisionDate: "", issuingAgency: "" },
  content: { requirementLine: "thi hành Quyết định này theo quy định của Bộ luật Tố tụng hình sự." },
  recipients: { accusedLine: "", archiveLine: "Lưu: HSVA, HSKS, VP." },
  signature: { signMode: "KT. VIỆN TRƯỞNG", positionTitle: "PHÓ VIỆN TRƯỞNG", signerName: "" },
};

function isRecord(v: unknown): v is Record<string, unknown> { return typeof v === "object" && v !== null && !Array.isArray(v); }
function text(v: unknown): string { return v == null ? "" : String(v).trim(); }

function normalizePayload(payload: Record<string, unknown> | null): Bm050Form {
  if (!payload) return EMPTY;
  const saved = ((payload.formInputs as Record<string, unknown>) ?? {});
  const overrides = ((payload.payloadOverrides as Record<string, unknown>) ?? {});
  const merged = { ...saved, ...overrides };
  const sec = (k: string): Record<string, unknown> => { const v = merged[k]; return isRecord(v) ? v : {}; };
  const cd = sec("caseDecision");
  const ad = sec("accusedDecision");
  const gd = sec("guaranteeDecision");
  const recipients = sec("recipients");
  return {
    agency: { name: text(sec("agency").name), parentName: text(sec("agency").parentName), issuePlace: text(sec("agency").issuePlace) },
    document: { documentCode: text(sec("document").documentCode), issueDate: text(sec("document").issueDate) },
    legalBasis: { bltthsArticles: text(sec("legalBasis").bltthsArticles) || EMPTY.legalBasis.bltthsArticles, luatphapArticle: text(sec("legalBasis").luatphapArticle) },
    caseDecision: {
      decisionCode: text(cd.decisionCode), decisionDate: text(cd.decisionDate),
      decisionChangeCode: text(cd.decisionChangeCode), decisionChangeDate: text(cd.decisionChangeDate),
      issuingAgency: text(cd.issuingAgency), offenseName: text(cd.offenseName),
      articleNumber: text(cd.articleNumber), articleClause: text(cd.articleClause),
    },
    accusedDecision: {
      decisionCode: text(ad.decisionCode), decisionDate: text(ad.decisionDate),
      decisionChangeCode: text(ad.decisionChangeCode), decisionChangeDate: text(ad.decisionChangeDate),
      issuingAgency: text(ad.issuingAgency), offenseName: text(ad.offenseName),
      articleNumber: text(ad.articleNumber), articleClause: text(ad.articleClause), personName: text(ad.personName),
    },
    guaranteeDecision: { decisionCode: text(gd.decisionCode), decisionDate: text(gd.decisionDate), issuingAgency: text(gd.issuingAgency) },
    content: { requirementLine: text(sec("content").requirementLine) || EMPTY.content.requirementLine },
    recipients: { accusedLine: text(recipients.accusedLine), archiveLine: text(recipients.archiveLine) || EMPTY.recipients.archiveLine },
    signature: {
      signMode: text(sec("signature").signMode) || EMPTY.signature.signMode,
      positionTitle: text(sec("signature").positionTitle) || EMPTY.signature.positionTitle,
      signerName: text(sec("signature").signerName),
    },
  };
}

function Field({ label, value, onChange, type = "text", multiline, className = "" }: { label: string; value: string; onChange: (v: string) => void; type?: "text" | "date"; multiline?: boolean; className?: string }) {
  const cls = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-700">{label}</span>
      {multiline
        ? <textarea className={`${cls} min-h-[80px] resize-none`} value={value} onChange={(e) => onChange(e.target.value)} />
        : <input className={cls} type={type} value={value} onChange={(e) => onChange(e.target.value)} />}
    </label>
  );
}

export function Bm050FormInputsPanel({ documentId, onSaved }: { documentId: string | number; onSaved?: () => void }) {
  const [form, setForm] = useState<Bm050Form>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const casePayload = useCasePayload();

  function patch(section: keyof Bm050Form, field: string, value: string) {
    setIsDirty(true);
    setForm((current) => ({ ...current, [section]: { ...current[section], [field]: value } }));
  }

  async function load() {
    setIsLoading(true); setError(null);
    try {
      const payload = await getDocumentRenderPayload<Record<string, unknown>>(documentId);
      setForm(normalizePayload(payload));
    } catch { /* keep defaults */ } finally { setIsLoading(false); }
  }

  useEffect(() => { void load(); }, [documentId]);

  async function handleSave() {
    setIsSaving(true); setError(null); setSuccess(null);
    try {
      const body = { ...form, formInputs: form, payloadOverrides: form, renderPayloadOverrides: form };
      await saveDocumentFormInputs(documentId, body);
      setIsDirty(false); setSuccess("Đã lưu biểu mẫu BM-050."); onSaved?.();
    } catch (e) { setError(e instanceof Error ? e.message : "Lỗi khi lưu."); } finally { setIsSaving(false); }
  }

  function handleApplyFromCase() {
    if (!casePayload) { setError("Chưa có dữ liệu vụ án."); return; }
    const result = applyCasePayloadToGenericForm({ form: form as unknown as GenericCaseFormInputs, casePayload });
    setIsDirty(true); setForm(result.form as unknown as Bm050Form);
    setSuccess(`Đã lấy ${result.appliedFields.length} trường từ vụ án.`);
  }

  return (
    <div className="space-y-5">
      <BmFormMetaBar title="QĐ không phê chuẩn QĐ về việc đặt tiền để bảo đảm" subtitle="Mẫu số 50/HS · Thông tư 03/2026-VKSTC · G02 BP_NGAN_CHAN" templateCode="BM-050" isDirty={isDirty} isLoading={isLoading} errorMessage={error} savedAt={null}
        meta={<div className="flex gap-3 text-xs text-slate-500"><span>Stage: <span className="font-mono">BP_NGAN_CHAN</span></span><span>Group: <span className="font-mono">G02</span></span></div>}
      />
      {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{success}</div> : null}

      {/* 1. Agency */}
      <BmFormSection title="1. Cơ quan ban hành (P0001-P0004)">
        <Field label="Tên Viện kiểm sát" value={form.agency.name} onChange={(v) => patch("agency", "name", v)} className="md:col-span-2" />
        <Field label="Cơ quan cấp trên" value={form.agency.parentName} onChange={(v) => patch("agency", "parentName", v)} />
        <Field label="Địa danh" value={form.agency.issuePlace} onChange={(v) => patch("agency", "issuePlace", v)} />
      </BmFormSection>

      {/* 2. Document */}
      <BmFormSection title="2. Thông tin văn bản (P0003-P0009)">
        <Field label="Số quyết định" value={form.document.documentCode} onChange={(v) => patch("document", "documentCode", v)} />
        <Field label="Ngày ban hành" value={form.document.issueDate} onChange={(v) => patch("document", "issueDate", v)} type="date" />
      </BmFormSection>

      {/* 3. Căn cứ pháp lý */}
      <BmFormSection title="3. Căn cứ pháp lý (P0013-P0014)">
        <Field label="Căn cứ BLTTHS (Điều 41, 121, 165)" value={form.legalBasis.bltthsArticles} onChange={(v) => patch("legalBasis", "bltthsArticles", v)} multiline className="md:col-span-2" />
        <Field label="Căn cứ Luật TPNCN Điều 135 (optional)" value={form.legalBasis.luatphapArticle} onChange={(v) => patch("legalBasis", "luatphapArticle", v)} multiline className="md:col-span-2" />
      </BmFormSection>

      {/* 4. Căn cứ QĐ khởi tố vụ án */}
      <BmFormSection title="4. Căn cứ QĐ khởi tố vụ án (P0015-P0027)">
        <Field label="Số QĐ khởi tố vụ án" value={form.caseDecision.decisionCode} onChange={(v) => patch("caseDecision", "decisionCode", v)} />
        <Field label="Ngày QĐ khởi tố vụ án" value={form.caseDecision.decisionDate} onChange={(v) => patch("caseDecision", "decisionDate", v)} type="date" />
        <Field label="QĐ thay đổi số (nếu có)" value={form.caseDecision.decisionChangeCode} onChange={(v) => patch("caseDecision", "decisionChangeCode", v)} />
        <Field label="Ngày QĐ thay đổi (nếu có)" value={form.caseDecision.decisionChangeDate} onChange={(v) => patch("caseDecision", "decisionChangeDate", v)} type="date" />
        <Field label="Cơ quan ra QĐ khởi tố vụ án" value={form.caseDecision.issuingAgency} onChange={(v) => patch("caseDecision", "issuingAgency", v)} className="md:col-span-2" />
        <Field label="Tội danh" value={form.caseDecision.offenseName} onChange={(v) => patch("caseDecision", "offenseName", v)} />
        <Field label="Khoản" value={form.caseDecision.articleNumber} onChange={(v) => patch("caseDecision", "articleNumber", v)} />
        <Field label="Điều (BLHS)" value={form.caseDecision.articleClause} onChange={(v) => patch("caseDecision", "articleClause", v)} />
      </BmFormSection>

      {/* 5. Căn cứ QĐ khởi tố bị can */}
      <BmFormSection title="5. Căn cứ QĐ khởi tố bị can (P0028-P0041)">
        <Field label="Số QĐ khởi tố bị can" value={form.accusedDecision.decisionCode} onChange={(v) => patch("accusedDecision", "decisionCode", v)} />
        <Field label="Ngày QĐ khởi tố bị can" value={form.accusedDecision.decisionDate} onChange={(v) => patch("accusedDecision", "decisionDate", v)} type="date" />
        <Field label="QĐ thay đổi số (nếu có)" value={form.accusedDecision.decisionChangeCode} onChange={(v) => patch("accusedDecision", "decisionChangeCode", v)} />
        <Field label="Ngày QĐ thay đổi (nếu có)" value={form.accusedDecision.decisionChangeDate} onChange={(v) => patch("accusedDecision", "decisionChangeDate", v)} type="date" />
        <Field label="Cơ quan ra QĐ khởi tố bị can" value={form.accusedDecision.issuingAgency} onChange={(v) => patch("accusedDecision", "issuingAgency", v)} className="md:col-span-2" />
        <Field label="Họ tên bị can" value={form.accusedDecision.personName} onChange={(v) => patch("accusedDecision", "personName", v)} />
        <Field label="Tội danh" value={form.accusedDecision.offenseName} onChange={(v) => patch("accusedDecision", "offenseName", v)} />
        <Field label="Khoản" value={form.accusedDecision.articleNumber} onChange={(v) => patch("accusedDecision", "articleNumber", v)} />
        <Field label="Điều (BLHS)" value={form.accusedDecision.articleClause} onChange={(v) => patch("accusedDecision", "articleClause", v)} />
      </BmFormSection>

      {/* 6. QĐ đặt tiền bảo đảm */}
      <BmFormSection title="6. QĐ đặt tiền bảo đảm (P0042-P0047)">
        <Field label="Số QĐ đặt tiền" value={form.guaranteeDecision.decisionCode} onChange={(v) => patch("guaranteeDecision", "decisionCode", v)} />
        <Field label="Ngày QĐ đặt tiền" value={form.guaranteeDecision.decisionDate} onChange={(v) => patch("guaranteeDecision", "decisionDate", v)} type="date" />
        <Field label="Cơ quan ra QĐ đặt tiền" value={form.guaranteeDecision.issuingAgency} onChange={(v) => patch("guaranteeDecision", "issuingAgency", v)} className="md:col-span-2" />
      </BmFormSection>

      {/* 7. Điều 2 */}
      <BmFormSection title="7. Điều 2: Yêu cầu (P0055-P0056)">
        <Field label="Yêu cầu thi hành" value={form.content.requirementLine} onChange={(v) => patch("content", "requirementLine", v)} multiline className="md:col-span-2" />
      </BmFormSection>

      {/* 8. Nơi nhận */}
      <BmFormSection title="8. Nơi nhận (P0057-P0060)">
        <Field label="1. Bị can / người đại diện" value={form.recipients.accusedLine} onChange={(v) => patch("recipients", "accusedLine", v)} className="md:col-span-2" />
        <Field label="2. Lưu hồ sơ" value={form.recipients.archiveLine} onChange={(v) => patch("recipients", "archiveLine", v)} />
      </BmFormSection>

      {/* 9. Chữ ký */}
      <BmFormSection title="9. Chữ ký (P0061-P0062)">
        <Field label="Chế độ ký" value={form.signature.signMode} onChange={(v) => patch("signature", "signMode", v)} />
        <Field label="Chức vụ" value={form.signature.positionTitle} onChange={(v) => patch("signature", "positionTitle", v)} />
        <Field label="Người ký" value={form.signature.signerName} onChange={(v) => patch("signature", "signerName", v)} className="md:col-span-2" />
      </BmFormSection>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleApplyFromCase} disabled={!casePayload} className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-40">Lấy từ vụ án</button>
          <button type="button" onClick={() => void load()} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Tải lại</button>
        </div>
        <button type="button" onClick={handleSave} disabled={isSaving} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-slate-400">{isSaving ? "Đang lưu..." : "Lưu BM-050"}</button>
      </div>
    </div>
  );
}
