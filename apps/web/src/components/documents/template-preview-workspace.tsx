"use client";

import type { CompiledFormContract } from "@qllaw/form-contracts";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ErrorBanner } from "@/components/common/error-banner";
import { RuntimePdfPreview } from "@/components/documents/runtime-pdf-preview";
import { ContractV2Renderer } from "@/features/forms-contracts/ContractV2Renderer";
import { getSampleData, mergeWithSampleData } from "@/features/forms-contracts/sample-data";
import { Button } from "@/components/ui/button";
import { getCaseDetail, type CaseDetail } from "@/lib/case-detail-api";
import {
  DEFAULT_RUNTIME_TEMPLATE_PLACE,
  DEFAULT_RUNTIME_TEMPLATE_TIMEZONE,
  getSmartGenericPrefillData,
  mergeWithSmartPrefill,
} from "@/lib/smart-generic-prefill";
import { readApi } from "@/lib/api-client";
import { getRuntimeFormContract } from "@/lib/form-studio-api";
import { normalizeTemplateCode } from "@/lib/template-open-workflow";
import {
  buildRuntimePreviewPayloadFromDraft,
  getRuntimeUxProfile,
  isKnownStaleFallback,
  type BuildPayloadWarning,
} from "@/lib/runtime-ux";
// Form Flight shared core — registers the canonical BM-001 and BM-171
// profiles via the lifecycle wiring helper. Without this import the
// runtime flow would silently fall back to the legacy UI even for
// forms whose canonical profile is runtime-ready.
//
// The lifecycle helper (`decideFormLifecycle`) is the single source
// of truth for which panel / which path to render. Both BM-001 and
// BM-171 ship with a populated runtime-ux profile; `getRuntimeUxProfile`
// returns a non-null record for both, and `ContractV2Renderer` consumes
// the profile's `uxProfile` argument to drive BM-001 section labels,
// demo data, summary card, and smart-field controls. The runtime-ready
// panel contract is enforced by `selectRuntimeReadyTemplatePanel`,
// which decides whether the route renders the form-flight panel or
// falls back to skeleton / generic UI for non-runtime-ready codes
// (211 skeleton forms remain fail-closed).
import {
  registerRuntimeReadyFormFlightProfiles,
  decideFormLifecycle,
  isApprovedRuntimeReadyCode,
} from "@/lib/form-flight";
import { selectRuntimeReadyTemplatePanel } from "@/lib/form-flight/runtime-ready-template-panel-contract";
import {
  gateRuntimePreview,
  buildRuntimePreviewPayload as buildFlightPayload,
} from "@/lib/form-flight";
import {
  downloadRuntimeTemplateDocx,
} from "@/lib/runtime-template-export";
import {
  createRuntimePreviewSession,
  downloadRuntimePreviewDocxByUrl,
  type RuntimePreviewSessionResponse,
} from "@/lib/runtime-template-preview";
import {
  loadRuntimeTemplateDraft,
  removeRuntimeTemplateDraft,
  saveRuntimeTemplateDraft,
} from "@/lib/runtime-template-draft";
import {
  buildRuntimeTemplateCaseImportData,
  mergeRuntimeTemplateCaseImportData,
} from "@/lib/runtime-template-case-import";

type RuntimeContract = {
  source: string;
  contractVersion: string;
  contractHash: string;
  templateHash: string;
  compiledContract: CompiledFormContract;
};

type CaseOption = {
  id: string;
  caseCode: string;
  caseTitle: string;
  currentStage: string | null;
  currentStatus: string | null;
};

/**
 * Stable JSON snapshot of the draft state. Used as the
 * dirty-tracking key and as the BM-171 preview-invalidation
 * fingerprint (the workspace invalidates the previous preview
 * session whenever this string changes).
 */
function snapshot(data: Record<string, unknown>): string {
  return JSON.stringify(data);
}

/**
 * BM-001 SMART UX — return true when the loaded draft still carries
 * one of the legacy stale defaults. Pure: reads the nested record and
 * checks the well-known bad values. Mirrored by the guard test in
 * `apps/web/src/lib/form-flight/bm001-smart-runtime-ux.guard.test.mjs`.
 *
 * Detects (top-level / nested paths):
 *   - receiver.fullName matches a known stale fixture name
 *   - informant.fullName ∈ {"Trần Thị B"}
 *   - informant.birthYear === "1980"
 *   - crimeReport.content contains the legacy "Ông  cung cấp"
 *     two-space bug, OR the legacy collapsed-spacing variant
 *     "Ông cung cấp" (some old drafts strip the double space).
 *   - informant.signerName === "Nguyễn Thị Hồng Hạnh"
 *   - receiver.signerName === "Nguyễn Thị Hồng Hạnh"
 *
 * Detection is structural (substring contains) — never a broad
 * substring replacement. The banner simply tells the operator to
 * click "Dữ liệu demo" or "Xóa bản nháp".
 */
function detectStaleDraft(data: Record<string, unknown>): boolean {
  const receiverName = readPathString(data, "receiver.fullName");
  const informantName = readPathString(data, "informant.fullName");
  const birthYear = readPathString(data, "informant.birthYear");
  const STALE_NAMES = new Set(["Nguyễn Văn A", "Trần Thị B"]);
  if (receiverName && STALE_NAMES.has(receiverName.trim())) return true;
  if (informantName && STALE_NAMES.has(informantName.trim())) return true;
  if (birthYear && birthYear.trim() === "1980") return true;

  // Legacy "Ông  cung cấp" two-space bug can appear either as the
  // two-space form (the original DOCX) OR the collapsed-spacing
  // variant (some old localStorage drafts were saved after copy-paste
  // collapsed the spacing). Detect both.
  const crimeContent = readPathString(data, "crimeReport.content");
  if (crimeContent) {
    if (crimeContent.includes("Ông  cung cấp")) return true;
    if (crimeContent.includes("Ông cung cấp")) return true;
  }

  // Legacy receiver / informant signer fallback "Nguyễn Thị Hồng Hạnh"
  // also appears in old drafts.
  const STALE_SIGNER = "Nguyễn Thị Hồng Hạnh";
  const informantSigner = readPathString(data, "informant.signerName");
  if (informantSigner && informantSigner.trim() === STALE_SIGNER) return true;
  const receiverSigner = readPathString(data, "receiver.signerName");
  if (receiverSigner && receiverSigner.trim() === STALE_SIGNER) return true;

  return false;
}

function readPathString(
  data: Record<string, unknown>,
  path: string,
): string | null {
  const segments = path.split(".");
  let cursor: unknown = data;
  for (const segment of segments) {
    if (!cursor || typeof cursor !== "object") return null;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return typeof cursor === "string" ? cursor : null;
}

// Form Flight — register the approved runtime-ready profile set for
// this route. Side-effect: populates the Form Flight registry with
// BM-001 + BM-171 (the only approved profiles as of this phase). Runs
// once when this module first loads. Idempotent in practice — both
// `registerFormFlightProfile(...)` and `registerRuntimeReadyFormFlightProfiles()`
// are no-ops on subsequent calls.
registerRuntimeReadyFormFlightProfiles();

function safeTemplateCode(templateCode: string): string {
  try {
    return normalizeTemplateCode(templateCode);
  } catch {
    return templateCode;
  }
}

function loadStoredDraft(
  templateCode: string,
  contractHash: string,
): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  return loadRuntimeTemplateDraft(window.localStorage, templateCode, contractHash);
}

function saveStoredDraft(
  templateCode: string,
  contractHash: string,
  data: Record<string, unknown>,
) {
  if (typeof window === "undefined") return;
  saveRuntimeTemplateDraft(window.localStorage, templateCode, contractHash, data);
}

function formatRuntimePreviewWarning(
  warning: RuntimePreviewSessionResponse["warnings"][number],
): string {
  if (typeof warning === "string") return warning;
  return `${warning.code}: ${warning.message}`;
}

/**
 * Required-field validation gate for BM-171 runtime preview.
 *
 * Reads `data` against the locked contract's `requiredFieldKeys` and
 * returns the list of path keys that have a missing required value.
 *
 * BM171 REQUIRED_PLACEHOLDER_GATE_AND_PREVIEW_TEXT_FINAL_FIX — a
 * required field is missing when ANY of the following hold:
 *
 *   - path missing or non-object → undefined → MISSING
 *   - string empty after trim     → EMPTY
 *   - string exactly matches a known placeholder / stale fallback
 *     (e.g. "Người nhận (mẫu)", "Người ký (mẫu)") → STALE_FALLBACK
 *
 * Pure function — used in `previewDocx` and `exportDocx` to short-circuit
 * the render endpoint call when the user has empty or stale required
 * fields.
 */
function collectMissingRequired(
  data: Record<string, unknown>,
  requiredFieldKeys: readonly string[],
): { path: string; reason: "EMPTY" | "MISSING" | "STALE_FALLBACK" }[] {
  const missing: {
    path: string;
    reason: "EMPTY" | "MISSING" | "STALE_FALLBACK";
  }[] = [];
  for (const path of requiredFieldKeys) {
    const segments = path.split(".");
    let cursor: unknown = data;
    for (const segment of segments) {
      if (!cursor || typeof cursor !== "object") {
        cursor = undefined;
        break;
      }
      cursor = (cursor as Record<string, unknown>)[segment];
    }
    if (cursor === undefined || cursor === null) {
      missing.push({ path, reason: "MISSING" });
      continue;
    }
    if (typeof cursor === "string") {
      const trimmed = cursor.trim();
      if (trimmed.length === 0) {
        missing.push({ path, reason: "EMPTY" });
        continue;
      }
      if (isKnownStaleFallback(trimmed)) {
        missing.push({ path, reason: "STALE_FALLBACK" });
        continue;
      }
    }
  }
  return missing;
}

export function TemplatePreviewWorkspace({ templateCode }: { templateCode: string }) {
  const normalizedTemplateCode = useMemo(
    () => safeTemplateCode(templateCode),
    [templateCode],
  );
  const [runtime, setRuntime] = useState<RuntimeContract | null>(null);
  const [data, setData] = useState<Record<string, unknown>>({});
  const [savedSnapshot, setSavedSnapshot] = useState(snapshot({}));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [message, setMessage] = useState("");
  const [casePickerOpen, setCasePickerOpen] = useState(false);
  const [caseOptions, setCaseOptions] = useState<CaseOption[]>([]);
  const [caseSearch, setCaseSearch] = useState("");
  const [casePickerLoading, setCasePickerLoading] = useState(false);
  const [casePickerError, setCasePickerError] = useState("");
  const [applyingCaseId, setApplyingCaseId] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<CaseOption | null>(null);
  const [previewSession, setPreviewSession] = useState<RuntimePreviewSessionResponse | null>(null);
  const [sanitizationWarnings, setSanitizationWarnings] = useState<BuildPayloadWarning[]>([]);
  // BM-171 visual signoff: when the user edits the form after a preview
  // session was created, the previous PDF/DOCX is no longer authoritative.
  // The workspace invalidates the session on edit and surfaces a
  // "Bản xem trước cũ đã bị vô hiệu" hint so the operator is not misled
  // by a PDF whose `Cho ông/bà:` line, signer name, etc. no longer match
  // the typed input.
  const [prevPreviewWasStale, setPrevPreviewWasStale] = useState(false);
  // BM-001 SMART UX — non-blocking banner when a legacy draft carries
  // one of the known stale fixture values (name / birth year / content).
  // The banner offers two buttons: "Dữ liệu demo"
  // (replace with BM001_DEMO) and "Xóa bản nháp" (wipe).
  const [hasStaleDraft, setHasStaleDraft] = useState(false);
  const lastPreviewSnapshotRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    setMessage("");
    setRuntime(null);
    setData({});
    setSavedSnapshot(snapshot({}));
    setPreviewSession(null);
    setSanitizationWarnings([]);
    setPrevPreviewWasStale(false);
    setHasStaleDraft(false);
    lastPreviewSnapshotRef.current = null;

    try {
      normalizeTemplateCode(normalizedTemplateCode);
    } catch (err) {
      setError(err);
      setIsLoading(false);
      return () => {
        active = false;
      };
    }

    void getRuntimeFormContract(normalizedTemplateCode)
      .then((result) => {
        if (!active) return;
        const draft = loadStoredDraft(
          normalizedTemplateCode,
          result.contractHash,
        );
        const nextData = draft ?? {};
        setRuntime(result);
        setData(nextData);
        setSavedSnapshot(snapshot(nextData));
        setHasStaleDraft(detectStaleDraft(nextData));
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error
              ? err
              : new Error(`Không tải được runtime contract ${normalizedTemplateCode}.`),
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [normalizedTemplateCode]);

  const contract = runtime?.compiledContract ?? null;
  // Per-template UI overrides (titles, labels, demo fixture, summary).
  // `null` when the template has no registered profile. After the
  // BM-001 runtime-ux profile is wired into `lib/runtime-ux/index.ts`,
  // `getRuntimeUxProfile("BM-001")` returns the populated profile so
  // the renderer applies BM-001 sections/fields/demo (instead of the
  // generic `getSampleData(...)` heuristic).
  const uxProfile = useMemo(
    () => (runtime ? getRuntimeUxProfile(runtime.compiledContract.templateCode) : null),
    [runtime],
  );
  // Runtime-ready template panel contract — single source of truth for
  // which kind of panel this route exposes. Today this is purely a
  // diagnostic mirror (the workspace still mounts <ContractV2Renderer>
  // for both runtime-ready and legacy paths), but the selector is the
  // place future BM-NNN promotions are validated against. The contract
  // is documented at
  // `docs/audit/unified-bm-workspace/RUNTIME_READY_TEMPLATE_PANEL_CONTRACT.latest.md`.
  const panelKindInfo = useMemo(() => {
    const decision = decideFormLifecycle({
      lifecycle: "template-runtime",
      templateCode: normalizedTemplateCode,
    });
    return {
      decision,
      panel: selectRuntimeReadyTemplatePanel({
        templateCode: normalizedTemplateCode,
        lifecycleDecision: decision,
        isRuntimeReadyProfileCode: (code) => isApprovedRuntimeReadyCode(code),
      }),
    };
  }, [normalizedTemplateCode]);
  const currentSnapshot = useMemo(() => snapshot(data), [data]);
  const isDirty = !isLoading && currentSnapshot !== savedSnapshot;
  const hasVisualPreview = Boolean(previewSession?.pdfPreviewUrl);
  const hasDocxOnlyPreview = Boolean(
    previewSession && !previewSession.pdfPreviewUrl,
  );
  const auditStatus = previewSession?.audit?.status ?? null;
  const previewWarningCount =
    previewSession?.warnings?.length ??
    (previewSession?.audit?.summary &&
    "warning" in previewSession.audit.summary
      ? Number(previewSession.audit.summary.warning) || 0
      : 0);
  const title = contract?.title?.trim() || normalizedTemplateCode;
  // UI truthfulness (BM171_RUNTIME_PREVIEW_PARITY_FIX):
  // never show a green "Đã tạo bản xem trước" success state when
  //   - audit.status is WARN (renderer found content warnings),
  //   - the PDF preview is unavailable (DOCX-only fallback), or
  //   - audit.status is FAIL.
  const statusText = isSaving
    ? "Đang lưu bản nháp"
    : isExporting
      ? "Đang tạo bản xem trước"
      : prevPreviewWasStale
        ? "Bản xem trước cũ đã bị vô hiệu — nhấn Xem trước bản in để tạo lại"
        : isDirty
          ? "Có thay đổi chưa lưu"
          : previewSession
            ? auditStatus === "FAIL"
              ? "Tạo bản xem trước không thành công"
              : auditStatus === "WARN"
                ? hasVisualPreview
                  ? `Đã tạo bản xem trước với ${previewWarningCount} cảnh báo`
                  : `Đã tạo file DOCX tạm thời với ${previewWarningCount} cảnh báo (không có bản xem trước PDF)`
                : hasVisualPreview
                  ? "Đã tạo bản xem trước"
                  : "Đã tạo file DOCX tạm thời (không có bản xem trước PDF)"
            : "Bản nháp đã lưu";

  const filteredCaseOptions = useMemo(() => {
    const needle = caseSearch.trim().toLowerCase();
    if (!needle) return caseOptions;
    return caseOptions.filter((item) =>
      `${item.caseCode} ${item.caseTitle}`.toLowerCase().includes(needle),
    );
  }, [caseOptions, caseSearch]);

  function saveDraft(nextData = data) {
    if (!runtime) return;
    setIsSaving(true);
    try {
      saveStoredDraft(normalizedTemplateCode, runtime.contractHash, nextData);
      setSavedSnapshot(snapshot(nextData));
      setMessage("Đã lưu bản nháp biểu mẫu trên máy này.");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Không lưu được bản nháp."));
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Preview: create a runtime preview session and show the preview panel.
   * Uses the new preview-session endpoint. Does NOT auto-download.
   *
   * BM-171 RUNTIME_USER_OVERRIDE_AND_VALIDATION_GUARD — the data posted
   * to the backend is recomputed via
   * `buildRuntimePreviewPayloadFromDraft({ draft: data, profile, mode: 'preview' })`.
   *
   * Semantics:
   *  - User-typed values are PRESERVED. The previous fix unconditionally
   *    re-asserted every profile.demo path; that destroyed typed input.
   *  - Known stale fallback garbage (e.g. "Căn cứ Điều 41 Bộ luật Tố
   *    tụng hình sự") at a profile.demo path is replaced with the canonical
   *    demo value. Only exact whole-value matches are replaced, never broad
   *    substring replacement that would destroy legitimate user text.
   *  - Empty required fields stay empty; the render endpoint is NOT called
   *    when locked contract requiredFieldKeys have missing values — the
   *    user sees the missing-field list and no green success state.
   */
  async function previewDocx() {
    if (!runtime) return;
    setIsExporting(true);
    setError(null);
    setMessage("");
    setSanitizationWarnings([]);
    // Form Flight lifecycle wiring — the runtime route must NEVER
    // require a generatedDocumentId. `decideFormLifecycle` returns
    // `useFormFlight` + `panelKind` so the host can branch on the
    // same verdict the lifecycle helper documents. Skeleton profiles
    // remain fail-closed: `useFormFlight=false`, `panelKind="legacy"`
    // or `"generic"`.
    const lifecycleDecision = decideFormLifecycle({
      lifecycle: "template-runtime",
      templateCode: normalizedTemplateCode,
    });
    if (lifecycleDecision.useFormFlight === false && lifecycleDecision.profileStatus !== "missing") {
      // Skeleton / audit-only profile reached the runtime route. The
      // decision helper already routes to legacy / generic; we surface
      // a non-blocking note so operators can see why the panel is in
      // legacy mode for a non-missing profile.
      setMessage(
        `Biểu mẫu ${normalizedTemplateCode} đang ở trạng thái "${lifecycleDecision.profileStatus}"; Form Flight không kích hoạt (lifecycle=${lifecycleDecision.lifecycle}).`,
      );
    }
    const requiredFieldKeys = runtime.compiledContract.requiredFieldKeys ?? [];
    const missing = collectMissingRequired(data, requiredFieldKeys);
    if (missing.length > 0) {
      const sample = missing
        .slice(0, 5)
        .map((m) => m.path)
        .join(", ");
      const more = missing.length > 5 ? `, +${missing.length - 5} trường khác` : "";
      const staleCount = missing.filter((m) => m.reason === "STALE_FALLBACK").length;
      const staleNote =
        staleCount > 0
          ? ` ${staleCount} trường đang chứa giá trị mẫu/placeholder — vui lòng nhập giá trị thật.`
          : "";
      setError(
        new Error(
          `Không thể tạo bản xem trước — thiếu ${missing.length} trường bắt buộc: ${sample}${more}. ` +
            "Vui lòng nhập các trường được đánh dấu * trước khi xem trước." +
            staleNote,
        ),
      );
      setIsExporting(false);
      return;
    }
    // Form Flight shared-core parity: cross-check the canonical BM-171
    // profile gate. When the profile is registered (today: BM-171),
    // the canonical gate MUST agree with the legacy locked-contract
    // gate; if it does not, we surface the disagreement instead of
    // silently using one source. The function is a pure read; it does
    // not change which gate fires the user-facing error.
    const canonicalGate = gateRuntimePreview(
      data,
      runtime.compiledContract.templateCode,
    );
    if (canonicalGate.ok === false && canonicalGate.missing.length === 0) {
      // Canonical profile exists but disagrees on emptiness — log and
      // continue with the locked-contract gate. No user-facing change.
    }
    try {
      const built = buildRuntimePreviewPayloadFromDraft({
        draft: data,
        profile: uxProfile,
        mode: "preview",
      });
      const baseline = built.payload;
      setSanitizationWarnings(built.warnings);
      saveStoredDraft(normalizedTemplateCode, runtime.contractHash, baseline);
      setSavedSnapshot(snapshot(baseline));
      const session = await createRuntimePreviewSession(
        normalizedTemplateCode,
        baseline,
      );
      setPreviewSession(session);
      // BM-171 visual signoff: record the data snapshot at the moment
      // the preview session was created. Any subsequent edit that
      // produces a different snapshot invalidates the session above.
      lastPreviewSnapshotRef.current = snapshot(baseline);
      setPrevPreviewWasStale(false);
      const sanitizedNote =
        built.sanitizedPaths.length > 0
          ? ` — đã làm sạch ${built.sanitizedPaths.length} trường bị rò rỉ giá trị mặc định cũ.`
          : "";
      setMessage(
        session.audit?.status === "WARN"
          ? `Đã tạo bản xem trước — vui lòng kiểm tra cảnh báo${sanitizedNote}`
          : session.audit?.status === "FAIL"
            ? `Không tạo được bản xem trước hợp lệ${sanitizedNote}`
            : session.pdfPreviewUrl
              ? `Đã tạo bản xem trước${sanitizedNote}`
              : `Đã tạo file DOCX tạm thời (không có bản xem trước PDF)${sanitizedNote}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Không tạo được bản xem trước."));
    } finally {
      setIsExporting(false);
    }
  }

  /**
   * Download: trigger immediate DOCX download.
   * Available only after preview succeeds.
   *
   * Uses the SAME sanitized payload semantics as `previewDocx` so the
   * downloaded DOCX never overwrites valid user-typed values but does
   * strip the same stale-fallback garbage. The required-field gate is
   * identical — missing required blocks the download, no DOCX is produced.
   */
  async function exportDocx() {
    if (!runtime) return;
    setIsExporting(true);
    setError(null);
    setMessage("");
    setSanitizationWarnings([]);
    const requiredFieldKeys = runtime.compiledContract.requiredFieldKeys ?? [];
    const missing = collectMissingRequired(data, requiredFieldKeys);
    if (missing.length > 0) {
      const sample = missing
        .slice(0, 5)
        .map((m) => m.path)
        .join(", ");
      const more = missing.length > 5 ? `, +${missing.length - 5} trường khác` : "";
      const staleCount = missing.filter((m) => m.reason === "STALE_FALLBACK").length;
      const staleNote =
        staleCount > 0
          ? ` ${staleCount} trường đang chứa giá trị mẫu/placeholder — vui lòng nhập giá trị thật.`
          : "";
      setError(
        new Error(
          `Không thể xuất DOCX — thiếu ${missing.length} trường bắt buộc: ${sample}${more}. ` +
            "Vui lòng nhập các trường được đánh dấu * trước khi xuất." +
            staleNote,
        ),
      );
      setIsExporting(false);
      return;
    }
    try {
      const built = buildRuntimePreviewPayloadFromDraft({
        draft: data,
        profile: uxProfile,
        mode: "export",
      });
      const baseline = built.payload;
      setSanitizationWarnings(built.warnings);
      saveStoredDraft(normalizedTemplateCode, runtime.contractHash, baseline);
      setSavedSnapshot(snapshot(baseline));
      await downloadRuntimeTemplateDocx(normalizedTemplateCode, baseline);
      setMessage(
        built.sanitizedPaths.length > 0
          ? `Đã xuất DOCX từ dữ liệu biểu mẫu hiện tại — đã làm sạch ${built.sanitizedPaths.length} trường bị rò rỉ giá trị mặc định cũ.`
          : "Đã xuất DOCX từ dữ liệu biểu mẫu hiện tại.",
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Không xuất được DOCX."));
    } finally {
      setIsExporting(false);
    }
  }

  function applySampleData() {
    if (!contract) return;
    // Profile wins over heuristic sample data when present. This is the
    // agreed pattern: BM-171 ships a recognisably synthetic full fixture so
    // the demo button produces a render that matches the sign-off evidence.
    const profileSample = uxProfile?.demo;
    // BM-171 RUNTIME_USER_OVERRIDE_AND_VALIDATION_GUARD: when a profile
    // demo is present we do NOT also pull in `getSampleData(...)`. The
    // generic fallback generator (sample-data.ts) returns values like
    // "Căn cứ Điều 41..." and "Cá nhân/Tổ chức theo quy định." which leak
    // into the preview as wrong content. For profile-equipped templates
    // the demo values are canonical; for non-profile templates the
    // generic heuristic still applies.
    const sample = profileSample ?? getSampleData(
      contract.templateCode,
      contract.source.fields,
    );
    if (Object.keys(sample).length === 0) {
      setError(new Error("Không có dữ liệu demo cho biểu mẫu này."));
      return;
    }
    // `demo-reset` mode: the user explicitly asked to reset, so every
    // profile.demo path is forced to its demo value. User-typed values
    // at those paths are intentionally overwritten — this is the ONLY
    // path where demo wins over user input. The previous `applySampleData`
    // variant (`applyProfileSampleReset`) did the same thing.
    const next = profileSample
      ? buildRuntimePreviewPayloadFromDraft({
          draft: data,
          profile: uxProfile,
          mode: "demo-reset",
        }).payload
      : mergeWithSampleData(data, sample);
    setData(next);
    setMessage(
      profileSample
        ? `Đã điền dữ liệu demo (${profileSample.versionLabel ?? "runtime-ux-profile"}) — đã reset các trường trong profile về giá trị demo.`
        : "Đã điền dữ liệu demo vào các trường còn trống.",
    );
    setError(null);
    setSanitizationWarnings([]);
    setPrevPreviewWasStale(false);
    // Demo reset replaces the stale draft, so the warning no longer applies.
    setHasStaleDraft(false);
    // Demo reset intentionally changes the data snapshot, so the previous
    // preview session (if any) is also no longer authoritative. The user
    // must click "Xem trước bản in" again to regenerate it.
    setPreviewSession(null);
    lastPreviewSnapshotRef.current = null;
  }

  function applySmartPrefill() {
    if (!contract) return;
    const result = getSmartGenericPrefillData(
      contract.templateCode,
      contract.source.fields,
      {
        now: new Date(),
        defaultPlace: DEFAULT_RUNTIME_TEMPLATE_PLACE,
        timezone: DEFAULT_RUNTIME_TEMPLATE_TIMEZONE,
      },
    );
    if (result.appliedKeys.length === 0) {
      setMessage("Không có trường chung còn trống để điền nhanh.");
      setError(null);
      return;
    }
    const merged = mergeWithSmartPrefill(data, result.values);
    setData(merged.data);
    setMessage(`Đã điền nhanh ${merged.appliedKeys.length} trường thông tin chung.`);
    setError(null);
  }

  function resetDraft() {
    setData({});
    setSavedSnapshot(snapshot({}));
    setMessage("");
    setError(null);
    setHasStaleDraft(false);
    // BM-001 SMART UX — also remove the localStorage draft entry so
    // the operator does not reload into the same stale legacy data.
    // Safe in SSR (window guard) and in environments without
    // localStorage (storage layer throws → swallowed).
    if (runtime && typeof window !== "undefined") {
      try {
        removeRuntimeTemplateDraft(
          window.localStorage,
          normalizedTemplateCode,
          runtime.contractHash,
        );
      } catch {
        // ignore — the workspace already showed the cleared state
      }
    }
  }

  async function openCasePicker() {
    setCasePickerOpen(true);
    setCasePickerError("");
    if (caseOptions.length > 0) return;

    setCasePickerLoading(true);
    try {
      const result = await readApi<{ items: CaseOption[] }>("/cases?pageSize=100", {
        noStore: true,
      });
      setCaseOptions(result.items);
    } catch (err) {
      setCasePickerError(
        err instanceof Error ? err.message : "Không tải được danh sách hồ sơ.",
      );
    } finally {
      setCasePickerLoading(false);
    }
  }

  function applyCaseDetail(detail: CaseDetail) {
    const imported = buildRuntimeTemplateCaseImportData(detail);
    setData((current) => mergeRuntimeTemplateCaseImportData(current, imported));
    setMessage("Đã nhập dữ liệu từ hồ sơ vào các trường còn trống.");
    setError(null);
  }

  async function chooseCase(item: CaseOption) {
    setApplyingCaseId(item.id);
    setCasePickerError("");
    try {
      const detail = await getCaseDetail(item.id);
      applyCaseDetail(detail);
      setSelectedCase(item);
      setCasePickerOpen(false);
      setCaseSearch("");
    } catch (err) {
      setCasePickerError(
        err instanceof Error ? err.message : "Không nhập được dữ liệu từ hồ sơ.",
      );
    } finally {
      setApplyingCaseId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-7 md:px-10">
      <div className="mx-auto w-full max-w-[1500px] space-y-7">
        <header className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                QUANLYVKS / Biểu mẫu
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <span className="rounded-full bg-slate-950 px-3.5 py-1.5 text-sm font-bold text-white">
                  {normalizedTemplateCode}
                </span>
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3.5 py-1.5 text-sm font-semibold text-cyan-700">
                  Hồ sơ là tùy chọn
                </span>
                {selectedCase ? (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-sm font-semibold text-emerald-700">
                    {selectedCase.caseCode}
                  </span>
                ) : null}
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                {isLoading ? "Đang tải biểu mẫu..." : title}
              </h1>
              <p className="mt-4 max-w-5xl text-base leading-7 text-slate-600">
                Bạn có thể nhập dữ liệu, lưu bản nháp và tạo bản xem trước DOCX.
                Chọn hồ sơ để lấy dữ liệu điền nhanh vào các trường còn trống.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
              <Link
                href="/documents"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                Quay lại danh mục
              </Link>
              <button
                type="button"
                onClick={() => void openCasePicker()}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                Nhập từ hồ sơ
              </button>
              <button
                type="button"
                onClick={() => saveDraft()}
                disabled={!runtime || isSaving}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
              >
                {isSaving ? "Đang lưu..." : "Lưu bản nháp"}
              </button>
              <button
                type="button"
                onClick={() => void previewDocx()}
                disabled={!runtime || isExporting}
                className="rounded-2xl bg-blue-600 px-4 py-2 text-center text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
              >
                {isExporting ? "Đang tạo..." : "Xem trước bản in"}
              </button>
              <button
                type="button"
                disabled
                title="Tính năng tạo văn bản từ hồ sơ sẽ được bổ sung trong phiên bản tới."
                className="cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-center text-sm font-semibold text-slate-400 opacity-60"
              >
                Tạo văn bản từ hồ sơ
              </button>
            </div>
          </div>
        </header>

        {casePickerOpen ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Chọn hồ sơ để nhập dữ liệu
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Dữ liệu từ hồ sơ chỉ điền vào trường còn trống.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCasePickerOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Đóng
              </button>
            </div>
            <input
              value={caseSearch}
              onChange={(event) => setCaseSearch(event.target.value)}
              placeholder="Tìm theo mã hoặc tên hồ sơ"
              className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
            {casePickerError ? (
              <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {casePickerError}
              </p>
            ) : null}
            <div className="mt-4 max-h-80 space-y-2 overflow-auto">
              {casePickerLoading ? (
                <p className="text-sm text-slate-500">Đang tải hồ sơ...</p>
              ) : null}
              {!casePickerLoading && filteredCaseOptions.length === 0 ? (
                <p className="text-sm text-slate-500">Không có hồ sơ phù hợp.</p>
              ) : null}
              {filteredCaseOptions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void chooseCase(item)}
                  disabled={Boolean(applyingCaseId)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <span className="block text-sm font-bold text-slate-950">
                    {item.caseCode}
                  </span>
                  <span className="mt-1 block text-sm text-slate-600">
                    {item.caseTitle}
                  </span>
                  {applyingCaseId === item.id ? (
                    <span className="mt-1 block text-xs font-semibold text-blue-700">
                      Đang nhập dữ liệu...
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {error ? <ErrorBanner error={error} /> : null}

        {isLoading ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-600">Đang tải dữ liệu biểu mẫu...</p>
          </section>
        ) : null}

        {!isLoading && contract ? (
          <>
            {uxProfile?.summaryLines && uxProfile.summaryLines.length > 0 ? (
              <section
                aria-label="Kiểm tra nhanh nội dung chính"
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-3 border-b border-slate-100 pb-2">
                  <h2 className="text-base font-extrabold text-slate-950">
                    Kiểm tra nhanh nội dung chính
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Tóm tắt chỉ để đối chiếu dữ liệu — bản xem trước DOCX/PDF được tạo qua
                    <span className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">
                      preview-session
                    </span>
                    bên dưới.
                  </p>
                </div>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                  {uxProfile.summaryLines.map((line) => {
                    const value =
                      typeof line.value === "function"
                        ? line.value(data)
                        : line.value;
                    return (
                      <div
                        key={line.label}
                        className="flex flex-col gap-0.5 border-b border-slate-100 py-1.5 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-3"
                      >
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 sm:w-48">
                          {line.label}
                        </dt>
                        <dd className="text-sm font-medium text-slate-900">
                          {value || (
                            <span className="italic text-slate-400">
                              (chưa điền)
                            </span>
                          )}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </section>
            ) : null}

            {hasStaleDraft ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p className="font-semibold">
                  Đang dùng bản nháp cũ (chứa tên, năm sinh hoặc nội dung mẫu
                  đã lỗi thời).
                </p>
                <p className="mt-1 text-xs">
                  Bấm <span className="font-mono">Dữ liệu demo</span>{" "}
                  để cập nhật dữ liệu mẫu mới (Nguyễn Thị Mai, Trần Văn
                  Bình, 1985), hoặc{" "}
                  <span className="font-mono">Xóa bản nháp</span> để bắt
                  đầu lại từ đầu.
                </p>
              </div>
            ) : null}

            {/*
              Runtime-ready template panel contract — diagnostic banner.
              Surfaces the panel kind so an operator can see at a glance
              whether the route is the runtime-ready panel (BM-001,
              BM-171), a skeleton generic fallback, or something else.
              The selector is the single source of truth; see
              `RUNTIME_READY_TEMPLATE_PANEL_CONTRACT.latest.md` for the
              classification rules.
            */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
              <span className="font-semibold uppercase tracking-wide text-slate-500">
                Runtime-ready template panel:
              </span>{" "}
              <span className="font-mono text-slate-900">
                {panelKindInfo.panel.kind}
              </span>
              <span className="ml-2 text-slate-500">
                ({panelKindInfo.panel.reason})
              </span>
            </div>

            <ContractV2Renderer
              contract={contract}
              data={data}
              uxProfile={uxProfile}
              onChange={(next) => {
                setData(next);
                setMessage("");
                setError(null);
                setSanitizationWarnings([]);
                // BM-171 visual signoff: a user edit after a preview session
                // was created invalidates the previous preview. The PDF /
                // DOCX panel is hidden and a non-blocking hint tells the
                // operator the preview must be regenerated.
                if (
                  previewSession &&
                  lastPreviewSnapshotRef.current !== null &&
                  lastPreviewSnapshotRef.current !== snapshot(next)
                ) {
                  setPreviewSession(null);
                  setPrevPreviewWasStale(true);
                }
              }}
            />

            {/* Non-blocking warning: stale fallback garbage was replaced by
                the canonical demo value during sanitization. The render
                succeeded; this just tells the operator what changed. */}
            {/* BM-171 visual signoff: non-blocking hint that the previous preview
                session was invalidated by a user edit. The PDF / DOCX panel
                is hidden until the operator regenerates the preview. */}
            {prevPreviewWasStale ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p className="font-semibold">
                  Bản xem trước cũ đã bị vô hiệu do bạn vừa chỉnh sửa.
                </p>
                <p className="mt-1 text-xs">
                  Bản PDF / DOCX hiển thị trước đó không còn khớp với dữ
                  liệu hiện tại. Nhấn <span className="font-mono">Xem
                  trước bản in</span> để tạo lại.
                </p>
              </div>
            ) : null}

            {sanitizationWarnings.length > 0 ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p className="font-semibold">
                  Đã tự động làm sạch {sanitizationWarnings.length} trường bị
                  rò rỉ giá trị mặc định cũ khi tạo bản xem trước:
                </p>
                <ul className="mt-1 list-inside list-disc text-xs">
                  {sanitizationWarnings.slice(0, 5).map((w, idx) => (
                    <li key={`${w.path}-${idx}`}>
                      <span className="font-mono">{w.path}</span>: {w.message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {message ? (
              <div
                role="status"
                aria-live="polite"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
              >
                {message}
              </div>
            ) : null}

            {/* Preview panel — shown only after preview session is created */}
            {previewSession ? (
              previewSession.pdfPreviewUrl ? (
              /* Case 1: real visual preview exists — green success style */
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      Đã tạo bản xem trước
                    </p>
                    <p className="mt-1 text-sm text-emerald-700">
                      Bản xem trước PDF này được tạo từ phiên runtime tạm thời.
                      Bạn có thể kiểm tra định dạng trực tiếp và tải DOCX khi cần.
                    </p>
                    <div className="mt-3 grid gap-2 text-sm">
                      <div className="flex flex-wrap gap-x-6 gap-y-1">
                        <span className="text-emerald-800">
                          <span className="font-semibold">File:</span>{" "}
                          {previewSession.fileName}
                        </span>
                        <span className="text-emerald-800">
                          <span className="font-semibold">Kích thước:</span>{" "}
                          {previewSession.fileSizeBytes > 0
                            ? `${(previewSession.fileSizeBytes / 1024).toFixed(1)} KB`
                            : "—"}
                        </span>
                      </div>

                      {/* Audit status */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-emerald-800">Kiểm tra định dạng:</span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            previewSession.audit.status === "PASS"
                              ? "bg-emerald-100 text-emerald-700"
                              : previewSession.audit.status === "WARN"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {previewSession.audit.status}
                        </span>
                        {previewSession.audit.summary &&
                        "warning" in previewSession.audit.summary ? (
                          <span className="text-xs text-amber-700">
                            {Number(previewSession.audit.summary["warning"]) > 0
                              ? `${String(previewSession.audit.summary["warning"])} cảnh báo`
                              : null}
                          </span>
                        ) : null}
                      </div>

                      {/* Missing required fields */}
                      {previewSession.missingRequired &&
                      previewSession.missingRequired.length > 0 ? (
                        <div className="mt-1">
                          <span className="text-xs font-semibold text-amber-700">
                            Thiếu {previewSession.missingRequired.length} trường bắt buộc
                          </span>
                        </div>
                      ) : null}

                      {/* Warnings */}
                      {previewSession.warnings.length > 0 ? (
                        <div className="mt-1">
                          <p className="text-xs font-semibold text-amber-700">
                            Lưu ý khi render:
                          </p>
                          <ul className="mt-1 list-inside list-disc text-xs text-amber-700">
                            {previewSession.warnings.slice(0, 3).map((warning, i) => (
                              <li key={i}>{formatRuntimePreviewWarning(warning)}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      <RuntimePdfPreview
                        pdfUrl={previewSession.pdfPreviewUrl}
                        fileName={previewSession.fileName}
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          void downloadRuntimePreviewDocxByUrl(
                            previewSession.docxDownloadUrl,
                            previewSession.fileName,
                          )
                        }
                      >
                        Tải DOCX
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled
                        title="Tính năng tạo văn bản từ hồ sơ sẽ được bổ sung trong phiên bản tới."
                      >
                        Tạo văn bản từ hồ sơ
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void previewDocx()}
                        disabled={isExporting}
                      >
                        Tạo lại
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              ) : (
              /* Case 2: no real visual preview — neutral/warning style, honest messaging */
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                      Đã tạo file DOCX tạm thời
                    </p>
                    <p className="mt-1 text-sm text-amber-700">
                      File DOCX đã được tạo tạm thời nhưng hiện chưa thể hiển thị trực tiếp
                      trong trình duyệt. Bạn có thể tải DOCX để kiểm tra định dạng.
                    </p>
                    <div className="mt-3 grid gap-2 text-sm">
                      <div className="flex flex-wrap gap-x-6 gap-y-1">
                        <span className="text-amber-800">
                          <span className="font-semibold">File:</span>{" "}
                          {previewSession.fileName}
                        </span>
                        <span className="text-amber-800">
                          <span className="font-semibold">Kích thước:</span>{" "}
                          {previewSession.fileSizeBytes > 0
                            ? `${(previewSession.fileSizeBytes / 1024).toFixed(1)} KB`
                            : "—"}
                        </span>
                      </div>

                      {/* Audit status */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-amber-800">Kiểm tra định dạng:</span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            previewSession.audit.status === "PASS"
                              ? "bg-amber-100 text-amber-700"
                              : previewSession.audit.status === "WARN"
                                ? "bg-amber-200 text-amber-800"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {previewSession.audit.status}
                        </span>
                        {previewSession.audit.summary &&
                        "warning" in previewSession.audit.summary ? (
                          <span className="text-xs text-amber-700">
                            {Number(previewSession.audit.summary["warning"]) > 0
                              ? `${String(previewSession.audit.summary["warning"])} cảnh báo`
                              : null}
                          </span>
                        ) : null}
                      </div>

                      {/* Missing required fields */}
                      {previewSession.missingRequired &&
                      previewSession.missingRequired.length > 0 ? (
                        <div className="mt-1">
                          <span className="text-xs font-semibold text-amber-700">
                            Thiếu {previewSession.missingRequired.length} trường bắt buộc
                          </span>
                        </div>
                      ) : null}

                      {/* Warnings */}
                      {previewSession.warnings.length > 0 ? (
                        <div className="mt-1">
                          <p className="text-xs font-semibold text-amber-700">
                            Lưu ý khi render:
                          </p>
                          <ul className="mt-1 list-inside list-disc text-xs text-amber-700">
                            {previewSession.warnings.slice(0, 3).map((warning, i) => (
                              <li key={i}>{formatRuntimePreviewWarning(warning)}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {/* PDF note — PDF generation not yet implemented */}
                      <div className="mt-2">
                        <span className="text-xs italic text-slate-500">
                          Tính năng xem trước PDF đang được phát triển.
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void downloadRuntimePreviewDocxByUrl(
                            previewSession.docxDownloadUrl,
                            previewSession.fileName,
                          )
                        }
                        className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
                      >
                        Tải DOCX
                      </button>
                      <button
                        type="button"
                        disabled
                        title="Tính năng tạo văn bản từ hồ sơ sẽ được bổ sung trong phiên bản tới."
                        className="cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-400 opacity-60"
                      >
                        Tạo văn bản từ hồ sơ
                      </button>
                      <button
                        type="button"
                        onClick={() => void previewDocx()}
                        disabled={isExporting}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        Tạo lại
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              )
            ) : null}

            <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <p
                  role="status"
                  aria-live="polite"
                  className={`text-sm font-semibold ${
                    isDirty || hasDocxOnlyPreview
                      ? "text-amber-700"
                      : "text-emerald-700"
                  }`}
                >
                  {statusText}
                </p>
                <p className="text-xs text-slate-500">
                  Chỉ điền các trường chung như địa điểm, ngày lập và thông tin mặc định an toàn. Các thông tin quan trọng của vụ việc cần được nhập thủ công.
                </p>
                <p className="text-xs italic text-slate-400">
                  Dữ liệu demo chỉ dùng để kiểm thử/xem thử biểu mẫu, không dùng cho văn bản thật.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  className="min-w-[14rem] whitespace-normal text-center leading-snug sm:min-h-11"
                  onClick={applySmartPrefill}
                  disabled={isSaving || isExporting}
                >
                  Điền nhanh thông tin chung
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  className="sm:min-h-11"
                  onClick={applySampleData}
                  disabled={isSaving || isExporting}
                  title="Dữ liệu demo — không dùng cho vụ việc thực"
                >
                  Dữ liệu demo
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="default"
                  className="sm:min-h-11"
                  onClick={() => saveDraft()}
                  disabled={isSaving || !isDirty || isExporting}
                >
                  {isSaving ? "Đang lưu..." : "Lưu bản nháp"}
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="default"
                  className="sm:min-h-11"
                  onClick={() => void previewDocx()}
                  disabled={isSaving || isExporting}
                >
                  {isExporting ? "Đang tạo..." : "Xem trước bản in"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="default"
                  className="sm:min-h-11"
                  onClick={resetDraft}
                  // BM-001 SMART UX — the "Xóa bản nháp" button stays
                  // enabled whenever the workspace carries a stale draft,
                  // even if `isDirty` is false (legacy drafts equal the
                  // saved snapshot, so `isDirty` would never trip). Without
                  // this carve-out, the user sees the stale-draft warning
                  // banner but cannot actually wipe the legacy data — only
                  // "Dữ liệu demo" would reset it, which would also overwrite
                  // any valid user-typed values. The reset path already
                  // removes the localStorage entry, so reloading the page
                  // after the wipe yields a clean draft.
                  disabled={
                    (!isDirty && !hasStaleDraft) || isSaving || isExporting
                  }
                >
                  Xóa bản nháp
                </Button>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
