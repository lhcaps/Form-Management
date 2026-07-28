import { deepEqual, ok } from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';

import { loadLockedRuntimeIndex } from './lib/locked-runtime-index.mjs';

test('guard script is a Node entry point that exits 0 when chain is green', () => {
  const guard = 'scripts/runtime-rollout/guard-locked-runtime-authority.mjs';
  const result = spawnSync(process.execPath, [guard], { encoding: 'utf8' });
  ok((result.status ?? 1) === 0, `guard should exit 0; got ${result.status}. stdout=${result.stdout} stderr=${result.stderr}`);
});

test('index v2.1 still has 213 forms and 2497 elements after the guard ran', () => {
  const index = loadLockedRuntimeIndex();
  deepEqual(index.contractCount, 213);
  let fields = 0;
  let slots = 0;
  let bindings = 0;
  for (const form of index.forms) {
    fields += form.runtimeView.canonicalFields.length;
    slots += form.runtimeView.docxSlots.length;
    bindings += form.runtimeView.renderBindings.length;
  }
  deepEqual(fields, 2497);
  deepEqual(slots, 2497);
  deepEqual(bindings, 2497);
});
