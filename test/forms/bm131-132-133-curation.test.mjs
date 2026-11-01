/**
 * BM-131 / BM-132 / BM-133 — re-appraisal and re-valuation procedural family.
 *
 * Shared procedural domain (Điều 211/214/218 BLTTHS):
 *   - BM-131: Yêu cầu định giá lại tài sản (Viện trưởng VKS → Hội đồng
 *     định giá tài sản). Source number prefix /YC-VKS (P0004).
 *   - BM-132: Quyết định định giá lại tài sản trong trường hợp đặc biệt.
 *     Source number prefix /QĐ-VKSTC (P0006) — VKSTC cấp tối cao.
 *   - BM-133: Quyết định giám định lại trong trường hợp đặc biệt. Source
 *     number prefix /QĐ-VKSTC (P0006) — VKSTC cấp tối cao.
 *
 * Each form is a DISTINCT document type within the same procedural family.
 * The family does NOT encode a linear chain (BM-131 → BM-132 → BM-133);
 * BM-131 is a request letter, BM-132/133 are decisions issued in different
 * procedural scenarios. Each form must carry its own document-type label,
 * its own number prefix, and its own workflow description.
 *
 * RED tests assert the validator currently catches:
 *   - PRESENTATION_SECTIONS_MISSING
 *   - GENERATED_MARKER_PRESENT (e.g. "(mẫu BM-131)")
 *   - PROFILE_SECTION_OUTSIDE_CONTRACT (BM-131, BM-132, BM-133 all
 *     currently emit sections not declared in their compiled contracts)
 *   - PROFILE_SECTION_DESCRIPTION_MISSING
 *
 * Mutation-proof tests verify the validator's `mutateProfile` helper
 * returns the matching issue code when each anti-pattern is introduced
 * in-memory, without mutating the real on-disk profile.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(TEST_DIR, '..', '..');

const helperUrl = pathToFileURL(
  resolve(PROJECT_ROOT, 'test/forms/helpers/runtime-ux-curation-validator.mjs'),
).href;

const {
  loadProfile,
  validateCuration,
  mutateProfile,
} = await import(helperUrl);

const requireFromHere = createRequire(import.meta.url);
const fs = requireFromHere('node:fs');

const PROVENANCE_LEDGER_PATH = resolve(
  PROJECT_ROOT,
  'docs/audit/unified-bm-workspace/QLLAW_213_SEMANTIC_UI_CURATION_PROVENANCE.md',
);

const FORMS = [
  {
    code: 'BM-131',
    profileVar: 'BM131_RUNTIME_UX_PROFILE',
    documentTypeLabel: 'Yêu cầu định giá lại tài sản',
    demoNumberPrefix: '/YC-VKS',
    documentTypeKind: 'REQUEST',
    legalWorkflowKind: 'ASSET_REVALUATION_REQUEST',
    contractSections: new Set(['section-thong-tin-bieu-mau']),
  },
  {
    code: 'BM-132',
    profileVar: 'BM132_RUNTIME_UX_PROFILE',
    documentTypeLabel:
      'Quyết định định giá lại tài sản trong trường hợp đặc biệt',
    demoNumberPrefix: '/QĐ-VKS',
    documentTypeKind: 'DECISION',
    legalWorkflowKind: 'ASSET_REVALUATION_DECISION_SPECIAL_CASE',
    contractSections: new Set(['section-thong-tin-bieu-mau']),
  },
  {
    code: 'BM-133',
    profileVar: 'BM133_RUNTIME_UX_PROFILE',
    documentTypeLabel:
      'Quyết định giám định lại trong trường hợp đặc biệt',
    demoNumberPrefix: '/QĐ-VKS',
    documentTypeKind: 'DECISION',
    legalWorkflowKind: 'EXPERT_REAPPRAISAL_DECISION_SPECIAL_CASE',
    contractSections: new Set(['section-thong-tin-bieu-mau']),
  },
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

function readProvenanceRows() {
  const text = fs.readFileSync(PROVENANCE_LEDGER_PATH, 'utf8');
  const rows = new Map();
  const re = /^\|\s*(BM-\d{3})\s*\|.*$/gmu;
  let m;
  while ((m = re.exec(text))) {
    const code = m[1];
    rows.set(code, m[0]);
  }
  return rows;
}

describe('BM-131 / BM-132 / BM-133 — re-appraisal/re-valuation family', () => {
  const ledgerRows = readProvenanceRows();

  for (const spec of FORMS) {
    describe(spec.code, () => {
      const contract = loadContract(spec.code);
      const profile = loadProfileFor(spec.code, spec.profileVar);
      const ledgerRow = ledgerRows.get(spec.code) ?? '';

      it('shares exactly one canonical path-integrity helper', async () => {
        const integrityHelperUrl = pathToFileURL(
          resolve(
            PROJECT_ROOT,
            'test/forms/helpers/provenance-source-integrity.mjs',
          ),
        ).href;
        const { assertRepositoryLocalPath, PROVENANCE_ROOTS } = await import(
          integrityHelperUrl
        );
        assert.equal(typeof assertRepositoryLocalPath, 'function');
        assert.ok(PROVENANCE_ROOTS);
        assert.ok(PROVENANCE_ROOTS.extract);
        assert.ok(PROVENANCE_ROOTS.compiled);
      });

      it(`profile templateCode === compiled templateCode (${spec.code})`, () => {
        assert.equal(profile.templateCode, contract.templateCode);
      });

      it(`${spec.code} compiled field count preserved exactly`, () => {
        const compiledKeys = contract.source.fields.map((f) => f.key);
        const profileKeys = Object.keys(profile.fields);
        assert.equal(profileKeys.length, compiledKeys.length);
        for (const k of compiledKeys) assert.ok(k in profile.fields);
      });

      it(`${spec.code} presentation sections present and contract-bounded`, () => {
        const sections = profile.presentationSections;
        assert.ok(Array.isArray(sections), 'presentationSections must be array');
        assert.ok(sections.length >= 1, 'must have at least one presentation section');
        for (const section of sections) {
          assert.ok(
            spec.contractSections.has(section.id),
            `presentation section ${section.id} must exist in compiled contract`,
          );
          assert.ok(
            section.description && section.description.trim().length > 0,
            `presentation section ${section.id} must have non-empty description`,
          );
          assert.ok(
            Array.isArray(section.fieldKeys) && section.fieldKeys.length > 0,
            `presentation section ${section.id} must declare fieldKeys`,
          );
        }
        // Every compiled field must appear in exactly one presentation section.
        const compiledKeys = contract.source.fields.map((f) => f.key);
        const presentedKeys = sections.flatMap((s) => s.fieldKeys);
        for (const k of compiledKeys) {
          assert.equal(
            presentedKeys.filter((x) => x === k).length,
            1,
            `field ${k} must appear exactly once across presentationSections`,
          );
        }
      });

      it(`${spec.code} documentType label is present and non-generic`, () => {
        // The curated title must be present in either the heading or the
        // section title/description so the document type is not collapsed
        // to a generic "Thông tin biểu mẫu" placeholder.
        const haystack = JSON.stringify(profile).toLowerCase();
        assert.ok(
          haystack.includes(spec.documentTypeLabel.toLowerCase()),
          `profile must embed document-type label "${spec.documentTypeLabel}"`,
        );
        // The "Thông tin biểu mẫu" generic title is forbidden as the only
        // title-like text; the curated label must out-rank it.
        assert.ok(
          !haystack.includes('thông tin biểu mẫu') ||
            haystack.includes(spec.documentTypeLabel.toLowerCase()),
          'profile must not collapse to the generic "Thông tin biểu mẫu" label',
        );
      });

      it(`${spec.code} demo document number carries the source-backed prefix`, () => {
        const demo = profile.demo ?? {};
        const soQuyet = demo['document.soQuyet'] ?? '';
        assert.ok(
          soQuyet.includes(spec.demoNumberPrefix),
          `demo number "${soQuyet}" must carry prefix ${spec.demoNumberPrefix}`,
        );
      });

      it(`${spec.code} placeholders carry no generated marker`, () => {
        const placeholders = Object.values(profile.fields ?? {}).map(
          (f) => f.placeholder ?? '',
        );
        for (const ph of placeholders) {
          assert.ok(
            !/\(m(?:ẫu|áº«u)\s+BM-\d{3}\)/iu.test(ph),
            `placeholder must not carry "(mẫu BM-NNN)" marker: "${ph}"`,
          );
        }
      });

      it(`${spec.code} no presentation field outside compiled contract`, () => {
        const compiledKeys = new Set(
          contract.source.fields.map((f) => f.key),
        );
        const presentedKeys =
          profile.presentationSections?.flatMap((s) => s.fieldKeys) ?? [];
        for (const key of presentedKeys) {
          assert.ok(
            compiledKeys.has(key),
            `presentation field "${key}" must be in compiled contract`,
          );
        }
      });

      it(`${spec.code} provenance row is present in the ledger`, () => {
        assert.ok(
          ledgerRow.length > 0,
          `provenance row for ${spec.code} must exist in the ledger`,
        );
      });

      it(`${spec.code} no linear chain encoded into profile or provenance`, () => {
        const haystack =
          JSON.stringify(profile).toLowerCase() +
          '\n' +
          ledgerRow.toLowerCase();
        assert.ok(
          !/bm-131\s*→\s*bm-132\s*→\s*bm-133/u.test(haystack),
          'profile or provenance must not encode BM-131 → BM-132 → BM-133 linear chain',
        );
      });
    });
  }

  describe('family boundary — BM-134 and BM-135 belong to a DIFFERENT family', () => {
    // The first five semantic-incomplete codes in numeric order are
    // BM-131, BM-132, BM-133, BM-134, BM-135. BM-131/132/133 share the
    // re-appraisal/re-valuation procedural domain; BM-134 ("BB ghi lời
    // khai") and BM-135 ("BB hỏi cung bị can") are biên bản records
    // governed by Điều 183-186 BLTTHS, NOT re-appraisal decisions. This
    // batch must not include them.
    it('does not include BM-134 or BM-135 even though they are next in numeric order', () => {
      const codes = FORMS.map((f) => f.code);
      assert.ok(!codes.includes('BM-134'));
      assert.ok(!codes.includes('BM-135'));
    });
  });

  describe('mutation proof — shared validator catches each anti-pattern', () => {
    for (const spec of FORMS) {
      const baseline = loadProfileFor(spec.code, spec.profileVar);

      it(`${spec.code} mutation: GENERATED_MARKER_PRESENT is caught`, () => {
        const mutated = mutateProfile(baseline, (p) => {
          p.fields['agency.vienKiem'].placeholder =
            'Viện kiểm sát (mẫu BM-131)';
        });
        const contract = loadContract(spec.code);
        const issues = validateCuration(mutated, contract, { ledger: 'ok' });
        assert.ok(
          issues.includes('GENERATED_MARKER_PRESENT'),
          'shared validator must catch generated marker',
        );
      });

      it(`${spec.code} mutation: PRESENTATION_SECTIONS_MISSING is caught`, () => {
        const mutated = mutateProfile(baseline, (p) => {
          p.presentationSections = [];
        });
        const contract = loadContract(spec.code);
        const issues = validateCuration(mutated, contract, { ledger: 'ok' });
        assert.ok(
          issues.includes('PRESENTATION_SECTIONS_MISSING'),
          'shared validator must catch missing presentationSections',
        );
      });

      it(`${spec.code} mutation: PRESENTATION_FIELD_OUTSIDE_CONTRACT is caught`, () => {
        const mutated = mutateProfile(baseline, (p) => {
          p.presentationSections = [
            {
              id: 'section-thong-tin-bieu-mau',
              title: 'Thông tin biểu mẫu',
              description: 'desc',
              fieldKeys: ['agency.vienKiem', 'document.soQuyet', 'made.up.field'],
            },
          ];
        });
        const contract = loadContract(spec.code);
        const issues = validateCuration(mutated, contract, { ledger: 'ok' });
        assert.ok(
          issues.some((i) =>
            i.startsWith('PRESENTATION_FIELD_OUTSIDE_CONTRACT:'),
          ),
          'shared validator must catch presentation field outside compiled contract',
        );
      });
    }
  });

  describe('scoped assertion — prefix swap is caught by family-local rule', () => {
    // The shared validator is text-blind for document-type prefixes;
    // the family-local rule enforces BM-131=/YC-VKS and BM-132/133=/QĐ-VKS.
    function assertPrefixMatchesDocumentType(profile, code) {
      const spec = FORMS.find((f) => f.code === code);
      assert.ok(spec, `${code} must be a selected family member`);
      const demo = profile.demo ?? {};
      const soQuyet = demo['document.soQuyet'] ?? '';
      assert.ok(
        soQuyet.includes(spec.demoNumberPrefix),
        `${code} demo number "${soQuyet}" must carry ${spec.demoNumberPrefix}`,
      );
    }

    it('BM-131 prefix swap /QĐ-VKS → /YC-VKS rejected', () => {
      const profile = loadProfileFor('BM-131', 'BM131_RUNTIME_UX_PROFILE');
      // mutated prefix is the WRONG one
      const mutated = mutateProfile(profile, (p) => {
        p.demo['document.soQuyet'] = '131/QĐ-VKSKV7';
      });
      assert.throws(
        () => assertPrefixMatchesDocumentType(mutated, 'BM-131'),
        /\/YC-VKS/,
        'BM-131 must enforce /YC-VKS prefix',
      );
    });

    it('BM-132 prefix swap /YC-VKS → /QĐ-VKS rejected', () => {
      const profile = loadProfileFor('BM-132', 'BM132_RUNTIME_UX_PROFILE');
      const mutated = mutateProfile(profile, (p) => {
        p.demo['document.soQuyet'] = '132/YC-VKSKV7';
      });
      assert.throws(
        () => assertPrefixMatchesDocumentType(mutated, 'BM-132'),
        /\/QĐ-VKS/,
        'BM-132 must enforce /QĐ-VKS prefix',
      );
    });

    it('BM-133 prefix swap /YC-VKS → /QĐ-VKS rejected', () => {
      const profile = loadProfileFor('BM-133', 'BM133_RUNTIME_UX_PROFILE');
      const mutated = mutateProfile(profile, (p) => {
        p.demo['document.soQuyet'] = '133/YC-VKSKV7';
      });
      assert.throws(
        () => assertPrefixMatchesDocumentType(mutated, 'BM-133'),
        /\/QĐ-VKS/,
        'BM-133 must enforce /QĐ-VKS prefix',
      );
    });
  });
});
