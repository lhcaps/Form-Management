// Family B transformer - standalone VML textbox carrying model-number.
//
// Detection: the document contains a <w:pict> or <w:drawing> whose
// descendant chain contains a <v:textbox> or <w:txbxContent> that
// carries the form's model-number token.
//
// Action:
//   1. Locate every <w:pict> AND every <w:drawing> that carries the
//      model-number textbox (some forms put the text in <w:pict> for
//      VML legacy, others in <w:drawing> for DrawingML).
//   2. Extract the runs inside any <w:txbxContent> preserving rPr.
//   3. Delete the entire <w:pict>/<w:drawing> block.
//   4. Insert an in-flow right-aligned paragraph (with the same runs
//      and properties) at the top of the body.

const PICT_RE = /<w:pict\b[\s\S]*?<\/w:pict>/g;
const DRAWING_RE = /<w:drawing\b[\s\S]*?<\/w:drawing>/g;
const TEXTBOX_CONTENT_RE = /<w:txbxContent\b[\s\S]*?<\/w:txbxContent>/g;
const PARAGRAPH_RE = /<w:p\b[\s\S]*?<\/w:p>/g;
const RUN_RE = /<w:r\b[\s\S]*?<\/w:r>/g;
const BODY_OPEN_RE = /<w:body\b[^>]*>/;
const TEXT_RE = /<w:t[^>]*>([^<]*)<\/w:t>/;

function extractRuns(textboxContentXml) {
  const out = [];
  let m;
  while ((m = RUN_RE.exec(textboxContentXml)) !== null) {
    const runXml = m[0];
    const tm = runXml.match(TEXT_RE);
    if (!tm) continue;
    out.push({
      text: tm[1],
      rPr: runXml.match(/<w:rPr\b[\s\S]*?<\/w:rPr>/)?.[0] ?? '<w:rPr/>',
    });
  }
  return out;
}

function extractParagraphs(textboxContentXml) {
  return [...textboxContentXml.matchAll(PARAGRAPH_RE)]
    .map((match) => {
      const paragraphXml = match[0];
      const runs = extractRuns(paragraphXml);
      if (runs.length === 0) return null;
      return {
        runs,
        pPr: paragraphXml.match(/<w:pPr\b[\s\S]*?<\/w:pPr>/)?.[0] ?? '<w:pPr/>',
      };
    })
    .filter(Boolean);
}

function buildRightAlignedParagraph(paragraph) {
  const runs = paragraph.runs;
  const originalPPr = paragraph.pPr ?? '<w:pPr/>';
  const pPrWithoutAlignment = originalPPr.replace(/<w:jc\b[^>]*\/?>(?:<\/w:jc>)?/g, '');
  const pPrInner = pPrWithoutAlignment
    .replace(/^<w:pPr>/, '')
    .replace(/<\/w:pPr>$/, '');
  if (runs.length === 0) {
    return `<w:p><w:pPr>${pPrInner}<w:jc w:val="right"/></w:pPr></w:p>`;
  }
  const inner = runs
    .map((run) => {
      const rPr = run.rPr ?? '<w:rPr/>';
      const text = String(run.text ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<w:r>${rPr}<w:t xml:space="preserve">${text}</w:t></w:r>`;
    })
    .join('');
  return `<w:p><w:pPr>${pPrInner}<w:jc w:val="right"/></w:pPr>${inner}</w:p>`;
}

function containerHasToken(containerXml, modelNumberToken) {
  const textboxMatch = containerXml.match(TEXTBOX_CONTENT_RE);
  if (!textboxMatch) return null;
  const textboxXml = textboxMatch[0];
  const text = textboxXml.replace(/<[^>]+>/g, '');
  if (!modelNumberToken || text.includes(modelNumberToken)) {
    const paragraphs = extractParagraphs(textboxXml);
    return { textboxXml, paragraphs, runs: paragraphs.flatMap((paragraph) => paragraph.runs) };
  }
  return null;
}

export function transformFamilyB(documentXml, options = {}) {
  const modelNumberToken = options.modelNumberToken ?? null;

  let removedContainers = 0;
  let preservedRuns = 0;
  let topParagraphs = null;

  // Pass 1: remove all <w:pict> blocks carrying the model-number.
  let intermediate = documentXml.replace(PICT_RE, (pictXml) => {
    const found = containerHasToken(pictXml, modelNumberToken);
    if (!found) return pictXml;
    preservedRuns += found.runs.length;
    removedContainers += 1;
    if (topParagraphs == null) topParagraphs = found.paragraphs;
    return '';
  });

  // Pass 2: remove all <w:drawing> blocks carrying the model-number.
  intermediate = intermediate.replace(DRAWING_RE, (drawingXml) => {
    const found = containerHasToken(drawingXml, modelNumberToken);
    if (!found) return drawingXml;
    preservedRuns += found.runs.length;
    removedContainers += 1;
    if (topParagraphs == null) topParagraphs = found.paragraphs;
    return '';
  });

  if (removedContainers === 0 || topParagraphs == null) {
    throw new Error(
      'FAMILY_B: no <w:pict> or <w:drawing> carrying the model-number was found in the document; refusing to transform.',
    );
  }

  const bodyOpen = intermediate.match(BODY_OPEN_RE);
  if (!bodyOpen) {
    throw new Error('FAMILY_B: <w:body> open tag was not found in document.xml.');
  }
  const insertAt = bodyOpen.index + bodyOpen[0].length;
  const paragraphBlock = topParagraphs.map(buildRightAlignedParagraph).join('');
  const out = intermediate.slice(0, insertAt) + paragraphBlock + intermediate.slice(insertAt);

  return {
    documentXml: out,
    transformed: true,
    removedContainers,
    preservedRuns,
  };
}
