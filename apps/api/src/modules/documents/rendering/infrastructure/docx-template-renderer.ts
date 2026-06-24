import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';

export type DocxPackageIntegrity = Readonly<{
  status: 'pass' | 'fail';
  missingParts: readonly string[];
  changedPreservedParts: readonly string[];
}>;

const MUTABLE_PACKAGE_PARTS = new Set([
  '[Content_Types].xml',
  'word/document.xml',
]);

/**
 * Renders bindings into a complete DOCX package without discarding OOXML parts.
 */
export function renderDocxTemplate(
  templateBuffer: Buffer,
  bindings: ReadonlyMap<string, unknown>,
): Buffer {
  const zip = new PizZip(templateBuffer);
  const document = new Docxtemplater(zip, {
    delimiters: { start: '{{', end: '}}' },
    linebreaks: true,
    paragraphLoop: true,
    // Placeholders without a corresponding binding should resolve to an
    // empty string rather than the literal "undefined" (docxtemplater's
    // default). This is what the contract-render-engine spec asserts
    // (see docxtemplater-contract-render-engine.spec.ts:84).
    nullGetter: () => '',
  });
  const data: Record<string, unknown> = {};

  for (const [key, value] of bindings) {
    data[key] = value ?? '';
  }

  document.render(data);

  return document.getZip().generate({ type: 'nodebuffer' });
}

/**
 * Confirms that rendering did not remove or mutate template package parts.
 */
export function auditDocxPackageIntegrity(
  templateBuffer: Buffer,
  renderedBuffer: Buffer,
): DocxPackageIntegrity {
  const templateZip = new PizZip(templateBuffer);
  const renderedZip = new PizZip(renderedBuffer);
  const templateParts = Object.values(templateZip.files).filter(
    (part) => !part.dir,
  );
  const missingParts: string[] = [];
  const changedPreservedParts: string[] = [];

  for (const templatePart of templateParts) {
    const renderedPart = renderedZip.file(templatePart.name);

    if (!renderedPart) {
      missingParts.push(templatePart.name);
      continue;
    }

    if (
      !MUTABLE_PACKAGE_PARTS.has(templatePart.name) &&
      !templatePart.asNodeBuffer().equals(renderedPart.asNodeBuffer())
    ) {
      changedPreservedParts.push(templatePart.name);
    }
  }

  return Object.freeze({
    status:
      missingParts.length === 0 && changedPreservedParts.length === 0
        ? 'pass'
        : 'fail',
    missingParts: Object.freeze(missingParts),
    changedPreservedParts: Object.freeze(changedPreservedParts),
  });
}
