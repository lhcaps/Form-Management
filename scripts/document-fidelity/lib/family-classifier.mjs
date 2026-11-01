// Family classifier - wraps ooxml-token-scope.classifyStructuralFamily
// and provides the canonical family enum + helper predicates.

import { classifyStructuralFamily } from './ooxml-token-scope.mjs';

export const FAMILY = Object.freeze({
  A_ANCHORED: 'FAMILY_A_ANCHORED_HEADER_TABLE_WITH_VML',
  B_STANDALONE_VML: 'FAMILY_B_STANDALONE_MODEL_NUMBER_VML',
  C_IN_FLOW_PARAGRAPH: 'FAMILY_C_IN_FLOW_PARAGRAPH',
  D_IN_FLOW_TABLE: 'FAMILY_D_IN_FLOW_TABLE',
  E_OTHER_KNOWN: 'FAMILY_E_OTHER_KNOWN',
  UNKNOWN: 'FAMILY_UNKNOWN',
  NO_MODEL_NUMBER: 'NO_MODEL_NUMBER',
});

// Vietnamese form-number prefix built from NFC code points.
const MAU_SO_PREFIX = 'M' + String.fromCharCode(0x1EAB) + 'u s' + String.fromCharCode(0x1ED1) + ' ';
const BAU_HANH_THEO = 'Ban h' + String.fromCharCode(0xE0) + 'nh theo';
const BAU_HANH_KEM = 'Ban h' + String.fromCharCode(0xE0) + 'nh k' + String.fromCharCode(0xE8) + 'm theo';

function tokenFor(code) {
  const num = code.replace(/^BM-/, '');
  if (code === 'BM-001') return MAU_SO_PREFIX + '01/HS';
  return MAU_SO_PREFIX + num;
}

function issuanceFor(code) {
  return code === 'BM-001' ? BAU_HANH_THEO : BAU_HANH_KEM;
}

// Forms that we KNOW are safe to transform with our Family A/B code
// (verified empirically from the normalized DOCX in this execution).
// The previous registry listed BM-001 as FAMILY_A based on the original
// .doc source, but the normalized DOCX stores the model-number inside a
// standalone <v:textbox> inside a <w:pict> (the line-drawing template),
// NOT inside the anchored table that holds the rest of the legal header.
// We therefore classify BM-001 as FAMILY_B in this registry.
const RAW_KNOWN = Object.freeze([
  { code: 'BM-001', family: 'B_STANDALONE_VML' },
  { code: 'BM-136', family: 'B_STANDALONE_VML' },
  { code: 'BM-148', family: 'B_STANDALONE_VML' },
  { code: 'BM-156', family: 'B_STANDALONE_VML' },
  { code: 'BM-157', family: 'B_STANDALONE_VML' },
  { code: 'BM-168', family: 'B_STANDALONE_VML' },
  { code: 'BM-171', family: 'B_STANDALONE_VML' },
  { code: 'BM-174', family: 'B_STANDALONE_VML' },
  { code: 'BM-181', family: 'B_STANDALONE_VML' },
  { code: 'BM-206', family: 'B_STANDALONE_VML' },
  { code: 'BM-213', family: 'B_STANDALONE_VML' },
]);

export const KNOWN_FORM_FAMILIES = Object.freeze(
  Object.fromEntries(
    RAW_KNOWN.map((r) => [
      r.code,
      {
        family: FAMILY[r.family],
        modelNumberToken: tokenFor(r.code),
        issuanceNoteToken: issuanceFor(r.code),
      },
    ]),
  ),
);

export function classifyForm(documentXml, formCode) {
  const known = KNOWN_FORM_FAMILIES[formCode] ?? null;
  const result = classifyStructuralFamily(documentXml, {
    modelNumberToken: known?.modelNumberToken ?? null,
    issuanceNoteToken: known?.issuanceNoteToken ?? null,
  });
  return {
    formCode,
    known,
    ...result,
    expectedFamily: known?.family ?? null,
    familyMatchesRegistry: known ? result.family === known.family : null,
  };
}
