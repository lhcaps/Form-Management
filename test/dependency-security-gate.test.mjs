import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const gate = readFileSync(
  new URL('../scripts/audit/dependency-security.mjs', import.meta.url),
  'utf8',
);

test('dependency security gate is fail-closed and produces SBOM plus OSV evidence', () => {
  assert.equal(packageJson.scripts['security:dependencies'], 'node scripts/audit/dependency-security.mjs');
  assert.equal(packageJson.devDependencies['@cyclonedx/cyclonedx-npm'], '6.0.0');
  assert.match(gate, /runPnpm\(\['audit', '--prod', '--json'\]/u);
  assert.match(gate, /buildProductionSbom/u);
  assert.match(gate, /'--prod', '--json', '--depth', 'Infinity'/u);
  assert.match(gate, /timeoutMs/u);
  assert.match(gate, /runOsv\(\['--lockfile', 'pnpm-lock\.yaml'\]/u);
  assert.match(gate, /ghcr\.io\/google\/osv-scanner/u);
  assert.match(gate, /high|critical/u);
  assert.match(gate, /process\.exitCode = 1/u);
});
