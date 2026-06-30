import assert from 'node:assert/strict';
import { test } from 'node:test';
import PizZip from 'pizzip';
import {
  repairRunPropertyPlaceholdersInDocxBuffer,
  repairRunPropertyPlaceholdersInXml,
  repairStrayClosingBraceRunsInDocxBuffer,
  repairStrayClosingBraceRunsInXml,
} from '../scripts/audit/lib/ooxml-stray-brace-repair.mjs';

function makeDocx(documentXml) {
  const zip = new PizZip();
  zip.file('[Content_Types].xml', '<Types/>');
  zip.file('word/document.xml', documentXml);
  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

test('repairStrayClosingBraceRunsInXml removes only standalone closing-brace runs', () => {
  const xml = [
    '<w:p>',
    '<w:r><w:t>{{agency.name}}</w:t></w:r>',
    '<w:r><w:t>}</w:t></w:r>',
    '<w:r><w:t>keep } inside text</w:t></w:r>',
    '</w:p>',
  ].join('');

  const repaired = repairStrayClosingBraceRunsInXml(xml);

  assert.equal(repaired.removedRuns, 1);
  assert.equal(repaired.xml.includes('<w:t>}</w:t>'), false);
  assert.equal(repaired.xml.includes('{{agency.name}}'), true);
  assert.equal(repaired.xml.includes('keep } inside text'), true);
});

test('repairStrayClosingBraceRunsInDocxBuffer repairs Word XML parts', () => {
  const buffer = makeDocx(
    '<w:document><w:body><w:p><w:r><w:t>{{person.fullName}}</w:t></w:r><w:r><w:t>}</w:t></w:r></w:p></w:body></w:document>',
  );

  const repaired = repairStrayClosingBraceRunsInDocxBuffer(buffer);
  const zip = new PizZip(repaired.buffer);
  const documentXml = zip.file('word/document.xml').asText();

  assert.deepEqual(repaired.changes, [{ fileName: 'word/document.xml', removedRuns: 1 }]);
  assert.equal(documentXml.includes('<w:t>}</w:t>'), false);
  assert.equal(documentXml.includes('{{person.fullName}}'), true);
});

test('repairRunPropertyPlaceholdersInXml removes placeholders only from run properties', () => {
  const xml = [
    '<w:p>',
    '<w:r><w:rPr>{{agency.nameUpper}}<w:b/></w:rPr><w:t>2</w:t></w:r>',
    '<w:r><w:t>{{agency.nameUpper}}</w:t></w:r>',
    '</w:p>',
  ].join('');

  const repaired = repairRunPropertyPlaceholdersInXml(xml, ['agency.nameUpper']);

  assert.equal(repaired.removedPlaceholders, 1);
  assert.equal(repaired.xml.includes('<w:rPr>{{agency.nameUpper}}'), false);
  assert.equal(repaired.xml.includes('<w:t>{{agency.nameUpper}}</w:t>'), true);
});

test('repairRunPropertyPlaceholdersInDocxBuffer repairs Word XML parts', () => {
  const buffer = makeDocx(
    '<w:document><w:body><w:p><w:r><w:rPr>{{agency.nameUpper}}<w:b/></w:rPr><w:t>2</w:t></w:r></w:p></w:body></w:document>',
  );

  const repaired = repairRunPropertyPlaceholdersInDocxBuffer(buffer, ['agency.nameUpper']);
  const zip = new PizZip(repaired.buffer);
  const documentXml = zip.file('word/document.xml').asText();

  assert.deepEqual(repaired.changes, [
    { fileName: 'word/document.xml', removedPlaceholders: 1 },
  ]);
  assert.equal(documentXml.includes('{{agency.nameUpper}}'), false);
  assert.equal(documentXml.includes('<w:t>2</w:t>'), true);
});
