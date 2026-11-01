#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const requireFromApi = createRequire(join(REPO_ROOT, 'apps', 'api', 'package.json'));
const mariadb = requireFromApi('mariadb');

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const jsonReplacer = (_key, value) =>
  typeof value === 'bigint' ? value.toString() : value;

function loadBm031() {
  const lockedDir = join(
    REPO_ROOT,
    'docs',
    'audit',
    'docx',
    'contracts',
    'locked',
  );
  const lockedName = readdirSync(lockedDir).find(
    (name) =>
      name.startsWith('BM-031') && name.endsWith('.contract.locked.json'),
  );
  if (!lockedName) throw new Error('BM-031 locked contract not found');

  const lockedPath = join(lockedDir, lockedName);
  const compiledPath = join(
    REPO_ROOT,
    'docs',
    'audit',
    'docx',
    'compiled-v2',
    'BM-031.compiled.json',
  );
  const lockedBytes = readFileSync(lockedPath);
  const compiledBytes = readFileSync(compiledPath);
  const locked = JSON.parse(lockedBytes.toString('utf8'));
  const compiled = JSON.parse(compiledBytes.toString('utf8'));
  const sourceId =
    locked.sourceId ||
    `BM-031__${sha256(Buffer.from(lockedName, 'utf8')).slice(0, 12)}`;
  const draft = {
    schemaVersion: locked.schemaVersion || '1.0',
    sourceId,
    templateCode: locked.templateCode || 'BM-031',
    templateTitle: locked.templateTitle || 'BM-031',
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

  return {
    lockedPath,
    compiledPath,
    lockedBytes,
    compiledBytes,
    compiled,
    draftText: JSON.stringify(draft),
  };
}

function legacySqlLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function fixedSqlLiteral(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}

function firstByteDifference(expected, actual) {
  const limit = Math.max(expected.length, actual.length);
  for (let index = 0; index < limit; index += 1) {
    if (expected[index] !== actual[index]) return index;
  }
  return null;
}

async function firstRow(connection, sql, values = []) {
  const rows = await connection.query(sql, values);
  return rows[0];
}

async function probeParameterizedInsert(connection, corpus) {
  await connection.beginTransaction();
  try {
    await connection.query(
      "INSERT INTO officials (username, full_name, role, is_active) VALUES ('phase8d-param-owner', 'Phase8D Param Owner', 'ADMIN', TRUE) ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)",
    );
    const owner = await firstRow(
      connection,
      "SELECT id FROM officials WHERE username = 'phase8d-param-owner'",
    );
    await connection.query(
      "INSERT INTO templates (template_code, template_name, is_active, render_scope, output_strategy, requires_review) VALUES ('PHASE8D-PARAM', 'Phase8D Param', TRUE, 'CASE_LEVEL', 'ONE_FILE_PER_CASE', TRUE)",
    );
    await connection.query(
      "INSERT INTO form_contract_versions (template_id, scope_key, version_no, status, revision, contract_hash, template_hash, draft_json, compiled_json, created_by_official_id) VALUES ((SELECT id FROM templates WHERE template_code = 'PHASE8D-PARAM'), 'GLOBAL', 1, 'PUBLISHED', 0, ?, ?, ?, ?, ?)",
      [
        corpus.compiled.contractHash,
        corpus.compiled.templateHash,
        corpus.draftText,
        JSON.stringify(corpus.compiled),
        owner.id,
      ],
    );
    const stored = await firstRow(
      connection,
      "SELECT JSON_VALID(draft_json) AS jsonValid, CHAR_LENGTH(draft_json) AS charLength, OCTET_LENGTH(draft_json) AS octetLength, SHA2(draft_json, 256) AS sha256 FROM form_contract_versions WHERE template_id = (SELECT id FROM templates WHERE template_code = 'PHASE8D-PARAM')",
    );
    return { ok: true, ...stored };
  } catch (error) {
    return {
      ok: false,
      code: error.code ?? null,
      errno: error.errno ?? null,
      sqlState: error.sqlState ?? null,
    };
  } finally {
    await connection.rollback();
  }
}

async function probeLiteralInsert(connection, corpus, literal) {
  await connection.beginTransaction();
  try {
    await connection.query(
      "INSERT INTO officials (username, full_name, role, is_active) VALUES ('phase8d-literal-owner', 'Phase8D Literal Owner', 'ADMIN', TRUE) ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)",
    );
    const owner = await firstRow(
      connection,
      "SELECT id FROM officials WHERE username = 'phase8d-literal-owner'",
    );
    await connection.query(
      "INSERT INTO templates (template_code, template_name, is_active, render_scope, output_strategy, requires_review) VALUES ('PHASE8D-LITERAL', 'Phase8D Literal', TRUE, 'CASE_LEVEL', 'ONE_FILE_PER_CASE', TRUE)",
    );
    await connection.query(
      `INSERT INTO form_contract_versions (template_id, scope_key, version_no, status, revision, contract_hash, template_hash, draft_json, compiled_json, created_by_official_id) VALUES ((SELECT id FROM templates WHERE template_code = 'PHASE8D-LITERAL'), 'GLOBAL', 1, 'PUBLISHED', 0, ?, ?, ${literal}, ?, ?)`,
      [
        corpus.compiled.contractHash,
        corpus.compiled.templateHash,
        JSON.stringify(corpus.compiled),
        owner.id,
      ],
    );
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      code: error.code ?? null,
      errno: error.errno ?? null,
      sqlState: error.sqlState ?? null,
      draftJsonConstraint: /draft_json/i.test(error.message),
    };
  } finally {
    await connection.rollback();
  }
}

async function main() {
  const databaseUrl =
    process.env.PHASE8D_DATABASE_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[FAIL] PHASE8D_DATABASE_URL or DATABASE_URL is required');
    process.exit(2);
  }

  const corpus = loadBm031();
  const canonicalBytes = Buffer.from(corpus.draftText, 'utf8');
  const legacyLiteral = legacySqlLiteral(corpus.draftText);
  const fixedLiteral = fixedSqlLiteral(corpus.draftText);
  const driverUrl = databaseUrl.replace(/^mysql:/, 'mariadb:');
  const connection = await mariadb.createConnection(driverUrl);

  try {
    const session = await firstRow(
      connection,
      'SELECT @@autocommit AS autocommit, @@in_transaction AS inTransaction, @@sql_mode AS sqlMode, @@character_set_client AS characterSetClient, @@character_set_connection AS characterSetConnection, @@character_set_results AS characterSetResults, @@collation_connection AS collationConnection, @@max_allowed_packet AS maxAllowedPacket',
    );
    const parameterizedSelect = await firstRow(
      connection,
      'SELECT JSON_VALID(?) AS jsonValid, CHAR_LENGTH(?) AS charLength, OCTET_LENGTH(?) AS octetLength, SHA2(?, 256) AS sha256',
      [
        corpus.draftText,
        corpus.draftText,
        corpus.draftText,
        corpus.draftText,
      ],
    );
    const legacyLiteralSelect = await firstRow(
      connection,
      `SELECT JSON_VALID(${legacyLiteral}) AS jsonValid, CHAR_LENGTH(${legacyLiteral}) AS charLength, OCTET_LENGTH(${legacyLiteral}) AS octetLength, SHA2(${legacyLiteral}, 256) AS sha256, ${legacyLiteral} AS decoded`,
    );
    const fixedLiteralSelect = await firstRow(
      connection,
      `SELECT JSON_VALID(${fixedLiteral}) AS jsonValid, CHAR_LENGTH(${fixedLiteral}) AS charLength, OCTET_LENGTH(${fixedLiteral}) AS octetLength, SHA2(${fixedLiteral}, 256) AS sha256`,
    );
    const decodedBytes = Buffer.from(
      String(legacyLiteralSelect.decoded),
      'utf8',
    );
    const firstDifferingByte = firstByteDifference(
      canonicalBytes,
      decodedBytes,
    );
    const contextStart = Math.max(0, (firstDifferingByte ?? 0) - 12);
    const contextEnd = Math.min(
      Math.max(canonicalBytes.length, decodedBytes.length),
      (firstDifferingByte ?? 0) + 20,
    );
    const parameterizedInsert = await probeParameterizedInsert(
      connection,
      corpus,
    );
    const legacyLiteralInsert = await probeLiteralInsert(
      connection,
      corpus,
      legacyLiteral,
    );
    const fixedLiteralInsert = await probeLiteralInsert(
      connection,
      corpus,
      fixedLiteral,
    );
    const rowsAfterRollback = await firstRow(
      connection,
      "SELECT (SELECT COUNT(*) FROM officials WHERE username LIKE 'phase8d-%-owner') AS officials, (SELECT COUNT(*) FROM templates WHERE template_code LIKE 'PHASE8D-%') AS templates, (SELECT COUNT(*) FROM form_contract_versions AS version JOIN templates AS template ON template.id = version.template_id WHERE template.template_code LIKE 'PHASE8D-%') AS versions",
    );

    await connection.query(
      "SET SESSION sql_mode = CONCAT(@@SESSION.sql_mode, ',NO_BACKSLASH_ESCAPES')",
    );
    const noBackslashEscapesProbe = await firstRow(
      connection,
      `SELECT @@sql_mode AS sqlMode, JSON_VALID(${legacyLiteral}) AS jsonValid, CHAR_LENGTH(${legacyLiteral}) AS charLength, OCTET_LENGTH(${legacyLiteral}) AS octetLength, SHA2(${legacyLiteral}, 256) AS sha256`,
    );

    const output = {
      source: {
        lockedPath: corpus.lockedPath,
        lockedFileSha256: sha256(corpus.lockedBytes),
        compiledPath: corpus.compiledPath,
        compiledFileSha256: sha256(corpus.compiledBytes),
      },
      session,
      canonical: {
        sha256: sha256(canonicalBytes),
        charLength: corpus.draftText.length,
        octetLength: canonicalBytes.length,
        backslashCount: (corpus.draftText.match(/\\/g) ?? []).length,
        escapedDoubleQuoteCount: (corpus.draftText.match(/\\"/g) ?? [])
          .length,
      },
      parameterizedSelect,
      legacyLiteralSelect: {
        jsonValid: legacyLiteralSelect.jsonValid,
        charLength: legacyLiteralSelect.charLength,
        octetLength: legacyLiteralSelect.octetLength,
        sha256: legacyLiteralSelect.sha256,
        decodedSha256: sha256(decodedBytes),
      },
      fixedLiteralSelect,
      firstDifferingByte,
      sanitizedDiff: {
        start: contextStart,
        end: contextEnd,
        canonicalHex: canonicalBytes
          .subarray(contextStart, contextEnd)
          .toString('hex'),
        decodedHex: decodedBytes
          .subarray(contextStart, contextEnd)
          .toString('hex'),
      },
      parameterizedInsert,
      legacyLiteralInsert,
      fixedLiteralInsert,
      rowsAfterRollback,
      noBackslashEscapesProbe,
    };
    console.log(JSON.stringify(output, jsonReplacer, 2));
  } finally {
    await connection.end();
  }
}

await main();
