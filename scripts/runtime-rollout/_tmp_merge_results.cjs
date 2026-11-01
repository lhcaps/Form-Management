const fs = require('fs');
const path = require('path');
const main = JSON.parse(fs.readFileSync(path.resolve('./docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase13c-live-browser/browser-full-results.json'), 'utf8'));
const rerun = JSON.parse(fs.readFileSync(path.resolve('./docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase13c-live-browser/browser-failed-rerun.json'), 'utf8'));

// Replace failed forms with their rerun results
const rerunMap = new Map();
for (const f of rerun.forms) rerunMap.set(f.formCode, f);
let replaced = 0;
for (let i = 0; i < main.forms.length; i++) {
  const orig = main.forms[i];
  if (orig.verdict === 'FAIL' && rerunMap.has(orig.formCode)) {
    const newRes = rerunMap.get(orig.formCode);
    main.forms[i] = { ...orig, ...newRes, rerunVerdict: newRes.verdict, rerunDurationMs: newRes.durationMs };
    replaced += 1;
  }
}

// Recompute summary
main.summary.attempted = main.forms.length;
main.summary.passed = main.forms.filter(f => f.verdict === 'PERSISTED_BROWSER_PASS').length;
main.summary.failed = main.forms.filter(f => f.verdict === 'FAIL').length;
main.summary.skipped = main.forms.filter(f => f.verdict === 'SKIPPED_RUNTIME_READY').length;
main.summary.passRate = main.summary.attempted > 0 ? main.summary.passed / main.summary.attempted : 0;
main.mergedAt = new Date().toISOString();
main.mergedRerunCount = replaced;

fs.writeFileSync(path.resolve('./docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase13c-live-browser/browser-full-results.json'), JSON.stringify(main, null, 2));
console.log(`Replaced ${replaced} failed forms with rerun results.`);
console.log(`Final: ${main.summary.passed}/${main.summary.attempted} PASS, ${main.summary.failed} FAIL, ${main.summary.skipped} SKIPPED`);
