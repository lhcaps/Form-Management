// Inspect lockedContracts shape
import fs from 'node:fs';
import path from 'node:path';
const REPO = path.resolve('.');
const corpus = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/audit/docx/reports/form-corpus-reconciliation.json'), 'utf8'));
console.log(JSON.stringify({
  counts: corpus.counts,
  referenceDocs: corpus.referenceDocs?.length,
  lockedContractsType: Array.isArray(corpus.lockedContracts) ? 'array' : typeof corpus.lockedContracts,
  lockedContractsKeysIfObject: corpus.lockedContracts && typeof corpus.lockedContracts === 'object' ? Object.keys(corpus.lockedContracts).slice(0, 5) : null,
  lockedContractsArrayLen: Array.isArray(corpus.lockedContracts) ? corpus.lockedContracts.length : null,
  draftContractsType: typeof corpus.draftContracts,
  draftContractsLen: Array.isArray(corpus.draftContracts) ? corpus.draftContracts.length : (corpus.draftContracts && typeof corpus.draftContracts === 'object' ? Object.keys(corpus.draftContracts).length : null),
  stages: corpus.stages && Object.keys(corpus.stages),
}, null, 2));
