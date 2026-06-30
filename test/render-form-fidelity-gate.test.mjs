import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import PizZip from 'pizzip';

const ROOT = process.cwd();
const SCRIPT = join(ROOT, 'scripts', 'audit', 'render-form-fidelity-gate.mjs');

function makeDocx(documentXml) {
  const zip = new PizZip();
  zip.file(
    '[Content_Types].xml',
    [
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
      '<Default Extension="xml" ContentType="application/xml"/>',
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>',
      '</Types>',
    ].join(''),
  );
  zip.file(
    '_rels/.rels',
    [
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>',
      '</Relationships>',
    ].join(''),
  );
  zip.file(
    'word/_rels/document.xml.rels',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>',
  );
  zip.file('word/document.xml', documentXml);
  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

function writeJson(filePath, value) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function fixtureRoot({ includeBodyBinding = true } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'render-fidelity-gate-'));
  const templateCode = 'BM-999';
  const docxDir = join(root, 'storage', 'templates', 'normalized-docx', templateCode);
  const contractDir = join(root, 'docs', 'audit', 'docx', 'contracts', 'locked');
  mkdirSync(docxDir, { recursive: true });
  mkdirSync(contractDir, { recursive: true });

  const documentXml = [
    '<w:document>',
    '<w:body>',
    '<w:p><w:r><w:t>QUYET DINH {{agency.name}}</w:t></w:r></w:p>',
    '<w:p><w:r><w:t>Ho ten: {{person.fullName}}</w:t></w:r></w:p>',
    '<w:p><w:r><w:t>Noi nhan: {{recipients.personLine}}</w:t></w:r></w:p>',
    '</w:body>',
    '</w:document>',
  ].join('');
  writeFileSync(
    join(docxDir, `${templateCode}_normalized.docx`),
    makeDocx(documentXml),
  );

  const fields = [
    {
      path: 'agency.name',
      type: 'string',
      label: 'Co quan',
      source: 'agencyConfig',
      required: true,
      reviewRequired: false,
    },
    {
      path: 'person.fullName',
      type: 'string',
      label: 'Ho ten',
      source: 'manual',
      required: true,
      reviewRequired: false,
    },
  ];
  const slots = [
    { slotId: 'agency.name', label: 'Co quan', slotType: 'text' },
    { slotId: 'person.fullName', label: 'Ho ten', slotType: 'text' },
  ];
  const bindings = [
    {
      slotId: 'agency.name',
      from: 'agency.name',
      transform: 'identity',
      fallback: '',
      reviewRequired: false,
    },
    {
      slotId: 'person.fullName',
      from: 'person.fullName',
      transform: 'identity',
      fallback: '',
      reviewRequired: false,
    },
  ];

  if (includeBodyBinding) {
    fields.push({
      path: 'recipients.personLine',
      type: 'string',
      label: 'Noi nhan',
      source: 'manual',
      required: false,
      reviewRequired: false,
    });
    slots.push({ slotId: 'recipients.personLine', label: 'Noi nhan', slotType: 'text' });
    bindings.push({
      slotId: 'recipients.personLine',
      from: 'recipients.personLine',
      transform: 'identity',
      fallback: '',
      reviewRequired: false,
    });
  }

  writeJson(join(contractDir, `${templateCode}__fixture.contract.locked.json`), {
    sourceId: `${templateCode}__fixture`,
    templateCode,
    templateTitle: 'Fixture render fidelity',
    status: 'locked',
    canonicalFields: fields,
    docxSlots: slots,
    renderBindings: bindings,
  });

  return { root, templateCode };
}

function splitAnchorFixtureRoot() {
  const root = mkdtempSync(join(tmpdir(), 'render-fidelity-gate-split-anchor-'));
  const templateCode = 'BM-998';
  const docxDir = join(root, 'storage', 'templates', 'normalized-docx', templateCode);
  const contractDir = join(root, 'docs', 'audit', 'docx', 'contracts', 'locked');
  mkdirSync(docxDir, { recursive: true });
  mkdirSync(contractDir, { recursive: true });

  const documentXml = [
    '<w:document>',
    '<w:body>',
    '<w:p><w:r><w:t>Can cu {{legalBasis.article}} cua Bo luat To tung hinh su.</w:t></w:r></w:p>',
    '</w:body>',
    '</w:document>',
  ].join('');
  writeFileSync(
    join(docxDir, `${templateCode}_normalized.docx`),
    makeDocx(documentXml),
  );

  writeJson(join(contractDir, `${templateCode}__fixture.contract.locked.json`), {
    sourceId: `${templateCode}__fixture`,
    templateCode,
    templateTitle: 'Fixture split anchor fidelity',
    status: 'locked',
    canonicalFields: [
      {
        path: 'legalBasis.article',
        type: 'string',
        label: 'Dieu luat',
        source: 'manual',
        required: true,
        reviewRequired: false,
      },
    ],
    docxSlots: [
      { slotId: 'legalBasis.article', label: 'Dieu luat', slotType: 'text' },
    ],
    renderBindings: [
      {
        slotId: 'legalBasis.article',
        from: 'legalBasis.article',
        transform: 'identity',
        fallback: '',
        reviewRequired: false,
      },
    ],
  });

  return { root, templateCode };
}

test('render fidelity gate passes when every DOCX placeholder has a binding', () => {
  const { root, templateCode } = fixtureRoot();
  try {
    assert.equal(existsSync(SCRIPT), true, 'render fidelity gate script must exist');
    execFileSync(process.execPath, [SCRIPT, '--root', root, '--template-code', templateCode], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
    });

    const reportPath = join(
      root,
      'docs',
      'audit',
      'per-form-render-accurate',
      templateCode,
      'render-diff.latest.json',
    );
    const report = JSON.parse(readFileSync(reportPath, 'utf8'));
    assert.equal(report.status, 'PASS');
    assert.equal(report.textFidelity.unreplacedPlaceholders, 0);
    assert.deepEqual(report.bindingFidelity.templatePlaceholdersWithoutBindings, []);
    assert.equal(report.structureFidelity.status, 'PASS');
    assert.equal(report.literalFidelity.undefinedOrNullLiterals, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('render fidelity gate preserves static text split around rendered values', () => {
  const { root, templateCode } = splitAnchorFixtureRoot();
  try {
    const result = spawnSync(
      process.execPath,
      [SCRIPT, '--root', root, '--template-code', templateCode],
      { cwd: ROOT, encoding: 'utf8' },
    );
    assert.equal(result.status, 0, result.stderr || result.stdout);

    const reportPath = join(
      root,
      'docs',
      'audit',
      'per-form-render-accurate',
      templateCode,
      'render-diff.latest.json',
    );
    const report = JSON.parse(readFileSync(reportPath, 'utf8'));
    assert.equal(report.status, 'PASS');
    assert.equal(report.textFidelity.missingStaticAnchors, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('render fidelity gate fails and reports DOCX placeholders missing bindings', () => {
  const { root, templateCode } = fixtureRoot({ includeBodyBinding: false });
  try {
    const result = spawnSync(
      process.execPath,
      [SCRIPT, '--root', root, '--template-code', templateCode],
      { cwd: ROOT, encoding: 'utf8' },
    );
    assert.equal(result.status, 1);

    const reportPath = join(
      root,
      'docs',
      'audit',
      'per-form-render-accurate',
      templateCode,
      'render-diff.latest.json',
    );
    const report = JSON.parse(readFileSync(reportPath, 'utf8'));
    assert.equal(report.status, 'FAIL');
    assert.deepEqual(report.bindingFidelity.templatePlaceholdersWithoutBindings, [
      'recipients.personLine',
    ]);
    assert.equal(report.nextAction, 'Repair template placeholders without bindings before claiming render fidelity.');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
