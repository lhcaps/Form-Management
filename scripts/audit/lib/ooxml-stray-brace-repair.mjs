import PizZip from 'pizzip';

function wordTextRuns(runXml) {
  const runs = [];
  for (const match of runXml.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gu)) {
    runs.push(match[1] ?? '');
  }
  return runs;
}

function isStrayClosingBraceRun(runXml) {
  const text = wordTextRuns(runXml).join('');
  return text.trim() === '}';
}

export function repairStrayClosingBraceRunsInXml(xml) {
  let removedRuns = 0;
  const repairedXml = String(xml ?? '').replace(/<w:r\b[\s\S]*?<\/w:r>/gu, (runXml) => {
    if (!isStrayClosingBraceRun(runXml)) return runXml;
    removedRuns += 1;
    return '';
  });
  return {
    xml: repairedXml,
    removedRuns,
  };
}

export function repairStrayClosingBraceRunsInDocxBuffer(buffer) {
  const zip = new PizZip(buffer);
  const changes = [];

  for (const fileName of Object.keys(zip.files)) {
    if (!fileName.startsWith('word/') || !fileName.endsWith('.xml')) continue;
    const file = zip.file(fileName);
    if (!file) continue;
    const originalXml = file.asText();
    const repaired = repairStrayClosingBraceRunsInXml(originalXml);
    if (repaired.removedRuns === 0) continue;
    zip.file(fileName, repaired.xml);
    changes.push({
      fileName,
      removedRuns: repaired.removedRuns,
    });
  }

  return {
    buffer: zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' }),
    changes,
  };
}

export function repairRunPropertyPlaceholdersInXml(xml, placeholders) {
  const placeholderSet = new Set(placeholders);
  let removedPlaceholders = 0;
  const repairedXml = String(xml ?? '').replace(/<w:rPr\b[\s\S]*?<\/w:rPr>/gu, (runPropertyXml) =>
    runPropertyXml.replace(/\{\{\s*([^{}]+?)\s*\}\}/gu, (match, rawTag) => {
      const tag = String(rawTag ?? '').trim();
      if (!placeholderSet.has(tag)) return match;
      removedPlaceholders += 1;
      return '';
    }),
  );
  return {
    xml: repairedXml,
    removedPlaceholders,
  };
}

export function repairRunPropertyPlaceholdersInDocxBuffer(buffer, placeholders) {
  const zip = new PizZip(buffer);
  const changes = [];

  for (const fileName of Object.keys(zip.files)) {
    if (!fileName.startsWith('word/') || !fileName.endsWith('.xml')) continue;
    const file = zip.file(fileName);
    if (!file) continue;
    const originalXml = file.asText();
    const repaired = repairRunPropertyPlaceholdersInXml(originalXml, placeholders);
    if (repaired.removedPlaceholders === 0) continue;
    zip.file(fileName, repaired.xml);
    changes.push({
      fileName,
      removedPlaceholders: repaired.removedPlaceholders,
    });
  }

  return {
    buffer: zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' }),
    changes,
  };
}
