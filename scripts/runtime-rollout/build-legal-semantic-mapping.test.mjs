import test from 'node:test';
import assert from 'node:assert/strict';

import { proposeSemanticMapping } from './build-legal-semantic-mapping.mjs';

test('auto-approves one exact semantic target with a proven structural path', () => {
  const result = proposeSemanticMapping({
    contractKey: 'person.fullName',
    contractLabel: 'Họ và tên người bị buộc tội',
    required: true,
    candidates: [{
      target: 'accused.fullName',
      structuralPath: 'word/document.xml#/w:document/w:body/w:p[8]',
      sourceText: 'Họ và tên người bị buộc tội: {{accused.fullName}}',
    }],
  });

  assert.equal(result.CONFIDENCE, 'HIGH');
  assert.equal(result.DECISION_STATUS, 'AUTO_APPROVED_DETERMINISTIC');
  assert.equal(result.PROPOSED_SOURCE_TARGET, 'accused.fullName');
});

test('keeps multiple official-role targets fail-closed for legal review', () => {
  const result = proposeSemanticMapping({
    contractKey: 'official.fullName',
    contractLabel: 'Họ và tên người có thẩm quyền',
    required: true,
    candidates: [
      { target: 'signature.signerName', structuralPath: 'word/document.xml#/p[20]', sourceText: 'NGƯỜI KÝ {{signature.signerName}}' },
      { target: 'receiver.fullName', structuralPath: 'word/document.xml#/p[4]', sourceText: 'Người nhận {{receiver.fullName}}' },
    ],
  });

  assert.equal(result.PROPOSED_FIELD_CLASSIFICATION, 'AMBIGUOUS_LEGAL_ROLE');
  assert.equal(result.CONFIDENCE, 'LOW');
  assert.equal(result.DECISION_STATUS, 'PROPOSED_FOR_REVIEW');
});

test('classifies a required field with no source target as source-template debt', () => {
  const result = proposeSemanticMapping({
    contractKey: 'caseInfo.referenceNumber',
    contractLabel: 'Số văn bản được viện dẫn',
    required: true,
    candidates: [],
  });

  assert.equal(result.PROPOSED_FIELD_CLASSIFICATION, 'SOURCE_TEMPLATE_DEBT');
  assert.equal(result.CONFIDENCE, 'UNRESOLVABLE_FROM_CURRENT_SOURCE');
  assert.equal(result.DECISION_STATUS, 'SOURCE_TEMPLATE_DEBT');
});

test('does not invent a target when every current-form candidate is semantically unrelated', () => {
  const result = proposeSemanticMapping({
    contractKey: 'assignment.newAssigneeName',
    contractLabel: 'Người được phân công mới',
    required: true,
    candidates: [{
      target: 'agency.issuePlace',
      structuralPath: 'word/document.xml#/p[2]',
      sourceText: 'Địa danh: {{agency.issuePlace}}',
    }],
  });

  assert.equal(result.PROPOSED_SOURCE_TARGET, 'NOT_AVAILABLE_FROM_CURRENT_EVIDENCE');
  assert.equal(result.DECISION_STATUS, 'SOURCE_TEMPLATE_DEBT');
});
