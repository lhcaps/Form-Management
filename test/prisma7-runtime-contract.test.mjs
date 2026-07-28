import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const rootPackage = JSON.parse(read('package.json'));
const prismaEntrypoints = [
  'apps/api/prisma/seed.ts',
  'apps/api/prisma/seed-demo-cases.ts',
  'apps/api/scripts/check-bm171-doc.mjs',
  'apps/api/src/modules/forms-contracts/infrastructure/contract-sync.guard.ts',
  'scripts/audit-form-authoring-baselines.mjs',
  'scripts/audit-template-db-coverage.mjs',
  'scripts/audit/audit-contract-sync.mjs',
  'scripts/audit/audit-contract-sync-prep.mjs',
  'scripts/audit/build-active-remediation-blocker-pack.mjs',
  'scripts/docx-contract/migrate-compiled-json-to-v2.mjs',
  'scripts/docx-contract/publish-locked-contracts-to-db.mjs',
];

test('Prisma 7 uses an explicit generated client and MariaDB driver adapter', () => {
  const schema = read('apps/api/prisma/schema.prisma');
  const service = read('apps/api/src/prisma/prisma.service.ts');
  const adapter = read('apps/api/src/prisma/prisma-mariadb-adapter.ts');
  const apiPackage = JSON.parse(read('apps/api/package.json'));

  assert.match(schema, /provider\s*=\s*"prisma-client-js"/u);
  assert.doesNotMatch(schema, /url\s*=\s*env\("DATABASE_URL"\)/u);
  assert.equal(apiPackage.dependencies['@prisma/adapter-mariadb'], '7.9.1');
  assert.equal(apiPackage.dependencies['@prisma/client'], '7.9.1');
  assert.equal(apiPackage.devDependencies.prisma, '7.9.1');
  assert.match(service, /createPrismaMariaDbAdapter/u);
  assert.match(service, /super\(\{ adapter \}\)/u);
  assert.match(adapter, /connectTimeout: Number\(url\.searchParams\.get\('connect_timeout'\) \?\? 5\) \* 1000/u);
  assert.equal(existsSync(new URL('../apps/api/prisma.config.ts', import.meta.url)), true);
  assert.equal(rootPackage.scripts.postinstall, 'pnpm prisma:generate');
});

test('every Prisma 7 database entrypoint supplies the MariaDB adapter', () => {
  for (const path of prismaEntrypoints) {
    const source = read(path);
    assert.doesNotMatch(source, /new PrismaClient\(\)/u, path);
    assert.match(source, /adapter\s*:/u, path);
  }
});
