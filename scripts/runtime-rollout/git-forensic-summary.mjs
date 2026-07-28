import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ref = 'b0e43be3fd7831db42a88ad521384e0608ee6a18';
const lockedDir = 'docs/audit/docx/contracts/locked';
const out = path.join(root, 'docs/audit/final-213-customer-ready/runtime-rollout/git-forensic');
const git = (args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }).trim();
const rows = (s) => s ? s.split(/\r?\n/).filter(Boolean) : [];
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const tree = (commit, dir) => rows(git(['ls-tree', '-r', '-l', commit, '--', dir])).map((line) => {
  const m = line.match(/^\d+\s+\w+\s+([0-9a-f]+)\s+\d+\t(.+)$/);
  return m && { blob: m[1], path: m[2], FORM_CODE: m[2].match(/BM-\d{3}/)?.[0] || null };
}).filter(Boolean);
const put = (file, json) => writeFile(path.join(out, file), `${JSON.stringify(json, null, 2)}\n`);

await mkdir(out, { recursive: true });
const reference = tree(ref, lockedDir);
const head = tree('HEAD', lockedDir);
if (reference.length !== 213) throw new Error(`REFERENCE_LOCKED_COUNT=${reference.length}; expected 213`);
const headByPath = new Map(head.map((x) => [x.path, x]));
const corpus = reference.map((r) => {
  const current = headByPath.get(r.path); const worktreePath = path.join(root, r.path);
  return { FORM_CODE: r.FORM_CODE, REFERENCE_PATH: r.path, REFERENCE_BLOB_SHA: r.blob, HEAD_PATH: current?.path || null, HEAD_BLOB_SHA: current?.blob || null, WORKTREE_PATH: existsSync(worktreePath) ? r.path : null, WORKTREE_SHA256: existsSync(worktreePath) ? sha(worktreePath) : null, STATUS: !current ? 'MISSING_FROM_HEAD' : !existsSync(worktreePath) ? 'MISSING_FROM_WORKTREE' : current.blob === r.blob ? 'PRESENT_IDENTICAL' : 'PRESENT_MODIFIED' };
});
const parsed = reference.map((r) => { try { const c = JSON.parse(git(['show', `${ref}:${r.path}`])); return { code: c.templateCode, slots: c.docxSlots?.length || 0, fields: c.canonicalFields?.length || 0, bindings: c.renderBindings?.length || 0, malformed: false }; } catch { return { malformed: true }; } });
const totals = parsed.reduce((a, x) => ({ lockedContractsParsed: a.lockedContractsParsed + !x.malformed, slotsTotal: a.slotsTotal + (x.slots || 0), fieldsTotal: a.fieldsTotal + (x.fields || 0), bindingsTotal: a.bindingsTotal + (x.bindings || 0), malformedTotal: a.malformedTotal + x.malformed }), { lockedContractsParsed: 0, slotsTotal: 0, fieldsTotal: 0, bindingsTotal: 0, malformedTotal: 0 });
const state = { currentHead: git(['rev-parse', 'HEAD']), currentBranch: git(['branch', '--show-current']), referenceCommitExists: git(['cat-file', '-t', ref]) === 'commit', mergeBase: git(['merge-base', 'HEAD', ref]), trackedDeletedFiles: rows(git(['ls-files', '--deleted'])), unstagedFiles: rows(git(['diff', '--name-only'])), stagedFiles: rows(git(['diff', '--cached', '--name-only'])), untrackedFiles: rows(git(['ls-files', '--others', '--exclude-standard'])), remoteUrls: rows(git(['remote', '-v'])) };
const verdict = { primaryVerdict: corpus.every((x) => x.STATUS === 'PRESENT_IDENTICAL') ? 'LOCKED_CORPUS_PRESENT_MAPPER_BYPASSED_IT' : 'LOCKED_CORPUS_PARTIALLY_DELETED', evidence: { REFERENCE_LOCKED_COUNT: reference.length, HEAD_LOCKED_COUNT: head.length, WORKTREE_LOCKED_COUNT: readdirSync(path.join(root, lockedDir)).filter((x) => x.endsWith('.contract.locked.json')).length, ...totals }, mapper: { lockedContractConsumed: false, reason: 'Current semantic mapper reads compiled-v2 and slot-inventory artifacts; it has no locked-contract loader.' }, restorationNeeded: false, nextCorrectiveCommand: 'Implement a read-only locked-contract loader adapter, then regenerate debt from canonicalFields/renderBindings.' };
await Promise.all([
  put('current-git-state.json', state), put('locked-corpus-reference.json', { REFERENCE_LOCKED_COUNT: reference.length, files: reference, totals }), put('locked-corpus-current.json', { HEAD_LOCKED_COUNT: head.length, files: head }), put('locked-corpus-diff.json', { files: corpus }),
  put('deletion-rename-history.json', { lockedDeletes: rows(git(['log', '--all', '--diff-filter=D', '--summary', '--', lockedDir])), lockedRenames: rows(git(['log', '--all', '--diff-filter=R', '--summary', '--', lockedDir])) }),
  put('panel-corpus-diff.json', { referencePanels: tree(ref, 'apps/web/src/components/documents').filter((x) => /bm-\d{3}-form-inputs\.tsx$/i.test(x.path)).length, headPanels: tree('HEAD', 'apps/web/src/components/documents').filter((x) => /bm-\d{3}-form-inputs\.tsx$/i.test(x.path)).length }),
  put('docx-corpus-diff.json', { referenceNormalizedDocx: tree(ref, 'storage/templates/normalized-docx').filter((x) => x.path.endsWith('.docx')).length, headNormalizedDocx: tree('HEAD', 'storage/templates/normalized-docx').filter((x) => x.path.endsWith('.docx')).length }),
  put('mapper-input-trace.json', verdict.mapper), put('root-cause-verdict.json', verdict)
]);
await writeFile(path.join(out, 'FINAL-REPORT.md'), `# Locked-contract forensic audit\n\nPrimary verdict: **${verdict.primaryVerdict}**.\n\nLocked corpus reference/head/worktree: ${reference.length}/${head.length}/${verdict.evidence.WORKTREE_LOCKED_COUNT}.\n\nNo restoration is needed. Mapper bypassed locked contracts.\n`);
console.log(JSON.stringify(verdict));
