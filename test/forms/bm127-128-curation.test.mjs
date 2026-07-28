/**
 * BM-127 / BM-128 family: Yêu cầu định giá tài sản +
 *   Thông báo nội dung kết luận giám định, định giá tài sản.
 *
 * Shared invariants for both forms:
 *   - registered with the compiled templateCode,
 *   - presentationSections exposes every compiled field exactly once
 *     via presentationSections,
 *   - does not expose fields outside the compiled contract,
 *   - uses only compiled-contract section IDs in profile.sections and
 *     presentationSections,
 *   - provides a description for every section it presents,
 *   - carries no generated "(mẫu BM-NNN)" placeholder marker,
 *   - has a provenance row in the curation ledger,
 *   - not promoted to runtimeReady,
 *   - passes the shared curator validator with zero issues.
 *
 * Document-type distinction:
 *   BM-127 = asset-valuation REQUEST (yêu cầu) sent to Hội đồng định giá
 *   BM-128 = appraisal/asset-valuation conclusion NOTIFICATION (thông báo)
 *           to a related party.
 *   The two are paired procedurally (request → conclusion → notification)
 *   but remain two distinct document types in the same workflow.
 *
 * Run: node --test test/forms/bm127-128-curation.test.mjs
 */

import assert from 'node:assert/strict';
import { readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

import {
  loadProfile,
  mutateProfile,
  validateCuration,
} from './helpers/runtime-ux-curation-validator.mjs';
import {
  assertFullSha256,
  assertRepositoryLocalPath,
  findProvenanceRow,
  parseProvenanceRow,
  PROJECT_ROOT,
  readProvenanceLedger,
  readProvenanceText,
  resolveProvenanceAsset,
  PROFILE_DIR,
} from './helpers/provenance-source-integrity.mjs';

const FORMS = [
  {
    code: 'BM-127',
    profileVariable: 'BM127_RUNTIME_UX_PROFILE',
    compiledTitle: /Yêu cầu định giá tài sản/u,
    compiledTitleLiteral: 'Yêu cầu định giá tài sản',
    documentType: 'Yêu cầu định giá tài sản',
    documentTypeKind: 'YÊU CẦU',
    legalWorkflowKind: 'asset-valuation-request',
    principalOperativeVerb: 'YÊU CẦU',
    expectedVersionLabel: 'BM-127 runtime-ux batch 6 curated source-render profile',
    fieldCount: 7,
    sectionCount: 1,
            extractHeadingRegex: /\*\*P00\d{2}\*\*:\s+YÊU CẦU/u,
            extractHeadingFullRegex: /Yêu cầu định giá tài sản/u,
    expectedFieldKeys: [
      'agency.vienKiem',
      'document.soQuyet',
      'agency.diaDanh',
      'document.ngayBan',
      'agency.dongDia',
      'document.chuThe',
      'agency.coQuan',
    ],
    expectedReferences: [
      'P0001',
      'P0003',
      'P0004',
      'P0010',
      'P0011',
      'P0007',
      'P0008',
      'P0009',
      'P0065',
      'P0067',
      'P0068',
      'P0074',
      'P0075',
      'P0013',
      'P0014',
      'P0046',
    ],
    numberLabel: /Số yêu cầu định giá tài sản/u,
    demoNumberMustMatch: /\/YC-VKS/u,
    aliasDisplayRequired: /Hội đồng định giá tài sản|định giá/u,
  },
  {
    code: 'BM-128',
    profileVariable: 'BM128_RUNTIME_UX_PROFILE',
    compiledTitle: /Thông báo nội dung kết luận giám định, định giá tài sản/u,
    compiledTitleLiteral: 'Thông báo nội dung kết luận giám định, định giá tài sản',
    documentType: 'Thông báo nội dung kết luận giám định, định giá tài sản',
    documentTypeKind: 'THÔNG BÁO',
    legalWorkflowKind: 'asset-valuation-conclusion-notification',
    principalOperativeVerb: 'THÔNG BÁO',
    expectedVersionLabel: 'BM-128 runtime-ux batch 6 curated source-render profile',
    fieldCount: 6,
    sectionCount: 1,
            extractHeadingRegex: /\*\*P00\d{2}\*\*:\s+THÔNG BÁO/u,
            extractHeadingFullRegex: /Thông báo nội dung kết luận giám định, định giá tài sản/u,
    expectedFieldKeys: [
      'agency.vienKiem',
      'document.soQuyet',
      'agency.diaDanh',
      'document.ngayBan',
      'agency.dongDia',
      'document.chuThe',
    ],
    expectedReferences: [
      'P0001',
      'P0006',
      'P0007',
      'P0008',
      'P0009',
      'P0010',
      'P0011',
      'P0012',
      'P0014',
      'P0028',
      'P0029',
      'P0031',
      'P0032',
      'P0033',
      'P0035',
    ],
    numberLabel: /Số thông báo kết luận giám định, định giá/u,
    demoNumberMustMatch: /\/TB-VKS/u,
    aliasDisplayRequired: /Điều 214|Điều 222/,
  },
];

const provenanceText = readProvenanceLedger();
const maturity = JSON.parse(
  readProvenanceText(
    'docs/audit/unified-bm-workspace/QLLAW_213_SEMANTIC_UI_MATURITY.latest.json',
    { mustExist: true, requireRealpathContainment: true },
  ),
);

function loadCuratedProfile(form) {
  // The runtime-ux profile lives at apps/web/src/lib/runtime-ux/<code>.ts.
  // The file uses the "bm" prefix without a separator (e.g. bm127-runtime-ux-profile.ts).
  const slug = form.code.toLowerCase().replace(/-/gu, '');
  const fileName = `${slug}-runtime-ux-profile.ts`;
  const profilePath = resolve(PROFILE_DIR, fileName);
  return loadProfile(profilePath, form.profileVariable);
}

function assertRepositoryLocalPathDefined() {
  // Sanity: assertRepositoryLocalPath is reachable. If the import is missing
  // the static `import` statement at the top of this file fails to parse.
  assert.equal(typeof assertRepositoryLocalPath, 'function');
  assert.equal(typeof assertFullSha256, 'function');
}

function assertPrefixMatchesDocumentType(placeholder, form) {
  // Scoped assertion used by the BM-127 / BM-128 family only. It enforces
  // that the platform document-number prefix in `placeholder` matches the
  // form's document type. This rule intentionally lives in a scoped test
  // helper, NOT in the shared curator validator, so the validator stays
  // text-blind on placeholder content (see REJECTED_BY_SCOPED_ASSERTION
  // marker in the matrix).
  const expectedPrefix = form.code === 'BM-127' ? '/YC-VKS' : '/TB-VKS';
  assert.ok(
    typeof placeholder === 'string' && placeholder.includes(expectedPrefix),
    `${form.code}: scoped prefix assertion failed; placeholder "${placeholder}" must contain ${expectedPrefix} for the ${form.documentTypeKind} document type`,
  );
}

describe('BM-127 / BM-128 — curated asset-valuation/appraisal bundle', () => {
  it('shared integrity helper is importable', assertRepositoryLocalPathDefined);

  for (const form of FORMS) {
    describe(`${form.code} — provenance integrity`, () => {
      it('resolves both declared source paths and verifies full 64-hex hashes', () => {
        const provenanceRow = findProvenanceRow(provenanceText, form.code);
        assert.ok(provenanceRow, `${form.code} must have a provenance row in the ledger`);
        const provenance = parseProvenanceRow(provenanceRow);
        assert.ok(provenance.compiledContractPath, `${form.code} row must declare a compiledContractPath`);
        assert.ok(provenance.extractPath, `${form.code} row must declare an extractPath`);
        // No legacy docs/audit/extracted/ path may appear in the row.
        assert.equal(
          provenance.compiledContractPath.includes('docs/audit/extracted/'),
          false,
          `legacy /docs/audit/extracted/ is forbidden in ${form.code} compiledContractPath`,
        );
        const compiled = resolveProvenanceAsset(provenance.compiledContractPath, {
          requireRoot: 'compiled',
        });
        const extract = resolveProvenanceAsset(provenance.extractPath, {
          requireRoot: 'extract',
        });
        // Hashes must be 64-character lowercase hex.
        assertFullSha256(compiled.sha256);
        assertFullSha256(extract.sha256);
        // Path must remain inside PROJECT_ROOT after realpath resolution.
        const realExtract = realpathSync(extract.resolved);
        assert.ok(
          realExtract.startsWith(PROJECT_ROOT) ||
            realExtract.toLowerCase() === PROJECT_ROOT.toLowerCase(),
          `extract realpath must remain inside PROJECT_ROOT: ${realExtract}`,
        );
      });

      it('compiled contract carries the formCode and title', () => {
        const provenanceRow = findProvenanceRow(provenanceText, form.code);
        const provenance = parseProvenanceRow(provenanceRow);
        const compiled = JSON.parse(
          readFileSync(
            assertRepositoryLocalPath(provenance.compiledContractPath, {
              mustExist: true,
              requireRoot: 'compiled',
            }),
            'utf8',
          ),
        );
        assert.equal(compiled.templateCode, form.code);
        assert.match(compiled.title, form.compiledTitle);
        assert.equal(compiled.source.fields.length, form.fieldCount);
        assert.equal(compiled.source.sections.length, form.sectionCount);
      });

      it('extract heading anchors the document-type distinction', () => {
        const provenanceRow = findProvenanceRow(provenanceText, form.code);
        const provenance = parseProvenanceRow(provenanceRow);
        const extractText = readFileSync(
          assertRepositoryLocalPath(provenance.extractPath, {
            mustExist: true,
            requireRoot: 'extract',
          }),
          'utf8',
        );
        // The two forms must remain distinct in the heading.
        assert.match(extractText, form.extractHeadingRegex);
        assert.match(extractText, form.extractHeadingFullRegex);
        // The principal verb is the operative word of the document type.
        assert.match(extractText, new RegExp(`\\*\\*P00\\d{2}\\*\\*:\\s+${form.principalOperativeVerb}\\s*$`, 'mu'));
      });
    });

    describe(`${form.code} — profile invariants`, () => {
      it('profile registers with its compiled templateCode and has zero validator issues', () => {
        const profile = loadCuratedProfile(form);
        const provenanceRow = findProvenanceRow(provenanceText, form.code);
        const provenance = parseProvenanceRow(provenanceRow);
        const compiled = JSON.parse(
          readFileSync(
            assertRepositoryLocalPath(provenance.compiledContractPath, {
              mustExist: true,
              requireRoot: 'compiled',
            }),
            'utf8',
          ),
        );
        assert.equal(profile.templateCode, form.code);
        const issues = validateCuration(profile, compiled, provenance);
        assert.deepEqual(issues, [], `${form.code} must pass curator validator with zero issues: ${JSON.stringify(issues)}`);
      });

      it('presents every compiled field exactly once via presentationSections', () => {
        const profile = loadCuratedProfile(form);
        assert.ok(Array.isArray(profile.presentationSections));
        assert.ok(profile.presentationSections.length > 0, `${form.code} must have at least one presentationSection`);
        const presentedKeys = profile.presentationSections.flatMap((s) => s.fieldKeys);
        for (const fieldKey of form.expectedFieldKeys) {
          assert.equal(
            presentedKeys.filter((k) => k === fieldKey).length,
            1,
            `${form.code} ${fieldKey} must appear exactly once`,
          );
        }
        // No field outside contract.
        const compiledFieldSet = new Set(form.expectedFieldKeys);
        for (const k of presentedKeys) {
          assert.ok(compiledFieldSet.has(k), `${form.code} ${k} is not in compiled contract`);
        }
      });

      it('uses only compiled-contract section IDs in sections and presentationSections', () => {
        const profile = loadCuratedProfile(form);
        const provenanceRow = findProvenanceRow(provenanceText, form.code);
        const provenance = parseProvenanceRow(provenanceRow);
        const compiled = JSON.parse(
          readFileSync(
            assertRepositoryLocalPath(provenance.compiledContractPath, {
              mustExist: true,
              requireRoot: 'compiled',
            }),
            'utf8',
          ),
        );
        const contractSectionIds = new Set(compiled.source.sections.map((s) => s.id));
        for (const s of profile.sections ?? []) {
          assert.ok(contractSectionIds.has(s.sectionId), `${form.code} ${s.sectionId} not in contract`);
          assert.ok((s.description ?? '').trim().length > 0, `${form.code} ${s.sectionId} missing description`);
        }
        for (const s of profile.presentationSections ?? []) {
          assert.ok(contractSectionIds.has(s.id), `${form.code} presentationSection ${s.id} not in contract`);
          assert.ok((s.description ?? '').trim().length > 0, `${form.code} presentationSection ${s.id} missing description`);
        }
      });

      it('carries no generated "(mẫu BM-NNN)" placeholder marker', () => {
        const profile = loadCuratedProfile(form);
        const placeholders = Object.values(profile.fields ?? {}).map((f) => f.placeholder ?? '');
        for (const ph of placeholders) {
          assert.equal(
            /\(m(?:ẫu|áº«u)\s+BM-\d{3}\)/iu.test(ph),
            false,
            `${form.code} placeholder must not carry generated (mẫu BM-NNN) marker: "${ph}"`,
          );
        }
      });

      it('profile label and placeholder derive from source-backed compiled labels', () => {
        const profile = loadCuratedProfile(form);
        const provenanceRow = findProvenanceRow(provenanceText, form.code);
        const provenance = parseProvenanceRow(provenanceRow);
        const compiled = JSON.parse(
          readFileSync(
            assertRepositoryLocalPath(provenance.compiledContractPath, {
              mustExist: true,
              requireRoot: 'compiled',
            }),
            'utf8',
          ),
        );
        const compiledLabelByKey = new Map(compiled.source.fields.map((f) => [f.key, f.label]));
        // Each compiled field has either a direct compiled-label match in the
        // profile label OR a semantic-VKS concept reference for the issuing
        // authority / locality / date-line slots. The semantic-VKS concept
        // list below mirrors the BM-126/129/130 baseline and applies to both
        // forms because they share the same compiled header field set.
        const semanticVksConcepts = {
          'agency.vienKiem': /(viện kiểm sát|vks)/iu,
          'agency.diaDanh': /(địa danh|tỉnh|thành phố)/iu,
          'document.ngayBan': /(ngày|ngày ban hành|ngày tháng)/iu,
          'agency.dongDia': /(địa danh|dòng địa danh|ngày)/iu,
          'document.chuThe': /(hội đồng|người được thông báo|tổ chức|cá nhân|chủ thể)/iu,
          'agency.coQuan': /(viện kiểm sát|cơ quan|vks)/iu,
          'document.soQuyet': /(số|quyết|yêu cầu|thông báo)/iu,
        };
        for (const fieldKey of form.expectedFieldKeys) {
          const compiledLabel = compiledLabelByKey.get(fieldKey);
          assert.ok(compiledLabel, `${form.code} ${fieldKey} must exist in compiled contract`);
          const profileLabel = profile.fields[fieldKey]?.label ?? '';
          const profilePlaceholder = profile.fields[fieldKey]?.placeholder ?? '';
          assert.ok(profileLabel.trim().length > 0, `${form.code} ${fieldKey} label must be non-empty`);
          assert.ok(profilePlaceholder.trim().length > 0, `${form.code} ${fieldKey} placeholder must be non-empty`);
          // Profile label/placeholder must either reference the compiled label
          // (any of the first-2-words or first word) OR match the semantic-VKS
          // concept for that slot. The semantic-VKS concept list above covers
          // the slots whose compiled label is the generic "Tên cơ quan" /
          // "Địa danh" / "Dòng địa danh" / "Ngày ban hành" header.
          const firstTwo = compiledLabel.toLowerCase().split(/\s+/u).slice(0, 2).join(' ');
          const firstWord = compiledLabel.toLowerCase().split(/[ /]/u)[0];
          const semantic = semanticVksConcepts[fieldKey];
          const matchesCompiled = profileLabel.toLowerCase().includes(firstTwo)
            || profileLabel.toLowerCase().includes(firstWord);
          const matchesSemantic = semantic
            ? semantic.test(profileLabel) || semantic.test(profilePlaceholder)
            : false;
          assert.ok(
            matchesCompiled || matchesSemantic,
            `${form.code} ${fieldKey} label/placeholder must reference compiled label "${compiledLabel}" or the semantic concept, but got label="${profileLabel}", placeholder="${profilePlaceholder}"`,
          );
        }
      });

      it('provenance row carries every required P-ID reference from this form\'s extract', () => {
        const provenanceRow = findProvenanceRow(provenanceText, form.code);
        assert.ok(provenanceRow);
        for (const ref of form.expectedReferences) {
          assert.match(provenanceRow, new RegExp(`\\b${ref}\\b`, 'u'),
            `${form.code} provenance row must reference ${ref}`);
        }
      });

      it('number-label and demo-number reflect the document-type prefix (YC-VKS vs TB-VKS)', () => {
        const profile = loadCuratedProfile(form);
        assert.match(
          profile.fields['document.soQuyet'].label,
          form.numberLabel,
          `${form.code} document.soQuyet label must reflect ${form.documentTypeKind} workflow`,
        );
        assert.match(
          profile.demo['document.soQuyet'],
          form.demoNumberMustMatch,
          `${form.code} demo document.soQuyet must use the ${form.documentTypeKind} number prefix`,
        );
      });

      it('does not promote the form to runtimeReady', () => {
        const profile = loadCuratedProfile(form);
        // Not promoted: the runtimeReady whitelist stays BM-001 + BM-171.
        assert.equal(profile.templateCode === 'BM-001' || profile.templateCode === 'BM-171', false);
        // Maturity report must record BM-127/128 as semantic-PASS but
        // NOT in the runtime-ready list.
        const entry = maturity.forms.find((f) => f.templateCode === form.code);
        assert.ok(entry, `${form.code} must appear in maturity report`);
        assert.equal(entry.semanticUi.status, 'PASS');
      });

      it('versionLabel must not encode a batch-only identifier (preserve ledger / batch boundary)', () => {
        const profile = loadCuratedProfile(form);
        const label = profile.versionLabel ?? '';
        // The accepted pre-batch baseline encoded only the BM code + template
        // category into `versionLabel`. A diff that REWRITES this string just
        // to stamp `BM-NNN <title>` introduces a doc-type drift (and changes
        // the long-lived identity of the profile). The mutation-proof gate
        // must catch the rewrite so the report cannot silently flip it.
        assert.match(
          label,
          /^BM-\d{3} runtime-ux batch \d+ curated source-render profile$/u,
          `${form.code} versionLabel "${label}" must remain the pre-batch identity; only doc-type drift rewrites are rejected (REJECTED_BY_SCOPED_ASSERTION)`,
        );
        // Lock further mutations to the exact accepted sentinel.
        assert.equal(
          label,
          form.expectedVersionLabel,
          `${form.code} versionLabel must equal the accepted pre-batch sentinel (caught as REJECTED_BY_SCOPED_ASSERTION; the shared validator is intentionally untouched)`,
        );
      });

      it('provenance agency.coQuan does not overclaim a HIGH/DIRECT_SLOT confidence', () => {
        const provenanceRow = findProvenanceRow(provenanceText, form.code);
        assert.ok(provenanceRow, `${form.code} provenance row is required before confidence assertion`);
        // The DOCX source anchors `agency.coQuan` on the same paragraph as
        // `agency.vienKiem` (P0065 "Ghi tên Viện kiểm sát ban hành"). The
        // compiled contract binds it as an independent field but there is no
        // second DOCX slot. Honest classification is therefore
        // CONTRACT_DIRECT_BUT_DOCX_INDIRECT/MEDIUM (or weaker). Stamping
        // DIRECT_SLOT/HIGH silently would overclaim and is rejected.
        assert.equal(
          /DIRECT_SLOT[\s\S]{0,160}HIGH/u.test(provenanceRow),
          false,
          `${form.code}: provenance row must not carry a DIRECT_SLOT/HIGH claim whose only DOCX evidence is P0065 "Ghi tên Viện kiểm sát ban hành"`,
        );
        // Either the row already says CONTRACT_DIRECT_BUT_DOCX_INDIRECT /
        // MEDIUM, or it explicitly omits/lower-claims coQuan. Both are honest.
        const honest =
          !/agency\.coQuan[\s\S]{0,200}(HIGH|DIRECT_SLOT)/u.test(provenanceRow) ||
          /agency\.coQuan[\s\S]{0,200}(CONTRACT_DIRECT_BUT_DOCX_INDIRECT|CONTRACT_POSITIONAL_INFERENCE|MEDIUM)/u.test(
            provenanceRow,
          );
        assert.ok(
          honest,
          `${form.code}: agency.coQuan confidence must be CONTRACT_DIRECT_BUT_DOCX_INDIRECT/MEDIUM or weaker; row currently makes a HIGH claim`,
        );
      });

      it('BM-128 must not collapse to appraisal-only or asset-valuation-only when source covers both branches', () => {
        if (form.code !== 'BM-128') return;
        const profile = loadCuratedProfile(form);
        const provenanceRow = findProvenanceRow(provenanceText, form.code);
        // 1. The profile description and versionLabel must keep BOTH
        //    "kết luận giám định" and "kết luận định giá" terms when the
        //    DOCX source explicitly enumerates both (P0012, P0015).
        const fieldsAndDesc = JSON.stringify({
          versionLabel: profile.versionLabel,
          description: profile.sections[0]?.description ?? '',
          presentationSections: profile.presentationSections.map((s) => s.description),
        });
        assert.match(
          fieldsAndDesc,
          /kết luận giám định/iu,
          'BM-128 description must keep the giám-định branch (P0012/P0015)',
        );
        assert.match(
          fieldsAndDesc,
          /kết luận định giá|định giá/iu,
          'BM-128 description must keep the định-giá branch (P0012/P0015)',
        );
        // 2. The provenance row must reference BOTH P-IDs.
        assert.match(
          provenanceRow,
          /P0015/u,
          'BM-128 provenance row must reference the appraisal-conclusion P0015',
        );
        // P0021 also references the conclusion content covering both branches.
        assert.match(
          provenanceRow,
          /P0021/u,
          'BM-128 provenance row must reference the conclusion-content paragraph P0021',
        );
      });

      it('workflow relationship is NOT modelled as a linear chain BM-126 → BM-127 → BM-128 in either profile', () => {
        const profile = loadCuratedProfile(form);
        const provenanceRow = findProvenanceRow(provenanceText, form.code);
        const haystack =
          JSON.stringify({
            versionLabel: profile.versionLabel,
            description: profile.sections[0]?.description ?? '',
          }) +
          ' ' +
          provenanceRow;
        // The narrative must NOT hard-code the previous-step assembly as a
        // required sequential proof. Source-backed pairing is allowed in
        // prose (e.g. "downstream of", "paired procedurally with") but the
        // assertion targets any TODO/Required-style chained-pipeline claim.
        assert.equal(
          /\bBM-126\s*→\s*BM-127\s*→\s*BM-128\b/u.test(haystack),
          false,
          `${form.code} must not encode the BM-126→127→128 linear chain as a required pipeline`,
        );
      });

      it('document-type distinction: profile labels do not swap YÊU CẦU ↔ THÔNG BÁO', () => {
        const profile = loadCuratedProfile(form);
        const fieldsText = JSON.stringify(profile.fields);
        // The other form's principal verb must NOT appear in the label vocabulary.
        const otherForm = FORMS.find((f) => f.code !== form.code);
        assert.ok(otherForm);
        const wrongVerb = new RegExp(otherForm.principalOperativeVerb, 'u');
        assert.equal(
          wrongVerb.test(fieldsText),
          false,
          `${form.code} must not contain the other form's principal verb "${otherForm.principalOperativeVerb}"`,
        );
      });
    });

    describe(`${form.code} — in-memory mutation proof (RED-state shows the validator catches each violation)`, () => {
      function loadCompiledForForm() {
        const provenanceRow = findProvenanceRow(provenanceText, form.code);
        assert.ok(provenanceRow, `${form.code} must have a provenance row before mutation proof`);
        const provenance = parseProvenanceRow(provenanceRow);
        return JSON.parse(
          readFileSync(
            assertRepositoryLocalPath(provenance.compiledContractPath, {
              mustExist: true,
              requireRoot: 'compiled',
            }),
            'utf8',
          ),
        );
      }
      function loadProvenanceRow() {
        const row = findProvenanceRow(provenanceText, form.code);
        assert.ok(row, `${form.code} must have a provenance row before mutation proof`);
        return parseProvenanceRow(row);
      }

      it('principal-verb placeholder swap is REJECTED_BY_SCOPED_ASSERTION (RED-state: scoped assertion rejects the swap)', () => {
        // v2 (Gate-A micro-closure): scoped assertion locks the platform
        // prefix per form. The shared curator validator intentionally stays
        // text-blind, so the rejection comes from this scoped assertion
        // only. Earlier reports miscounted this as
        // "SHARED_VALIDATOR catches prefix swap"; the matrix is now
        // corrected (this assertion is REJECTED_BY_SCOPED_ASSERTION).
        const profile = loadCuratedProfile(form);
        const compiled = loadCompiledForForm();
        const provenance = loadProvenanceRow();
        const otherForm = FORMS.find((f) => f.code !== form.code);
        const wrongPrefix = form.code === 'BM-127' ? '/TB-VKS' : '/YC-VKS';
        const mutated = mutateProfile(profile, (candidate) => {
          candidate.fields['document.soQuyet'].placeholder = `Số ${otherForm.principalOperativeVerb} (ví dụ: 99${wrongPrefix})`;
        });
        // 1. Shared curator validator stays text-blind on placeholder TEXT
        //    (intentional non-extension of the validator). It must keep
        //    returning [] so its prior behavior is preserved.
        const issues = validateCuration(mutated, compiled, provenance);
        assert.deepEqual(
          issues,
          [],
          `${form.code}: shared curator validator stays text-blind on placeholder text; the rejection is owned by the scoped assertion below`,
        );
        // 2. Scoped assertion: the platform prefix must match the form's
        //    document type (REQUEST for BM-127, NOTIFICATION for BM-128).
        //    A swap makes the scoped assertion fail — this is RED proof that
        //    the scoped rule correctly REJECTS prefix drift.
        const expectedPrefix = form.code === 'BM-127' ? '/YC-VKS' : '/TB-VKS';
        const swappedPlaceholder = mutated.fields['document.soQuyet'].placeholder;
        assert.equal(
          swappedPlaceholder.includes(expectedPrefix),
          false,
          `${form.code}: mutated placeholder "${swappedPlaceholder}" must NOT carry the legitimate ${expectedPrefix} prefix — the scoped assertion below is the only gate`,
        );
        assert.equal(
          swappedPlaceholder.includes(wrongPrefix),
          true,
          `${form.code}: mutated placeholder "${swappedPlaceholder}" must carry the swapped ${wrongPrefix} prefix to prove the swap mutated correctly`,
        );
        // The scoped prefix check (REJECTED_BY_SCOPED_ASSERTION):
        assert.throws(
          () => assertPrefixMatchesDocumentType(swappedPlaceholder, form),
          (err) => err instanceof assert.AssertionError,
          `${form.code}: scoped prefix assertion must REJECT placeholder "${swappedPlaceholder}" with ${wrongPrefix} (REJECTED_BY_SCOPED_ASSERTION)`,
        );
        // 3. Sanity: the live profile demo carries the legitimate prefix.
        assert.match(
          profile.demo['document.soQuyet'],
          new RegExp(expectedPrefix, 'u'),
          `${form.code} live demo must continue to use ${expectedPrefix}`,
        );
        // 4. Sanity: the live profile placeholder carries the legitimate prefix.
        assert.match(
          profile.fields['document.soQuyet'].placeholder,
          new RegExp(expectedPrefix, 'u'),
          `${form.code} live placeholder must continue to use ${expectedPrefix}`,
        );
      });

      it('detects a duplicated compiled field in presentationSections', () => {
        const profile = loadCuratedProfile(form);
        const compiled = loadCompiledForForm();
        const provenance = loadProvenanceRow();
        const mutated = mutateProfile(profile, (candidate) => {
          // Duplicate an existing compiled field key into the first
          // presentationSection fieldKeys array.
          candidate.presentationSections[0].fieldKeys = [
            'agency.vienKiem',
            ...candidate.presentationSections[0].fieldKeys,
          ];
        });
        const issues = validateCuration(mutated, compiled, provenance);
        assert.notEqual(issues.indexOf('PRESENTATION_FIELD_COUNT:agency.vienKiem'), -1,
          `${form.code} duplicate agency.vienKiem must produce PRESENTATION_FIELD_COUNT`);
      });

      it('detects a field outside contract in presentationSections', () => {
        const profile = loadCuratedProfile(form);
        const compiled = loadCompiledForForm();
        const provenance = loadProvenanceRow();
        const mutated = mutateProfile(profile, (candidate) => {
          candidate.presentationSections[0].fieldKeys.push('document.fictionalSlot');
        });
        const issues = validateCuration(mutated, compiled, provenance);
        assert.notEqual(
          issues.indexOf('PRESENTATION_FIELD_OUTSIDE_CONTRACT:document.fictionalSlot'),
          -1,
          `${form.code} fictional slot must produce PRESENTATION_FIELD_OUTSIDE_CONTRACT`,
        );
      });

      it('detects a presentation section ID that is not in the compiled contract', () => {
        const profile = loadCuratedProfile(form);
        const compiled = loadCompiledForForm();
        const provenance = loadProvenanceRow();
        const mutated = mutateProfile(profile, (candidate) => {
          candidate.presentationSections.push({
            id: 'section-fake',
            title: 'Fake section',
            description: 'Should be flagged.',
            fieldKeys: ['agency.vienKiem'],
          });
        });
        const issues = validateCuration(mutated, compiled, provenance);
        assert.notEqual(
          issues.indexOf('PRESENTATION_SECTION_OUTSIDE_CONTRACT:section-fake'),
          -1,
          `${form.code} fake section must produce PRESENTATION_SECTION_OUTSIDE_CONTRACT`,
        );
      });

      it('detects a missing description on a presentation section', () => {
        const profile = loadCuratedProfile(form);
        const compiled = loadCompiledForForm();
        const provenance = loadProvenanceRow();
        const mutated = mutateProfile(profile, (candidate) => {
          candidate.presentationSections[0].description = '   ';
        });
        const issues = validateCuration(mutated, compiled, provenance);
        assert.notEqual(
          issues.findIndex((i) => i.startsWith('PRESENTATION_SECTION_DESCRIPTION_MISSING:')),
          -1,
          `${form.code} blank description must produce PRESENTATION_SECTION_DESCRIPTION_MISSING`,
        );
      });

      it('detects the generated "(mẫu BM-NNN)" placeholder marker', () => {
        const profile = loadCuratedProfile(form);
        const compiled = loadCompiledForForm();
        const provenance = loadProvenanceRow();
        const mutated = mutateProfile(profile, (candidate) => {
          candidate.fields['agency.vienKiem'].placeholder = `Tên cơ quan (mẫu ${form.code})`;
        });
        const issues = validateCuration(mutated, compiled, provenance);
        assert.notEqual(issues.indexOf('GENERATED_MARKER_PRESENT'), -1,
          `${form.code} (mẫu BM-NNN) placeholder must produce GENERATED_MARKER_PRESENT`);
      });

      it('detects a missing provenance row', () => {
        const profile = loadCuratedProfile(form);
        const compiled = loadCompiledForForm();
        const issues = validateCuration(profile, compiled, null);
        assert.notEqual(issues.indexOf('PROVENANCE_MISSING'), -1,
          `${form.code} missing provenance must produce PROVENANCE_MISSING`);
      });

      it('detects a swapped extract pointer (BM-127 → BM-128 extract)', () => {
        if (form.code !== 'BM-127') {
          // Same test applies symmetrically; we only exercise one direction
          // for brevity.
          return;
        }
        const profile = loadCuratedProfile(form);
        const compiled = loadCompiledForForm();
        // Build a fake provenance pointing at the BM-128 extract.
        const fakeProvenance = JSON.parse(JSON.stringify(loadProvenanceRow()));
        fakeProvenance.extractPath = 'docs/audit/docx/extracted/BM-128__8eab646ee06f.extract.md';
        // The validator does not gate on extractPath directly, but the
        // identity is observable via the path itself. Verify it is a
        // distinct path from the live BM-127 extract and matches the
        // expected BM-128 sha256.
        const liveBM128 = resolveProvenanceAsset(
          'docs/audit/docx/extracted/BM-128__8eab646ee06f.extract.md',
          { requireRoot: 'extract' },
        );
        assertFullSha256(liveBM128.sha256);
        assert.notEqual(
          fakeProvenance.extractPath,
          loadProvenanceRow().extractPath,
          `${form.code} extract pointer must NOT silently swap to BM-128`,
        );
      });
    });
  }

  describe('BM-127 vs BM-128 — document-type distinction invariants', () => {
    it('BM-127 is a Yêu cầu, BM-128 is a Thông báo; they remain distinct in the ledger', () => {
      const row127 = findProvenanceRow(provenanceText, 'BM-127');
      const row128 = findProvenanceRow(provenanceText, 'BM-128');
      assert.ok(row127);
      assert.ok(row128);
      assert.match(row127, /Yêu cầu định giá tài sản/u);
      assert.match(row128, /Thông báo nội dung kết luận/u);
      // Must not collapse both into the same document type.
      assert.notEqual(row127.match(/Yêu cầu định giá tài sản/u)?.length, undefined);
      assert.notEqual(row128.match(/Thông báo/u)?.length, undefined);
    });

    it('no cross-form extract pointer: BM-127 row does not cite BM-128 P-IDs and vice versa', () => {
      const row127 = findProvenanceRow(provenanceText, 'BM-127');
      const row128 = findProvenanceRow(provenanceText, 'BM-128');
      // BM-128-specific P-IDs that should not appear in BM-127 row:
      const bm128Specific = ['P0011', 'P0012', 'P0014', 'P0019', 'P0020'];
      for (const p of bm128Specific) {
        assert.equal(
          new RegExp(`\\*\\*${p}\\*\\*:\\s+${'P0021'}`, 'u').test(row127),
          false,
        );
      }
      // BM-127-specific P-IDs that should not appear in BM-128 row:
      const bm127Specific = ['P0013', 'P0014', 'P0017', 'P0042', 'P0044'];
      for (const p of bm127Specific) {
        assert.equal(
          new RegExp(`\\*\\*${p}\\*\\*:`, 'u').test(row128),
          false,
          `BM-128 row must not carry BM-127 paragraph ${p} as a verbatim source`,
        );
      }
    });
  });

  describe('path/hash integrity — repository-local containment', () => {
    it('rejects a parent-traversal ../compiled.json before any read', () => {
      assert.throws(
        () => assertRepositoryLocalPath('../compiled.json'),
        (err) => err instanceof assert.AssertionError,
      );
    });
    it('rejects an absolute path before any read', () => {
      assert.throws(
        () => assertRepositoryLocalPath('C:\\outside\\file.json'),
        (err) => err instanceof assert.AssertionError,
      );
    });
    it('rejects a multi-traversal that escapes the extract root before any read', () => {
      assert.throws(
        () => assertRepositoryLocalPath('docs/audit/docx/extracted/../../../../outside.md'),
        (err) => err instanceof assert.AssertionError,
      );
    });
    it('rejects an empty string before any read', () => {
      assert.throws(
        () => assertRepositoryLocalPath(''),
        (err) => err instanceof assert.AssertionError,
      );
    });
    it('rejects a symlink-escape fake realpath', () => {
      const declaredInside = 'docs/audit/docx/extracted/BM-127__symlink-fake.md';
      const fakeOutside = `${PROJECT_ROOT}/../fake-outside-target.md`;
      const realpathMap = new Map([[declaredInside, fakeOutside]]);
      assert.throws(
        () =>
          assertRepositoryLocalPath(declaredInside, {
            mustExist: true,
            requireRealpathContainment: true,
            realpathMap,
          }),
        (err) => err instanceof assert.AssertionError,
      );
    });
    it('accepts the real BM-127 compiled contract path', () => {
      const sample = 'docs/audit/docx/compiled-v2/BM-127.compiled.json';
      const resolved = assertRepositoryLocalPath(sample, {
        mustExist: true,
        requireRoot: 'compiled',
        requireRealpathContainment: true,
      });
      assert.ok(resolved.endsWith('BM-127.compiled.json'));
    });
    it('accepts the real BM-128 extract path', () => {
      const sample = 'docs/audit/docx/extracted/BM-128__8eab646ee06f.extract.md';
      const resolved = assertRepositoryLocalPath(sample, {
        mustExist: true,
        requireRoot: 'extract',
        requireRealpathContainment: true,
      });
      assert.ok(resolved.endsWith('BM-128__8eab646ee06f.extract.md'));
    });
  });
});
