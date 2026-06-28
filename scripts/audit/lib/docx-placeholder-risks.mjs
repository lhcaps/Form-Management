import { existsSync, readFileSync } from 'node:fs';
import PizZip from 'pizzip';

export function decodeXml(text) {
  return String(text ?? '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

export function stripXml(xml) {
  return decodeXml(String(xml ?? '').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

export function contextAround(text, needle, radius = 120) {
  const index = text.indexOf(needle);
  if (index < 0) return '';
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + needle.length + radius);
  return text.slice(start, end).replace(/\s+/g, ' ').trim();
}

export function contextsAroundAll(text, needle, radius = 120, limit = 30) {
  const contexts = [];
  let index = 0;

  while ((index = text.indexOf(needle, index)) >= 0 && contexts.length < limit) {
    const start = Math.max(0, index - radius);
    const end = Math.min(text.length, index + needle.length + radius);
    contexts.push(text.slice(start, end).replace(/\s+/g, ' ').trim());
    index += needle.length;
  }

  return contexts;
}

const SEMANTIC_ANCHORS = [
  ['fullName', /họ\s*tên/i],
  ['alias', /tên\s*gọi\s*khác/i],
  ['job', /nghề\s*nghiệp/i],
  ['idNumber', /cmnd|cccd|hộ\s*chiếu/i],
  ['permanentAddress', /nơi\s*thường\s*trú/i],
  ['temporaryAddress', /nơi\s*tạm\s*trú/i],
  ['currentAddress', /nơi\s*ở\s*hiện\s*tại/i],
  ['recipientFooter', /nơi\s*nhận/i],
  ['signature', /ký,\s*ghi\s*rõ\s*họ\s*tên|đóng\s*dấu/i],
  ['prosecutor', /kiểm\s*sát\s*viên/i],
  ['committee', /ủy\s*ban\s*nhân\s*dân|y\s*ban\s*nhân\s*dân/i],
  ['decisionBasis', /căn\s*cứ\s*quyết\s*định|xét\s*thấy/i],
  ['assignment', /phân\s*công/i],
  ['asset', /tài\s*sản|kê\s*biên|bảo\s*quản/i],
  ['documentNumber', /số:\s*…|số\s*…|số\s*văn\s*bản/i],
  ['dateLine', /ngày\s*…\s*tháng\s*…\s*năm|ngày\s*tháng\s*năm/i],
];

export function semanticAnchors(context) {
  return SEMANTIC_ANCHORS
    .filter(([, pattern]) => pattern.test(context))
    .map(([name]) => name);
}

export function genericNumberedPlaceholder(path) {
  return /(?:personLine|decisionLine|fullDocumentCode)\d+$/u.test(path);
}

export function duplicateSemanticRisk(item) {
  if ((item.count ?? 0) <= 1) return null;
  if (item.placeholder.startsWith('agency.')) return null;

  const occurrenceContexts = item.occurrenceContexts?.length
    ? item.occurrenceContexts
    : [item.context].filter(Boolean);
  const anchors = [
    ...new Set(occurrenceContexts.flatMap((context) => semanticAnchors(context))),
  ].sort();

  const highVolumeGeneric =
    genericNumberedPlaceholder(item.placeholder) && item.count >= 3;
  const mixedContextGeneric =
    genericNumberedPlaceholder(item.placeholder) && anchors.length >= 2;

  if (!highVolumeGeneric && !mixedContextGeneric) {
    return null;
  }

  return {
    placeholder: item.placeholder,
    count: item.count,
    severity: 'HIGH',
    reason:
      'The same numbered DOCX placeholder appears in multiple visible semantic contexts; renormalize the DOCX placeholders before contract add/relink/remove.',
    anchors,
    occurrenceContexts,
  };
}

export function buildPlaceholderRisks(items) {
  return {
    duplicateSemantic: items
      .map(duplicateSemanticRisk)
      .filter(Boolean),
  };
}

export function emptyDocxPlaceholderEvidence(normalizedPath, error) {
  return {
    normalizedPath,
    exists: error !== 'NORMALIZED_DOCX_MISSING',
    error,
    placeholders: {
      total: 0,
      unique: [],
      duplicates: [],
      items: [],
      risks: { duplicateSemantic: [] },
    },
  };
}

export function extractDocxPlaceholdersFromFile(docxPath) {
  if (!existsSync(docxPath)) {
    return emptyDocxPlaceholderEvidence(docxPath, 'NORMALIZED_DOCX_MISSING');
  }

  try {
    const zip = new PizZip(readFileSync(docxPath));
    const documentXml = zip.file('word/document.xml')?.asText() ?? '';
    const plainText = stripXml(documentXml);
    const all = [...documentXml.matchAll(/\{\{([^}]+)\}\}/g)].map((match) =>
      match[1].trim(),
    );
    const counts = new Map();
    for (const placeholder of all) {
      counts.set(placeholder, (counts.get(placeholder) ?? 0) + 1);
    }
    const unique = [...counts.keys()].sort();
    const items = unique.map((placeholder) => {
      const token = `{{${placeholder}}}`;
      const plainContexts = contextsAroundAll(plainText, token);
      const occurrenceContexts = plainContexts.length
        ? plainContexts
        : contextsAroundAll(decodeXml(documentXml), token);

      return {
        placeholder,
        count: counts.get(placeholder),
        context:
          occurrenceContexts[0] ||
          contextAround(plainText, token) ||
          contextAround(decodeXml(documentXml), token),
        occurrenceContexts,
      };
    });

    return {
      normalizedPath: docxPath,
      exists: true,
      error: null,
      placeholders: {
        total: all.length,
        unique,
        duplicates: items
          .filter((item) => item.count > 1)
          .map((item) => ({
            placeholder: item.placeholder,
            count: item.count,
          })),
        items,
        risks: buildPlaceholderRisks(items),
      },
    };
  } catch (error) {
    return emptyDocxPlaceholderEvidence(docxPath, error.message);
  }
}
