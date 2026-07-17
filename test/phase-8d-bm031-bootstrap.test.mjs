import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const REPO_ROOT = resolve(
  process.env.QLLAW_REPO_ROOT ||
    new URL('..', import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/u, (value) =>
      value.slice(1),
    ),
);
const GENERATOR = join(
  REPO_ROOT,
  'scripts',
  'audit',
  'build-phase-8c-bootstrap-sql.mjs',
);
const DISPOSABLE_CLOSURE = join(
  REPO_ROOT,
  'scripts',
  'audit',
  'build-phase-8c2-bootstrap-disposable-closure.mjs',
);
const LATEST_SQL = join(
  REPO_ROOT,
  'docs',
  'audit',
  'infrastructure-modernization',
  'phase-8c-bootstrap',
  'bootstrap.latest.sql',
);
const LOCKED_DIR = join(
  REPO_ROOT,
  'docs',
  'audit',
  'docx',
  'contracts',
  'locked',
);
const COMPILED_DIR = join(
  REPO_ROOT,
  'docs',
  'audit',
  'docx',
  'compiled-v2',
);
const requireFromApi = createRequire(
  join(REPO_ROOT, 'apps', 'api', 'package.json'),
);
const mariadb = requireFromApi('mariadb');

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const jsonReplacer = (_key, value) =>
  typeof value === 'bigint' ? value.toString() : value;

function runGenerator(args, env = {}) {
  return spawnSync(process.execPath, [GENERATOR, ...args], {
    cwd: REPO_ROOT,
    env: { ...process.env, ...env },
    encoding: 'utf8',
    windowsHide: true,
  });
}

function loadCorpus() {
  return readdirSync(LOCKED_DIR)
    .filter((name) => name.endsWith('.contract.locked.json'))
    .sort()
    .map((name) => {
      const locked = JSON.parse(readFileSync(join(LOCKED_DIR, name), 'utf8'));
      const templateCode = locked.templateCode || name.split('__')[0];
      const compiled = JSON.parse(
        readFileSync(join(COMPILED_DIR, `${templateCode}.compiled.json`), 'utf8'),
      );
      const sourceId =
        locked.sourceId ||
        `${templateCode}__${sha256(Buffer.from(name, 'utf8')).slice(0, 12)}`;
      const draft = {
        schemaVersion: locked.schemaVersion || '1.0',
        sourceId,
        templateCode,
        templateTitle: locked.templateTitle || templateCode,
        documentKind: locked.documentKind || 'form',
        status: 'locked',
        docxSlots: Array.isArray(locked.docxSlots) ? locked.docxSlots : [],
        canonicalFields: Array.isArray(locked.canonicalFields)
          ? locked.canonicalFields
          : [],
        renderBindings: Array.isArray(locked.renderBindings)
          ? locked.renderBindings
          : [],
        lockedAt: locked.lockedAt || null,
      };
      return { templateCode, compiled, draftText: JSON.stringify(draft) };
    });
}

function versionBlocks(sqlText) {
  const starts = [
    ...sqlText.matchAll(/INSERT INTO form_contract_versions \(/gu),
  ].map((match) => match.index);
  const commitIndex = sqlText.indexOf('\nCOMMIT;', starts.at(-1));
  return starts.map((start, index) =>
    sqlText.slice(start, starts[index + 1] ?? commitIndex),
  );
}

function sqlStringTokens(sqlText) {
  const tokens = [];
  for (let index = 0; index < sqlText.length; index += 1) {
    if (sqlText[index] !== "'") continue;
    let token = "'";
    index += 1;
    while (index < sqlText.length) {
      const char = sqlText[index];
      token += char;
      if (char === "'") {
        if (sqlText[index + 1] === "'") {
          token += "'";
          index += 2;
          continue;
        }
        break;
      }
      index += 1;
    }
    tokens.push(token);
  }
  return tokens;
}

function decodeMariaDbStringLiteral(token) {
  const inner = token.slice(1, -1);
  let decoded = '';
  for (let index = 0; index < inner.length; index += 1) {
    const char = inner[index];
    if (char === "'" && inner[index + 1] === "'") {
      decoded += "'";
      index += 1;
      continue;
    }
    if (char !== '\\') {
      decoded += char;
      continue;
    }
    const next = inner[index + 1];
    const escaped = {
      '0': '\0',
      b: '\b',
      n: '\n',
      r: '\r',
      t: '\t',
      Z: '\x1a',
    }[next];
    decoded += escaped ?? next ?? '';
    index += 1;
  }
  return decoded;
}

function bm031SqlRepresentation(sqlText) {
  const blocks = versionBlocks(sqlText);
  const blockIndex = blocks.findIndex((block) =>
    /template_code = 'BM-031' LIMIT 1/u.test(block),
  );
  assert.notEqual(blockIndex, -1, 'BM-031 version block must exist');
  for (const token of sqlStringTokens(blocks[blockIndex])) {
    const decoded = decodeMariaDbStringLiteral(token);
    try {
      const parsed = JSON.parse(decoded);
      if (parsed.templateCode === 'BM-031' && Array.isArray(parsed.docxSlots)) {
        return { blocks, blockIndex, block: blocks[blockIndex], token, decoded };
      }
    } catch {
      // The regression under test is that the current raw SQL literal is invalid.
    }
  }
  return { blocks, blockIndex, block: blocks[blockIndex], token: null, decoded: null };
}

function generateSql() {
  const result = runGenerator(['--write']);
  assert.equal(
    result.status,
    0,
    `generator --write failed: ${(result.stderr || result.stdout).slice(0, 500)}`,
  );
  return readFileSync(LATEST_SQL, 'utf8');
}

test('BM-031 canonical draft parses and has no raw control corruption', () => {
  const corpus = loadCorpus();
  assert.equal(corpus.length, 213);
  const bm031 = corpus.find((entry) => entry.templateCode === 'BM-031');
  assert.ok(bm031);
  assert.doesNotThrow(() => JSON.parse(bm031.draftText));
  assert.equal((bm031.draftText.match(/\\"/gu) ?? []).length, 12);
  assert.equal((bm031.draftText.match(/[\u0000-\u001f\u007f]/gu) ?? []).length, 0);
});

test('generated BM-031 SQL decodes byte-identically and appears once in order', () => {
  const corpus = loadCorpus();
  const bm031 = corpus.find((entry) => entry.templateCode === 'BM-031');
  const sqlText = generateSql();
  const representation = bm031SqlRepresentation(sqlText);
  const modeNormalizationIndex = sqlText.indexOf(
    'SET SESSION sql_mode = TRIM',
  );
  const transactionIndex = sqlText.indexOf('START TRANSACTION;');

  assert.equal(representation.blocks.length, 213);
  assert.ok(modeNormalizationIndex >= 0);
  assert.ok(modeNormalizationIndex < transactionIndex);
  assert.equal(representation.blockIndex, 30);
  assert.match(representation.blocks[29], /template_code = 'BM-030'/u);
  assert.match(representation.blocks[31], /template_code = 'BM-032'/u);
  assert.ok(representation.token, 'BM-031 draft JSON SQL token must remain parseable');
  assert.equal(representation.decoded, bm031.draftText);
  assert.equal(
    sha256(Buffer.from(representation.decoded, 'utf8')),
    sha256(Buffer.from(bm031.draftText, 'utf8')),
  );
});

test('official apply has an installed schema probe and cwd-correct Prisma schema path', () => {
  const source = readFileSync(GENERATOR, 'utf8');
  assert.doesNotMatch(source, /mysql2\/promise/u);
  assert.match(source, /const API_ROOT = join\(REPO_ROOT, 'apps', 'api'\);/u);
  assert.match(
    source,
    /createRequire\(join\(API_ROOT, 'package\.json'\)\)/u,
  );
  assert.match(
    source,
    /'--schema',\s*'prisma\/schema\.prisma'/su,
  );
  assert.doesNotMatch(source, /if\s*\([^\n]*BM-031|BM-031[^\n]*\?/u);
});

test('disposable closure uses the official apply and derives idempotence evidence', () => {
  const source = readFileSync(DISPOSABLE_CLOSURE, 'utf8');
  const freshDbProbe = source.indexOf("pre-migration-user-tables");
  const firstMigrationDeploy = source.indexOf("prisma migrate deploy");
  assert.match(
    source,
    /build-phase-8c-bootstrap-sql\.mjs --apply/u,
  );
  assert.match(source, /QLLAW_BOOTSTRAP_ALLOW_DB_WRITE/u);
  assert.doesNotMatch(
    source,
    /mariadb[^\n]*<[^\n]*bootstrap/iu,
  );
  assert.match(source, /JOIN templates/u);
  assert.doesNotMatch(source, /semanticChange:\s*'NONE'/u);
  assert.match(source, /templates[^\n]*213/u);
  assert.match(source, /versions[^\n]*213/u);
  assert.ok(freshDbProbe >= 0);
  assert.ok(firstMigrationDeploy >= 0);
  assert.ok(
    freshDbProbe < firstMigrationDeploy,
    'fresh-database zero-table proof must happen before migrate deploy',
  );
  assert.match(source, /docker volume create/u);
  assert.match(source, /docker volume rm/u);
  assert.match(source, /process\.on\('exit'/u);
  assert.match(
    source,
    /sqlBytes:\s*Buffer\.byteLength\(bootstrapSql, 'utf8'\)/u,
  );
  assert.doesNotMatch(source, /sqlBytes:\s*bootstrapSql\.length/u);
  assert.match(source, /migrationStateBefore/u);
  assert.match(source, /migrationStateAfter/u);
  assert.match(source, /migrationMetadataSha256Before/u);
  assert.match(source, /migrationMetadataSha256After/u);
  assert.match(source, /migrationStateMatchesInitial/u);
  assert.match(source, /migrationRows !== 1/u);
  assert.match(source, /failedMigrationRows !== 0/u);
  assert.match(source, /Pre-bootstrap fonts\.ok expected true/u);
  assert.match(source, /Pre-bootstrap missingLocked expected/u);
  assert.doesNotMatch(
    source,
    /CONCAT_WS\('\|', template_code, contract_hash, template_hash\)[^\n]*FROM form_contract_versions/u,
  );
});

const integrationEnabled =
  process.env.PHASE8D_DISPOSABLE_DB === '1' &&
  Boolean(process.env.PHASE8D_DATABASE_URL) &&
  Boolean(process.env.PHASE8D_ADMIN_DATABASE_URL);

test(
  'disposable official apply is atomic, creates 213/213, and is a semantic no-op on apply two',
  { skip: !integrationEnabled },
  async (t) => {
    const databaseUrl = process.env.PHASE8D_DATABASE_URL;
    const adminDatabaseUrl = process.env.PHASE8D_ADMIN_DATABASE_URL;
    const parsedUrl = new URL(databaseUrl);
    const parsedAdminUrl = new URL(adminDatabaseUrl);
    assert.equal(parsedUrl.hostname, '127.0.0.1');
    assert.notEqual(parsedUrl.port, '3306');
    assert.equal(parsedAdminUrl.protocol, 'mysql:');
    assert.equal(parsedAdminUrl.username, 'root');
    assert.equal(parsedAdminUrl.hostname, '127.0.0.1');
    assert.equal(parsedAdminUrl.port, parsedUrl.port);
    assert.notEqual(parsedAdminUrl.port, '3306');
    assert.equal(parsedAdminUrl.pathname, parsedUrl.pathname);
    const adminConnection = await mariadb.createConnection(
      adminDatabaseUrl.replace(/^mysql:/u, 'mariadb:'),
    );
    const originalGlobalModeRow = (
      await adminConnection.query('SELECT @@GLOBAL.sql_mode AS sqlMode')
    )[0];
    const originalGlobalSqlMode = originalGlobalModeRow.sqlMode ?? '';
    const hostileGlobalSqlMode = originalGlobalSqlMode
      .split(',')
      .filter((mode) => mode && mode !== 'NO_BACKSLASH_ESCAPES')
      .concat('NO_BACKSLASH_ESCAPES')
      .join(',');
    let connection = null;
    const corpus = loadCorpus();

    try {
      await adminConnection.query('SET GLOBAL sql_mode = ?', [hostileGlobalSqlMode]);
      const hostileGlobalModeRow = (
        await adminConnection.query('SELECT @@GLOBAL.sql_mode AS sqlMode')
      )[0];
      assert.match(hostileGlobalModeRow.sqlMode, /NO_BACKSLASH_ESCAPES/u);

      connection = await mariadb.createConnection(
        databaseUrl.replace(/^mysql:/u, 'mariadb:'),
      );
      const firstRow = async (sql, values = []) =>
        (await connection.query(sql, values))[0];
      const inheritedMode = await firstRow('SELECT @@SESSION.sql_mode AS sqlMode');
      assert.match(inheritedMode.sqlMode, /NO_BACKSLASH_ESCAPES/u);

      await connection.query('DELETE FROM form_contract_versions');
      await connection.query('DELETE FROM templates');
      await connection.query(
        "DELETE FROM officials WHERE username LIKE 'phase8d-%' OR username = 'qllaw-bootstrap'",
      );

      await t.test('exact UTF-8 parameter and generated SQL literal are JSON-valid', async () => {
        const bm031 = corpus.find((entry) => entry.templateCode === 'BM-031');
        const sqlText = generateSql();
        const representation = bm031SqlRepresentation(sqlText);
        const modeNormalization = sqlText
          .split('\n')
          .find((line) => line.startsWith('SET SESSION sql_mode = TRIM'));
        assert.ok(modeNormalization);
        const modeBefore = await firstRow(
          'SELECT @@SESSION.sql_mode AS sqlMode',
        );
        assert.match(modeBefore.sqlMode, /NO_BACKSLASH_ESCAPES/u);
        await connection.query(modeNormalization);
        const modeAfter = await firstRow(
          'SELECT @@SESSION.sql_mode AS sqlMode',
        );
        assert.doesNotMatch(modeAfter.sqlMode, /NO_BACKSLASH_ESCAPES/u);
        const parameterized = await firstRow(
          'SELECT JSON_VALID(?) AS valid, CHAR_LENGTH(?) AS chars, OCTET_LENGTH(?) AS bytes, SHA2(?, 256) AS sha256',
          [bm031.draftText, bm031.draftText, bm031.draftText, bm031.draftText],
        );
        const literal = await firstRow(
          `SELECT JSON_VALID(${representation.token}) AS valid, CHAR_LENGTH(${representation.token}) AS chars, OCTET_LENGTH(${representation.token}) AS bytes, SHA2(${representation.token}, 256) AS sha256`,
        );
        assert.equal(parameterized.valid, 1);
        assert.equal(literal.valid, 1);
        assert.equal(literal.chars, parameterized.chars);
        assert.equal(literal.bytes, parameterized.bytes);
        assert.equal(literal.sha256, parameterized.sha256);
      });

      await t.test('synthetic failure through the official Prisma engine rolls back to 0/0', async () => {
        const failureSql = [
          'START TRANSACTION;',
          "INSERT INTO officials (username, full_name, role, is_active) VALUES ('phase8d-prisma-owner', 'Phase8D Prisma Owner', 'ADMIN', TRUE);",
          "SET @phase8d_owner := (SELECT id FROM officials WHERE username = 'phase8d-prisma-owner');",
          "INSERT INTO templates (template_code, template_name, is_active, render_scope, output_strategy, requires_review) VALUES ('PHASE8D-PRISMA-VALID', 'Valid', TRUE, 'CASE_LEVEL', 'ONE_FILE_PER_CASE', TRUE);",
          "INSERT INTO form_contract_versions (template_id, scope_key, version_no, status, revision, contract_hash, template_hash, draft_json, created_by_official_id) VALUES ((SELECT id FROM templates WHERE template_code = 'PHASE8D-PRISMA-VALID'), 'GLOBAL', 1, 'PUBLISHED', 0, 'c', 'h', '{}', @phase8d_owner);",
          "INSERT INTO templates (template_code, template_name, is_active, render_scope, output_strategy, requires_review) VALUES ('PHASE8D-PRISMA-INVALID', 'Invalid', TRUE, 'CASE_LEVEL', 'ONE_FILE_PER_CASE', TRUE);",
          "INSERT INTO form_contract_versions (template_id, scope_key, version_no, status, revision, contract_hash, template_hash, draft_json, created_by_official_id) VALUES ((SELECT id FROM templates WHERE template_code = 'PHASE8D-PRISMA-INVALID'), 'GLOBAL', 1, 'PUBLISHED', 0, 'c', 'h', '{invalid}', @phase8d_owner);",
          'COMMIT;',
        ].join('\n');
        const result = spawnSync(
          'pnpm',
          [
            '--filter',
            'api',
            'exec',
            'prisma',
            'db',
            'execute',
            '--stdin',
            '--schema',
            'prisma/schema.prisma',
          ],
          {
            cwd: REPO_ROOT,
            env: { ...process.env, DATABASE_URL: databaseUrl },
            input: failureSql,
            encoding: 'utf8',
            shell: process.platform === 'win32',
            windowsHide: true,
          },
        );
        assert.equal(result.status, 1);
        assert.match(
          `${result.stdout ?? ''} ${result.stderr ?? ''}`,
          /CONSTRAINT.*draft_json|draft_json.*failed/isu,
        );
        const rows = await firstRow(
          "SELECT (SELECT COUNT(*) FROM officials WHERE username = 'phase8d-prisma-owner') AS officials, (SELECT COUNT(*) FROM templates WHERE template_code LIKE 'PHASE8D-PRISMA-%') AS templates, (SELECT COUNT(*) FROM form_contract_versions AS version JOIN templates AS template ON template.id = version.template_id WHERE template.template_code LIKE 'PHASE8D-PRISMA-%') AS versions",
        );
        assert.deepEqual(JSON.parse(JSON.stringify(rows, jsonReplacer)), {
          officials: '0',
          templates: '0',
          versions: '0',
        });
      });

      const applyEnvironment = {
        DATABASE_URL: databaseUrl,
        QLLAW_BOOTSTRAP_ALLOW_DB_WRITE: '1',
      };
      const firstApply = runGenerator(['--apply'], applyEnvironment);
      assert.equal(
        firstApply.status,
        0,
        `official apply 1 failed: ${(firstApply.stderr || firstApply.stdout).slice(0, 500)}`,
      );
      const globalModeAfterApply = (
        await adminConnection.query('SELECT @@GLOBAL.sql_mode AS sqlMode')
      )[0];
      assert.equal(
        globalModeAfterApply.sqlMode,
        hostileGlobalModeRow.sqlMode,
        'official apply must normalize only its own session',
      );

      const counts = await firstRow(
        'SELECT (SELECT COUNT(*) FROM templates) AS templates, (SELECT COUNT(*) FROM form_contract_versions) AS versions, (SELECT COUNT(*) FROM (SELECT template_id, scope_key, version_no, COUNT(*) AS count FROM form_contract_versions GROUP BY template_id, scope_key, version_no HAVING count > 1) AS duplicate_keys) AS duplicateKeys',
      );
      assert.equal(Number(counts.templates), 213);
      assert.equal(Number(counts.versions), 213);
      assert.equal(Number(counts.duplicateKeys), 0);

      const rowsAfterFirst = await connection.query(
        "SELECT template.template_code AS templateCode, version.scope_key AS scopeKey, version.version_no AS versionNo, version.status, version.contract_hash AS contractHash, version.template_hash AS templateHash, JSON_UNQUOTE(JSON_EXTRACT(version.compiled_json, '$.contractHash')) AS embeddedContractHash, JSON_UNQUOTE(JSON_EXTRACT(version.compiled_json, '$.templateHash')) AS embeddedTemplateHash, SHA2(version.draft_json, 256) AS draftSha256, SHA2(version.compiled_json, 256) AS compiledSha256 FROM form_contract_versions AS version JOIN templates AS template ON template.id = version.template_id ORDER BY template.template_code",
      );
      assert.equal(rowsAfterFirst.length, 213);
      const expectedByCode = new Map(
        corpus.map((entry) => [entry.templateCode, entry.compiled]),
      );
      for (const row of rowsAfterFirst) {
        const expected = expectedByCode.get(row.templateCode);
        assert.ok(expected, row.templateCode);
        assert.equal(row.contractHash, expected.contractHash, row.templateCode);
        assert.equal(row.templateHash, expected.templateHash, row.templateCode);
        assert.equal(row.embeddedContractHash, expected.contractHash, row.templateCode);
        assert.equal(row.embeddedTemplateHash, expected.templateHash, row.templateCode);
      }

      const required = rowsAfterFirst.filter((row) =>
        ['BM-001', 'BM-002', 'BM-003'].includes(row.templateCode),
      );
      assert.deepEqual(required.map((row) => row.templateCode), [
        'BM-001',
        'BM-002',
        'BM-003',
      ]);
      assert.ok(
        required.every(
          (row) => row.scopeKey === 'GLOBAL' && row.status === 'PUBLISHED',
        ),
      );

      const semanticBefore = sha256(
        JSON.stringify(rowsAfterFirst, jsonReplacer),
      );
      const secondApply = runGenerator(['--apply'], applyEnvironment);
      assert.equal(
        secondApply.status,
        0,
        `official apply 2 failed: ${(secondApply.stderr || secondApply.stdout).slice(0, 500)}`,
      );
      const globalModeAfterSecondApply = (
        await adminConnection.query('SELECT @@GLOBAL.sql_mode AS sqlMode')
      )[0];
      assert.equal(
        globalModeAfterSecondApply.sqlMode,
        hostileGlobalModeRow.sqlMode,
        'official apply 2 must also leave the global mode byte-equivalent',
      );
      const rowsAfterSecond = await connection.query(
        "SELECT template.template_code AS templateCode, version.scope_key AS scopeKey, version.version_no AS versionNo, version.status, version.contract_hash AS contractHash, version.template_hash AS templateHash, JSON_UNQUOTE(JSON_EXTRACT(version.compiled_json, '$.contractHash')) AS embeddedContractHash, JSON_UNQUOTE(JSON_EXTRACT(version.compiled_json, '$.templateHash')) AS embeddedTemplateHash, SHA2(version.draft_json, 256) AS draftSha256, SHA2(version.compiled_json, 256) AS compiledSha256 FROM form_contract_versions AS version JOIN templates AS template ON template.id = version.template_id ORDER BY template.template_code",
      );
      const semanticAfter = sha256(
        JSON.stringify(rowsAfterSecond, jsonReplacer),
      );
      assert.equal(semanticAfter, semanticBefore, 'NO_SEMANTIC_CHANGE');
    } finally {
      await adminConnection.query('SET GLOBAL sql_mode = ?', [originalGlobalSqlMode]);
      if (connection) await connection.end();
      await adminConnection.end();
    }
  },
);
