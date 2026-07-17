import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const source = readFileSync(
  `${ROOT}/scripts/audit/audit-docx-structural-fidelity.mjs`,
  "utf8",
);
const renderedTextSource = readFileSync(
  `${ROOT}/scripts/audit/audit-rendered-text-fidelity.mjs`,
  "utf8",
);
const bindingSource = readFileSync(
  `${ROOT}/scripts/audit/audit-docx-binding-correctness.mjs`,
  "utf8",
);
const mutationSource = readFileSync(
  `${ROOT}/scripts/audit/audit-docx-fidelity-mutations.mjs`,
  "utf8",
);

describe("DOCX structural fidelity diagnostics", () => {
  it("reports a renderer subprocess failure instead of silently turning it into a misleading cache miss", () => {
    assert.match(source, /\[F2\] renderer failed for \$\{templateCode\}/);
    assert.match(source, /String\(error\.stderr \?\? error\.message \?\? error\)/);
  });

  it("places transient TypeScript renderer files below apps/api so workspace dependencies resolve", () => {
    assert.match(source, /join\(ROOT, 'apps', 'api', '\.cache', `f2-render-\$\{process\.pid\}`\)/);
    assert.match(renderedTextSource, /j2join\(ROOT, 'apps', 'api', '\.cache', `f3-render-\$\{process\.pid\}`\)/);
    assert.match(bindingSource, /j2join\(ROOT, 'apps', 'api', '\.cache', `f4-binding-\$\{process\.pid\}`\)/);
    assert.match(bindingSource, /j2join\(ROOT, 'apps', 'api', '\.cache', `f4-smoke-\$\{process\.pid\}`\)/);
  });

  it("renders a required manual field through every contract binding slot that maps from it", () => {
    const mappings = bindingSource.match(/for \(const binding of contract\.renderBindings \?\? \[\]\) \{/g) ?? [];
    assert.equal(mappings.length, 2, "representative and corpus smoke renderers must share binding-slot marker mapping");
    assert.match(bindingSource, /binding\.from === field\.path/);
    assert.match(bindingSource, /mock\[binding\.slotId\] = marker/);
  });

  it("fails structural fidelity when the paragraph delta exceeds its configured threshold", () => {
    assert.match(
      source,
      /if \(paraDelta > t\.paragraphDeltaPercent\) failures\.push\(/,
    );
    assert.doesNotMatch(
      source,
      /if \(paraDelta > t\.paragraphDeltaPercent\) warnings\.push\(/,
    );
  });

  it("primes the F2 render cache and verifies a numeric paragraph delta before accepting mutation M2", () => {
    assert.match(mutationSource, /const primeF2Cache = \(templateCode\) =>/);
    assert.match(mutationSource, /primeF2Cache\(BM\)/);
    assert.match(mutationSource, /result\?\.status === 'FAIL'/);
    assert.match(mutationSource, /typeof result\.deltas\?\.paragraphDeltaPercent === 'number'/);
    assert.match(mutationSource, /result\.deltas\.paragraphDeltaPercent > 15/);
  });
});
