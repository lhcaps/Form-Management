#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_REVIEW_PATH = join(
  'docs',
  'audit',
  'legal-semantic-field-review-213',
  'latest.json',
);
const DEFAULT_APPLY_JSON = join(
  'docs',
  'audit',
  'legal-semantic-field-review-213',
  'apply-label.latest.json',
);
const DEFAULT_APPLY_MD = join(
  'docs',
  'audit',
  'legal-semantic-field-review-213',
  'apply-label.latest.md',
);

export const DEFAULT_LABEL_DECISIONS = {
  'BM-096:signature.cheDo': {
    label: 'Nơi thường trú',
    rationale: 'Template-specific DOCX context places this token immediately after "Nơi thường trú:".',
  },
  'BM-096:signature.chucVu': {
    label: 'Nơi thường trú (tiếp)',
    rationale: 'Template-specific DOCX context keeps this token before the "Nơi tạm trú:" marker.',
  },
  'BM-096:signature.nguoiKy': {
    label: 'Nơi tạm trú',
    rationale: 'Template-specific DOCX context places this token immediately after "Nơi tạm trú:".',
  },
  'BM-136:signature.cheDo': {
    label: 'Địa chỉ cư trú',
    rationale: 'Template-specific DOCX context places this token in the residence block before procedural status.',
  },
  'BM-136:signature.chucVu': {
    label: 'Tư cách tham gia tố tụng',
    rationale: 'Template-specific DOCX context places this token immediately after "Tư cách tham gia tố tụng:".',
  },
  'BM-136:signature.nguoiKy': {
    label: 'Người tham gia đối chất thứ ba',
    rationale: 'Template-specific DOCX context places this token after the third participant marker in the confrontation record.',
  },
  'agency.coQuan': {
    label: 'Cơ quan',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'agency.diaDanh': {
    label: 'Địa danh',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'agency.dongDia': {
    label: 'Dòng địa danh',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'agency.issuePlace': {
    label: 'Địa điểm ban hành',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'agency.tenCo': {
    label: 'Tên cơ quan',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'agency.vienKiem': {
    label: 'Viện kiểm sát',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'decision.decisionLine': {
    label: 'Nội dung quyết định',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'decision.summaryLine': {
    label: 'Tóm tắt quyết định',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'document.canCu': {
    label: 'Căn cứ',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'document.chuThe': {
    label: 'Chủ thể liên quan',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'document.dienThoai': {
    label: 'Số điện thoại',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'document.dieu1': {
    label: 'Nội dung Điều 1',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'document.dieu2': {
    label: 'Nội dung Điều 2',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'document.donVi': {
    label: 'Đơn vị',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'document.fullDocumentCode': {
    label: 'Số văn bản / quyết định',
    rationale: 'Curated from semantic field path and existing reviewed contract labels.',
  },
  'document.hoTen': {
    label: 'Họ tên',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'document.issuePlaceAndDateLine': {
    label: 'Địa danh, ngày ban hành',
    rationale: 'Curated from semantic field path and existing reviewed contract labels.',
  },
  'document.lyDo': {
    label: 'Lý do',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'document.namSinh': {
    label: 'Năm sinh',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'document.ngayBan': {
    label: 'Ngày ban hành',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'document.ngayLap': {
    label: 'Ngày lập',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'document.ngayQd': {
    label: 'Ngày quyết định',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'document.ngaySinh': {
    label: 'Ngày sinh',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'document.noiLap': {
    label: 'Nơi lập',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'document.reasonLine': {
    label: 'Căn cứ / lý do',
    rationale: 'Curated from semantic field path and existing reviewed contract labels.',
  },
  'document.reasonLine2': {
    label: 'Căn cứ / lý do bổ sung',
    rationale: 'Curated from semantic field path and existing reviewed contract labels.',
  },
  'document.soBien': {
    label: 'Số biên bản',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'document.soDanh': {
    label: 'Số danh sách',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'document.soKien': {
    label: 'Số kiến nghị',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'document.soPhieu': {
    label: 'Số phiếu',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'document.soQd': {
    label: 'Số quyết định',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'document.soQuyet': {
    label: 'Số quyết định',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'document.soThong': {
    label: 'Số thông báo',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'document.soTien': {
    label: 'Số tiền',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'document.soVan': {
    label: 'Số văn bản',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'document.soYeu': {
    label: 'Số yêu cầu',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'document.summaryLine': {
    label: 'Tóm tắt / liệt kê',
    rationale: 'Curated from semantic field path and existing reviewed contract labels.',
  },
  'document.tenVu': {
    label: 'Tên vụ án / vụ việc',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'document.thoiHan': {
    label: 'Thời hạn',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'document.vietTat': {
    label: 'Tên viết tắt',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'legalBasis.canCu': {
    label: 'Căn cứ pháp lý',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'person.dateOfBirth': {
    label: 'Ngày sinh',
    rationale: 'Curated from semantic field path and existing reviewed contract labels.',
  },
  'person.hoTen': {
    label: 'Họ tên',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'person.tenBi': {
    label: 'Tên bị can / bị cáo',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'person.tenNguoi': {
    label: 'Tên người liên quan',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'person.toiDanh': {
    label: 'Tội danh',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'recipients.archiveLine': {
    label: 'Lưu hồ sơ',
    rationale: 'Curated from semantic field path and existing reviewed contract labels.',
  },
  'recipients.luuHo': {
    label: 'Lưu hồ sơ',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'recipients.noiNhan': {
    label: 'Nơi nhận',
    rationale: 'Curated from semantic field path and actual DOCX token context.',
  },
  'recipients.personLine': {
    label: 'Người bị áp dụng',
    rationale: 'Curated from semantic field path and existing reviewed contract labels.',
  },
};

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalize(value) {
  return value == null ? '' : String(value).trim();
}

function toPath(root, value) {
  return resolve(root, normalize(value));
}

function findField(contract, fieldPath) {
  return asArray(contract.canonicalFields).find((field) => field.path === fieldPath) ?? null;
}

function findSlot(contract, row, fieldPath) {
  const slotId = normalize(row.docxSlotSlotId) || fieldPath;
  return (
    asArray(contract.docxSlots).find((slot) => slot.slotId === slotId) ??
    asArray(contract.docxSlots).find((slot) => slot.slotId === fieldPath) ??
    null
  );
}

function findBinding(contract, row, fieldPath) {
  const slotId = normalize(row.docxSlotSlotId) || fieldPath;
  return (
    asArray(contract.renderBindings).find(
      (binding) => binding.from === fieldPath && binding.slotId === slotId,
    ) ??
    asArray(contract.renderBindings).find((binding) => binding.from === fieldPath) ??
    asArray(contract.renderBindings).find((binding) => binding.slotId === slotId) ??
    null
  );
}

function decisionFor(row, labelDecisions) {
  const templateKey = `${row.templateCode}:${row.fieldPath}`;
  const rawDecision = labelDecisions?.[templateKey] ?? labelDecisions?.[row.fieldPath];
  if (!rawDecision) return null;
  if (typeof rawDecision === 'string') {
    return {
      label: rawDecision,
      rationale: `Curated label decision for ${row.fieldPath}.`,
    };
  }
  const label = normalize(rawDecision.label);
  if (!label) return null;
  return {
    label,
    rationale: normalize(rawDecision.rationale) || `Curated label decision for ${row.fieldPath}.`,
  };
}

function isEligible(row, labelDecisions) {
  if (row.disposition !== 'FIX_LABEL') return false;
  if (!(row.confidence === 'MEDIUM' || row.confidence === 'HIGH')) return false;
  if (row.actualDocxHasSemanticToken !== true) return false;
  return decisionFor(row, labelDecisions) !== null;
}

export function buildLabelReviewEvidence(row, decision, reviewedAt, reviewedBy) {
  return {
    reviewedAt,
    reviewedBy,
    disposition: row.disposition,
    confidence: row.confidence,
    oldLabel: row.fieldLabel ?? '',
    newLabel: decision.label,
    docxSlotId: row.docxSlotSlotId ?? '',
    actualDocxContext: row.actualDocxContext ?? '',
    actualDocxRawPattern: row.actualDocxEvidenceRawPattern ?? '',
    rationale: decision.rationale,
  };
}

function applyRow(contract, row, decision, options) {
  const fieldPath = normalize(row.fieldPath);
  const field = findField(contract, fieldPath);
  if (!field) return { changed: false, reason: 'field not found' };

  const changes = [];
  if (field.label !== decision.label) {
    field.label = decision.label;
    changes.push('field.label');
  }
  if (field.reviewRequired !== false) {
    field.reviewRequired = false;
    changes.push('field.reviewRequired');
  }

  const evidence = buildLabelReviewEvidence(row, decision, options.reviewedAt, options.reviewedBy);
  field.reviewedBy = options.reviewedBy;
  field.reviewedAt = options.reviewedAt;
  field.reviewEvidence = evidence;
  changes.push('field.reviewEvidence');

  const slot = findSlot(contract, row, fieldPath);
  if (slot && slot.reviewRequired !== false) {
    slot.reviewRequired = false;
    slot.reviewedBy = options.reviewedBy;
    slot.reviewedAt = options.reviewedAt;
    slot.reviewEvidence = evidence;
    changes.push('docxSlot.reviewRequired');
  }

  const binding = findBinding(contract, row, fieldPath);
  if (binding && binding.reviewRequired !== false) {
    binding.reviewRequired = false;
    binding.reviewedBy = options.reviewedBy;
    binding.reviewedAt = options.reviewedAt;
    binding.reviewEvidence = evidence;
    changes.push('renderBinding.reviewRequired');
  }

  return { changed: changes.length > 0, changes };
}

function buildMarkdown(report) {
  const rows = [
    ['Metric', 'Value'],
    ['Mode', report.write ? 'write' : 'dry-run'],
    ['Scanned rows', report.summary.scannedRows],
    ['Eligible rows', report.summary.eligibleRows],
    ['Contracts changed', report.summary.contractsChanged],
    ['Labels fixed', report.summary.labelsFixed],
    ['Skipped rows', report.summary.skippedRows],
  ];
  const lines = [
    '# Legal Semantic Label Review Apply',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    '',
    ...rows.map((row) => `| ${row[0]} | ${row[1]} |`),
    '',
    '## Changes',
    '',
    '| BM | Field | Label | Contract |',
    '|---|---|---|---|',
    ...report.changes.map(
      (change) =>
        `| ${change.templateCode} | \`${change.fieldPath}\` | ${change.newLabel} | ${change.lockedContractPath} |`,
    ),
    '',
  ];
  return lines.join('\n');
}

async function writeApplyReport(root, report, options) {
  const jsonPath = toPath(root, options.applyJsonPath ?? DEFAULT_APPLY_JSON);
  const mdPath = toPath(root, options.applyMdPath ?? DEFAULT_APPLY_MD);
  await mkdir(dirname(jsonPath), { recursive: true });
  await mkdir(dirname(mdPath), { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(mdPath, buildMarkdown(report));
  return { jsonPath, mdPath };
}

export async function applyLegalSemanticLabelReview(root = process.cwd(), options = {}) {
  const resolvedRoot = resolve(root);
  const reviewPath = toPath(resolvedRoot, options.reviewPath ?? DEFAULT_REVIEW_PATH);
  const reviewedAt = options.reviewedAt ?? new Date().toISOString();
  const reviewedBy = options.reviewedBy ?? 'Codex legal semantic label review';
  const labelDecisions = options.labelDecisions ?? DEFAULT_LABEL_DECISIONS;
  const review = JSON.parse(await readFile(reviewPath, 'utf8'));
  const rows = asArray(review.rows);
  const eligibleRows = rows.filter((row) => isEligible(row, labelDecisions));
  const skippedRows = rows.length - eligibleRows.length;
  const byContract = new Map();

  for (const row of eligibleRows) {
    const contractPath = toPath(resolvedRoot, row.lockedContractPath);
    const current = byContract.get(contractPath) ?? [];
    current.push(row);
    byContract.set(contractPath, current);
  }

  const changes = [];
  let contractsChanged = 0;
  let labelsFixed = 0;

  for (const [contractPath, contractRows] of byContract.entries()) {
    const contract = JSON.parse(await readFile(contractPath, 'utf8'));
    let contractChanged = false;

    for (const row of contractRows) {
      const decision = decisionFor(row, labelDecisions);
      const result = applyRow(contract, row, decision, { reviewedAt, reviewedBy });
      if (!result.changed) continue;
      contractChanged = true;
      labelsFixed += 1;
      changes.push({
        templateCode: row.templateCode,
        fieldPath: row.fieldPath,
        oldLabel: row.fieldLabel ?? '',
        newLabel: decision.label,
        lockedContractPath: row.lockedContractPath,
        changes: result.changes,
      });
    }

    if (contractChanged) {
      contractsChanged += 1;
      if (options.write === true) {
        await writeFile(contractPath, `${JSON.stringify(contract, null, 2)}\n`);
      }
    }
  }

  const report = {
    schemaVersion: 1,
    generatedAt: reviewedAt,
    generatedBy: 'scripts/audit/apply-legal-semantic-label-review-213.mjs',
    write: options.write === true,
    reviewPath,
    reviewedBy,
    summary: {
      scannedRows: rows.length,
      eligibleRows: eligibleRows.length,
      contractsChanged,
      labelsFixed,
      skippedRows,
    },
    changes,
  };

  if (options.report !== false) {
    report.reportPaths = await writeApplyReport(resolvedRoot, report, options);
  }

  return report;
}

function parseArgs(argv) {
  const options = { root: process.cwd(), write: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--root') options.root = argv[++index];
    else if (arg === '--review') options.reviewPath = argv[++index];
    else if (arg === '--write') options.write = true;
  }
  return options;
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const report = await applyLegalSemanticLabelReview(options.root, options);
  console.log(
    `LEGAL_SEMANTIC_LABEL_REVIEW_APPLY mode=${report.write ? 'write' : 'dry-run'} eligible=${report.summary.eligibleRows} changed=${report.summary.contractsChanged}`,
  );
  console.log(`Labels fixed: ${report.summary.labelsFixed}`);
  if (report.reportPaths) {
    console.log(`JSON: ${report.reportPaths.jsonPath}`);
    console.log(`MD: ${report.reportPaths.mdPath}`);
  }
}

const isCli = process.argv[1]
  ? import.meta.url === pathToFileURL(resolve(process.argv[1])).href
  : false;

if (isCli) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
