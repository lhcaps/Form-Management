/**
 * DOCX Style Audit Service
 *
 * High-level service that wraps docx-format-auditor.ts for use in the
 * preview pipeline. Provides profile-aware audit results with severity-
 * classified findings and recommendations.
 *
 * This service is READ-ONLY. It does NOT mutate DOCX files.
 *
 * Usage:
 *   const audit = await docxStyleAuditService.auditDocxFromFile(docxFilePath);
 *   const audit = await docxStyleAuditService.auditDocxFromBuffer(docxBuffer);
 *
 * @module documents/style
 */

import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs';
import {
  auditDocxFormat,
  extractOoxmlPartsFromDocx,
  type DocxFormatAudit,
  type DocxFormatCheck,
  type DocxFormatCheckStatus,
} from '../rendering/infrastructure/docx-format-auditor';
import {
  VKS_KHU_VUC_7_STYLE_PROFILE,
  BODY_TITLE_KEYWORDS,
  type VksStyleProfile,
} from './vks-khu-vuc-7-style-profile';

/** Severity of an audit finding. */
export type AuditFindingSeverity = 'INFO' | 'WARN' | 'FAIL';

/** Location in the document where a finding applies. */
export type AuditFindingLocation =
  | 'header'
  | 'footer'
  | 'body'
  | 'settings'
  | 'styles'
  | 'document';

/** A single audit finding with recommendation. */
export interface AuditFinding {
  severity: AuditFindingSeverity;
  code: string;
  message: string;
  location: AuditFindingLocation;
  recommendation?: string;
  /** The format check ID from docx-format-auditor.ts that produced this finding */
  sourceCheckId?: string;
}

/** Overall audit result. */
export interface DocxStyleAuditResult {
  status: 'PASS' | 'WARN' | 'FAIL';
  profileId: string;
  profileName: string;
  summary: {
    total: number;
    pass: number;
    warning: number;
    fail: number;
    notDetectable: number;
    notApplicable: number;
  };
  findings: AuditFinding[];
  /** Raw format audit from docx-format-auditor.ts for tooling/debug */
  rawAudit: DocxFormatAudit;
}

/** Map auditor status to our severity */
function auditorStatusToSeverity(
  status: DocxFormatCheckStatus,
): AuditFindingSeverity {
  switch (status) {
    case 'pass':
      return 'INFO';
    case 'warning':
      return 'WARN';
    case 'fail':
      return 'FAIL';
    case 'not_detectable':
      return 'WARN';
    case 'not_applicable':
      return 'INFO';
    default:
      return 'INFO';
  }
}

/** Map auditor check ID to our location */
function checkIdToLocation(checkId: string): AuditFindingLocation {
  if (checkId === 'FMT-017' || checkId === 'FMT-016') return 'settings';
  if (checkId === 'FMT-013' || checkId === 'FMT-014' || checkId === 'FMT-015')
    return 'footer';
  if (checkId.startsWith('FMT-00')) return 'header';
  return 'body';
}

/** Build a human-readable message from a format check */
function buildFindingMessage(
  check: DocxFormatCheck,
  profile: VksStyleProfile,
): string {
  const { id, requirement, status, evidence } = check;

  switch (id) {
    case 'FMT-001':
      return status === 'fail'
        ? 'Normal style does not use Times New Roman at 13pt. Document may render with wrong font.'
        : status === 'warning'
          ? 'Times New Roman font detected but Normal style baseline not confirmed.'
          : 'Times New Roman baseline confirmed.';

    case 'FMT-002':
      return status === 'fail' || status === 'not_detectable'
        ? 'Missing agency header: ' + profile.headerLeft.parentAgency.text
        : 'Agency header present.';

    case 'FMT-003':
      return status === 'fail' || status === 'warning'
        ? 'KHU VỰC 7 line should be bold.'
        : 'KHU VỰC 7 bold confirmed.';

    case 'FMT-004':
      return status === 'not_detectable'
        ? 'Underline under KHU VỰC 7 requires visual inspection (exact placement unverifiable from XML).'
        : 'Underline under KHU VỰC 7 detected.';

    case 'FMT-005':
      return status === 'fail' || status === 'warning'
        ? 'Legal basis line should use 8pt font. ' + (evidence ?? '')
        : 'Legal basis line format correct.';

    case 'FMT-006':
      return status === 'not_detectable'
        ? 'Missing: ' + profile.headerRight.quocHieu.text
        : 'Quốc hiệu present.';

    case 'FMT-007':
      return status === 'warning'
        ? 'Motto "Độc lập - Tự do - Hạnh phúc" should be bold size 14. ' +
            (evidence ?? '')
        : status === 'not_detectable'
          ? 'Missing motto line.'
          : 'Motto format correct.';

    case 'FMT-008':
      return 'Underline width under motto requires visual inspection (exact width unverifiable from XML).';

    case 'FMT-009':
      return status === 'not_detectable'
        ? 'Issue date (ngày/tháng/năm) pattern not detected.'
        : 'Issue date present.';

    case 'FMT-010':
      return 'Horizontal alignment of Số and date lines requires visual inspection.';

    case 'FMT-011':
      return status === 'warning'
        ? 'Body title should be bold size 14. ' + (evidence ?? '')
        : status === 'not_detectable'
          ? 'No known body title detected. Expected: ' +
            BODY_TITLE_KEYWORDS.join(', ')
          : 'Body title bold+size14 confirmed.';

    case 'FMT-012':
      return status === 'warning'
        ? 'Article/section headings (Điều 1, Điều 2, etc.) should be bold. ' +
            (evidence ?? '')
        : status === 'not_detectable'
          ? 'No article/section headings detected. Expected patterns: Điều N, 1., 2., I., II., III.'
          : 'Article headings bold confirmed.';

    case 'FMT-013':
      return status === 'not_detectable'
        ? 'Missing "Nơi nhận:" label in footer.'
        : '"Nơi nhận:" label present.';

    case 'FMT-014':
      return status === 'warning'
        ? 'Footer recipient lines should be size 11. ' + (evidence ?? '')
        : status === 'not_detectable'
          ? 'Footer recipient line size not verified.'
          : 'Footer recipient lines size 11 confirmed.';

    case 'FMT-015':
      return status === 'warning'
        ? 'Signature title should be bold size 14. ' + (evidence ?? '')
        : status === 'not_detectable'
          ? 'No signature title detected. Expected: Viện trưởng, Kiểm sát viên, etc.'
          : 'Signature title bold+size14 confirmed.';

    case 'FMT-016':
      return status === 'not_detectable'
        ? 'Page number field (PAGE) not found in document. Required for documents > 2 pages.'
        : 'Page numbering present.';

    case 'FMT-017':
      return status === 'not_detectable'
        ? '"Different First Page" not enabled in section settings. This should be enabled for legal documents.'
        : '"Different First Page" enabled.';

    case 'FMT-018':
      return status === 'fail'
        ? 'BM-001 receiver identity "Tôi:" paragraph contains non-black text. All legal content must be black.'
        : status === 'not_applicable'
          ? 'BM-001 form note check: not applicable (not BM-001).'
          : 'BM-001 receiver identity text is black.';

    case 'FMT-019':
      return status === 'fail'
        ? 'BM-001 form note should use explicit black text at 8pt. Current formatting may be invisible in print.'
        : status === 'not_applicable'
          ? 'BM-001 form note check: not applicable (not BM-001).'
          : 'BM-001 form note formatting correct.';

    default:
      return `${id}: ${requirement} — ${status}`;
  }
}

/** Build a recommendation from a format check */
function buildRecommendation(check: DocxFormatCheck): string | undefined {
  const { id, status } = check;

  if (status === 'pass' || status === 'not_applicable') return undefined;

  switch (id) {
    case 'FMT-001':
      return 'Ensure the Normal style in document.xml uses Times New Roman at sz=26 (13pt).';
    case 'FMT-002':
      return 'Add "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH" to the document header.';
    case 'FMT-003':
      return 'Make "KHU VỰC 7" bold in the issuing agency header line.';
    case 'FMT-004':
      return 'Visual inspection required: ensure underline is only under "KHU VỰC 7" and not the full line width.';
    case 'FMT-005':
      return 'Set font size to 8pt (sz=16 in half-points) for the circular reference line.';
    case 'FMT-006':
      return 'Add "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM" to the header right block.';
    case 'FMT-007':
      return 'Set "Độc lập - Tự do - Hạnh phúc" to bold size 14 (sz=28).';
    case 'FMT-008':
      return 'Visual inspection required: ensure motto underline width matches exact motto text width.';
    case 'FMT-009':
      return 'Ensure issue date follows pattern "ngày DD tháng MM năm YYYY" in italic.';
    case 'FMT-010':
      return 'Visual inspection required: align Số and date lines horizontally.';
    case 'FMT-011':
      return 'Set body main titles (QUYẾT ĐỊNH, LỆNH, etc.) to bold size 14 (sz=28).';
    case 'FMT-012':
      return 'Set Điều and section heading lines to bold.';
    case 'FMT-013':
      return 'Add "Nơi nhận:" label with bold italic formatting to footer.';
    case 'FMT-014':
      return 'Set footer recipient lines to size 11 (sz=22 in half-points).';
    case 'FMT-015':
      return 'Set signature title (Viện trưởng, Kiểm sát viên, etc.) to bold size 14 (sz=28).';
    case 'FMT-016':
      return 'Add PAGE field to document footer for page numbering.';
    case 'FMT-017':
      return 'Add <w:titlePg/> to document section properties in document.xml.';
    case 'FMT-018':
      return 'BM-001: ensure all text in "Tôi:" receiver paragraph uses explicit color #000000.';
    case 'FMT-019':
      return 'BM-001: ensure Mẫu số 01/HS textbox uses explicit black text (#000000) at 8pt.';
    default:
      return 'Review formatting against VKS Khu vực 7 style profile.';
  }
}

@Injectable()
export class DocxStyleAuditService {
  private readonly profile = VKS_KHU_VUC_7_STYLE_PROFILE;

  /**
   * Audit a DOCX file from its path on disk.
   * Does NOT mutate the file.
   */
  async auditDocxFromFile(filePath: string): Promise<DocxStyleAuditResult> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const buffer = fs.readFileSync(filePath);
    return this.auditDocxFromBuffer(buffer);
  }

  /**
   * Audit a DOCX from an in-memory buffer.
   * Does NOT mutate the buffer.
   */
  async auditDocxFromBuffer(buffer: Buffer): Promise<DocxStyleAuditResult> {
    const parts = await extractOoxmlPartsFromDocx(buffer);
    const rawAudit = auditDocxFormat(parts);

    return this.buildAuditResult(rawAudit);
  }

  /**
   * Audit a DOCX from OOXML parts already extracted.
   * Used when the parts are already available (e.g., from PDF conversion pipeline).
   */
  async auditDocxFromParts(
    parts: Awaited<ReturnType<typeof extractOoxmlPartsFromDocx>>,
  ): Promise<DocxStyleAuditResult> {
    const rawAudit = auditDocxFormat(parts);
    return this.buildAuditResult(rawAudit);
  }

  private buildAuditResult(rawAudit: DocxFormatAudit): DocxStyleAuditResult {
    const findings: AuditFinding[] = rawAudit.checks.map((check) => ({
      severity: auditorStatusToSeverity(check.status),
      code: check.id,
      message: buildFindingMessage(check, this.profile),
      location: checkIdToLocation(check.id),
      recommendation: buildRecommendation(check),
      sourceCheckId: check.id,
    }));

    // Count by status
    const summary = {
      total: rawAudit.checks.length,
      pass: rawAudit.checks.filter((c) => c.status === 'pass').length,
      warning: rawAudit.checks.filter(
        (c) => c.status === 'warning' || c.status === 'not_detectable',
      ).length,
      fail: rawAudit.checks.filter((c) => c.status === 'fail').length,
      notDetectable: rawAudit.checks.filter(
        (c) => c.status === 'not_detectable',
      ).length,
      notApplicable: rawAudit.checks.filter(
        (c) => c.status === 'not_applicable',
      ).length,
    };

    const resultStatus =
      rawAudit.status === 'fail'
        ? 'FAIL'
        : rawAudit.status === 'warning'
          ? 'WARN'
          : 'PASS';

    return {
      status: resultStatus,
      profileId: this.profile.profileId,
      profileName: this.profile.profileName,
      summary,
      findings,
      rawAudit,
    };
  }
}

// Re-export for consumers
export { extractOoxmlPartsFromDocx } from '../rendering/infrastructure/docx-format-auditor';
export type {
  DocxFormatAudit,
  DocxFormatCheck,
  DocxFormatCheckStatus,
} from '../rendering/infrastructure/docx-format-auditor';
