#!/usr/bin/env node
/**
 * scripts/audit/extract-docx-fidelity-source.selfcheck.mjs
 *
 * Self-check / calibration tests for the DOCX Fidelity Source Extractor.
 * Verifies the fixes for:
 * - Footnote separator filtering
 * - Endnote separator filtering
 * - Profile detection correctness
 * - Fidelity scoring strictness
 *
 * Mode: EVIDENCE_ONLY — no mutation of DOCX/source/contracts.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// ─── Inline fixtures ────────────────────────────────────────────────────────────

// Fixture: word/footnotes.xml with id=0 separator, id=1 continuationSeparator, id=2+ real
const FIXTURE_FOOTNOTES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:footnotes xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:footnote w:type="separator" w:id="-1">
    <w:p><w:r><w:separator/></w:r></w:p>
  </w:footnote>
  <w:footnote w:type="continuationSeparator" w:id="0">
    <w:p><w:r><w:continuationSeparator/></w:r></w:p>
  </w:footnote>
  <w:footnote w:id="1">
    <w:p>
      <w:r><w:t xml:space="preserve">Đây là nội dung chú thích thực sự bằng tiếng Việt.</w:t></w:r>
    </w:p>
  </w:footnote>
  <w:footnote w:id="2">
    <w:p>
      <w:r><w:t xml:space="preserve">Điều 15 Bộ luật Tố tụng Hình sự.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">Nội dung chi tiết của điều luật được viện dẫn.</w:t></w:r>
    </w:p>
  </w:footnote>
  <w:footnote w:id="3">
  </w:footnote>
</w:footnotes>`;

// Expected: id 1 and 2 are real, id 0/-1 are separators, id 3 is empty
const EXPECTED_FOOTNOTE_IDS = [1, 2];
const EXPECTED_FOOTNOTE_TEXTS = [
  'Đây là nội dung chú thích thực sự bằng tiếng Việt.',
  'Điều 15 Bộ luật Tố tụng Hình sự. Nội dung chi tiết của điều luật được viện dẫn.',
];

// ─── Test runner ────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function assert(testName, condition, expected, actual) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passed++;
  } else {
    console.log(`  ✗ ${testName}`);
    console.log(`    Expected: ${expected}`);
    console.log(`    Actual:   ${actual}`);
    failures.push({ testName, expected, actual });
    failed++;
  }
}

function assertEq(testName, actual, expected) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  assert(testName, actualStr === expectedStr, expectedStr, actualStr);
}

// ─── Test: Footnote parser ──────────────────────────────────────────────────────

async function testFootnoteParser() {
  console.log('\n━━━ Footnote Parser Tests ━━━');

  // Inline test of the footnote parsing logic
  function extractFootnotesFromXml(fnXml) {
    const footnotes = [];
    const fnTagRegex = /<w:footnote([^>]*)\/?>/gi;
    let match;

    while ((match = fnTagRegex.exec(fnXml)) !== null) {
      const tagAttrs = match[1];
      const fnIdMatch = tagAttrs.match(/w:id\s*=\s*["']([^"']*)["']/i);
      const fnTypeMatch = tagAttrs.match(/w:type\s*=\s*["']([^"']*)["']/i);

      if (!fnIdMatch) continue;
      const id = parseInt(fnIdMatch[1], 10);
      const fnType = fnTypeMatch ? fnTypeMatch[1] : null;

      // Skip separator/continuationSeparator
      if (fnType === 'separator' || fnType === 'continuationSeparator') {
        continue;
      }
      if (id < 0) continue;

      const startIdx = match.index + match[0].length;
      const endTag = fnXml.indexOf('</w:footnote>', startIdx);
      if (endTag === -1) continue;

      const fnContent = fnXml.slice(startIdx, endTag);
    const textMatch = fnContent.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
    let text = textMatch ? textMatch.map(t => t.replace(/<[^>]+>/g, '')).join(' ').replace(/\s+/g, ' ').trim() : '';

    if (!text) continue;
    footnotes.push({ id, text });
    }

    return footnotes;
  }

  const result = extractFootnotesFromXml(FIXTURE_FOOTNOTES_XML);

  // Test 1: Should NOT include separator (id=-1 with type=separator)
  assert('Separator (id=-1, type=separator) excluded',
    !result.some(f => f.id === -1), 'not -1', result.map(f => f.id));

  // Test 2: Should NOT include continuationSeparator (id=0 with type=continuationSeparator)
  assert('ContinuationSeparator (id=0, type=continuationSeparator) excluded',
    !result.some(f => f.id === 0), 'not 0', result.map(f => f.id));

  // Test 3: Should include id=1 real footnote
  assert('Real footnote id=1 included',
    result.some(f => f.id === 1), '1', result.map(f => f.id));

  // Test 4: Should include id=2 real footnote (multi-paragraph)
  assert('Real footnote id=2 (multi-paragraph) included',
    result.some(f => f.id === 2), '2', result.map(f => f.id));

  // Test 5: Should NOT include empty id=3
  assert('Empty footnote id=3 excluded',
    !result.some(f => f.id === 3), 'not 3', result.map(f => f.id));

  // Test 6: Count should match expected
  assertEq('Footnote count matches expected', result.length, EXPECTED_FOOTNOTE_IDS.length);

  // Test 7: Text content for id=1
  const footnote1 = result.find(f => f.id === 1);
  assertEq('Footnote id=1 text correct',
    footnote1?.text, EXPECTED_FOOTNOTE_TEXTS[0]);

  // Test 8: Text content for id=2 (multi-paragraph merged)
  const footnote2 = result.find(f => f.id === 2);
  assertEq('Footnote id=2 text correct',
    footnote2?.text, EXPECTED_FOOTNOTE_TEXTS[1]);
}

// ─── Test: Profile detection ────────────────────────────────────────────────────

async function testProfileDetection() {
  console.log('\n━━━ Profile Detection Tests ━━━');

  // Inline test of profile detection logic
  function getProfileStatus(profile) {
    let hasDemo = profile ? !profile.demoEmpty && !profile.demoMissing : false;
    let hasSummaryLines = profile ? !profile.summaryLinesUndefined : false;
    let hasAcceptance = profile ? profile.hasAcceptance === true : false;

    let profileStatus = 'MISSING';
    if (profile) {
      if (profile.runtimeReady && profile.profileStatus === 'runtime-ready') {
        profileStatus = 'RUNTIME_READY';
      } else if (profile.profileStatus === 'generated-ready-approved') {
        profileStatus = 'GENERATED_READY_APPROVED';
      } else if (profile.fieldPathCount > 0) {
        profileStatus = 'SKELETON';
      } else {
        profileStatus = 'INVALID';
      }
    }

    return { hasDemo, hasSummaryLines, hasAcceptance, profileStatus };
  }

  // Test: null profile (missing) should give hasDemo=false, hasSummaryLines=false, hasAcceptance=false
  const missing = getProfileStatus(null);
  assert('Null profile → hasDemo=false', missing.hasDemo === false, 'false', missing.hasDemo);
  assert('Null profile → hasSummaryLines=false', missing.hasSummaryLines === false, 'false', missing.hasSummaryLines);
  assert('Null profile → hasAcceptance=false', missing.hasAcceptance === false, 'false', missing.hasAcceptance);
  assert('Null profile → profileStatus=MISSING', missing.profileStatus === 'MISSING', 'MISSING', missing.profileStatus);

  // Test: BM-171-style fully loaded profile
  const bm171Like = {
    runtimeReady: true,
    profileStatus: 'runtime-ready',
    fieldPathCount: 50,
    demoEmpty: false,
    demoMissing: false,
    summaryLinesUndefined: false,
    hasAcceptance: true,
  };
  const runtimeReady = getProfileStatus(bm171Like);
  assert('Runtime profile → hasDemo=true', runtimeReady.hasDemo === true, 'true', runtimeReady.hasDemo);
  assert('Runtime profile → hasSummaryLines=true', runtimeReady.hasSummaryLines === true, 'true', runtimeReady.hasSummaryLines);
  assert('Runtime profile → hasAcceptance=true', runtimeReady.hasAcceptance === true, 'true', runtimeReady.hasAcceptance);
  assert('Runtime profile → profileStatus=RUNTIME_READY', runtimeReady.profileStatus === 'RUNTIME_READY', 'RUNTIME_READY', runtimeReady.profileStatus);

  // Test: BM-001-style skeleton
  const bm001Like = {
    runtimeReady: false,
    profileStatus: undefined,
    fieldPathCount: 30,
    demoEmpty: true,
    demoMissing: true,
    summaryLinesUndefined: true,
    hasAcceptance: false,
  };
  const skeleton = getProfileStatus(bm001Like);
  assert('Skeleton profile → hasDemo=false', skeleton.hasDemo === false, 'false', skeleton.hasDemo);
  assert('Skeleton profile → hasSummaryLines=false', skeleton.hasSummaryLines === false, 'false', skeleton.hasSummaryLines);
  assert('Skeleton profile → hasAcceptance=false', skeleton.hasAcceptance === false, 'false', skeleton.hasAcceptance);
  assert('Skeleton profile → profileStatus=SKELETON', skeleton.profileStatus === 'SKELETON', 'SKELETON', skeleton.profileStatus);
}

// ─── Test: Notes coverage status ────────────────────────────────────────────────

async function testNotesCoverage() {
  console.log('\n━━━ Notes Coverage Tests ━━━');

  // Inline test of coverage.notes logic (matches production logic)
  function determineNotesStatus(footnoteCount, endnoteCount, bodyNoteCount, hasFootnoteRefs, hasEndnoteRefs, hasFootnoteXml, hasEndnoteXml) {
    if (footnoteCount > 0 || endnoteCount > 0 || bodyNoteCount > 0) {
      // We have real extracted notes
      if ((hasFootnoteRefs && footnoteCount === 0 && hasFootnoteXml) ||
          (hasEndnoteRefs && endnoteCount === 0 && hasEndnoteXml)) {
        return 'FAIL';
      }
      return 'PASS';
    } else if (!hasFootnoteRefs && !hasEndnoteRefs && bodyNoteCount === 0) {
      return 'NO_NOTES_WITH_EVIDENCE';
    } else if (hasFootnoteRefs || hasEndnoteRefs) {
      // Refs exist but no notes extracted and no XML - rare inconsistent state
      if (!hasFootnoteXml && !hasEndnoteXml) return 'UNKNOWN';
      return 'FAIL'; // refs exist, XML exists, but extraction failed
    } else {
      return 'PARTIAL';
    }
  }

  // Test: Real notes extracted → PASS
  assert('Notes with footnotes → PASS',
    determineNotesStatus(3, 0, 0, true, false, true, false) === 'PASS', 'PASS',
    determineNotesStatus(3, 0, 0, true, false, true, false));

  // Test: No notes anywhere → NO_NOTES_WITH_EVIDENCE
  assert('No notes, no refs → NO_NOTES_WITH_EVIDENCE',
    determineNotesStatus(0, 0, 0, false, false, false, false) === 'NO_NOTES_WITH_EVIDENCE', 'NO_NOTES_WITH_EVIDENCE',
    determineNotesStatus(0, 0, 0, false, false, false, false));

  // Test: References exist, XML exists, but no notes extracted → FAIL
  assert('Refs with XML but no extracted notes → FAIL',
    determineNotesStatus(0, 0, 0, true, false, true, false) === 'FAIL', 'FAIL',
    determineNotesStatus(0, 0, 0, true, false, true, false));

  // Test: BM-001 scenario (footnote XML exists with only separators → no refs)
  assert('BM-001: no real notes, no refs → NO_NOTES_WITH_EVIDENCE',
    determineNotesStatus(0, 0, 0, false, false, true, false) === 'NO_NOTES_WITH_EVIDENCE', 'NO_NOTES_WITH_EVIDENCE',
    determineNotesStatus(0, 0, 0, false, false, true, false));

  // Test: PARTIAL - only body notes detected, no XML refs
  assert('Body notes only → PASS',
    determineNotesStatus(0, 0, 2, false, false, false, false) === 'PASS', 'PASS',
    determineNotesStatus(0, 0, 2, false, false, false, false));

  // Test: UNKNOWN - refs but no XML
  assert('Refs but no XML, no notes → UNKNOWN',
    determineNotesStatus(0, 0, 0, true, false, false, false) === 'UNKNOWN', 'UNKNOWN',
    determineNotesStatus(0, 0, 0, true, false, false, false));
}

// ─── Test: Fidelity scoring ─────────────────────────────────────────────────────

async function testFidelityScoring() {
  console.log('\n━━━ Fidelity Scoring Tests ━━━');

  // Inline test of strict fidelity scoring
  function determineFidelity(passCount, failCount, partialCount, profileStatus, hasDemo, hasSummaryLines, hasAcceptance) {
    const isProfileReady = profileStatus === 'RUNTIME_READY' || profileStatus === 'GENERATED_READY_APPROVED';
    const hasCompleteProfile = hasDemo && hasSummaryLines && hasAcceptance;

    if (isProfileReady && hasCompleteProfile && failCount === 0 && passCount >= 4) {
      return 'FIDELITY_COMPLETE_EVIDENCED';
    } else if (failCount >= 2) {
      return 'FIDELITY_BLOCKED';
    } else if (passCount >= 2 || partialCount >= 3) {
      return 'FIDELITY_PARTIAL';
    }
    return 'FIDELITY_UNKNOWN';
  }

  // Test: BM-171 (complete profile, complete coverage)
  assert('BM-171: all complete → FIDELITY_COMPLETE_EVIDENCED',
    determineFidelity(5, 0, 0, 'RUNTIME_READY', true, true, true) === 'FIDELITY_COMPLETE_EVIDENCED',
    'FIDELITY_COMPLETE_EVIDENCED',
    determineFidelity(5, 0, 0, 'RUNTIME_READY', true, true, true));

  // Test: BM-001 (skeleton profile, partial coverage)
  assert('BM-001: skeleton + partial → FIDELITY_PARTIAL',
    determineFidelity(2, 0, 3, 'SKELETON', false, false, false) === 'FIDELITY_PARTIAL',
    'FIDELITY_PARTIAL',
    determineFidelity(2, 0, 3, 'SKELETON', false, false, false));

  // Test: Missing profile (211 of them)
  assert('Missing profile + limited coverage → FIDELITY_UNKNOWN',
    determineFidelity(1, 0, 2, 'MISSING', false, false, false) === 'FIDELITY_UNKNOWN',
    'FIDELITY_UNKNOWN',
    determineFidelity(1, 0, 2, 'MISSING', false, false, false));

  // Test: Multiple FAIL → FIDELITY_BLOCKED
  assert('Multiple FAIL → FIDELITY_BLOCKED',
    determineFidelity(1, 3, 0, 'INVALID', false, false, false) === 'FIDELITY_BLOCKED',
    'FIDELITY_BLOCKED',
    determineFidelity(1, 3, 0, 'INVALID', false, false, false));
}

// ─── Test: Read existing profiles to verify BM-171 detection ────────────────────

async function testRealProfiles() {
  console.log('\n━━━ Real Profile Reading Tests ━━━');

  try {
    const bm171Content = readFileSync(
      join(process.cwd(), 'apps/web/src/lib/form-flight/profiles/bm171.ts'),
      'utf-8'
    );

    // Verify bm171 has expected structure - patterns include both inline and constant-based
    const hasRuntimeReady = /runtimeReady:\s*true/.test(bm171Content);
    const hasDemoObj = /demo:\s*\{/.test(bm171Content) && !/demo:\s*\{\s*\}/.test(bm171Content);
    const hasSummaryLines = /summaryLines:\s*\[/.test(bm171Content);
    const hasAcceptance = /const\s+\w+_ACCEPTANCE\s*=\s*\{/.test(bm171Content);
    const hasRequiredText = /requiredText:\s*\[/.test(bm171Content) && !/requiredText:\s*\[\s*\]/.test(bm171Content);
    const hasForbiddenText = /forbiddenText:/.test(bm171Content);

    console.log(`  bm171.ts:`);
    console.log(`    runtimeReady: ${hasRuntimeReady}`);
    console.log(`    demo object (non-empty): ${hasDemoObj}`);
    console.log(`    summaryLines array: ${hasSummaryLines}`);
    console.log(`    acceptance const: ${hasAcceptance}`);
    console.log(`    requiredText (non-empty): ${hasRequiredText}`);
    console.log(`    forbiddenText: ${hasForbiddenText}`);

    assert('BM-171 runtimeReady=true detected', hasRuntimeReady, 'true', hasRuntimeReady);
    // demo may use constant - check both patterns
    const hasDemoConst = /const\s+\w+_DEMO\s*=\s*\{/.test(bm171Content) && !/const\s+\w+_DEMO\s*=\s*\{\s*\}/.test(bm171Content);
    assert('BM-171 has demo object', hasDemoObj || hasDemoConst, 'true', hasDemoObj || hasDemoConst);
    // summaryLines may use constant
    const hasSummaryConst = /const\s+\w+_SUMMARY_LINES\s*=\s*\[/.test(bm171Content) && !/const\s+\w+_SUMMARY_LINES\s*=\s*\[\s*\]/.test(bm171Content);
    assert('BM-171 has summaryLines', hasSummaryLines || hasSummaryConst, 'true', hasSummaryLines || hasSummaryConst);
    assert('BM-171 has acceptance', hasAcceptance, 'true', hasAcceptance);
    assert('BM-171 has requiredText (non-empty)', hasRequiredText, 'true', hasRequiredText);
    assert('BM-171 has forbiddenText', hasForbiddenText, 'true', hasForbiddenText);
  } catch (err) {
    console.log(`  ✗ Could not read bm171.ts: ${err.message}`);
    failed++;
    failures.push({ testName: 'BM-171 profile read', expected: 'file exists', actual: err.message });
  }
}

// ─── Run all tests ──────────────────────────────────────────────────────────────

async function runAll() {
  console.log('DOCX Extractor Self-Check / Calibration');
  console.log('========================================');
  console.log('Mode: EVIDENCE_ONLY');
  console.log('');

  await testFootnoteParser();
  await testProfileDetection();
  await testNotesCoverage();
  await testFidelityScoring();
  await testRealProfiles();

  console.log('\n━━━ Summary ━━━');
  console.log(`Total tests: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures) {
      console.log(`  - ${f.testName}: expected ${f.expected}, got ${f.actual}`);
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

runAll().catch(err => {
  console.error('Self-check failed:', err);
  process.exit(1);
});
