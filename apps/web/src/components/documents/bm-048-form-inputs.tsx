"use client";

/**
 * BM-048 — QĐ huỷ bỏ biện pháp bảo lĩnh
 * Stage: BP_NGAN_CHAN (G02), Group: 02
 *
 * Mẫu số 48/HS · Thông tư 03/2026/TT-VKSTC
 *
 * DOCX source: 48-QĐ huỷ bỏ biện pháp bảo lĩnh.doc
 * DOCX verified field map (June 2026):
 *
 * P0001  VIỆN KIỂM SÁT
 * P0002  [tên VKS]
 * P0003  Số: [số QĐ]
 * P0013-15  Căn cứ điều 41,121,125,165 BLTTHS + Điều 135 Luật TPNCN
 * P0016-20  Căn cứ QĐ bảo lĩnh số/ngày/tháng/năm/của
 * P0022  Xét thấy
 * P0024  Điều 1. Hủy bỏ biện pháp bảo lĩnh đối với bị can
 * P0025  Họ tên + Giới tính (cùng dòng)
 * P0026-33  Thông tin bị can (P0028: QT/DT/TG 3 trường cùng dòng)
 * P0035-37  Tội danh (tội, khoản, điều)
 * P0039-40  Điều 2. Yêu cầu + P0040-41: thực hiện QĐ
 * P0042  Nơi nhận
 * P0043  bị can / đại diện
 * P0044  tổ chức/cá nhân nhận bảo lĩnh
 * P0045  Lưu
 * P0047  (Ký, ghi rõ họ tên, đóng dấu)
 * P0052  Chú thích: trường hợp hủy giai đoạn truy tố → Điều 236+241 BLTTHS
 */
import { useEffect, useState } from "react";
import { absoluteApiUrl, extractApiError } from "@/lib/api-client";
import { BmFormSection, BmFormMetaBar } from "@/components/documents/bm-form";
import { useCasePayload } from "@/lib/case-payload-context";
import { applyCasePayloadToGenericForm, type GenericCaseFormInputs } from "@/lib/bm-auto-populate/generic-case-defaults";

type Bm048Form = {
  agency: { name: string; parentName: string; issuePlace: string };
  document: { documentCode: string; issueDate: string };
  legalBasis: { luatphapArticle: string; bltthsArticles: string };
  bailDecision: { decisionCode: string; decisionDate: string; issuingAgency: string };
  person: {
    fullName: string; genderLabel: string; otherName: string;
    dateOfBirth: string; nationality: string; ethnicity: string; religion: string; occupation: string;
    identityNo: string; identityIssuedDate: string; identityIssuedPlace: string;
    permanentAddress: string; temporaryAddress: string; currentAddress: string;
  };
  offense: { offenseName: string; articleNumber: string; articleClause: string };
  content: { reasonLine: string; requirementLine: string };
  recipients: {
    accusedLine: string;
    guarantorLine: string;
    archiveLine: string;
  };
  signature: { signMode: string; positionTitle: string; signerName: string };
};

const EMPTY: Bm048Form = {
  agency: { name: "", parentName: "", issuePlace: "" },
  document: { documentCode: "", issueDate: "" },
  legalBasis: { luatphapArticle: "Điều 135 của Luật Tư pháp người chưa thành niên", bltthsArticles: "Căn cứ các điều 41, 121, 125 và 165 của Bộ luật Tố tụng hình sự;" },
  bailDecision: { decisionCode: "", decisionDate: "", issuingAgency: "" },
  person: {
    fullName: "", genderLabel: "", otherName: "", dateOfBirth: "", nationality: "", ethnicity: "", religion: "", occupation: "",
    identityNo: "", identityIssuedDate: "", identityIssuedPlace: "",
    permanentAddress: "", temporaryAddress: "", currentAddress: "",
  },
  offense: { offenseName: "", articleNumber: "", articleClause: "" },
  content: { reasonLine: "", requirementLine: "thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự." },
  recipients: { accusedLine: "", guarantorLine: "Cơ quan, tổ chức, cá nhân nhận bảo lĩnh cho bị can;", archiveLine: "Lưu: HSVA, HSKS, VP." },
  signature: { signMode: "KT. VIỆN TRƯỞNG", positionTitle: "PHÓ VIỆN TRƯỞNG", signerName: "" },
};

function isRecord(v: unknown): v is Record<string, unknown> { return typeof v === "object" && v !== null && !Array.isArray(v); }
function text(v: unknown): string { return v == null ? "" : String(v).trim(); }

function normalizePayload(payload: Record<string, unknown> | null): Bm048Form {
  if (!payload) return EMPTY;
  const saved = ((payload.formInputs as Record<string, unknown>) ?? {});
  const overrides = ((payload.payloadOverrides as Record<string, unknown>) ?? {});
  const merged = { ...saved, ...overrides };
  const sec = (k: string): Record<string, unknown> => { const v = merged[k]; return isRecord(v) ? v : {}; };
  const person = sec("person");
  const offense = sec("offense");
  const recipients = sec("recipients");
  const content = sec("content");
  const bail = sec("bailDecision");
  const legalBasis = sec("legalBasis");
  return {
    agency: { name: text(sec("agency").name), parentName: text(sec("agency").parentName), issuePlace: text(sec("agency").issuePlace) },
    document: { documentCode: text(sec("document").documentCode), issueDate: text(sec("document").issueDate) },
    legalBasis: {
      bltthsArticles: text(legalBasis.bltthsArticles) || EMPTY.legalBasis.bltthsArticles,
      luatphapArticle: text(legalBasis.luatphapArticle) || EMPTY.legalBasis.luatphapArticle,
    },
    bailDecision: {
      decisionCode: text(bail.decisionCode),
      decisionDate: text(bail.decisionDate),
      issuingAgency: text(bail.issuingAgency),
    },
    person: {
      fullName: text(person.fullName), genderLabel: text(person.genderLabel), otherName: text(person.otherName),
      dateOfBirth: text(person.dateOfBirth), nationality: text(person.nationality), ethnicity: text(person.ethnicity),
      religion: text(person.religion), occupation: text(person.occupation),
      identityNo: text(person.identityNo), identityIssuedDate: text(person.identityIssuedDate), identityIssuedPlace: text(person.identityIssuedPlace),
      permanentAddress: text(person.permanentAddress), temporaryAddress: text(person.temporaryAddress), currentAddress: text(person.currentAddress),
    },
    offense: { offenseName: text(offense.offenseName), articleNumber: text(offense.articleNumber), articleClause: text(offense.articleClause) },
    content: {
      reasonLine: text(content.reasonLine),
      requirementLine: text(content.requirementLine) || EMPTY.content.requirementLine,
    },
    recipients: {
      accusedLine: text(recipients.accusedLine),
      guarantorLine: text(recipients.guarantorLine) || EMPTY.recipients.guarantorLine,
      archiveLine: text(recipients.archiveLine) || EMPTY.recipients.archiveLine,
    },
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

export function Bm048FormInputsPanel({ documentId, onSaved }: { documentId: string | number; onSaved?: () => void }) {
  const [form, setForm] = useState<Bm048Form>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const casePayload = useCasePayload();

  function patch(section: "agency" | "document" | "legalBasis" | "bailDecision" | "person" | "offense" | "content" | "recipients" | "signature", field: string, value: string) {
    setIsDirty(true);
    setForm((current) => ({ ...current, [section]: { ...current[section], [field]: value } }));
  }

  async function load() {
    setIsLoading(true); setError(null);
    try {
      const res = await fetch(absoluteApiUrl(`/documents/generated/${documentId}/render-payload`), { method: "GET", credentials: "include", headers: { Accept: "application/json" }, cache: "no-store" });
      if (res.ok) setForm(normalizePayload((await res.json()) as Record<string, unknown>));
    } catch { /* keep defaults */ } finally { setIsLoading(false); }
  }

  useEffect(() => { void load(); }, [documentId]);

  async function handleSave() {
    setIsSaving(true); setError(null); setSuccess(null);
    try {
      const body = { ...form, formInputs: form, payloadOverrides: form, renderPayloadOverrides: form };
      const res = await fetch(absoluteApiUrl(`/documents/generated/${documentId}/form-inputs`), { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(extractApiError(await res.text().catch(() => ""), `Lỗi HTTP ${res.status}`));
      setIsDirty(false); setSuccess("Đã lưu biểu mẫu BM-048."); onSaved?.();
    } catch (e) { setError(e instanceof Error ? e.message : "Lỗi khi lưu."); } finally { setIsSaving(false); }
  }

  function handleApplyFromCase() {
    if (!casePayload) { setError("Chưa có dữ liệu vụ án."); return; }
    const result = applyCasePayloadToGenericForm({ form: form as unknown as GenericCaseFormInputs, casePayload });
    setIsDirty(true); setForm(result.form as unknown as Bm048Form);
    setSuccess(`Đã lấy ${result.appliedFields.length} trường từ vụ án.`);
  }

  return (
    <div className="space-y-5">
      <BmFormMetaBar title="QĐ huỷ bỏ biện pháp bảo lĩnh" subtitle="Mẫu số 48/HS · Thông tư 03/2026-VKSTC · G02 BP_NGAN_CHAN" templateCode="BM-048" isDirty={isDirty} isLoading={isLoading} errorMessage={error} savedAt={null}
        meta={<div className="flex gap-3 text-xs text-slate-500"><span>Stage: <span className="font-mono">BP_NGAN_CHAN</span></span><span>Group: <span className="font-mono">G02</span></span></div>}
      />
      {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{success}</div> : null}

      {/* 1. Agency — P0001-0004 */}
      <BmFormSection title="1. Cơ quan ban hành (P0001-P0004)">
        <Field label="Tên Viện kiểm sát" value={form.agency.name} onChange={(v) => patch("agency", "name", v)} className="md:col-span-2" />
        <Field label="Cơ quan cấp trên" value={form.agency.parentName} onChange={(v) => patch("agency", "parentName", v)} />
        <Field label="Địa danh" value={form.agency.issuePlace} onChange={(v) => patch("agency", "issuePlace", v)} />
      </BmFormSection>

      {/* 2. Document — P0003 */}
      <BmFormSection title="2. Thông tin văn bản (P0003-P0009)">
        <Field label="Số quyết định" value={form.document.documentCode} onChange={(v) => patch("document", "documentCode", v)} />
        <Field label="Ngày ban hành" value={form.document.issueDate} onChange={(v) => patch("document", "issueDate", v)} type="date" />
      </BmFormSection>

      {/* 3. Căn cứ pháp lý — P0013-15 */}
      <BmFormSection title="3. Căn cứ pháp lý (P0013-P0015)">
        <Field label="Căn cứ BLTTHS (Điều 41, 121, 125, 165)" value={form.legalBasis.bltthsArticles} onChange={(v) => patch("legalBasis", "bltthsArticles", v)} multiline className="md:col-span-2" />
        <Field label="Căn cứ Luật Tư pháp người chưa thành niên (Điều 135)" value={form.legalBasis.luatphapArticle} onChange={(v) => patch("legalBasis", "luatphapArticle", v)} multiline className="md:col-span-2" />
      </BmFormSection>

      {/* 4. Căn cứ QĐ bảo lĩnh bị hủy — P0016-20 */}
      <BmFormSection title="4. Quyết định bảo lĩnh bị hủy (P0016-P0020)">
        <Field label="Căn cứ QĐ bảo lĩnh số" value={form.bailDecision.decisionCode} onChange={(v) => patch("bailDecision", "decisionCode", v)} />
        <Field label="Ngày QĐ bảo lĩnh" value={form.bailDecision.decisionDate} onChange={(v) => patch("bailDecision", "decisionDate", v)} type="date" />
        <Field label="Cơ quan ra QĐ bảo lĩnh" value={form.bailDecision.issuingAgency} onChange={(v) => patch("bailDecision", "issuingAgency", v)} className="md:col-span-2" />
      </BmFormSection>

      {/* 5. Điều 1 — Thông tin bị can — P0024-38 */}
      <BmFormSection title="5. Điều 1: Thông tin bị can (P0025-P0037)">
        <Field label="Họ tên" value={form.person.fullName} onChange={(v) => patch("person", "fullName", v)} />
        <Field label="Giới tính" value={form.person.genderLabel} onChange={(v) => patch("person", "genderLabel", v)} />
        <Field label="Tên gọi khác" value={form.person.otherName} onChange={(v) => patch("person", "otherName", v)} />
        <Field label="Ngày sinh" value={form.person.dateOfBirth} onChange={(v) => patch("person", "dateOfBirth", v)} type="date" />
        <Field label="Quốc tịch" value={form.person.nationality} onChange={(v) => patch("person", "nationality", v)} />
        <Field label="Dân tộc" value={form.person.ethnicity} onChange={(v) => patch("person", "ethnicity", v)} />
        <Field label="Tôn giáo" value={form.person.religion} onChange={(v) => patch("person", "religion", v)} />
        <Field label="Nghề nghiệp" value={form.person.occupation} onChange={(v) => patch("person", "occupation", v)} />
        <Field label="Số CMND/CCCD" value={form.person.identityNo} onChange={(v) => patch("person", "identityNo", v)} />
        <Field label="Ngày cấp" value={form.person.identityIssuedDate} onChange={(v) => patch("person", "identityIssuedDate", v)} type="date" />
        <Field label="Nơi cấp" value={form.person.identityIssuedPlace} onChange={(v) => patch("person", "identityIssuedPlace", v)} />
        <Field label="Nơi thường trú" value={form.person.permanentAddress} onChange={(v) => patch("person", "permanentAddress", v)} multiline className="md:col-span-2" />
        <Field label="Nơi tạm trú" value={form.person.temporaryAddress} onChange={(v) => patch("person", "temporaryAddress", v)} multiline className="md:col-span-2" />
        <Field label="Nơi ở hiện tại" value={form.person.currentAddress} onChange={(v) => patch("person", "currentAddress", v)} multiline className="md:col-span-2" />
        <Field label="Bị khởi tố về tội" value={form.offense.offenseName} onChange={(v) => patch("offense", "offenseName", v)} className="md:col-span-2" />
        <Field label="Khoản" value={form.offense.articleNumber} onChange={(v) => patch("offense", "articleNumber", v)} />
        <Field label="Điều (BLHS)" value={form.offense.articleClause} onChange={(v) => patch("offense", "articleClause", v)} />
      </BmFormSection>

      {/* 6. Điều 2 + lý do */}
      <BmFormSection title="6. Điều 2: Lý do + Yêu cầu (P0039-P0041)">
        <Field label="Lý do hủy bỏ (Điều 121 + 125 BLTTHS)" value={form.content.reasonLine} onChange={(v) => patch("content", "reasonLine", v)} multiline className="md:col-span-2" />
        <Field label="Yêu cầu thi hành" value={form.content.requirementLine} onChange={(v) => patch("content", "requirementLine", v)} multiline className="md:col-span-2" />
      </BmFormSection>

      {/* 7. Nơi nhận — P0042-45 */}
      <BmFormSection title="7. Nơi nhận (P0042-P0045)">
        <Field label="1. Bị can / đại diện bị can" value={form.recipients.accusedLine} onChange={(v) => patch("recipients", "accusedLine", v)} className="md:col-span-2" />
        <Field label="2. Tổ chức/cá nhân nhận bảo lĩnh" value={form.recipients.guarantorLine} onChange={(v) => patch("recipients", "guarantorLine", v)} className="md:col-span-2" />
        <Field label="3. Lưu hồ sơ" value={form.recipients.archiveLine} onChange={(v) => patch("recipients", "archiveLine", v)} />
      </BmFormSection>

      {/* 8. Chữ ký */}
      <BmFormSection title="8. Chữ ký (P0046-P0047)">
        <Field label="Chế độ ký" value={form.signature.signMode} onChange={(v) => patch("signature", "signMode", v)} />
        <Field label="Chức vụ" value={form.signature.positionTitle} onChange={(v) => patch("signature", "positionTitle", v)} />
        <Field label="Người ký" value={form.signature.signerName} onChange={(v) => patch("signature", "signerName", v)} className="md:col-span-2" />
      </BmFormSection>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleApplyFromCase} disabled={!casePayload} className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-40">Lấy từ vụ án</button>
          <button type="button" onClick={() => void load()} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Tải lại</button>
        </div>
        <button type="button" onClick={handleSave} disabled={isSaving} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-slate-400">{isSaving ? "Đang lưu..." : "Lưu BM-048"}</button>
      </div>
    </div>
  );
}
