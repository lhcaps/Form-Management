// DOCX ZIP read/write helpers backed by PizZip.
import PizZip from 'pizzip';

export function readDocxParts(docxBuffer) {
  const zip = new PizZip(docxBuffer);
  const parts = [];
  for (const [name, entry] of Object.entries(zip.files)) {
    if (!/\.xml$/.test(name)) continue;
    parts.push({ name, xml: entry.asText() });
  }
  return { parts, zip };
}

export function writeDocxPart(zip, partName, xml) {
  zip.file(partName, xml);
}

export function generateDocxBuffer(zip) {
  return zip.generate({ type: 'nodebuffer' });
}

export function replaceDocxPart(docxBuffer, partName, xml) {
  const zip = new PizZip(docxBuffer);
  const existing = zip.file(partName);
  if (!existing) {
    throw new Error('DOCX is missing ' + partName + '; cannot replace.');
  }
  zip.file(partName, xml);
  return zip.generate({ type: 'nodebuffer' });
}

export function assertDocxWellFormed(docxBuffer) {
  let zip;
  try {
    zip = new PizZip(docxBuffer);
  } catch (err) {
    throw new Error('ZIP_INVALID: ' + (err instanceof Error ? err.message : String(err)));
  }
  const required = ['[Content_Types].xml', 'word/document.xml'];
  for (const partName of required) {
    if (!zip.file(partName)) {
      throw new Error('PARTS_MISSING: DOCX is missing required part ' + partName + '.');
    }
  }
}
