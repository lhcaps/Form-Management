/**
 * BM-139 — Kiến nghị khắc phục vi phạm (corrective recommendation)
 * BM-140 — Kiến nghị áp dụng biện pháp phòng ngừa (preventive recommendation)
 *
 * Both forms are members of the KIẾN NGHỊ (recommendation) family with two
 * distinct procedural subfamilies. They share the KIẾN NGHỊ heading (P0010)
 * and the /KN-VKS suffix (P0006) but have distinct operative verbs:
 *   - BM-139 = "Khắc phục vi phạm pháp luật" (corrective)
 *   - BM-140 = "Áp dụng biện pháp phòng ngừa tội phạm, vi phạm pháp luật" (preventive)
 *
 * Source contracts: `docs/audit/docx/compiled-v2/BM-139.compiled.json`
 *                   `docs/audit/docx/compiled-v2/BM-140.compiled.json`
 * Source extracts:  `docs/audit/docx/extracted/BM-139__23306e6022bd.extract.md`
 *                   `docs/audit/docx/extracted/BM-140__13e1ade15acd.extract.md`
 *
 * The BM-139 extract canonical selection: two extracts exist for BM-139
 * (`__9795f14f931c.extract.md` 49 paragraphs title="...nguồn tin, khởi tố,
 * điều tra, truy tố"; `__23306e6022bd.extract.md` 47 paragraphs title=
 * "...khởi tố, điều tra"). The compiled contract title is "Kiến nghị khắc
 * phục vi phạm trong hoạt động khởi tố, điều tra" — matching the 47-paragraph
 * `__23306e6022bd` extract. The 49-paragraph `__9795f14f931c` extract is a
 * distinct variant; only the title-matching extract is treated as canonical
 * for this curation turn.
 *
 * BM-139 compiled contract has 6 fields and 2 sections; 3 of the 6 fields
 * carry GENERIC PLACEHOLDER labels ("Trường cần điền (document)") in the
 * compiled contract — these are not source-aligned and must be replaced
 * by source-aligned labels in the curated profile while the field keys
 * remain unchanged (forbidden by the GATE C scope).
 *
 * BM-140 compiled contract has 5 fields and 1 section (`section-thong-tin-
 * bieu-mau`); the pre-curation profile introduced a phantom `section-dong-
 * ngay` that was never declared in the compiled contract and must be removed.
 *
 * Scoped semantic assertions (split into three independent gates):
 *   - assertBm139DocumentIdentity / assertBm140DocumentIdentity: throw on
 *     any mutation of identity-bearing objects.
 *   - assertBm139PresentationIdentity / assertBm140PresentationIdentity:
 *     throw on any mutation of presentation labels / sections / demo.
 *   - assertBm139ProvenanceIdentity / assertBm140ProvenanceIdentity: throw
 *     on any mutation of provenance row contents.
 *
 * Run: node --test test/forms/bm139-140-curation.test.mjs
 */

import assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(TEST_DIR, '..', '..');

const helperUrl = pathToFileURL(
  resolve(PROJECT_ROOT, 'test/forms/helpers/runtime-ux-curation-validator.mjs'),
).href;
const { loadProfile, validateCuration } = await import(helperUrl);

const provenanceUrl = pathToFileURL(
  resolve(PROJECT_ROOT, 'test/forms/helpers/provenance-source-integrity.mjs'),
).href;
const {
  readProvenanceLedger,
  findProvenanceRow,
  PROJECT_ROOT: HELPER_PROJECT_ROOT,
} = await import(provenanceUrl);

assert.equal(
  HELPER_PROJECT_ROOT,
  PROJECT_ROOT,
  'PROJECT_ROOT mismatch between provenance helper and test root',
);

const requireFromHere = createRequire(import.meta.url);
const fs = requireFromHere('node:fs');

// ============================================================
// BM-139 constants (corrective recommendation — Kiến nghị khắc phục vi phạm)
// ============================================================
const BM139_CODE = 'BM-139';
const BM139_PROFILE_VAR = 'BM139_RUNTIME_UX_PROFILE';
const BM139_COMPILED_PATH = 'docs/audit/docx/compiled-v2/BM-139.compiled.json';
const BM139_EXTRACT_PATH =
  'docs/audit/docx/extracted/BM-139__23306e6022bd.extract.md';
const BM139_COMPILED_TITLE =
  'Kiến nghị khắc phục vi phạm trong hoạt động khởi tố, điều tra';
const BM139_EXTRACT_HEADING = 'KIẾN NGHỊ';
const BM139_COMPILED_FILE_SHA256 =
  'ab569269b827dbb73805cbec3f3918d83c2eaac703865e6c7a378637e9034942';
const BM139_EXTRACT_FILE_SHA256 =
  '2a6f4a5a53192c49d615aeab5a5ba4da4ea9afdaf850a96142203d024dd7d934';

// Sibling identity tokens (BM-140 = corrective partner; BM-141/142/143 = Quyết
// định prosecution family — NOT siblings).
const BM140_HEADING_FRAGMENT = 'KIẾN NGHỊ'; // shared family heading
const BM140_TITLE_FRAGMENT = 'phòng ngừa';
const BM141_HEADING_FRAGMENT = 'QUYẾT ĐỊNH';
const BM141_TITLE_FRAGMENT = 'Quyết định';
const BM138_HEADING_FRAGMENT = 'YÊU CẦU';
const BM138_TITLE_FRAGMENT = 'Yêu cầu cung cấp';

const BM139_EXPECTED_FIELDS = [
  'agency.vienKiem',
  'document.soQuyet',
  'agency.diaDanh',
  'recipients.localityName',
  'person.personFullName',
  'document.issueDate',
];

const BM139_EXPECTED_SECTION_IDS = ['section-document', 'section-thong-tin-bieu-mau'];
// Presentation Sections list must contain BOTH compiled section ids; phantom
// ids are forbidden.
const BM139_EXPECTED_PRESENTATION_SECTION_IDS = [
  'section-document',
  'section-thong-tin-bieu-mau',
];

// ============================================================
// BM-140 constants (preventive recommendation — Kiến nghị phòng ngừa)
// ============================================================
const BM140_CODE = 'BM-140';
const BM140_PROFILE_VAR = 'BM140_RUNTIME_UX_PROFILE';
const BM140_COMPILED_PATH = 'docs/audit/docx/compiled-v2/BM-140.compiled.json';
const BM140_EXTRACT_PATH =
  'docs/audit/docx/extracted/BM-140__13e1ade15acd.extract.md';
const BM140_COMPILED_TITLE =
  'Kiến nghị áp dụng biện pháp phòng ngừa tội phạm và vi phạm pháp luật';
const BM140_EXTRACT_HEADING = 'KIẾN NGHỊ';
const BM140_COMPILED_FILE_SHA256 =
  'c8e4c8d0a06d36c1a9a7fa2966a0e72531acb138c9529c1be5af5e35a4baf222';
const BM140_EXTRACT_FILE_SHA256 =
  'ca7a3a645e68c70fcca140ccdafcc634b4db662e58f5d4b5ff2e5d5132396a3';

const BM140_EXPECTED_FIELDS = [
  'agency.vienKiem',
  'document.soKien',
  'agency.diaDanh',
  'document.ngayBan',
  'agency.dongDia',
];

const BM140_EXPECTED_SECTION_IDS = ['section-thong-tin-bieu-mau'];

function loadContract(code) {
  const p = resolve(
    PROJECT_ROOT,
    `docs/audit/docx/compiled-v2/${code}.compiled.json`,
  );
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function loadProfileFor(code, profileVar) {
  const p = resolve(
    PROJECT_ROOT,
    `apps/web/src/lib/runtime-ux/bm${code.slice(3)}-runtime-ux-profile.ts`,
  );
  return loadProfile(p, profileVar);
}

// ============================================================
// BM-139 SCOPED DOCUMENT-IDENTITY ASSERTION
// ============================================================

export function assertBm139DocumentIdentity(profile, provenanceRow, compiled) {
  const prof = profile ?? {};
  const row = provenanceRow ?? '';
  const c = compiled ?? {};

  if (prof.templateCode && prof.templateCode !== BM139_CODE) {
    throw new Error(
      `SCOPED_ASSERTION: BM-139 profile.templateCode is "${prof.templateCode}" — must be "${BM139_CODE}"`,
    );
  }
  if (prof.runtimeReady === true) {
    throw new Error(
      `SCOPED_ASSERTION: BM-139 profile declares runtimeReady=true — BM-139 is NOT promoted to runtimeReady`,
    );
  }
  if (c.templateCode && c.templateCode !== BM139_CODE) {
    throw new Error(
      `SCOPED_ASSERTION: BM-139 compiled.templateCode is "${c.templateCode}" — must be "${BM139_CODE}"`,
    );
  }
  if (c.title && c.title !== BM139_COMPILED_TITLE) {
    throw new Error(
      `SCOPED_ASSERTION: BM-139 compiled.title is "${c.title}" — must be "${BM139_COMPILED_TITLE}"`,
    );
  }
  if (c.source?.title && c.source.title !== BM139_COMPILED_TITLE) {
    throw new Error(
      `SCOPED_ASSERTION: BM-139 compiled.source.title is "${c.source.title}" — must be "${BM139_COMPILED_TITLE}"`,
    );
  }
  if (row) {
    const expectedCompiledTitleMarker = `title="${BM139_COMPILED_TITLE}"`;
    if (!row.includes(expectedCompiledTitleMarker)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-139 provenance row missing compiledTitle marker "${expectedCompiledTitleMarker}"`,
      );
    }
    const expectedHeadingMarker = `heading="${BM139_EXTRACT_HEADING}"`;
    if (!row.includes(expectedHeadingMarker)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-139 provenance row missing extractHeading marker "${expectedHeadingMarker}"`,
      );
    }
    // Family boundary token (KIẾN NGHỊ heading) MUST appear.
    if (!row.includes(BM140_HEADING_FRAGMENT)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-139 provenance row missing KIẾN NGHỊ family heading marker`,
      );
    }
    // Exactly ONE extractHeading marker — second-heading injection rejected.
    const headingCount = (row.match(/heading="/gu) ?? []).length;
    if (headingCount !== 1) {
      throw new Error(
        `SCOPED_ASSERTION: BM-139 provenance row contains ${headingCount} extractHeading markers — must be exactly 1`,
      );
    }
  }
  if (row && !row.includes(BM139_COMPILED_PATH)) {
    throw new Error(
      `SCOPED_ASSERTION: BM-139 provenance row does not reference own compiled path "${BM139_COMPILED_PATH}"`,
    );
  }
  if (row && !row.includes(BM139_EXTRACT_PATH)) {
    throw new Error(
      `SCOPED_ASSERTION: BM-139 provenance row does not reference own extract "${BM139_EXTRACT_PATH}"`,
    );
  }
  if (row && !row.includes(BM139_COMPILED_FILE_SHA256)) {
    throw new Error(
      'SCOPED_ASSERTION: BM-139 provenance row does not include own compiled SHA256',
    );
  }
  if (row && !row.includes(BM139_EXTRACT_FILE_SHA256)) {
    throw new Error(
      'SCOPED_ASSERTION: BM-139 provenance row does not include own extract SHA256',
    );
  }
  // Extract-path / extract-SHA pairing invariant: the canonical 47-paragraph
  // extract (`__23306e6022bd`) carries its own SHA. Replacing the path with
  // the alternative variant (`__9795f14f931c`) without updating the SHA
  // (or vice-versa) is rejected.
  if (row && row.includes(BM139_EXTRACT_PATH) && !row.includes(BM139_EXTRACT_FILE_SHA256)) {
    throw new Error(
      'SCOPED_ASSERTION: BM-139 provenance row references canonical extract path without the matching SHA256',
    );
  }
  if (row) {
    const crossPointers = [
      'docs/audit/docx/compiled-v2/BM-138.compiled.json',
      'docs/audit/docx/compiled-v2/BM-141.compiled.json',
      'docs/audit/docx/compiled-v2/BM-140.compiled.json',
      'docs/audit/docx/extracted/BM-138__bf31a1f547b0.extract.md',
      'docs/audit/docx/extracted/BM-139__9795f14f931c.extract.md',
    ];
    for (const p of crossPointers) {
      if (row.includes(p)) {
        throw new Error(
          `SCOPED_ASSERTION: BM-139 provenance row contains cross-form pointer "${p}"`,
        );
      }
    }
  }
}

// ============================================================
// BM-139 SCOPED PRESENTATION-IDENTITY ASSERTION
// ============================================================

// Surface-token blacklist for BM-139 recipient/signer misclassification.
// P0043 of the BM-139 canonical extract is "Ghi tên cơ quan, người có thẩm
// quyền tiếp nhận, giải quyết nguồn tin về tội phạm/khởi tố, điều tra bị
// kiến nghị" (recipient footnote, NOT locality). P0044 is "Ghi chức danh
// người ký" (signer-title footnote, NOT person full-name).
const BM139_RECIPIENT_LOCALITY_LABEL = 'Địa danh / Quận huyện của cơ quan nhận';
const BM139_RECIPIENT_LOCALITY_KEYWORDS = ['Quận huyện của cơ quan nhận'];
const BM139_PERSON_FULLNAME_LABEL = 'Họ và tên người ký';

export function assertBm139PresentationIdentity(profile, compiled) {
  const prof = profile ?? {};
  const fields = prof.fields ?? {};
  const demo = prof.demo ?? {};
  const sections = prof.presentationSections ?? [];
  const c = compiled ?? {};

  if (c.source?.fields && c.source.fields.length !== 6) {
    throw new Error(
      `SCOPED_ASSERTION: BM-139 compiled contract has ${c.source.fields.length} fields — must be exactly 6`,
    );
  }
  // Sections list must match the 2 compiled section ids; phantom ids are
  // forbidden.
  for (const expected of BM139_EXPECTED_PRESENTATION_SECTION_IDS) {
    if (!sections.find((s) => s.id === expected)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-139 profile presentationSection is missing compiled sectionId "${expected}"`,
      );
    }
  }
  for (const sec of sections) {
    if (!BM139_EXPECTED_PRESENTATION_SECTION_IDS.includes(sec.id)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-139 profile presentationSection contains phantom sectionId "${sec.id}" — must be one of ${JSON.stringify(BM139_EXPECTED_PRESENTATION_SECTION_IDS)}`,
      );
    }
    if (!sec.description?.trim()) {
      throw new Error(
        `SCOPED_ASSERTION: BM-139 presentationSection "${sec.id}" has empty description`,
      );
    }
  }
  // Field coverage — every compiled field must appear in exactly one section.
  if (c.source?.fields) {
    const compiledKeys = c.source.fields.map((f) => f.key);
    for (const key of compiledKeys) {
      if (!fields[key]) {
        throw new Error(
          `SCOPED_ASSERTION: BM-139 profile is missing compiled field "${key}"`,
        );
      }
    }
    for (const key of Object.keys(fields)) {
      if (!compiledKeys.includes(key)) {
        throw new Error(
          `SCOPED_ASSERTION: BM-139 profile field "${key}" is not in the compiled contract`,
        );
      }
    }
  }
  // Each compiled field must appear exactly once across presentationSections
  // (if present) — same invariant as BM-137/BM-138.
  const presentationSections = prof.presentationSections ?? [];
  if (presentationSections.length > 0) {
    const presented = presentationSections.flatMap((s) => s.fieldKeys ?? []);
    for (const key of BM139_EXPECTED_FIELDS) {
      const count = presented.filter((k) => k === key).length;
      if (count !== 1) {
        throw new Error(
          `SCOPED_ASSERTION: BM-139 field "${key}" appears ${count} times in presentationSections — must be exactly 1`,
        );
      }
    }
  }
  // Semantic-classification enforcement (Section 10 of brief):
  // - recipients.localityName MUST NOT be labelled as a locality
  //   (its source P0043 is a recipient-identity footnote).
  // - person.personFullName MUST NOT be labelled as a full-name slot
  //   (its source P0044 is a signer-title footnote).
  // - agency.diaDanh helpText MUST NOT claim DIRECT_SLOT/HIGH from
  //   P0041 (a locality marker footnote, not a value slot).
  const recipientsField = fields['recipients.localityName'];
  if (recipientsField) {
    const recipientsLabel = recipientsField.label ?? '';
    const recipientsHelp = recipientsField.helpText ?? '';
    const recipientsPlaceholder = recipientsField.placeholder ?? '';
    if (recipientsLabel === BM139_RECIPIENT_LOCALITY_LABEL) {
      throw new Error(
        `SCOPED_ASSERTION: BM-139 recipients.localityName label is "${recipientsLabel}" — must be the compatibility-mapped label "Cơ quan/người có thẩm quyền nhận kiến nghị" (source P0043 is a recipient footnote, NOT a locality)`,
      );
    }
    if (BM139_RECIPIENT_LOCALITY_KEYWORDS.some((kw) => recipientsLabel.includes(kw))) {
      throw new Error(
        `SCOPED_ASSERTION: BM-139 recipients.localityName label "${recipientsLabel}" classifies the slot as a locality — the source P0043 is the recipient footnote, NOT a locality marker`,
      );
    }
    if (/Địa\s*danh\s*\/\s*Quận\s*huyện/iu.test(recipientsHelp) ||
        /Địa\s*danh\s*\/\s*Quận\s*huyện/iu.test(recipientsPlaceholder)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-139 recipients.localityName helpText/placeholder classifies the slot as a locality — the source P0043 is the recipient footnote, NOT a locality marker`,
      );
    }
  }
  const signerField = fields['person.personFullName'];
  if (signerField) {
    const signerLabel = signerField.label ?? '';
    const signerHelp = signerField.helpText ?? '';
    const signerPlaceholder = signerField.placeholder ?? '';
    if (signerLabel === BM139_PERSON_FULLNAME_LABEL) {
      throw new Error(
        `SCOPED_ASSERTION: BM-139 person.personFullName label is "${signerLabel}" — must be the compatibility-mapped label "Chức danh người ký kiến nghị" (source P0044 is a signer-title footnote, NOT a person full-name)`,
      );
    }
    if (/Họ\s*và\s*tên\s*người\s*ký/u.test(signerLabel) ||
        /Họ\s*và\s*tên\s*người\s*ký/u.test(signerPlaceholder)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-139 person.personFullName label/placeholder classifies the slot as a person-name — the source P0044 is the signer-title footnote "Ghi chức danh người ký", NOT a person full-name`,
      );
    }
    if (/Họ\s*và\s*tên\s*người\s*ký/u.test(signerHelp)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-139 person.personFullName helpText classifies the slot as a person-name — the source P0044 is the signer-title footnote, NOT a person full-name`,
      );
    }
  }
  const diaDanhField = fields['agency.diaDanh'];
  if (diaDanhField) {
    const diaDanhHelp = diaDanhField.helpText ?? '';
    if (/DIRECT_SLOT\s*\/\s*HIGH/u.test(diaDanhHelp)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-139 agency.diaDanh helpText claims DIRECT_SLOT / HIGH — P0041 is a locality-marker footnote ("Ghi địa danh là tên tỉnh/thành phố...") with NO inline locality value slot`,
      );
    }
  }
  // Surface-token blacklist: NO "(mẫu BM-139)", NO "/BB-VKS", NO
  // "/VKSKV7", NO BM-141/142/143 Quyết định tokens, NO BM-138 Yêu cầu
  // tokens, NO generic "Trường cần điền (document)" placeholder.
  const FORBIDDEN = [
    '(mẫu BM-139)',
    '/BB-VKS',
    '/VKSKV7',
    'Số quyết định',
    'Trường cần điền (document)',
    'QUYẾT ĐỊNH',
    'Quyết định',
    'YÊU CẦU',
    'Yêu cầu cung cấp',
    'BB hỏi cung bị can',
    'BB ghi lời khai',
    'BB đối chất',
  ];
  const blob = JSON.stringify({ fields, demo, sections, presentationSections });
  for (const token of FORBIDDEN) {
    if (blob.includes(token)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-139 profile contains forbidden surface token "${token}"`,
      );
    }
  }
  // Demo must not contain fabricated identifiers.
  for (const value of Object.values(demo)) {
    const s = String(value ?? '');
    if (/Trần Minh Quang/i.test(s)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-139 demo contains fabricated identifier: "${s}"`,
      );
    }
    if (/\/QĐ-VKSKV7/i.test(s) || /\/QĐ-KN/i.test(s)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-139 demo contains QĐ-prefix token (for a KIẾN NGHỊ document): "${s}"`,
      );
    }
    // Fabricated official agency names that are not present in the
    // canonical BM-139 extract.
    if (/Viện\s*KSND\s*tối\s*cao/u.test(s) ||
        /Viện\s*Kiểm\s*sát\s*nhân\s*dân\s*tối\s*cao/u.test(s)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-139 demo["agency.vienKiem"] = "${s}" is a fabricated top-tier agency name — the canonical extract only carries "Ghi tên Viện kiểm sát ban hành" (P0039) without a literal agency value`,
      );
    }
  }
}

// ============================================================
// BM-139 SCOPED PROVENANCE-IDENTITY ASSERTION
// ============================================================

export function assertBm139ProvenanceIdentity(provenanceRow) {
  const row = provenanceRow ?? '';
  if (!row) {
    throw new Error('SCOPED_ASSERTION: BM-139 provenance row is empty');
  }
  if (!/khắc phục/i.test(row)) {
    throw new Error(
      'SCOPED_ASSERTION: BM-139 provenance row does not mention "khắc phục" workflow',
    );
  }
  // Sibling heading TEXT may appear in family-boundary explanatory text, but
  // sibling extract/compiled paths must NOT appear.
  for (const forbidden of [
    'docs/audit/docx/extracted/BM-134__',
    'docs/audit/docx/extracted/BM-135__',
    'docs/audit/docx/extracted/BM-136__',
    'docs/audit/docx/extracted/BM-138__',
    'docs/audit/docx/compiled-v2/BM-134.compiled.json',
    'docs/audit/docx/compiled-v2/BM-135.compiled.json',
    'docs/audit/docx/compiled-v2/BM-136.compiled.json',
    'docs/audit/docx/compiled-v2/BM-138.compiled.json',
    'docs/audit/docx/compiled-v2/BM-141.compiled.json',
  ]) {
    if (row.includes(forbidden)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-139 provenance row contains sibling artifact path "${forbidden}"`,
      );
    }
  }
  if (!row.includes(BM139_COMPILED_PATH)) {
    throw new Error(
      `SCOPED_ASSERTION: BM-139 provenance row missing own compiled path "${BM139_COMPILED_PATH}"`,
    );
  }
  if (!row.includes(BM139_EXTRACT_PATH)) {
    throw new Error(
      `SCOPED_ASSERTION: BM-139 provenance row missing own extract path "${BM139_EXTRACT_PATH}"`,
    );
  }
  if (!row.includes(BM139_COMPILED_FILE_SHA256)) {
    throw new Error(
      'SCOPED_ASSERTION: BM-139 provenance row missing own compiled SHA256',
    );
  }
  if (!row.includes(BM139_EXTRACT_FILE_SHA256)) {
    throw new Error(
      'SCOPED_ASSERTION: BM-139 provenance row missing own extract SHA256',
    );
  }
  if (!row.includes(`title="${BM139_COMPILED_TITLE}"`)) {
    throw new Error(
      `SCOPED_ASSERTION: BM-139 provenance row missing compiledTitle marker title="${BM139_COMPILED_TITLE}"`,
    );
  }
  if (!row.includes(`heading="${BM139_EXTRACT_HEADING}"`)) {
    throw new Error(
      `SCOPED_ASSERTION: BM-139 provenance row missing extractHeading marker heading="${BM139_EXTRACT_HEADING}"`,
    );
  }
}

export function assertBm139SemanticIdentity(profile, provenanceRow, compiled) {
  assertBm139DocumentIdentity(profile, provenanceRow, compiled);
  assertBm139PresentationIdentity(profile, compiled);
  assertBm139ProvenanceIdentity(provenanceRow);
}

// ============================================================
// BM-140 SCOPED DOCUMENT-IDENTITY ASSERTION
// ============================================================

export function assertBm140DocumentIdentity(profile, provenanceRow, compiled) {
  const prof = profile ?? {};
  const row = provenanceRow ?? '';
  const c = compiled ?? {};

  if (prof.templateCode && prof.templateCode !== BM140_CODE) {
    throw new Error(
      `SCOPED_ASSERTION: BM-140 profile.templateCode is "${prof.templateCode}" — must be "${BM140_CODE}"`,
    );
  }
  if (prof.runtimeReady === true) {
    throw new Error(
      `SCOPED_ASSERTION: BM-140 profile declares runtimeReady=true — BM-140 is NOT promoted to runtimeReady`,
    );
  }
  if (c.templateCode && c.templateCode !== BM140_CODE) {
    throw new Error(
      `SCOPED_ASSERTION: BM-140 compiled.templateCode is "${c.templateCode}" — must be "${BM140_CODE}"`,
    );
  }
  if (c.title && c.title !== BM140_COMPILED_TITLE) {
    throw new Error(
      `SCOPED_ASSERTION: BM-140 compiled.title is "${c.title}" — must be "${BM140_COMPILED_TITLE}"`,
    );
  }
  if (c.source?.title && c.source.title !== BM140_COMPILED_TITLE) {
    throw new Error(
      `SCOPED_ASSERTION: BM-140 compiled.source.title is "${c.source.title}" — must be "${BM140_COMPILED_TITLE}"`,
    );
  }
  if (row) {
    const expectedCompiledTitleMarker = `title="${BM140_COMPILED_TITLE}"`;
    if (!row.includes(expectedCompiledTitleMarker)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-140 provenance row missing compiledTitle marker "${expectedCompiledTitleMarker}"`,
      );
    }
    const expectedHeadingMarker = `heading="${BM140_EXTRACT_HEADING}"`;
    if (!row.includes(expectedHeadingMarker)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-140 provenance row missing extractHeading marker "${expectedHeadingMarker}"`,
      );
    }
    if (!row.includes(BM140_HEADING_FRAGMENT)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-140 provenance row missing KIẾN NGHỊ family heading marker`,
      );
    }
    if (/khắc\s*phục\s*vi\s*phạm/u.test(row)) {
      // Allow "khắc phục vi phạm" only when it appears as a corrective-
      // subfamily label inside an explicit comparison with the BM-140
      // preventive subfamily ("BM-139 = corrective ... BM-140 =
      // preventive ..."). The corrective label MUST be paired with the
      // BM-140 preventive label; an unpaired corrective claim is rejected.
      // Also: any SECOND occurrence of "khắc phục vi phạm" beyond the
      // single corrective-subfamily label is rejected (injection attack).
      const occurrences = (row.match(/khắc\s*phục\s*vi\s*phạm/gu) ?? []).length;
      if (occurrences > 1) {
        throw new Error(
          `SCOPED_ASSERTION: BM-140 provenance row contains ${occurrences} occurrences of "khắc phục vi phạm" — at most ONE is allowed (the corrective-subfamily comparison label); additional occurrences are rejected`,
        );
      }
      const pairedComparison = /BM-139\s*=\s*corrective[\s\S]{0,200}BM-140\s*=\s*preventive/u.test(row) ||
        /khắc\s*phục\s*vi\s*phạm[\s\S]{0,200}phòng\s*ngừa\s*tội\s*phạm/u.test(row);
      if (!pairedComparison) {
        throw new Error(
          'SCOPED_ASSERTION: BM-140 provenance row contains corrective-operative wording "khắc phục vi phạm" outside an explicit BM-139/BM-140 subfamily comparison — BM-140 is preventive recommendation, NOT corrective',
        );
      }
    }
  }
  if (row && !row.includes(BM140_COMPILED_PATH)) {
    throw new Error(
      `SCOPED_ASSERTION: BM-140 provenance row does not reference own compiled path "${BM140_COMPILED_PATH}"`,
    );
  }
  if (row && !row.includes(BM140_EXTRACT_PATH)) {
    throw new Error(
      `SCOPED_ASSERTION: BM-140 provenance row does not reference own extract "${BM140_EXTRACT_PATH}"`,
    );
  }
  if (row && !row.includes(BM140_COMPILED_FILE_SHA256)) {
    throw new Error(
      'SCOPED_ASSERTION: BM-140 provenance row does not include own compiled SHA256',
    );
  }
  if (row && !row.includes(BM140_EXTRACT_FILE_SHA256)) {
    throw new Error(
      'SCOPED_ASSERTION: BM-140 provenance row does not include own extract SHA256',
    );
  }
  if (row) {
    const crossPointers = [
      'docs/audit/docx/compiled-v2/BM-138.compiled.json',
      'docs/audit/docx/compiled-v2/BM-141.compiled.json',
      'docs/audit/docx/compiled-v2/BM-139.compiled.json',
      'docs/audit/docx/extracted/BM-138__bf31a1f547b0.extract.md',
    ];
    for (const p of crossPointers) {
      if (row.includes(p)) {
        throw new Error(
          `SCOPED_ASSERTION: BM-140 provenance row contains cross-form pointer "${p}"`,
        );
      }
    }
  }
}

// ============================================================
// BM-140 SCOPED PRESENTATION-IDENTITY ASSERTION
// ============================================================

// Semantic-classification enforcement (Section 13 of brief):
// - agency.diaDanh helpText MUST NOT claim DIRECT_SLOT/HIGH from
//   P0040 (a locality marker footnote, not a value slot).
// - agency.dongDia MUST NOT be presented as a DIRECT_SLOT; the
//   BM-140 extract has NO combined locality+date paragraph and
//   the compiled field is CONTRACT_ONLY_NO_DOCX_SLOT / LOW.
const BM140_DONGDIA_LABEL_DIRECT = 'Dòng địa danh ngày tháng';
const BM140_DONGDIA_HELPTEXT_SYNTHETIC = /Ghép từ P0040.*P0007.*P0008.*P0009/u;

export function assertBm140PresentationIdentity(profile, compiled) {
  const prof = profile ?? {};
  const fields = prof.fields ?? {};
  const demo = prof.demo ?? {};
  const sections = prof.presentationSections ?? [];
  const c = compiled ?? {};

  if (c.source?.fields && c.source.fields.length !== 5) {
    throw new Error(
      `SCOPED_ASSERTION: BM-140 compiled contract has ${c.source.fields.length} fields — must be exactly 5`,
    );
  }
  // Sections list must contain exactly the compiled section id; phantom ids
  // are forbidden.
  for (const sec of sections) {
    if (!BM140_EXPECTED_SECTION_IDS.includes(sec.id)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-140 profile presentationSection contains phantom sectionId "${sec.id}" — must be one of ${JSON.stringify(BM140_EXPECTED_SECTION_IDS)}`,
      );
    }
    if (!sec.description?.trim()) {
      throw new Error(
        `SCOPED_ASSERTION: BM-140 presentationSection "${sec.id}" has empty description`,
      );
    }
  }
  if (c.source?.fields) {
    const compiledKeys = c.source.fields.map((f) => f.key);
    for (const key of compiledKeys) {
      if (!fields[key]) {
        throw new Error(
          `SCOPED_ASSERTION: BM-140 profile is missing compiled field "${key}"`,
        );
      }
    }
    for (const key of Object.keys(fields)) {
      if (!compiledKeys.includes(key)) {
        throw new Error(
          `SCOPED_ASSERTION: BM-140 profile field "${key}" is not in the compiled contract`,
        );
      }
    }
  }
  const presentationSections = prof.presentationSections ?? [];
  if (presentationSections.length > 0) {
    const presented = presentationSections.flatMap((s) => s.fieldKeys ?? []);
    for (const key of BM140_EXPECTED_FIELDS) {
      const count = presented.filter((k) => k === key).length;
      if (count !== 1) {
        throw new Error(
          `SCOPED_ASSERTION: BM-140 field "${key}" appears ${count} times in presentationSections — must be exactly 1`,
        );
      }
    }
  }
  // Semantic-classification enforcement.
  const diaDanhField = fields['agency.diaDanh'];
  if (diaDanhField) {
    const diaDanhHelp = diaDanhField.helpText ?? '';
    if (/DIRECT_SLOT\s*\/\s*HIGH/u.test(diaDanhHelp)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-140 agency.diaDanh helpText claims DIRECT_SLOT / HIGH — P0040 is a locality-marker footnote ("Ghi địa danh là tên tỉnh/thành phố...") with NO inline locality value slot`,
      );
    }
  }
  const dongDiaField = fields['agency.dongDia'];
  if (dongDiaField) {
    const dongDiaLabel = dongDiaField.label ?? '';
    const dongDiaHelp = dongDiaField.helpText ?? '';
    const dongDiaPlaceholder = dongDiaField.placeholder ?? '';
    if (dongDiaLabel === BM140_DONGDIA_LABEL_DIRECT) {
      throw new Error(
        `SCOPED_ASSERTION: BM-140 agency.dongDia label is "${dongDiaLabel}" — must NOT claim a direct slot; no combined locality+date paragraph exists in the canonical extract`,
      );
    }
    if (BM140_DONGDIA_HELPTEXT_SYNTHETIC.test(dongDiaHelp)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-140 agency.dongDia helpText composes a synthetic combined locality+date slot from P0040+P0007–P0009 — the canonical extract has NO such combined paragraph`,
      );
    }
    if (/DIRECT_SLOT/u.test(dongDiaHelp)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-140 agency.dongDia helpText claims DIRECT_SLOT — the field is CONTRACT_ONLY_NO_DOCX_SLOT / LOW`,
      );
    }
    if (/DIRECT_SLOT/u.test(dongDiaPlaceholder)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-140 agency.dongDia placeholder claims DIRECT_SLOT — the field is CONTRACT_ONLY_NO_DOCX_SLOT / LOW`,
      );
    }
    if (/(MEDIUM\s*\/\s*HIGH|HIGH\s*\/\s*MEDIUM)/u.test(dongDiaPlaceholder)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-140 agency.dongDia placeholder claims MEDIUM/HIGH confidence — the field is CONTRACT_ONLY_NO_DOCX_SLOT / LOW`,
      );
    }
  }
  // Synthetic demo value: literal "Địa danh, ngày X tháng Y năm Z" pattern
  // (or similar) is fabricated — the canonical extract has no combined
  // locality+date paragraph to demo against.
  const dongDiaDemo = demo['agency.dongDia'] ?? '';
  if (/^[^\n,]+,\s*ngày\s+\d+\s+tháng\s+\d+\s+năm\s+\d{4}/u.test(dongDiaDemo)) {
    throw new Error(
      `SCOPED_ASSERTION: BM-140 demo["agency.dongDia"] = "${dongDiaDemo}" is a synthetic combined locality+date demo value — the canonical extract has NO such combined paragraph`,
    );
  }
  const FORBIDDEN = [
    '(mẫu BM-140)',
    '/BB-VKS',
    '/VKSKV7',
    'Số quyết định',
    'QUYẾT ĐỊNH',
    'Quyết định',
    'YÊU CẦU',
    'Yêu cầu cung cấp',
    'BB hỏi cung bị can',
    'BB ghi lời khai',
    'BB đối chất',
    'khắc phục vi phạm',
  ];
  const blob = JSON.stringify({ fields, demo, sections, presentationSections });
  for (const token of FORBIDDEN) {
    if (blob.includes(token)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-140 profile contains forbidden surface token "${token}"`,
      );
    }
  }
  for (const value of Object.values(demo)) {
    const s = String(value ?? '');
    if (/Trần Minh Quang/i.test(s)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-140 demo contains fabricated identifier: "${s}"`,
      );
    }
  }
}

// ============================================================
// BM-140 SCOPED PROVENANCE-IDENTITY ASSERTION
// ============================================================

export function assertBm140ProvenanceIdentity(provenanceRow) {
  const row = provenanceRow ?? '';
  if (!row) {
    throw new Error('SCOPED_ASSERTION: BM-140 provenance row is empty');
  }
  if (!/phòng ngừa/i.test(row)) {
    throw new Error(
      'SCOPED_ASSERTION: BM-140 provenance row does not mention "phòng ngừa" workflow',
    );
  }
  // Sibling heading TEXT may appear in family-boundary explanatory text, but
  // sibling extract/compiled paths must NOT appear.
  for (const forbidden of [
    'docs/audit/docx/extracted/BM-134__',
    'docs/audit/docx/extracted/BM-135__',
    'docs/audit/docx/extracted/BM-136__',
    'docs/audit/docx/extracted/BM-138__',
    'docs/audit/docx/compiled-v2/BM-134.compiled.json',
    'docs/audit/docx/compiled-v2/BM-135.compiled.json',
    'docs/audit/docx/compiled-v2/BM-136.compiled.json',
    'docs/audit/docx/compiled-v2/BM-138.compiled.json',
    'docs/audit/docx/compiled-v2/BM-141.compiled.json',
  ]) {
    if (row.includes(forbidden)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-140 provenance row contains sibling artifact path "${forbidden}"`,
      );
    }
  }
  if (!row.includes(BM140_COMPILED_PATH)) {
    throw new Error(
      `SCOPED_ASSERTION: BM-140 provenance row missing own compiled path "${BM140_COMPILED_PATH}"`,
    );
  }
  if (!row.includes(BM140_EXTRACT_PATH)) {
    throw new Error(
      `SCOPED_ASSERTION: BM-140 provenance row missing own extract path "${BM140_EXTRACT_PATH}"`,
    );
  }
  if (!row.includes(BM140_COMPILED_FILE_SHA256)) {
    throw new Error(
      'SCOPED_ASSERTION: BM-140 provenance row missing own compiled SHA256',
    );
  }
  if (!row.includes(BM140_EXTRACT_FILE_SHA256)) {
    throw new Error(
      'SCOPED_ASSERTION: BM-140 provenance row missing own extract SHA256',
    );
  }
  if (!row.includes(`title="${BM140_COMPILED_TITLE}"`)) {
    throw new Error(
      `SCOPED_ASSERTION: BM-140 provenance row missing compiledTitle marker title="${BM140_COMPILED_TITLE}"`,
    );
  }
  if (!row.includes(`heading="${BM140_EXTRACT_HEADING}"`)) {
    throw new Error(
      `SCOPED_ASSERTION: BM-140 provenance row missing extractHeading marker heading="${BM140_EXTRACT_HEADING}"`,
    );
  }
}

export function assertBm140SemanticIdentity(profile, provenanceRow, compiled) {
  assertBm140DocumentIdentity(profile, provenanceRow, compiled);
  assertBm140PresentationIdentity(profile, compiled);
  assertBm140ProvenanceIdentity(provenanceRow);
}

// ============================================================
// BM-139 invariant tests
// ============================================================

describe('BM-139 invariant tests (GATE C)', () => {
  let profile;
  let provenanceRow;
  let compiled;

  before(() => {
    profile = loadProfileFor(BM139_CODE, BM139_PROFILE_VAR);
    provenanceRow = findProvenanceRow(readProvenanceLedger(), BM139_CODE);
    compiled = loadContract(BM139_CODE);
  });

  it('BM-139 profile.templateCode is "BM-139"', () => {
    assert.equal(profile.templateCode, BM139_CODE);
  });

  it('BM-139 profile has 6 fields matching the compiled contract', () => {
    const keys = Object.keys(profile.fields);
    assert.equal(keys.length, 6);
    for (const k of BM139_EXPECTED_FIELDS) {
      assert.ok(keys.includes(k), `BM-139 profile missing field "${k}"`);
    }
  });

  it('BM-139 demo has 6 values matching the compiled contract', () => {
    const keys = Object.keys(profile.demo);
    assert.equal(keys.length, 6);
  });

  it('BM-139 profile sections contain exactly the 2 compiled sectionIds', () => {
    const sections = profile.sections;
    assert.ok(Array.isArray(sections), 'sections must be an array');
    assert.equal(sections.length, 2);
    const ids = sections.map((s) => s.sectionId).sort();
    assert.deepEqual(ids, [...BM139_EXPECTED_SECTION_IDS].sort());
    for (const sec of sections) {
      assert.ok(
        sec.description?.trim(),
        `BM-139 section "${sec.sectionId}" must have a non-empty description`,
      );
    }
  });

  it('BM-139 profile passes shared validator with empty issues', () => {
    const issues = validateCuration(profile, compiled, provenanceRow);
    assert.deepEqual(
      issues,
      [],
      `BM-139 shared validator must report zero issues — got: ${JSON.stringify(issues, null, 2)}`,
    );
  });

  it('BM-139 scoped document identity passes (no throw)', () => {
    assertBm139DocumentIdentity(profile, provenanceRow, compiled);
  });

  it('BM-139 scoped presentation identity passes (no throw)', () => {
    assertBm139PresentationIdentity(profile, compiled);
  });

  it('BM-139 scoped provenance identity passes (no throw)', () => {
    assertBm139ProvenanceIdentity(provenanceRow);
  });

  it('BM-139 scoped semantic identity passes (no throw)', () => {
    assertBm139SemanticIdentity(profile, provenanceRow, compiled);
  });
});

// ============================================================
// BM-139 / BM-140 MUTATION MATRICES
// ============================================================
//
// Two parallel mutation matrices per form (BM-139 and BM-140). Each
// matrix clones the live profile / provenance row / compiled contract
// via JSON.parse(JSON.stringify(...)) and asserts that the scoped
// semantic assertions reject the mutation with an error message
// starting with `SCOPED_ASSERTION`. Mutations that pass through the
// scoped assertions are treated as REGRESSIONS.
//
// The matrices are written BEFORE the profile / provenance corrections
// so the first execution is a RED run. The patches in §10/§11 of the
// brief turn the matrices GREEN. The matrices are exhaustive against
// the misclassifications catalogued in the same §10/§11 patch list.

const BM139_HEADING_FRAGMENT_BM140 = 'KIẾN NGHỊ';
const BM140_HEADING_FRAGMENT_BM139 = 'phòng ngừa';
const BM141_HEADING_FRAGMENT_BM139 = 'QUYẾT ĐỊNH';
const BM141_TITLE_FRAGMENT_BM139 = 'Quyết định';
const BM138_HEADING_FRAGMENT_BM139 = 'YÊU CẦU';
const BM138_TITLE_FRAGMENT_BM139 = 'Yêu cầu cung cấp';

// Helper: push a verdict for an arbitrary mutation exercise.
function recordVerdict(verdicts, name, throwObserved, detector, errMsg) {
  verdicts.push({
    mutation: name,
    expectedDetector: 'SCOPED_ASSERTION',
    actualDetector: detector,
    throws: throwObserved,
    errorMessage: errMsg,
    verdict: throwObserved && detector === 'SCOPED_ASSERTION' ? 'REJECTED' : 'PASSED_THROUGH',
  });
}

// ============================================================
// BM-139 DOCUMENT-IDENTITY MUTATION MATRIX (Section 8 cases 7–15)
// ============================================================

describe('BM-139 document-identity mutation matrix (Section 8)', () => {
  let profile;
  let provenanceRow;
  let compiled;
  let verdicts;

  before(() => {
    profile = loadProfileFor(BM139_CODE, BM139_PROFILE_VAR);
    provenanceRow = findProvenanceRow(readProvenanceLedger(), BM139_CODE);
    compiled = loadContract(BM139_CODE);
    verdicts = [];
  });

  function runDocMutation(name, mutator) {
    const cloneProfile = JSON.parse(JSON.stringify(profile));
    const cloneRow = String(provenanceRow ?? '');
    const cloneCompiled = JSON.parse(JSON.stringify(compiled));
    const result = mutator({
      profile: cloneProfile,
      row: cloneRow,
      compiled: cloneCompiled,
    });
    const finalRow = typeof result === 'string' ? result : cloneRow;
    let throws = false;
    let detector = 'NONE';
    let errMsg = '';
    try {
      assertBm139SemanticIdentity(cloneProfile, finalRow, cloneCompiled);
    } catch (err) {
      throws = true;
      detector = err.message.startsWith('SCOPED_ASSERTION') ? 'SCOPED_ASSERTION' : 'OTHER';
      errMsg = err.message;
    }
    recordVerdict(verdicts, name, throws, detector, errMsg);
  }

  it('document-identity mutations are all REJECTED by SCOPED_ASSERTION', () => {
    // 7. Extract path → rejected alternative BM-139 variant.
    {
      const cloneProfile = JSON.parse(JSON.stringify(profile));
      const cloneRow = String(provenanceRow ?? '').replace(
        BM139_EXTRACT_PATH,
        'docs/audit/docx/extracted/BM-139__9795f14f931c.extract.md',
      );
      const cloneCompiled = JSON.parse(JSON.stringify(compiled));
      let throws = false;
      let detector = 'NONE';
      let errMsg = '';
      try {
        assertBm139SemanticIdentity(cloneProfile, cloneRow, cloneCompiled);
      } catch (err) {
        throws = true;
        detector = err.message.startsWith('SCOPED_ASSERTION') ? 'SCOPED_ASSERTION' : 'OTHER';
        errMsg = err.message;
      }
      recordVerdict(verdicts, 'row-extractPath-to-BM-139-alt', throws, detector, errMsg);
    }
    // 8. Extract SHA → rejected alternative variant SHA.
    {
      const cloneProfile = JSON.parse(JSON.stringify(profile));
      const cloneRow = String(provenanceRow ?? '').replace(
        BM139_EXTRACT_FILE_SHA256,
        'a457ac7102ba4415fdeed7a1c8a456e4c28cf9c578a4809d5bbf32c3d26fb25f',
      );
      const cloneCompiled = JSON.parse(JSON.stringify(compiled));
      let throws = false;
      let detector = 'NONE';
      let errMsg = '';
      try {
        assertBm139SemanticIdentity(cloneProfile, cloneRow, cloneCompiled);
      } catch (err) {
        throws = true;
        detector = err.message.startsWith('SCOPED_ASSERTION') ? 'SCOPED_ASSERTION' : 'OTHER';
        errMsg = err.message;
      }
      recordVerdict(verdicts, 'row-extractSha-to-BM-139-alt', throws, detector, errMsg);
    }
    // 9. Compiled title → BM-140 title (cross-form pointer).
    {
      const cloneProfile = JSON.parse(JSON.stringify(profile));
      const cloneRow = String(provenanceRow ?? '').replace(
        `title="${BM139_COMPILED_TITLE}"`,
        `title="${BM140_COMPILED_TITLE}"`,
      );
      const cloneCompiled = JSON.parse(JSON.stringify(compiled));
      let throws = false;
      let detector = 'NONE';
      let errMsg = '';
      try {
        assertBm139SemanticIdentity(cloneProfile, cloneRow, cloneCompiled);
      } catch (err) {
        throws = true;
        detector = err.message.startsWith('SCOPED_ASSERTION') ? 'SCOPED_ASSERTION' : 'OTHER';
        errMsg = err.message;
      }
      recordVerdict(verdicts, 'row-compiledTitle-to-BM-140', throws, detector, errMsg);
    }
    // 10. Extract heading → QUYẾT ĐỊNH or YÊU CẦU (cross-family heading).
    runDocMutation('row-extractHeading-to-QUYET-DINH', ({ row }) => {
      return row.replace(`heading="${BM139_EXTRACT_HEADING}"`, `heading="QUYẾT ĐỊNH"`);
    });
    // 11. Compiled title → BM-140 (compiled cross-borrow).
    runDocMutation('compiled-title-to-BM-140', ({ compiled: c }) => {
      c.title = BM140_COMPILED_TITLE;
      c.source.title = BM140_COMPILED_TITLE;
    });
    // 12. Compiled field count inflation to 17 (duplicate compiled field).
    runDocMutation('compiled-field-count-to-17', ({ compiled: c }) => {
      const filler = { key: 'agency.foo', label: 'Foo', control: 'TEXT' };
      while (c.source.fields.length < 17) c.source.fields.push(filler);
    });
    // 13. Outside-contract field added to compiled.
    runDocMutation('compiled-adds-outside-field', ({ compiled: c }) => {
      c.source.fields.push({
        key: 'agency.notInContract',
        label: 'Outside contract',
        control: 'TEXT',
        sectionId: 'section-thong-tin-bieu-mau',
        dataSource: { kind: 'MANUAL' },
        order: 99,
        required: false,
      });
    });
    // 14. Profile runtimeReady claim (profile mutates to declare runtimeReady=true).
    runDocMutation('profile-claims-runtimeReady', ({ profile: p }) => {
      p.runtimeReady = true;
    });
    // 15. Profile claims runtimeReady via a sibling marker on templateCode.
    runDocMutation('profile-templateCode-to-BM-141', ({ profile: p }) => {
      p.templateCode = 'BM-141';
    });

    const rejected = verdicts.filter((v) => v.verdict === 'REJECTED');
    const passed = verdicts.filter((v) => v.verdict === 'PASSED_THROUGH');
    assert.equal(
      passed.length,
      0,
      `BM-139 document-identity mutations leaked through: ${JSON.stringify(passed, null, 2)}`,
    );
    assert.ok(
      rejected.length >= 9,
      `BM-139 must reject at least 9 document-identity mutations — got ${rejected.length}: ${JSON.stringify(verdicts, null, 2)}`,
    );
  });
});

// ============================================================
// BM-139 PRESENTATION-IDENTITY MUTATION MATRIX (Section 8 cases 1–6, 12–14)
// ============================================================

describe('BM-139 presentation-identity mutation matrix (Section 8)', () => {
  let profile;
  let provenanceRow;
  let compiled;
  let verdicts;

  before(() => {
    profile = loadProfileFor(BM139_CODE, BM139_PROFILE_VAR);
    provenanceRow = findProvenanceRow(readProvenanceLedger(), BM139_CODE);
    compiled = loadContract(BM139_CODE);
    verdicts = [];
  });

  function runPresMutation(name, mutator) {
    const cloneProfile = JSON.parse(JSON.stringify(profile));
    const cloneRow = String(provenanceRow ?? '');
    const cloneCompiled = JSON.parse(JSON.stringify(compiled));
    mutator({ profile: cloneProfile, row: cloneRow, compiled: cloneCompiled });
    let throws = false;
    let detector = 'NONE';
    let errMsg = '';
    try {
      assertBm139PresentationIdentity(cloneProfile, cloneCompiled);
    } catch (err) {
      throws = true;
      detector = err.message.startsWith('SCOPED_ASSERTION') ? 'SCOPED_ASSERTION' : 'OTHER';
      errMsg = err.message;
    }
    recordVerdict(verdicts, name, throws, detector, errMsg);
  }

  it('presentation-identity mutations are all REJECTED by SCOPED_ASSERTION', () => {
    // 1. recipients.localityName label → "Địa danh / Quận huyện của cơ quan nhận".
    runPresMutation('recipients.localityName-to-Dia-danh-QH-co-quan-nhan', ({ profile: p }) => {
      p.fields['recipients.localityName'].label = 'Địa danh / Quận huyện của cơ quan nhận';
    });
    // 2. recipients.localityName classification marker → "địa danh của cơ quan nhận" via helpText.
    runPresMutation('recipients.localityName-helpText-classifies-as-locality', ({ profile: p }) => {
      p.fields['recipients.localityName'].helpText =
        'Địa danh / quận huyện của cơ quan nhận kiến nghị (trích từ P0043, đây là locality slot).';
    });
    // 3. person.personFullName label → "Họ và tên người ký".
    runPresMutation('person.personFullName-to-Ho-va-ten-nguoi-ky', ({ profile: p }) => {
      p.fields['person.personFullName'].label = 'Họ và tên người ký';
    });
    // 4. person.personFullName classification → person-name slot via placeholder.
    runPresMutation('person.personFullName-placeholder-as-name', ({ profile: p }) => {
      p.fields['person.personFullName'].placeholder = 'Họ và tên người ký kiến nghị';
    });
    // 5. agency.diaDanh helpText claims DIRECT_SLOT/HIGH from P0041 (footnote only).
    runPresMutation('agency.diaDanh-claim-DIRECT-SLOT-from-footnote', ({ profile: p }) => {
      p.fields['agency.diaDanh'].helpText =
        'Trích từ P0041 — tên tỉnh/thành phố nơi đặt trụ sở Viện kiểm sát ban hành. DIRECT_SLOT / HIGH.';
    });
    // 6. Demo value fabricated agency/person.
    runPresMutation('demo-fabricated-agency-name', ({ profile: p }) => {
      p.demo['agency.vienKiem'] = 'Viện KSND tối cao';
    });
    // 12. Duplicate compiled field — add a second presentationSection with the same id.
    runPresMutation('presentation-section-id-duplicated', ({ profile: p }) => {
      p.presentationSections.push({
        id: 'section-thong-tin-bieu-mau',
        title: 'Thông tin kiến nghị (dup)',
        description: 'Duplicate presentation section.',
        fieldKeys: ['document.issueDate'],
      });
    });
    // 13. Outside-contract field added to profile.
    runPresMutation('profile-adds-outside-field', ({ profile: p }) => {
      p.fields['agency.notInContract'] = {
        label: 'Outside contract',
        placeholder: 'outside',
        helpText: 'outside',
      };
    });
    // 14. Demo value contains /BB-VKS prefix.
    runPresMutation('demo-bbvks-prefix', ({ profile: p }) => {
      p.demo['document.soQuyet'] = '12/BB-VKS';
    });

    const rejected = verdicts.filter((v) => v.verdict === 'REJECTED');
    const passed = verdicts.filter((v) => v.verdict === 'PASSED_THROUGH');
    assert.equal(
      passed.length,
      0,
      `BM-139 presentation-identity mutations leaked through: ${JSON.stringify(passed, null, 2)}`,
    );
    assert.ok(
      rejected.length >= 9,
      `BM-139 must reject at least 9 presentation-identity mutations — got ${rejected.length}: ${JSON.stringify(verdicts, null, 2)}`,
    );
  });
});

// ============================================================
// BM-139 PROVENANCE-IDENTITY MUTATION MATRIX (Section 8 cases 7–11)
// ============================================================

describe('BM-139 provenance-identity mutation matrix (Section 8)', () => {
  let profile;
  let provenanceRow;
  let compiled;
  let verdicts;

  before(() => {
    profile = loadProfileFor(BM139_CODE, BM139_PROFILE_VAR);
    provenanceRow = findProvenanceRow(readProvenanceLedger(), BM139_CODE);
    compiled = loadContract(BM139_CODE);
    verdicts = [];
  });

  function checkProvenanceMutation(name, mutatedRow) {
    let throws = false;
    let detector = 'NONE';
    let errMsg = '';
    try {
      assertBm139ProvenanceIdentity(mutatedRow);
    } catch (err) {
      throws = true;
      detector = err.message.startsWith('SCOPED_ASSERTION') ? 'SCOPED_ASSERTION' : 'OTHER';
      errMsg = err.message;
    }
    recordVerdict(verdicts, name, throws, detector, errMsg);
  }

  it('provenance-identity mutations are all REJECTED by SCOPED_ASSERTION', () => {
    // 7. Strip own extract path (replace_all so every occurrence is removed).
    checkProvenanceMutation(
      'row-strip-extract-path',
      String(provenanceRow).split(BM139_EXTRACT_PATH).join('docs/audit/docx/extracted/__REMOVED__.extract.md'),
    );
    // 8. Strip own extract SHA256.
    checkProvenanceMutation(
      'row-strip-extract-sha',
      String(provenanceRow).replace(BM139_EXTRACT_FILE_SHA256, '0'.repeat(64)),
    );
    // 9. Strip own compiled path.
    checkProvenanceMutation(
      'row-strip-compiled-path',
      String(provenanceRow).replace(BM139_COMPILED_PATH, 'docs/audit/docx/compiled-v2/__REMOVED__.compiled.json'),
    );
    // 10. Strip "khắc phục" workflow signature.
    checkProvenanceMutation(
      'row-strip-khac-phuc',
      String(provenanceRow).replace(/khắc phục/gu, 'something_else'),
    );
    // 11. Inject BM-140 extract path (cross-form pointer; replaces all BM-139
    //     occurrences with BM-140 path).
    checkProvenanceMutation(
      'row-injects-BM-140-extract-path',
      String(provenanceRow).split(BM139_EXTRACT_PATH).join(BM140_EXTRACT_PATH),
    );

    const rejected = verdicts.filter((v) => v.verdict === 'REJECTED');
    const passed = verdicts.filter((v) => v.verdict === 'PASSED_THROUGH');
    assert.equal(
      passed.length,
      0,
      `BM-139 provenance mutations leaked through: ${JSON.stringify(passed, null, 2)}`,
    );
    assert.ok(
      rejected.length >= 5,
      `BM-139 must reject at least 5 provenance mutations — got ${rejected.length}: ${JSON.stringify(verdicts, null, 2)}`,
    );
  });
});

// ============================================================
// BM-140 DOCUMENT-IDENTITY MUTATION MATRIX (Section 9)
// ============================================================

describe('BM-140 document-identity mutation matrix (Section 9)', () => {
  let profile;
  let provenanceRow;
  let compiled;
  let verdicts;

  before(() => {
    profile = loadProfileFor(BM140_CODE, BM140_PROFILE_VAR);
    provenanceRow = findProvenanceRow(readProvenanceLedger(), BM140_CODE);
    compiled = loadContract(BM140_CODE);
    verdicts = [];
  });

  function runDocMutation(name, mutator) {
    const cloneProfile = JSON.parse(JSON.stringify(profile));
    const cloneRow = String(provenanceRow ?? '');
    const cloneCompiled = JSON.parse(JSON.stringify(compiled));
    const result = mutator({
      profile: cloneProfile,
      row: cloneRow,
      compiled: cloneCompiled,
    });
    const finalRow = typeof result === 'string' ? result : cloneRow;
    let throws = false;
    let detector = 'NONE';
    let errMsg = '';
    try {
      assertBm140SemanticIdentity(cloneProfile, finalRow, cloneCompiled);
    } catch (err) {
      throws = true;
      detector = err.message.startsWith('SCOPED_ASSERTION') ? 'SCOPED_ASSERTION' : 'OTHER';
      errMsg = err.message;
    }
    recordVerdict(verdicts, name, throws, detector, errMsg);
  }

  it('document-identity mutations are all REJECTED by SCOPED_ASSERTION', () => {
    // 8. Compiled title → BM-139 title (cross-form pointer).
    {
      const cloneProfile = JSON.parse(JSON.stringify(profile));
      const cloneRow = String(provenanceRow ?? '').replace(
        `title="${BM140_COMPILED_TITLE}"`,
        `title="${BM139_COMPILED_TITLE}"`,
      );
      const cloneCompiled = JSON.parse(JSON.stringify(compiled));
      let throws = false;
      let detector = 'NONE';
      let errMsg = '';
      try {
        assertBm140SemanticIdentity(cloneProfile, cloneRow, cloneCompiled);
      } catch (err) {
        throws = true;
        detector = err.message.startsWith('SCOPED_ASSERTION') ? 'SCOPED_ASSERTION' : 'OTHER';
        errMsg = err.message;
      }
      recordVerdict(verdicts, 'row-compiledTitle-to-BM-139', throws, detector, errMsg);
    }
    // 9. Extract path → BM-139 extract (cross-form pointer).
    {
      const cloneProfile = JSON.parse(JSON.stringify(profile));
      const cloneRow = String(provenanceRow ?? '').replace(
        BM140_EXTRACT_PATH,
        BM139_EXTRACT_PATH,
      );
      const cloneCompiled = JSON.parse(JSON.stringify(compiled));
      let throws = false;
      let detector = 'NONE';
      let errMsg = '';
      try {
        assertBm140SemanticIdentity(cloneProfile, cloneRow, cloneCompiled);
      } catch (err) {
        throws = true;
        detector = err.message.startsWith('SCOPED_ASSERTION') ? 'SCOPED_ASSERTION' : 'OTHER';
        errMsg = err.message;
      }
      recordVerdict(verdicts, 'row-extractPath-to-BM-139', throws, detector, errMsg);
    }
    // 10. Provenance row injects corrective-operative wording ("khắc phục vi phạm").
    {
      const cloneProfile = JSON.parse(JSON.stringify(profile));
      const cloneRow = String(provenanceRow ?? '') + ' Corrective recommendation: khắc phục vi phạm.';
      const cloneCompiled = JSON.parse(JSON.stringify(compiled));
      let throws = false;
      let detector = 'NONE';
      let errMsg = '';
      try {
        assertBm140SemanticIdentity(cloneProfile, cloneRow, cloneCompiled);
      } catch (err) {
        throws = true;
        detector = err.message.startsWith('SCOPED_ASSERTION') ? 'SCOPED_ASSERTION' : 'OTHER';
        errMsg = err.message;
      }
      recordVerdict(verdicts, 'row-injects-corrective-wording', throws, detector, errMsg);
    }
    // 11. Compiled field count inflation to 12 (duplicate compiled field).
    runDocMutation('compiled-field-count-to-12', ({ compiled: c }) => {
      const filler = { key: 'agency.foo', label: 'Foo', control: 'TEXT' };
      while (c.source.fields.length < 12) c.source.fields.push(filler);
    });
    // 12. Outside-contract field added to compiled.
    runDocMutation('compiled-adds-outside-field', ({ compiled: c }) => {
      c.source.fields.push({
        key: 'agency.notInContract',
        label: 'Outside contract',
        control: 'TEXT',
        sectionId: 'section-thong-tin-bieu-mau',
        dataSource: { kind: 'MANUAL' },
        order: 99,
        required: false,
      });
    });
    // 13. Profile runtimeReady claim.
    runDocMutation('profile-claims-runtimeReady', ({ profile: p }) => {
      p.runtimeReady = true;
    });
    // Template-code cross-form drift.
    runDocMutation('profile-templateCode-to-BM-141', ({ profile: p }) => {
      p.templateCode = 'BM-141';
    });

    const rejected = verdicts.filter((v) => v.verdict === 'REJECTED');
    const passed = verdicts.filter((v) => v.verdict === 'PASSED_THROUGH');
    assert.equal(
      passed.length,
      0,
      `BM-140 document-identity mutations leaked through: ${JSON.stringify(passed, null, 2)}`,
    );
    assert.ok(
      rejected.length >= 7,
      `BM-140 must reject at least 7 document-identity mutations — got ${rejected.length}: ${JSON.stringify(verdicts, null, 2)}`,
    );
  });
});

// ============================================================
// BM-140 PRESENTATION-IDENTITY MUTATION MATRIX (Section 9 cases 1–7)
// ============================================================

describe('BM-140 presentation-identity mutation matrix (Section 9)', () => {
  let profile;
  let provenanceRow;
  let compiled;
  let verdicts;

  before(() => {
    profile = loadProfileFor(BM140_CODE, BM140_PROFILE_VAR);
    provenanceRow = findProvenanceRow(readProvenanceLedger(), BM140_CODE);
    compiled = loadContract(BM140_CODE);
    verdicts = [];
  });

  function runPresMutation(name, mutator) {
    const cloneProfile = JSON.parse(JSON.stringify(profile));
    const cloneRow = String(provenanceRow ?? '');
    const cloneCompiled = JSON.parse(JSON.stringify(compiled));
    mutator({ profile: cloneProfile, row: cloneRow, compiled: cloneCompiled });
    let throws = false;
    let detector = 'NONE';
    let errMsg = '';
    try {
      assertBm140PresentationIdentity(cloneProfile, cloneCompiled);
    } catch (err) {
      throws = true;
      detector = err.message.startsWith('SCOPED_ASSERTION') ? 'SCOPED_ASSERTION' : 'OTHER';
      errMsg = err.message;
    }
    recordVerdict(verdicts, name, throws, detector, errMsg);
  }

  it('presentation-identity mutations are all REJECTED by SCOPED_ASSERTION', () => {
    // 1. agency.diaDanh helpText claims DIRECT_SLOT/HIGH from P0040 (footnote only).
    runPresMutation('agency.diaDanh-claim-DIRECT-SLOT-from-footnote', ({ profile: p }) => {
      p.fields['agency.diaDanh'].helpText =
        'Trích từ P0040 — tên tỉnh/thành phố nơi đặt trụ sở Viện kiểm sát ban hành. DIRECT_SLOT / HIGH.';
    });
    // 2. agency.dongDia label → "Dòng địa danh ngày tháng" (claim direct slot).
    runPresMutation('agency.dongDia-label-direct-slot-claim', ({ profile: p }) => {
      p.fields['agency.dongDia'].label = 'Dòng địa danh ngày tháng';
    });
    // 3. agency.dongDia helpText → P0040 + P0007–P0009 synthetic composition.
    runPresMutation('agency.dongDia-helpText-synthetic-composition', ({ profile: p }) => {
      p.fields['agency.dongDia'].helpText =
        "Ghép từ P0040 (địa danh) + P0007 ', ngày' + P0008 'tháng' + P0009 'năm 20__' thành một dòng.";
    });
    // 4. agency.dongDia placeholder claims direct source.
    runPresMutation('agency.dongDia-placeholder-direct-source-claim', ({ profile: p }) => {
      p.fields['agency.dongDia'].placeholder =
        'Địa danh — ngày tháng năm ban hành (trích từ P0040 + P0007–P0009, DIRECT_SLOT).';
    });
    // 5. agency.dongDia label claim MEDIUM/HIGH confidence via placeholder.
    runPresMutation('agency.dongDia-confidence-claim-MEDIUM', ({ profile: p }) => {
      p.fields['agency.dongDia'].placeholder = 'Địa danh — ngày tháng năm (MEDIUM/HIGH).';
    });
    // 6. Demo synthetic locality/date demo value.
    runPresMutation('demo-synthetic-locality-date-value', ({ profile: p }) => {
      p.demo['agency.dongDia'] = 'Hà Nội, ngày 15 tháng 6 năm 2026';
    });
    // 7. Demo value contains /BB-VKS prefix.
    runPresMutation('demo-bbvks-prefix', ({ profile: p }) => {
      p.demo['document.soKien'] = '12/BB-VKS';
    });

    const rejected = verdicts.filter((v) => v.verdict === 'REJECTED');
    const passed = verdicts.filter((v) => v.verdict === 'PASSED_THROUGH');
    assert.equal(
      passed.length,
      0,
      `BM-140 presentation-identity mutations leaked through: ${JSON.stringify(passed, null, 2)}`,
    );
    assert.ok(
      rejected.length >= 4,
      `BM-140 must reject at least 4 presentation-identity mutations — got ${rejected.length}: ${JSON.stringify(verdicts, null, 2)}`,
    );
  });
});

// ============================================================
// BM-140 PROVENANCE-IDENTITY MUTATION MATRIX (Section 9 cases 8–11)
// ============================================================

describe('BM-140 provenance-identity mutation matrix (Section 9)', () => {
  let profile;
  let provenanceRow;
  let compiled;
  let verdicts;

  before(() => {
    profile = loadProfileFor(BM140_CODE, BM140_PROFILE_VAR);
    provenanceRow = findProvenanceRow(readProvenanceLedger(), BM140_CODE);
    compiled = loadContract(BM140_CODE);
    verdicts = [];
  });

  function checkProvenanceMutation(name, mutatedRow) {
    let throws = false;
    let detector = 'NONE';
    let errMsg = '';
    try {
      assertBm140ProvenanceIdentity(mutatedRow);
    } catch (err) {
      throws = true;
      detector = err.message.startsWith('SCOPED_ASSERTION') ? 'SCOPED_ASSERTION' : 'OTHER';
      errMsg = err.message;
    }
    recordVerdict(verdicts, name, throws, detector, errMsg);
  }

  it('provenance-identity mutations are all REJECTED by SCOPED_ASSERTION', () => {
    // 1. Strip "phòng ngừa" workflow signature.
    checkProvenanceMutation(
      'row-strip-phong-ngua',
      String(provenanceRow).replace(/phòng ngừa/gu, 'something_else'),
    );
    // 2. Strip own extract path.
    checkProvenanceMutation(
      'row-strip-extract-path',
      String(provenanceRow).replace(
        BM140_EXTRACT_PATH,
        'docs/audit/docx/extracted/__REMOVED__.extract.md',
      ),
    );
    // 3. Strip own extract SHA256.
    checkProvenanceMutation(
      'row-strip-extract-sha',
      String(provenanceRow).replace(BM140_EXTRACT_FILE_SHA256, '0'.repeat(64)),
    );
    // 4. Inject BM-139 extract path (cross-form pointer).
    checkProvenanceMutation(
      'row-injects-BM-139-extract-path',
      String(provenanceRow).replace(
        BM140_EXTRACT_PATH,
        BM139_EXTRACT_PATH,
      ),
    );

    const rejected = verdicts.filter((v) => v.verdict === 'REJECTED');
    const passed = verdicts.filter((v) => v.verdict === 'PASSED_THROUGH');
    assert.equal(
      passed.length,
      0,
      `BM-140 provenance mutations leaked through: ${JSON.stringify(passed, null, 2)}`,
    );
    assert.ok(
      rejected.length >= 4,
      `BM-140 must reject at least 4 provenance mutations — got ${rejected.length}: ${JSON.stringify(verdicts, null, 2)}`,
    );
  });
});

// ============================================================
// BM-140 invariant tests
// ============================================================

describe('BM-140 invariant tests (GATE C)', () => {
  let profile;
  let provenanceRow;
  let compiled;

  before(() => {
    profile = loadProfileFor(BM140_CODE, BM140_PROFILE_VAR);
    provenanceRow = findProvenanceRow(readProvenanceLedger(), BM140_CODE);
    compiled = loadContract(BM140_CODE);
  });

  it('BM-140 profile.templateCode is "BM-140"', () => {
    assert.equal(profile.templateCode, BM140_CODE);
  });

  it('BM-140 profile has 5 fields matching the compiled contract', () => {
    const keys = Object.keys(profile.fields);
    assert.equal(keys.length, 5);
    for (const k of BM140_EXPECTED_FIELDS) {
      assert.ok(keys.includes(k), `BM-140 profile missing field "${k}"`);
    }
  });

  it('BM-140 demo has 5 values matching the compiled contract', () => {
    const keys = Object.keys(profile.demo);
    assert.equal(keys.length, 5);
  });

  it('BM-140 profile sections contain exactly the 1 compiled sectionId', () => {
    const sections = profile.sections;
    assert.ok(Array.isArray(sections), 'sections must be an array');
    assert.equal(sections.length, 1);
    assert.equal(sections[0].sectionId, 'section-thong-tin-bieu-mau');
    assert.ok(
      sections[0].description?.trim(),
      'BM-140 presentationSection must have a non-empty description',
    );
  });

  it('BM-140 profile passes shared validator with empty issues', () => {
    const issues = validateCuration(profile, compiled, provenanceRow);
    assert.deepEqual(
      issues,
      [],
      `BM-140 shared validator must report zero issues — got: ${JSON.stringify(issues, null, 2)}`,
    );
  });

  it('BM-140 scoped document identity passes (no throw)', () => {
    assertBm140DocumentIdentity(profile, provenanceRow, compiled);
  });

  it('BM-140 scoped presentation identity passes (no throw)', () => {
    assertBm140PresentationIdentity(profile, compiled);
  });

  it('BM-140 scoped provenance identity passes (no throw)', () => {
    assertBm140ProvenanceIdentity(provenanceRow);
  });

  it('BM-140 scoped semantic identity passes (no throw)', () => {
    assertBm140SemanticIdentity(profile, provenanceRow, compiled);
  });
});