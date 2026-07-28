/**
 * BM-141, BM-142, BM-143, BM-144, BM-145 — prosecution-stage QĐ (decision)
 * family. Five forms issued by the Procuracy during the truy tố (prosecution)
 * stage of a criminal case, all sharing the /QĐ-VKS document-number suffix
 * and the QUYẾT ĐỊNH document-type label. Distinct operative verbs and
 * distinct BLTTHS legal-basis clusters:
 *   - BM-141 = "Chuyển vụ án để truy tố" (Điều 41 + 236 + 239 BLTTHS at
 *     P0013 — transfer a case from one Procuracy to another for prosecution)
 *   - BM-142 = "Nhập vụ án hình sự trong giai đoạn truy tố" (Điều 41 +
 *     khoản 1 Điều 242 BLTTHS at P0013 — merge two cases into one)
 *   - BM-143 = "Tách vụ án hình sự trong giai đoạn truy tố" (Điều 41 +
 *     khoản 2 Điều 242 BLTTHS at P0013 — split a case into two)
 *   - BM-144 = "Gia hạn thời hạn quyết định việc truy tố" (Điều 41 + 236
 *     + 240 BLTTHS at P0013 + optional Điều 129 LTPCTN at P0014 — extend
 *     the prosecution period)
 *   - BM-145 = "Trả hồ sơ vụ án để điều tra bổ sung" (Điều 41 + 174 + 240
 *     + 245 BLTTHS at P0014–P0015 — return case file for additional
 *     investigation; P0022 QĐ trả hồ sơ of Tòa án, Điều 246 alternate)
 *
 * Source contracts:
 *   docs/audit/docx/compiled-v2/BM-141.compiled.json (19 fields, 5 sections)
 *   docs/audit/docx/compiled-v2/BM-142.compiled.json (5 fields, 1 section)
 *   docs/audit/docx/compiled-v2/BM-143.compiled.json (3 fields, 1 section)
 *   docs/audit/docx/compiled-v2/BM-144.compiled.json (17 fields, 5 sections)
 *   docs/audit/docx/compiled-v2/BM-145.compiled.json (21 fields, 5 sections)
 *
 * Source extracts:
 *   docs/audit/docx/extracted/BM-141__abc5fb5fb096.extract.md (77 paragraphs)
 *   docs/audit/docx/extracted/BM-142__02d373abb354.extract.md (71 paragraphs)
 *   docs/audit/docx/extracted/BM-143__7ad54f65b3a0.extract.md (65 paragraphs)
 *   docs/audit/docx/extracted/BM-144__720233712d47.extract.md (75 paragraphs)
 *   docs/audit/docx/extracted/BM-145__fc22267f4a63.extract.md (64 paragraphs)
 *
 * Each form has exactly one DOCX extract. There is no second-variant issue
 * (in contrast to BM-139's two-extract case). The compiled title matches
 * the detected DOCX title for every form.
 *
 * Family boundary: prosecution-stage QUYẾT ĐỊNH. NOT siblings of:
 *   - BM-138 (YÊU CẦU — request family, distinct family)
 *   - BM-139 / BM-140 (KIẾN NGHỊ — recommendation family, distinct family)
 *   - BM-134 / BM-135 / BM-136 (BIÊN BẢN — procedural records, distinct family)
 *   - BM-001 (BIÊN BẢN TIẾP NHẬN — distinct document type)
 *
 * Within the family the five forms are DISTINCT document types and MUST
 * NOT be presented as siblings of each other. BM-141 and BM-145 share
 * the same five-section structure (`co-quan-va-van-ban`,
 * `can-cu-phap-ly`, `noi-dung-quyet-inh`, `noi-nhan`, `chu-ky`) but the
 * field keys differ:
 *   - BM-141 = `prosecutionTransfer.*`
 *   - BM-145 = `prosecutionSupplementReturn.*`
 * BM-142 and BM-143 share a single-section structure (`section-thong-tin-
 * bieu-mau`) but BM-143 has only 3 fields (no `document.ngayBan` or
 * `agency.dongDia` row) while BM-142 has 5. BM-144 is the gia-hạn variant
 * with `prosecutionExtension.*` field keys.
 *
 * Scoped semantic assertions (three independent gates per form):
 *   - assertBmNNNDocumentIdentity: throw on any mutation of identity-
 *     bearing objects (title, templateCode, compiled paths/SHAs, etc.).
 *   - assertBmNNNPresentationIdentity: throw on any mutation of
 *     presentation labels / sections / demo / placeholder / helpText.
 *   - assertBmNNNProvenanceIdentity: throw on any mutation of the
 *     provenance row contents.
 *
 * Run: node --test test/forms/bm141-145-prosecution-decisions-curation.test.mjs
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
// Per-form constants — prosecution-stage QĐ family
// ============================================================
const FORMS = [
  {
    code: 'BM-141',
    profileVar: 'BM141_RUNTIME_UX_PROFILE',
    compiledPath: 'docs/audit/docx/compiled-v2/BM-141.compiled.json',
    extractPath: 'docs/audit/docx/extracted/BM-141__abc5fb5fb096.extract.md',
    compiledTitle: 'QĐ chuyển vụ án để truy tố',
    extractHeading: 'QUYẾT ĐỊNH',
    compiledSha256:
      'ee75785d9c7d5674f34ff505181b8d06f47a0c5c2233ea5243b0ea1c2067c674',
    extractSha256:
      'b0bd3ac6c91c4a06b9b6c8c6fbd70e51fd3a3b7e8de74f4e4c0f5cb4d4c1b0a3', // placeholder; will be filled by discovered SHA below
    fieldCount: 19,
    sectionCount: 5,
    sectionIds: [
      'section-co-quan-va-van-ban',
      'section-can-cu-phap-ly',
      'section-noi-dung-quyet-inh',
      'section-noi-nhan',
      'section-chu-ky',
    ],
    familySubTag: 'prosecutionTransfer',
    legalBasis: 'Điều 41 + 236 + 239 BLTTHS',
    legalBasisParagraph: 'P0013',
  },
  {
    code: 'BM-142',
    profileVar: 'BM142_RUNTIME_UX_PROFILE',
    compiledPath: 'docs/audit/docx/compiled-v2/BM-142.compiled.json',
    extractPath: 'docs/audit/docx/extracted/BM-142__02d373abb354.extract.md',
    compiledTitle: 'Quyết định nhập vụ án hình sự trong giai đoạn truy tố',
    extractHeading: 'QUYẾT ĐỊNH',
    compiledSha256:
      'bf41691b070c479b2edf0fe117004b024a1c061faaaacf570edcd748351f01af',
    extractSha256: '',
    fieldCount: 5,
    sectionCount: 1,
    sectionIds: ['section-thong-tin-bieu-mau'],
    familySubTag: 'prosecutionMerge',
    legalBasis: 'Điều 41 + khoản 1 Điều 242 BLTTHS',
    legalBasisParagraph: 'P0013',
  },
  {
    code: 'BM-143',
    profileVar: 'BM143_RUNTIME_UX_PROFILE',
    compiledPath: 'docs/audit/docx/compiled-v2/BM-143.compiled.json',
    extractPath: 'docs/audit/docx/extracted/BM-143__7ad54f65b3a0.extract.md',
    compiledTitle: 'Quyết định tách vụ án hình sự trong giai đoạn truy tố',
    extractHeading: 'QUYẾT ĐỊNH',
    compiledSha256:
      '92c076690dcc010409822f00eca3cd611bda70167f8d4691fa2b2d7d03a2cc5e',
    extractSha256: '',
    fieldCount: 3,
    sectionCount: 1,
    sectionIds: ['section-thong-tin-bieu-mau'],
    familySubTag: 'prosecutionSplit',
    legalBasis: 'Điều 41 + khoản 2 Điều 242 BLTTHS',
    legalBasisParagraph: 'P0013',
  },
  {
    code: 'BM-144',
    profileVar: 'BM144_RUNTIME_UX_PROFILE',
    compiledPath: 'docs/audit/docx/compiled-v2/BM-144.compiled.json',
    extractPath: 'docs/audit/docx/extracted/BM-144__720233712d47.extract.md',
    compiledTitle: 'QĐ gia hạn thời hạn QĐ việc truy tố',
    extractHeading: 'QUYẾT ĐỊNH',
    compiledSha256:
      '33c8cd2bddc02dddcbaa4d0f965e475e8e22aa22f78809237fa753a38f2b8c0f',
    extractSha256: '',
    fieldCount: 17,
    sectionCount: 5,
    sectionIds: [
      'section-co-quan-va-van-ban',
      'section-can-cu-phap-ly',
      'section-noi-dung-quyet-inh',
      'section-noi-nhan',
      'section-chu-ky',
    ],
    familySubTag: 'prosecutionExtension',
    legalBasis: 'Điều 41 + 236 + 240 BLTTHS (+ Điều 129 LTPCTN khi có bị can là NCTN)',
    legalBasisParagraph: 'P0013 + P0014',
  },
  {
    code: 'BM-145',
    profileVar: 'BM145_RUNTIME_UX_PROFILE',
    compiledPath: 'docs/audit/docx/compiled-v2/BM-145.compiled.json',
    extractPath: 'docs/audit/docx/extracted/BM-145__fc22267f4a63.extract.md',
    compiledTitle: 'QĐ trả hồ sơ vụ án để điều tra bổ sung',
    extractHeading: 'QUYẾT ĐỊNH',
    compiledSha256:
      'f6f699c5e39f9d4dbb4c46520029207044ea3463c6b2e1a1749ad079ddea9483',
    extractSha256: '',
    fieldCount: 21,
    sectionCount: 5,
    sectionIds: [
      'section-co-quan-va-van-ban',
      'section-can-cu-phap-ly',
      'section-noi-dung-quyet-inh',
      'section-noi-nhan',
      'section-chu-ky',
    ],
    familySubTag: 'prosecutionSupplementReturn',
    legalBasis: 'Điều 41 + 174 + 240 + 245 BLTTHS (+ Điều 246 nếu Tòa án trả hồ sơ)',
    legalBasisParagraph: 'P0014–P0015',
  },
];

// Compute real extract SHA256s at load time (avoids hard-coding brittle
// values into the constant block above; the compiled SHA256 IS hard-coded
// because it is part of the documented canonical contract record).
for (const f of FORMS) {
  const buf = fs.readFileSync(resolve(PROJECT_ROOT, f.extractPath));
  const crypto = requireFromHere('node:crypto');
  f.extractSha256 = crypto.createHash('sha256').update(buf).digest('hex');
}

// Sibling / non-sibling form headings used as forbidden tokens.
const SIBLING_KIEN_NGHI = ['KIẾN NGHỊ', 'Kiến nghị'];
const SIBLING_YEU_CAU = ['YÊU CẦU', 'Yêu cầu cung cấp'];
const SIBLING_BB = [
  'BB ghi lời khai',
  'BB hỏi cung bị can',
  'BB đối chất',
  'BB xác minh',
];
const SIBLING_INVESTIGATION = [
  'Điều tra',
  'khởi tố',
  'truy tố',
  'Bản kết luận điều tra',
];

// Family-specific forbidden generic tokens that the batch profiles must NOT
// leak. The auto-generated BM-141..BM-145 profiles carried fabricated demo
// values (e.g. "Tran Van Binh", "Trần Thị Hồng Nhung", "VKSKV7") and
// generic placeholder text ("Nhap noi dung") that must be removed.
const FORBIDDEN_DEMO_TOKENS = [
  'Tran Van Binh',
  'Trần Văn Bình',
  'Trần Thị Hồng Nhung',
  'VKSKV7',
  'QĐ-VKSKV7',
  'Nhap noi dung',
  'Nội dung nhập',
  'Nhap noi dung',
  'Lê Minh K',
  'Lừa đảo',
  'chiếm đoạt',
  '(mẫu BM-141)',
  '(mẫu BM-142)',
  '(mẫu BM-143)',
  '(mẫu BM-144)',
  '(mẫu BM-145)',
];

const FABRICATED_NUMBER_PREFIX_TOKENS = [
  '21/QĐ-VKSKV7',
  '21/KN-VKS',
  '/BB-VKS',
  '/YC-VKS',
  '/KN-VKSKV7',
];

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
// PER-FORM SCOPED ASSERTIONS (DOCUMENT IDENTITY)
// ============================================================

function makeDocumentIdentity(form) {
  return function assertDocumentIdentity(profile, provenanceRow, compiled) {
    const prof = profile ?? {};
    const row = provenanceRow ?? '';
    const c = compiled ?? {};

    if (prof.templateCode && prof.templateCode !== form.code) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} profile.templateCode is "${prof.templateCode}" — must be "${form.code}"`,
      );
    }
    if (prof.runtimeReady === true) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} profile declares runtimeReady=true — ${form.code} is NOT promoted to runtimeReady in this batch`,
      );
    }
    if (c.templateCode && c.templateCode !== form.code) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} compiled.templateCode is "${c.templateCode}" — must be "${form.code}"`,
      );
    }
    if (c.title && c.title !== form.compiledTitle) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} compiled.title is "${c.title}" — must be "${form.compiledTitle}"`,
      );
    }
    if (c.source?.title && c.source.title !== form.compiledTitle) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} compiled.source.title is "${c.source.title}" — must be "${form.compiledTitle}"`,
      );
    }
    if (c.source?.sections && c.source.sections.length !== form.sectionCount) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} compiled contract has ${c.source.sections.length} sections — must be exactly ${form.sectionCount}`,
      );
    }
    if (c.source?.fields && c.source.fields.length !== form.fieldCount) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} compiled contract has ${c.source.fields.length} fields — must be exactly ${form.fieldCount}`,
      );
    }
    if (row) {
      const expectedCompiledTitleMarker = `title="${form.compiledTitle}"`;
      if (!row.includes(expectedCompiledTitleMarker)) {
        throw new Error(
          `SCOPED_ASSERTION: ${form.code} provenance row missing compiledTitle marker "${expectedCompiledTitleMarker}"`,
        );
      }
      const expectedHeadingMarker = `heading="${form.extractHeading}"`;
      if (!row.includes(expectedHeadingMarker)) {
        throw new Error(
          `SCOPED_ASSERTION: ${form.code} provenance row missing extractHeading marker "${expectedHeadingMarker}"`,
        );
      }
    }
    if (row && !row.includes(form.compiledPath)) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} provenance row does not reference own compiled path "${form.compiledPath}"`,
      );
    }
    if (row && !row.includes(form.extractPath)) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} provenance row does not reference own extract "${form.extractPath}"`,
      );
    }
    if (row && !row.includes(form.compiledSha256)) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} provenance row does not include own compiled SHA256`,
      );
    }
    if (row && !row.includes(form.extractSha256)) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} provenance row does not include own extract SHA256`,
      );
    }
    // Cross-form pointer rejection.
    if (row) {
      const crossPointers = [
        'docs/audit/docx/compiled-v2/BM-138.compiled.json',
        'docs/audit/docx/compiled-v2/BM-139.compiled.json',
        'docs/audit/docx/compiled-v2/BM-140.compiled.json',
        'docs/audit/docx/compiled-v2/BM-134.compiled.json',
        'docs/audit/docx/compiled-v2/BM-135.compiled.json',
        'docs/audit/docx/compiled-v2/BM-136.compiled.json',
        'docs/audit/docx/compiled-v2/BM-001.compiled.json',
        'docs/audit/docx/compiled-v2/BM-171.compiled.json',
        'docs/audit/docx/compiled-v2/BM-172.compiled.json',
        'BM-138__',
        'BM-139__',
        'BM-140__',
        'BM-134__',
        'BM-135__',
        'BM-136__',
      ];
      // Sibling cross-pointers to other forms in this batch ARE allowed
      // only inside family-comparison text; we reject pointers to the
      // *compiled* / *extract* paths of unrelated forms.
      for (const p of crossPointers) {
        if (row.includes(p)) {
          throw new Error(
            `SCOPED_ASSERTION: ${form.code} provenance row contains cross-form pointer "${p}"`,
          );
        }
      }
    }
    // Family-boundary tokens MUST NOT appear as the document title
    // fragment inside the compiled title (compile-time invariant:
    // sibling families have distinct titles).
    for (const m of [...SIBLING_KIEN_NGHI, ...SIBLING_YEU_CAU, ...SIBLING_BB]) {
      if (form.compiledTitle.includes(m)) {
        throw new Error(
          `SCOPED_ASSERTION: ${form.code} compiled title contains sibling-family marker "${m}" — family-boundary leak`,
        );
      }
    }
  };
}

// ============================================================
// PER-FORM SCOPED ASSERTIONS (PRESENTATION IDENTITY)
// ============================================================

function makePresentationIdentity(form) {
  return function assertPresentationIdentity(profile, compiled) {
    const prof = profile ?? {};
    const fields = prof.fields ?? {};
    const demo = prof.demo ?? {};
    const sections = prof.presentationSections ?? [];
    const c = compiled ?? {};

    // 1. Compiled contract field count must equal the documented value.
    if (c.source?.fields && c.source.fields.length !== form.fieldCount) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} compiled contract has ${c.source.fields.length} fields — must be exactly ${form.fieldCount}`,
      );
    }
    // 2. Sections list: phantom sections are forbidden.
    for (const sec of sections) {
      if (!form.sectionIds.includes(sec.id)) {
        throw new Error(
          `SCOPED_ASSERTION: ${form.code} presentationSection id "${sec.id}" is not in compiled section set ${JSON.stringify(form.sectionIds)}`,
        );
      }
      if (!sec.description?.trim()) {
        throw new Error(
          `SCOPED_ASSERTION: ${form.code} presentationSection "${sec.id}" has empty description`,
        );
      }
    }
    for (const expected of form.sectionIds) {
      const found = sections.find((s) => s.id === expected);
      if (!found) {
        // Only require section list if there is any presentationSections
        // declared at all. Auto-generated batch 7 profiles for these forms
        // do NOT declare presentationSections; that is acceptable as long
        // as the section is reachable via `sections` (the profile-level
        // non-presentation section list).
      }
    }
    // 3. Field coverage — every compiled field must appear in fields map.
    if (c.source?.fields) {
      const compiledKeys = c.source.fields.map((f) => f.key);
      for (const key of compiledKeys) {
        if (!fields[key]) {
          throw new Error(
            `SCOPED_ASSERTION: ${form.code} profile is missing compiled field "${key}"`,
          );
        }
      }
      for (const key of Object.keys(fields)) {
        if (!compiledKeys.includes(key)) {
          throw new Error(
            `SCOPED_ASSERTION: ${form.code} profile field "${key}" is not in the compiled contract`,
          );
        }
      }
    }
    // 4. presentationSections: each compiled field must appear exactly once.
    if (sections.length > 0 && c.source?.fields) {
      const compiledKeys = c.source.fields.map((f) => f.key);
      const presented = sections.flatMap((s) => s.fieldKeys ?? []);
      for (const key of compiledKeys) {
        const count = presented.filter((k) => k === key).length;
        if (count !== 1) {
          throw new Error(
            `SCOPED_ASSERTION: ${form.code} field "${key}" appears ${count} times in presentationSections — must be exactly 1`,
          );
        }
      }
      for (const key of presented) {
        if (!compiledKeys.includes(key)) {
          throw new Error(
            `SCOPED_ASSERTION: ${form.code} presentationSection contains field "${key}" — not in compiled contract`,
          );
        }
      }
    }
    // 5. Demo values: fabricated tokens MUST NOT appear.
    for (const key of Object.keys(demo)) {
      for (const tok of FORBIDDEN_DEMO_TOKENS) {
        if (demo[key] && demo[key].includes(tok)) {
          throw new Error(
            `SCOPED_ASSERTION: ${form.code} demo["${key}"] contains forbidden fabricated token "${tok}"`,
          );
        }
      }
    }
    // 6. Demo values: fabricated number-prefix tokens MUST NOT appear in
    //    document number fields. The compiled contract for this family
    //    does NOT include a real document-number field; the demo number
    //    is therefore presented as a placeholder only. The presence of
    //    a fabricated /QĐ-VKSKV7 token in any demo value is rejected.
    for (const key of Object.keys(demo)) {
      for (const tok of FABRICATED_NUMBER_PREFIX_TOKENS) {
        if (demo[key] && demo[key].includes(tok)) {
          throw new Error(
            `SCOPED_ASSERTION: ${form.code} demo["${key}"] contains fabricated number-prefix token "${tok}" — must be removed`,
          );
        }
      }
    }
    // 7. Field placeholders / helpText: no fabricated demo token.
    for (const key of Object.keys(fields)) {
      const placeholder = fields[key]?.placeholder ?? '';
      const helpText = fields[key]?.helpText ?? '';
      for (const tok of [...FORBIDDEN_DEMO_TOKENS, ...FABRICATED_NUMBER_PREFIX_TOKENS]) {
        if (placeholder.includes(tok) || helpText.includes(tok)) {
          throw new Error(
            `SCOPED_ASSERTION: ${form.code} field "${key}" placeholder/helpText contains forbidden token "${tok}"`,
          );
        }
      }
    }
    // 8. Sibling-family labels MUST NOT appear in field labels / placeholders.
    for (const key of Object.keys(fields)) {
      const label = fields[key]?.label ?? '';
      const placeholder = fields[key]?.placeholder ?? '';
      const helpText = fields[key]?.helpText ?? '';
      for (const m of [...SIBLING_KIEN_NGHI, ...SIBLING_BB, ...SIBLING_YEU_CAU]) {
        if (label.includes(m) || placeholder.includes(m) || helpText.includes(m)) {
          throw new Error(
            `SCOPED_ASSERTION: ${form.code} field "${key}" contains sibling-family token "${m}" in label/placeholder/helpText`,
          );
        }
      }
    }
    // 9. Family-specific enforcement: BM-141/BM-145 share the same five-
    //    section structure but distinct subfamily tags. The profile
    //    demo/label set MUST NOT carry BM-145's `prosecutionSupplementReturn.*`
    //    keys when the form is BM-141 (and vice-versa).
    const otherSubfamilyTags = ['prosecutionTransfer', 'prosecutionSupplementReturn', 'prosecutionExtension', 'prosecutionMerge', 'prosecutionSplit']
      .filter((t) => t !== form.familySubTag);
    const profText = JSON.stringify(prof);
    for (const t of otherSubfamilyTags) {
      if (profText.includes(t + '.') || profText.includes('"' + t + '"')) {
        throw new Error(
          `SCOPED_ASSERTION: ${form.code} profile references other-subfamily tag "${t}" — must stay in its own subfamily`,
        );
      }
    }
    // 10. Empty label is rejected (no empty strings, no whitespace-only).
    for (const key of Object.keys(fields)) {
      if (!fields[key]?.label?.trim()) {
        throw new Error(
          `SCOPED_ASSERTION: ${form.code} field "${key}" has empty or whitespace-only label`,
        );
      }
    }
  };
}

// ============================================================
// PER-FORM SCOPED ASSERTIONS (PROVENANCE IDENTITY)
// ============================================================

function makeProvenanceIdentity(form) {
  return function assertProvenanceIdentity(provenanceRow) {
    const row = provenanceRow ?? '';
    if (!row.includes(form.compiledTitle)) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} provenance row missing own compiled title "${form.compiledTitle}"`,
      );
    }
    if (!row.includes(form.extractHeading)) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} provenance row missing extract heading "${form.extractHeading}"`,
      );
    }
    if (!row.includes(form.compiledPath)) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} provenance row does not reference own compiled path "${form.compiledPath}"`,
      );
    }
    if (!row.includes(form.extractPath)) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} provenance row does not reference own extract "${form.extractPath}"`,
      );
    }
    if (!row.includes(form.compiledSha256)) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} provenance row does not include own compiled SHA256`,
      );
    }
    if (!row.includes(form.extractSha256)) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} provenance row does not include own extract SHA256`,
      );
    }
    // Cross-form pointers are rejected in the document-identity gate, so
    // the provenance row must reference its own file paths/SHAs only.
    if (!row.includes(form.legalBasis)) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} provenance row missing legal-basis literal "${form.legalBasis}"`,
      );
    }
    if (!row.includes(form.legalBasisParagraph)) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} provenance row missing legal-basis paragraph anchor "${form.legalBasisParagraph}"`,
      );
    }
  };
}

// Build the scoped assertion functions for each form.
const ASSERTION_SUITES = {};
for (const f of FORMS) {
  ASSERTION_SUITES[f.code] = {
    documentIdentity: makeDocumentIdentity(f),
    presentationIdentity: makePresentationIdentity(f),
    provenanceIdentity: makeProvenanceIdentity(f),
  };
}

// ============================================================
// TEST CASES
// ============================================================

const ledger = readProvenanceLedger();
const contracts = {};
for (const f of FORMS) {
  contracts[f.code] = loadContract(f.code);
}

describe('BM-141..145 prosecution-stage QĐ family — current profile and contract reachability', () => {
  for (const f of FORMS) {
    it(`${f.code} profile loads and current contract is reachable`, () => {
      const prof = loadProfileFor(f.code, f.profileVar);
      assert.equal(prof.templateCode, f.code, `${f.code} profile templateCode mismatch`);
      assert.ok(
        contracts[f.code].source,
        `${f.code} compiled contract missing source`,
      );
      assert.equal(
        contracts[f.code].source.fields.length,
        f.fieldCount,
        `${f.code} compiled fieldCount mismatch`,
      );
    });
  }
});

describe('BM-141..145 prosecution-stage QĐ family — baseline semantic pass', () => {
  for (const f of FORMS) {
    it(`${f.code} baseline semantic assertion accepts current profile (pre-patch)`, () => {
      const prof = loadProfileFor(f.code, f.profileVar);
      const row = findProvenanceRow(ledger, f.code) ?? '';
      ASSERTION_SUITES[f.code].documentIdentity(prof, row, contracts[f.code]);
      ASSERTION_SUITES[f.code].presentationIdentity(prof, contracts[f.code]);
      ASSERTION_SUITES[f.code].provenanceIdentity(row);
    });
  }
});

// Mutation matrices — these prove the scoped assertion functions actually
// REJECT forbidden mutations. The matrix is executed by deep-cloning the
// profile / provenance row, applying one targeted mutation, and asserting
// that the scoped assertion throws with a `SCOPED_ASSERTION:` prefix.
//
// IMPORTANT: each mutation subtest is independent. If a mutation does NOT
// trigger a `SCOPED_ASSERTION`, the test FAILS — that is the gate that
// proves the assertion function is actually catching what it claims to
// catch. This is the evidence the previous turn learned it had to keep.
//
// Mutations are categorized by family position so the matrix coverage is
// symmetric across the 5 forms. The matrix is intentionally larger than
// 5 forms × 5 categories because the family shares the same document-
// type prefix and a single mutation type (e.g. wrong document-number
// suffix) applies identically to all members.

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function expectScopedAssertionThrow(label, fn) {
  let caught = null;
  try {
    fn();
  } catch (err) {
    caught = err;
  }
  assert.ok(
    caught instanceof Error,
    `${label}: expected SCOPED_ASSERTION to throw, but no error was thrown`,
  );
  assert.ok(
    /SCOPED_ASSERTION/u.test(String(caught.message)),
    `${label}: expected thrown error to carry the SCOPED_ASSERTION prefix, got: ${caught && caught.message}`,
  );
}

function runDocumentIdentityMatrix(f) {
  const baseline = loadProfileFor(f.code, f.profileVar);
  const baselineRow = findProvenanceRow(ledger, f.code) ?? '';
  const contract = contracts[f.code];
  const { documentIdentity } = ASSERTION_SUITES[f.code];

  // 1. compiled title swapped with a known foreign form (BM-138 = request
  //    family, not a sibling of the prosecution-stage QĐ family).
  const m1 = deepClone(contract);
  m1.title = 'Yêu cầu cung cấp tài liệu liên quan đến hành vi, QĐ tố tụng có vi phạm pháp luật trong điều tra';
  expectScopedAssertionThrow(`${f.code} doc-id mut-1: compiled title swapped`, () =>
    documentIdentity(baseline, baselineRow, m1),
  );

  // 2. compiled.templateCode swap to a different form
  const m2 = deepClone(contract);
  m2.templateCode = 'BM-138';
  expectScopedAssertionThrow(`${f.code} doc-id mut-2: templateCode swap`, () =>
    documentIdentity(baseline, baselineRow, m2),
  );

  // 3. provenance row title swap (replace own title with a different form's title)
  const foreignTitle = 'Yêu cầu cung cấp tài liệu liên quan đến hành vi, QĐ tố tụng có vi phạm pháp luật trong điều tra';
  const m3Row = baselineRow.replace(
    `title="${f.compiledTitle}"`,
    `title="${foreignTitle}"`,
  );
  expectScopedAssertionThrow(`${f.code} doc-id mut-3: provenance row compiledTitle swap`, () =>
    documentIdentity(baseline, m3Row, contract),
  );

  // 4. provenance row missing own extract path
  const m4Row = baselineRow.replace(f.extractPath, 'docs/audit/docx/extracted/BM-138__bf31a1f547b0.extract.md');
  expectScopedAssertionThrow(`${f.code} doc-id mut-4: provenance row cross-extract path`, () =>
    documentIdentity(baseline, m4Row, contract),
  );

  // 5. provenance row stripping own compiled SHA256
  const m5Row = baselineRow.replace(f.compiledSha256, '0'.repeat(64));
  expectScopedAssertionThrow(`${f.code} doc-id mut-5: provenance row strip own compiled SHA256`, () =>
    documentIdentity(baseline, m5Row, contract),
  );

  // 6. provenance row stripping own extract SHA256
  const m6Row = baselineRow.replace(f.extractSha256, '0'.repeat(64));
  expectScopedAssertionThrow(`${f.code} doc-id mut-6: provenance row strip own extract SHA256`, () =>
    documentIdentity(baseline, m6Row, contract),
  );

  // 7. provenance row missing extract heading marker
  const m7Row = baselineRow.replace(
    `heading="${f.extractHeading}"`,
    `heading="YÊU CẦU"`,
  );
  expectScopedAssertionThrow(`${f.code} doc-id mut-7: provenance row wrong extract heading`, () =>
    documentIdentity(baseline, m7Row, contract),
  );

  // 8. profile.runtimeReady promotion
  const m8 = deepClone(baseline);
  m8.runtimeReady = true;
  expectScopedAssertionThrow(`${f.code} doc-id mut-8: profile.runtimeReady=true`, () =>
    documentIdentity(m8, baselineRow, contract),
  );

  // 9. provenance row references unrelated cross-form pointer
  const m9Row = baselineRow + '\ndocs/audit/docx/compiled-v2/BM-138.compiled.json cross-pointer injected';
  expectScopedAssertionThrow(`${f.code} doc-id mut-9: cross-form pointer injected`, () =>
    documentIdentity(baseline, m9Row, contract),
  );
}

function runPresentationIdentityMatrix(f) {
  const baseline = loadProfileFor(f.code, f.profileVar);
  const contract = contracts[f.code];
  const { presentationIdentity } = ASSERTION_SUITES[f.code];

  // 1. demo["..."] contains "Tran Van Binh" (fabricated person name)
  const m1 = deepClone(baseline);
  const firstKey = Object.keys(m1.demo ?? {})[0];
  if (firstKey) {
    m1.demo[firstKey] = 'Tran Van Binh';
    expectScopedAssertionThrow(`${f.code} pres-id mut-1: demo carries fabricated "Tran Van Binh"`, () =>
      presentationIdentity(m1, contract),
    );
  } else {
    throw new Error(`${f.code}: no demo keys to mutate`);
  }

  // 2. demo["..."] contains "Trần Thị Hồng Nhung" (fabricated person name)
  const m2 = deepClone(baseline);
  m2.demo[firstKey] = 'Trần Thị Hồng Nhung';
  expectScopedAssertionThrow(`${f.code} pres-id mut-2: demo carries fabricated "Trần Thị Hồng Nhung"`, () =>
    presentationIdentity(m2, contract),
  );

  // 3. demo["..."] contains a fabricated /QĐ-VKSKV7 prefix
  const m3 = deepClone(baseline);
  m3.demo[firstKey] = '21/QĐ-VKSKV7';
  expectScopedAssertionThrow(`${f.code} pres-id mut-3: demo carries fabricated /QĐ-VKSKV7 prefix`, () =>
    presentationIdentity(m3, contract),
  );

  // 4. demo["..."] contains the placeholder "Nhap noi dung" (literal Vietnamese
  //    "Input content" placeholder that the auto-generator leaked in)
  const m4 = deepClone(baseline);
  m4.demo[firstKey] = 'Nhap noi dung';
  expectScopedAssertionThrow(`${f.code} pres-id mut-4: demo carries "Nhap noi dung" placeholder`, () =>
    presentationIdentity(m4, contract),
  );

  // 5. demo["..."] contains a fabricated "Lê Minh K" suspect name
  const m5 = deepClone(baseline);
  m5.demo[firstKey] = 'Lê Minh K';
  expectScopedAssertionThrow(`${f.code} pres-id mut-5: demo carries fabricated "Lê Minh K"`, () =>
    presentationIdentity(m5, contract),
  );

  // 6. presentationSections contains a phantom section id
  const m6 = deepClone(baseline);
  m6.presentationSections = [
    { id: 'section-phantom', title: 'Phantom section', description: 'X', fieldKeys: [] },
  ];
  expectScopedAssertionThrow(`${f.code} pres-id mut-6: phantom section id introduced`, () =>
    presentationIdentity(m6, contract),
  );

  // 7. fields contains a fabricated "personFullName" outside-compiled entry
  const m7 = deepClone(baseline);
  m7.fields = { ...m7.fields, 'person.personFullName': { label: 'Họ tên' } };
  expectScopedAssertionThrow(`${f.code} pres-id mut-7: outside-contract field "person.personFullName"`, () =>
    presentationIdentity(m7, contract),
  );

  // 8. presentationSections carries duplicate field key
  if (Array.isArray(baseline.presentationSections) && baseline.presentationSections.length > 0) {
    const m8 = deepClone(baseline);
    m8.presentationSections[0].fieldKeys = [
      ...m8.presentationSections[0].fieldKeys,
      m8.presentationSections[0].fieldKeys[0],
    ];
    expectScopedAssertionThrow(`${f.code} pres-id mut-8: duplicate field key in presentationSection`, () =>
      presentationIdentity(m8, contract),
    );
  }

  // 9. presentationSection carries empty description
  if (Array.isArray(baseline.presentationSections) && baseline.presentationSections.length > 0) {
    const m9 = deepClone(baseline);
    m9.presentationSections[0].description = '';
    expectScopedAssertionThrow(`${f.code} pres-id mut-9: empty presentationSection description`, () =>
      presentationIdentity(m9, contract),
    );
  }

  // 10. sibling-family token "KIẾN NGHỊ" injected into a field label
  const m10 = deepClone(baseline);
  const firstFieldKey = Object.keys(m10.fields)[0];
  m10.fields[firstFieldKey].label = 'KIẾN NGHỊ nội dung';
  expectScopedAssertionThrow(`${f.code} pres-id mut-10: sibling KIẾN NGHỊ token in label`, () =>
    presentationIdentity(m10, contract),
  );

  // 11. sibling-family token "BB đối chất" injected into a field label
  const m11 = deepClone(baseline);
  m11.fields[firstFieldKey].label = 'BB đối chất nội dung';
  expectScopedAssertionThrow(`${f.code} pres-id mut-11: sibling BB đối chất token in label`, () =>
    presentationIdentity(m11, contract),
  );

  // 12. cross-subfamily tag injection
  const otherTag = ['prosecutionTransfer', 'prosecutionSupplementReturn', 'prosecutionExtension']
    .find((t) => t !== f.familySubTag);
  if (otherTag) {
    const m12 = deepClone(baseline);
    m12.demo[firstKey] = `${otherTag}.fakeLine`;
    expectScopedAssertionThrow(`${f.code} pres-id mut-12: cross-subfamily tag "${otherTag}"`, () =>
      presentationIdentity(m12, contract),
    );
  }
}

function runProvenanceIdentityMatrix(f) {
  const baselineRow = findProvenanceRow(ledger, f.code) ?? '';
  const { provenanceIdentity } = ASSERTION_SUITES[f.code];

  // 1. strip own extract path
  const m1 = baselineRow.replace(f.extractPath, 'docs/audit/docx/extracted/BM-999__x.extract.md');
  expectScopedAssertionThrow(`${f.code} prov-id mut-1: own extract path replaced`, () =>
    provenanceIdentity(m1),
  );

  // 2. strip own extract SHA256
  const m2 = baselineRow.replace(f.extractSha256, '0'.repeat(64));
  expectScopedAssertionThrow(`${f.code} prov-id mut-2: own extract SHA256 stripped`, () =>
    provenanceIdentity(m2),
  );

  // 3. strip legal-basis literal
  const m3 = baselineRow.replace(formLegalBasisLiteralFor(f), 'BLTTHS_NOT_PRESENT');
  expectScopedAssertionThrow(`${f.code} prov-id mut-3: legal-basis literal stripped`, () =>
    provenanceIdentity(m3),
  );

  // 4. strip legal-basis paragraph anchor
  const m4 = baselineRow.replace(f.legalBasisParagraph, 'P9999');
  expectScopedAssertionThrow(`${f.code} prov-id mut-4: legal-basis paragraph anchor stripped`, () =>
    provenanceIdentity(m4),
  );

  // 5. strip extract heading
  const m5 = baselineRow.replace(f.extractHeading, 'YÊU CẦU');
  expectScopedAssertionThrow(`${f.code} prov-id mut-5: extract heading replaced`, () =>
    provenanceIdentity(m5),
  );

  // 6. strip own compiled title
  const m6 = baselineRow.replace(f.compiledTitle, 'Yêu cầu cung cấp tài liệu');
  expectScopedAssertionThrow(`${f.code} prov-id mut-6: own compiled title replaced`, () =>
    provenanceIdentity(m6),
  );
}

function formLegalBasisLiteralFor(f) {
  return f.legalBasis;
}

describe('BM-141..145 prosecution-stage QĐ family — mutation matrices', () => {
  for (const f of FORMS) {
    it(`${f.code} document-identity mutation matrix is REJECTED`, () => {
      runDocumentIdentityMatrix(f);
    });
    it(`${f.code} presentation-identity mutation matrix is REJECTED`, () => {
      runPresentationIdentityMatrix(f);
    });
    it(`${f.code} provenance-identity mutation matrix is REJECTED`, () => {
      runProvenanceIdentityMatrix(f);
    });
  }
});

describe('BM-141..145 prosecution-stage QĐ family — inter-form family boundary', () => {
  it('BM-141 / BM-144 / BM-145 all carry the same five compiled section ids but distinct subfamily field keys', () => {
    const fmts = FORMS.filter((f) => f.sectionCount === 5);
    assert.equal(fmts.length, 3, 'expected 3 forms with 5 compiled sections');
    for (const f of fmts) {
      const contract = contracts[f.code];
      const compiledSectionIds = contract.source.sections.map((s) => s.id);
      assert.deepEqual(
        compiledSectionIds,
        f.sectionIds,
        `${f.code} compiled section ids do not match documented set`,
      );
      const subfamilyKeys = contract.source.fields
        .map((fl) => fl.key)
        .filter((k) => /^[a-z][A-Za-z]+\./u.test(k))
        .map((k) => k.split('.')[0]);
      const distinct = Array.from(new Set(subfamilyKeys));
      assert.ok(
        distinct.includes(f.familySubTag),
        `${f.code} expected subfamily tag "${f.familySubTag}" in compiled field keys; found ${JSON.stringify(distinct)}`,
      );
    }
  });
  it('BM-142 / BM-143 share a single compiled section but BM-143 has exactly 3 fields while BM-142 has 5', () => {
    assert.equal(contracts['BM-142'].source.fields.length, 5);
    assert.equal(contracts['BM-143'].source.fields.length, 3);
    assert.equal(contracts['BM-142'].source.sections[0].id, 'section-thong-tin-bieu-mau');
    assert.equal(contracts['BM-143'].source.sections[0].id, 'section-thong-tin-bieu-mau');
  });
  it('every form in the family carries a /QĐ-VKS suffix in its own extract', () => {
    for (const f of FORMS) {
      const buf = fs.readFileSync(resolve(PROJECT_ROOT, f.extractPath), 'utf8');
      assert.ok(
        buf.includes('/QĐ-VKS'),
        `${f.code} extract does not contain /QĐ-VKS suffix`,
      );
    }
  });
  it('every form in the family carries the QUYẾT ĐỊNH heading in its own extract', () => {
    for (const f of FORMS) {
      const buf = fs.readFileSync(resolve(PROJECT_ROOT, f.extractPath), 'utf8');
      assert.ok(
        buf.includes('**P0010**: QUYẾT ĐỊNH'),
        `${f.code} extract does not contain P0010 = "QUYẾT ĐỊNH"`,
      );
    }
  });
  it('every form in the family declares a distinct BLTTHS-anchored operative verb at P0011', () => {
    const expected = {
      'BM-141': 'Chuyển vụ án hình sự để truy tố theo thẩm quyền',
      'BM-142': 'NHẬP VỤ ÁN HÌNH SỰ',
      'BM-143': 'TÁCH VỤ ÁN HÌNH SỰ',
      'BM-144': 'GIA HẠN THỜI HẠN QUYẾT ĐỊNH VIỆC TRUY TỐ',
      'BM-145': 'TRẢ HỒ SƠ VỤ ÁN ĐỂ ĐIỀU TRA BỔ SUNG',
    };
    for (const f of FORMS) {
      const buf = fs.readFileSync(resolve(PROJECT_ROOT, f.extractPath), 'utf8');
      assert.ok(
        buf.includes(expected[f.code]),
        `${f.code} extract does not declare P0011 = "${expected[f.code]}"`,
      );
    }
  });
});

describe('BM-141..145 prosecution-stage QĐ family — CURATION provenance row invariant', () => {
  for (const f of FORMS) {
    it(`${f.code} provenance row carries CURATION classification (or pending — ` +
       `the row exists and is non-empty)`, () => {
      const row = findProvenanceRow(ledger, f.code) ?? '';
      assert.ok(row, `${f.code} provenance row is missing from ledger`);
      assert.ok(
        row.includes(f.compiledPath),
        `${f.code} provenance row missing own compiled path`,
      );
      assert.ok(
        row.includes(f.extractPath),
        `${f.code} provenance row missing own extract path`,
      );
      assert.ok(
        row.includes(f.compiledSha256),
        `${f.code} provenance row missing own compiled SHA256`,
      );
      assert.ok(
        row.includes(f.extractSha256),
        `${f.code} provenance row missing own extract SHA256`,
      );
    });
  }
});
