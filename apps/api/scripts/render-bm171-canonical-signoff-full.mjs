#!/usr/bin/env node
/**
 * PR7A.4 — Render a fresh canonical BM-171 DOCX via the production render
 * path using the FULL synthetic fixture (34/34 slots filled with
 * non-real-PII placeholder data).
 *
 * This script exists so Planner can review a render that closely
 * resembles a real user-typed case panel (each locked-contract slot
 * carries a realistic value) instead of the sparse 4-of-34 fixture.
 * It still uses the production render path
 * (ContractRenderPlanBuilder + DocxtemplaterContractRenderEngine) and
 * the BM-171 style profile (run-style + paragraph-drop rules).
 *
 * The full fixture proves:
 *   - The legal-basis block between "TRẢ LẠI TÀI SẢN" and "QUYẾT ĐỊNH:"
 *     is preserved when the legal-basis slots are FILLED. The
 *     `drop_legal_basis_blank_block` rule has `onlyIfAllEmpty: true`
 *     so it is a no-op when those paragraphs carry real text.
 *   - The asset-owner / address / signature blocks render with real
 *     synthetic text and survive the pipeline.
 *   - Notes 12 and 13 remain suppressed by the BM-171 profile's
 *     `drop_drafter_note_12` / `drop_drafter_note_13` rules (gated
 *     by `requireSuperscriptPrefix`).
 *
 * No locking boundary is crossed:
 *   - The normalized DOCX at
 *     `storage/templates/normalized-docx/BM-171/BM-171_normalized.docx`
 *     is NOT mutated.
 *   - The locked contract at
 *     `docs/audit/docx/contracts/locked/BM-171__*.contract.locked.json`
 *     is NOT mutated.
 *   - Only the `formData` payload passed to the production renderer is
 *     widened. This payload is plain in-memory data the renderer
 *     substitutes into `{{slot}}` placeholders; it is not part of the
 *     locked contract.
 *
 * Invocation (called by the BM-171 visual sign-off packet builder):
 *
 *   BM171_SIGNOFF_DOCX_PATH=<abs path>
 *   BM171_SIGNOFF_OUT_ROOT=<abs path>
 *   BM171_SIGNOFF_REPO_ROOT=<abs path>
 *   pnpm --filter api exec tsx ./scripts/render-bm171-canonical-signoff-full.mjs
 *
 * Exit codes:
 *   0 — render OK
 *   1 — infra failure (template missing, locked contract missing, render error)
 *   2 — usage error (env var missing)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';

import PizZip from 'pizzip';
import {
  buildArchiveLine,
  formatSlashDate,
  formatVietnamesePlaceDateLine,
  splitIsoDateToVietnameseParts,
} from '@qllaw/form-contracts';

import { ContractRenderPlanBuilder } from '../src/modules/documents/rendering/application/contract-render-plan.builder';
import { DocxtemplaterContractRenderEngine } from '../src/modules/documents/rendering/infrastructure/docxtemplater-contract-render-engine';
import { extractDocumentXmlFromZip } from '../src/modules/documents/rendering/infrastructure/docx-semantic-comparator';

const REPO_ROOT = process.env.BM171_SIGNOFF_REPO_ROOT ?? process.cwd();

const DOCX_OUT_PATH = process.env.BM171_SIGNOFF_DOCX_PATH ?? '';
if (!DOCX_OUT_PATH) {
  console.error(
    '[FAIL] Missing env var BM171_SIGNOFF_DOCX_PATH (absolute path for the rendered DOCX copy).',
  );
  process.exit(2);
}

const OUT_ROOT = process.env.BM171_SIGNOFF_OUT_ROOT ?? '';
if (!OUT_ROOT) {
  console.error(
    '[FAIL] Missing env var BM171_SIGNOFF_OUT_ROOT (absolute path for shadow artefacts).',
  );
  process.exit(2);
}

/**
 * Full canonical BM-171 synthetic fixture (PR7A.4).
 *
 * Every slot listed in
 * `docs/audit/docx/contracts/locked/BM-171__46b9a8be4e01.contract.locked.json`
 * is filled with non-real-PII placeholder data. The slot IDs and
 * transforms are reproduced from the locked contract; the values
 * themselves are clearly Vietnamese-language synthetic data.
 *
 * The dates are real ISO dates that flow through the shared toolkit
 * (`formatSlashDate`, `formatVietnamesePlaceDateLine`,
 * `buildArchiveLine`) so the visible text is byte-identical to what
 * a real panel would emit for the same input.
 *
 * 27 of 34 slots were left empty in the PR7A canonical fixture
 * because the locked contract declares them required and the
 * planner refused to invent values. The Planner's PR7A.4 directive
 * ("Add BM-171 full canonical synthetic fixture") explicitly
 * authorises this script's population. The fixture uses clearly
 * recognisable synthetic markers ("Nguyễn Văn A", "Phường Bến
 * Nghé", "01/QĐ-VKSKV7") so no real PII is rendered.
 */
const BM171_FIXTURE_INPUT = Object.freeze({
  // Header — agency
  agencyParentName: 'VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH',
  agencyName: 'VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7',
  // Header — document
  documentCode: '01/QĐ-VKSKV7',
  documentIssuePlace: 'TP. Hồ Chí Minh',
  documentIssueDate: '2026-07-04',
  // Body — issuer / title
  issuerTitle: 'VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7',
  // Body — legal basis block (between TRẢ LẠI TÀI SẢN and QUYẾT ĐỊNH:)
  legalBasisProcedureLine:
    'Căn cứ Điều 134, Điều 212 Bộ luật Tố tụng hình sự năm 2015;',
  caseDecisionLegalBasisLine:
    'Căn cứ Quyết định truy tố số 02/QĐ-VKS-KV7 ngày 12/03/2026 của Viện Kiểm sát nhân dân Khu vực 7;',
  accusedDecisionLegalBasisLine:
    'Căn cứ Quyết định áp dụng biện pháp tạm giam số 15/QĐ-BCA ngày 20/02/2026;',
  investigationConclusionLegalBasisLine:
    'Căn cứ Kết luận điều tra số 21/KLĐT-PCA ngày 28/02/2026 của Cơ quan Cảnh sát điều tra;',
  caseSuspensionLegalBasisLine:
    'Căn cứ Quyết định tạm đình chỉ vụ án số 03/QĐ-VKS-KV7 ngày 05/03/2026;',
  accusedSuspensionLegalBasisLine:
    'Căn cứ Quyết định tạm đình chỉ đối với bị can số 04/QĐ-VKS-KV7 ngày 05/03/2026;',
  considerationLine:
    'Xét thấy tài sản bị tạm giữ không còn liên quan đến việc giải quyết vụ án và cần trả lại cho chủ sở hữu, quản lý hợp pháp theo quy định tại Điều 212 Bộ luật Tố tụng hình sự;',
  // Body — assets
  assetListLine:
    '1. 01 chiếc xe máy Honda Wave RSX, biển số 59C1-123.45, màu đỏ-đen, năm sản xuất 2018, khung JL110E-1234567, máy JL110E-7654321;\n2. 01 sổ tiết kiệm Ngân hàng TMCP Ngoại thương Việt Nam, chi nhánh TP.HCM, số tài khoản 0011-2233-4455-66, số dư 12.500.000 đồng (Mười hai triệu năm trăm nghìn đồng);',
  // Body — asset owner
  assetOwnerFullName: 'Nguyễn Văn A',
  assetOwnerGenderText: 'Nam',
  assetOwnerOtherName: 'Không có',
  assetOwnerDateOfBirth: '1985-09-08',
  assetOwnerPlaceOfBirth: 'Tỉnh Bình Dương',
  assetOwnerNationality: 'Việt Nam',
  assetOwnerEthnicity: 'Kinh',
  assetOwnerReligion: 'Không',
  assetOwnerOccupation: 'Lao động tự do',
  assetOwnerIdentityNo: '079085001234',
  assetOwnerIdentityIssuedDate: '2021-12-14',
  assetOwnerIdentityIssuedPlace: 'Cục Cảnh sát Quản lý hành chính về trật tự xã hội',
  assetOwnerPermanentResidence:
    'Số 12, đường Nguyễn Trãi, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh',
  assetOwnerTemporaryResidence: 'Không có',
  assetOwnerCurrentResidence:
    'Số 12, đường Nguyễn Trãi, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh',
  // Body — article 2 request
  executionRequestLine:
    'Yêu cầu Phòng Cảnh sát Quản lý hành chính về trật tự xã hội thuộc Công an Thành phố Hồ Chí Minh chuyển giao tài sản nêu tại Điều 1 cho ông Nguyễn Văn A trong thời hạn 05 ngày làm việc kể từ ngày nhận được Quyết định.',
  // Sign
  signMode: 'Ký thay',
  positionTitle: 'VIỆN TRƯỞNG',
  signerName: 'Trần Thị B',
  // Recipients
  recipientsLine1: 'Phòng CSQLHC TTXH Công an TP.HCM;',
  recipientsArchiveLineInput: '',
});

const BM171_PAYLOAD = Object.freeze({
  // P0011 — agency
  'agency.parentName': BM171_FIXTURE_INPUT.agencyParentName,
  'agency.name': BM171_FIXTURE_INPUT.agencyName,

  // P0012 — document code
  'document.documentCode': BM171_FIXTURE_INPUT.documentCode,

  // P0019 — issue place + date (date transform, alias of identity)
  'document.issuePlaceAndDateLine': formatVietnamesePlaceDateLine({
    place: BM171_FIXTURE_INPUT.documentIssuePlace,
    isoDate: BM171_FIXTURE_INPUT.documentIssueDate,
    defaultPlace: 'TP. Hồ Chí Minh',
  }),

  // P0023 — issuer title (bold rendered by BM-171 profile; preserved as literal)
  'official.issuerTitle': BM171_FIXTURE_INPUT.issuerTitle,

  // P0024..P0030 — legal-basis block (each is a separate multi-line slot).
  // Filling these is the KEY TEST for the `drop_legal_basis_blank_block`
  // rule's safety: when these slots are non-empty, the rule is a no-op
  // (onlyIfAllEmpty: true → rule refuses to remove non-empty paragraphs).
  'legalBasis.procedureArticlesLine': BM171_FIXTURE_INPUT.legalBasisProcedureLine,
  'caseDecision.prosecutionDecisionLegalBasisLine':
    BM171_FIXTURE_INPUT.caseDecisionLegalBasisLine,
  'accusedDecision.prosecutionDecisionLegalBasisLine':
    BM171_FIXTURE_INPUT.accusedDecisionLegalBasisLine,
  'assetReturn.investigationConclusionLegalBasisLine':
    BM171_FIXTURE_INPUT.investigationConclusionLegalBasisLine,
  'assetReturn.caseSuspensionDecisionLegalBasisLine':
    BM171_FIXTURE_INPUT.caseSuspensionLegalBasisLine,
  'assetReturn.accusedSuspensionDecisionLegalBasisLine':
    BM171_FIXTURE_INPUT.accusedSuspensionLegalBasisLine,
  'assetReturn.considerationLine': BM171_FIXTURE_INPUT.considerationLine,

  // P0033 — asset list
  'assetReturn.assetListLine': BM171_FIXTURE_INPUT.assetListLine,

  // P0034..P0038 — asset owner
  'assetOwner.fullName': BM171_FIXTURE_INPUT.assetOwnerFullName,
  'assetOwner.genderText': BM171_FIXTURE_INPUT.assetOwnerGenderText,
  'assetOwner.otherName': BM171_FIXTURE_INPUT.assetOwnerOtherName,
  'assetOwner.dateOfBirthText': formatSlashDate(
    splitIsoDateToVietnameseParts(BM171_FIXTURE_INPUT.assetOwnerDateOfBirth),
  ),
  'assetOwner.placeOfBirth': BM171_FIXTURE_INPUT.assetOwnerPlaceOfBirth,
  'assetOwner.nationality': BM171_FIXTURE_INPUT.assetOwnerNationality,
  'assetOwner.ethnicity': BM171_FIXTURE_INPUT.assetOwnerEthnicity,
  'assetOwner.religion': BM171_FIXTURE_INPUT.assetOwnerReligion,
  'assetOwner.occupation': BM171_FIXTURE_INPUT.assetOwnerOccupation,

  // P0039..P0041 — identity
  'assetOwner.identityNo': BM171_FIXTURE_INPUT.assetOwnerIdentityNo,
  'assetOwner.identityIssuedDateText': formatSlashDate(
    splitIsoDateToVietnameseParts(BM171_FIXTURE_INPUT.assetOwnerIdentityIssuedDate),
  ),
  'assetOwner.identityIssuedPlace': BM171_FIXTURE_INPUT.assetOwnerIdentityIssuedPlace,
  'assetOwner.permanentResidence': BM171_FIXTURE_INPUT.assetOwnerPermanentResidence,

  // P0042..P0043 — addresses
  'assetOwner.temporaryResidence': BM171_FIXTURE_INPUT.assetOwnerTemporaryResidence,
  'assetOwner.currentResidence': BM171_FIXTURE_INPUT.assetOwnerCurrentResidence,

  // P0045 — article 2
  'assetReturn.executionRequestLine': BM171_FIXTURE_INPUT.executionRequestLine,

  // P0048..P0049 — recipients
  'recipients.line1': BM171_FIXTURE_INPUT.recipientsLine1,
  'recipients.archiveLine': buildArchiveLine(
    BM171_FIXTURE_INPUT.recipientsArchiveLineInput,
    'Lưu: HSVA, HSKS, VP.',
  ),

  // P0050..P0055 — signature
  'signature.signMode': BM171_FIXTURE_INPUT.signMode,
  'signature.positionTitle': BM171_FIXTURE_INPUT.positionTitle,
  'signature.signerName': BM171_FIXTURE_INPUT.signerName,
});

function makeWorkspacePaths() {
  return {
    contractsRoot: `${REPO_ROOT}/docs/audit/docx/contracts`,
    normalizedTemplatesRoot: `${REPO_ROOT}/storage/templates/normalized-docx`,
    repoRoot: REPO_ROOT,
  };
}

function makePrismaService() {
  return { $connect: () => undefined, $disconnect: () => undefined };
}

async function main() {
  const workspacePaths = makeWorkspacePaths();
  const plan = new ContractRenderPlanBuilder(
    makePrismaService(),
    workspacePaths,
  ).build({
    documentId: 'pr7a4-bm171-canonical-signoff-full',
    formData: BM171_PAYLOAD,
    templateCode: 'BM-171',
  });

  const result = await new DocxtemplaterContractRenderEngine(
    workspacePaths,
  ).renderShadow(plan, BM171_PAYLOAD, OUT_ROOT);

  const buffer = readFileSync(result.artifacts.docxPath);
  mkdirSync(dirname(DOCX_OUT_PATH), { recursive: true });
  writeFileSync(DOCX_OUT_PATH, buffer);

  const xml = await extractDocumentXmlFromZip(buffer);
  const visibleText = xml
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const payload = {
    docxPath: DOCX_OUT_PATH,
    shadowPath: result.shadowPath,
    manifestPath: result.artifacts.manifestPath,
    byteLength: buffer.byteLength,
    sha256: createHash('sha256').update(buffer).digest('hex'),
    visibleText,
    semanticStatus: result.semanticComparison.status,
    formatStatus: result.formatAudit.status,
    packageIntegrityStatus: result.packageIntegrity.status,
    renderPlan: {
      templateCode: plan.templateCode,
      fieldCount: plan.fields.length,
      bindingCount: plan.bindings.length,
      missingRequiredCount: plan.missingRequired.length,
      warnings: [...plan.warnings],
    },
    fixtureVariant: 'FULL_SYNTHETIC_PR7A_4',
    payloadUsed: BM171_PAYLOAD,
    fixtureInputs: BM171_FIXTURE_INPUT,
  };
  process.stdout.write(JSON.stringify(payload));
}

main().catch((err) => {
  console.error(
    '[FAIL]',
    err && err.stack ? err.stack : err && err.message ? err.message : String(err),
  );
  process.exit(1);
});
