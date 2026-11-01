// Token-scoped OOXML ancestry helper.
//
// Walks the OOXML text-graph from a <w:t> node back to its nearest
// enclosing structural ancestor and reports whether any text token
// inside that scope is wrapped in a floating container (VML textbox,
// DrawingML textbox, frame, or anchored table).
//
// This helper does NOT use "anyFloating = true" as proof. It walks
// ancestors explicitly so a positive verdict means the SPECIFIC
// token's enclosing container is a floating structure, not that some
// unrelated textbox exists somewhere in the file.

const FLOATING_ANCESTORS = [
  'w:txbxContent',
  'v:textbox',
  'w:pict',
  'w:framePr',
  'w:drawing',
  'mc:AlternateContent',
];

const ANCESTOR_FAMILY = {
  'w:txbxContent': 'VML_TEXTBOX',
  'v:textbox': 'VML_TEXTBOX',
  'w:pict': 'VML_PICT',
  'w:framePr': 'FRAME_PR',
  'w:drawing': 'DRAWING_ML',
  'mc:AlternateContent': 'DRAWING_ML',
};

const ANCHORED_TABLE_ANCESTOR = 'w:tblpPr';
const TABLE_ANCESTOR = 'w:tbl';

export function extractTextNodes(xml) {
  const out = [];
  const re = /<w:t\b[^>]*>([^<]*)<\/w:t>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    out.push({
      index: m.index,
      value: m[1],
      start: m.index,
      end: m.index + m[0].length,
    });
  }
  return out;
}

function findElementRanges(xml, tagName) {
  const ranges = [];
  const openRe = new RegExp('<' + tagName + '\\b[^>]*?>', 'g');
  const closeRe = new RegExp('</' + tagName + '\\s*>', 'g');
  let m;
  while ((m = openRe.exec(xml)) !== null) {
    if (m[0].endsWith('/>')) continue;
    const openStart = m.index;
    const openEnd = m.index + m[0].length;
    closeRe.lastIndex = openEnd;
    const c = closeRe.exec(xml);
    if (!c) break;
    ranges.push({
      openStart,
      openEnd,
      closeStart: c.index,
      closeEnd: c.index + c[0].length,
    });
  }
  return ranges;
}

function innermostAncestor(ranges, offset) {
  let best = null;
  for (const r of ranges) {
    if (r.openStart <= offset && offset < r.closeEnd) {
      if (!best || r.openStart > best.openStart) best = r;
    }
  }
  return best;
}

export function classifyTextNodes(xml) {
  const textNodes = extractTextNodes(xml);
  const rangeCache = new Map();
  const tagNames = new Set([
    ...FLOATING_ANCESTORS,
    ANCHORED_TABLE_ANCESTOR,
    TABLE_ANCESTOR,
  ]);
  for (const t of tagNames) {
    if (!rangeCache.has(t)) rangeCache.set(t, findElementRanges(xml, t));
  }

  return textNodes.map((node) => {
    const ancestors = [];
    for (const tagName of FLOATING_ANCESTORS) {
      const ranges = rangeCache.get(tagName);
      const r = innermostAncestor(ranges, node.start);
      if (r) ancestors.push({ tagName, family: ANCESTOR_FAMILY[tagName] });
    }
    const tableRanges = rangeCache.get(TABLE_ANCESTOR);
    const tbl = innermostAncestor(tableRanges, node.start);
    let inTable = false;
    let inAnchoredTable = false;
    if (tbl) {
      inTable = true;
      const tblpRanges = rangeCache.get(ANCHORED_TABLE_ANCESTOR);
      for (const r of tblpRanges) {
        if (r.openStart >= tbl.openStart && r.closeEnd <= tbl.closeEnd) {
          inAnchoredTable = true;
          break;
        }
      }
    }
    return {
      ...node,
      ancestors,
      inTable,
      inAnchoredTable,
      inFloatingContainer: ancestors.length > 0,
    };
  });
}

export function locateToken(xml, token) {
  const classifications = classifyTextNodes(xml);
  const occurrences = [];
  for (const node of classifications) {
    let from = 0;
    while (true) {
      const idx = node.value.indexOf(token, from);
      if (idx === -1) break;
      from = idx + token.length;
      occurrences.push({
        token,
        inFloatingContainer: node.inFloatingContainer,
        inAnchoredTable: node.inAnchoredTable,
        inTable: node.inTable,
        ancestorFamilies: node.ancestors.map((a) => a.family),
      });
    }
  }
  const anyFloating = occurrences.some((o) => o.inFloatingContainer);
  const anyAnchoredTable = occurrences.some((o) => o.inAnchoredTable);
  const allFloatingFree = occurrences.length > 0 && occurrences.every((o) => !o.inFloatingContainer);
  const allInFlow = occurrences.length > 0 && occurrences.every((o) => !o.inFloatingContainer && !o.inAnchoredTable);
  return {
    token,
    occurrences,
    anyFloating,
    anyAnchoredTable,
    allFloatingFree,
    allInFlow,
    count: occurrences.length,
  };
}

export function classifyStructuralFamily(documentXml, options = {}) {
  const modelNumberToken = options.modelNumberToken ?? null;
  const issuanceNoteToken = options.issuanceNoteToken ?? null;

  const classifications = classifyTextNodes(documentXml);

  function locate(token) {
    if (!token) return null;
    const result = { token, occurrences: [], anyFloating: false, anyAnchoredTable: false, allInFlow: false };
    for (const node of classifications) {
      let from = 0;
      while (true) {
        const idx = node.value.indexOf(token, from);
        if (idx === -1) break;
        from = idx + token.length;
        result.occurrences.push({
          inFloatingContainer: node.inFloatingContainer,
          inAnchoredTable: node.inAnchoredTable,
          ancestorFamilies: node.ancestors.map((a) => a.family),
        });
      }
    }
    result.anyFloating = result.occurrences.some((o) => o.inFloatingContainer);
    result.anyAnchoredTable = result.occurrences.some((o) => o.inAnchoredTable);
    result.allInFlow = result.occurrences.length > 0 && result.occurrences.every((o) => !o.inFloatingContainer && !o.inAnchoredTable);
    result.count = result.occurrences.length;
    return result;
  }

  const modelLoc = locate(modelNumberToken);
  const issuanceLoc = locate(issuanceNoteToken);

  const hasAnchoredTable = /<w:tblpPr\b/.test(documentXml);
  const hasVmlTextbox = /<v:textbox\b/.test(documentXml);
  const hasDrawingMlTextbox = /<w:drawing\b/.test(documentXml);
  const hasTitlePg = /<w:titlePg\b/.test(documentXml);
  const hasHeaderReference = /<w:headerReference\b/.test(documentXml);
  const sectionCount = (documentXml.match(/<w:sectPr\b/g) ?? []).length;
  const hasBorderlessTable = /<w:tblBorders\b[^>]*>(?:(?!<\/w:tblBorders>)[\s\S])*?<w:top\s+w:val="none"/.test(documentXml);

  let family = 'FAMILY_UNKNOWN';
  if (!modelLoc || modelLoc.count === 0) {
    family = 'NO_MODEL_NUMBER';
  } else if (modelLoc.anyFloating && modelLoc.anyAnchoredTable) {
    family = 'FAMILY_A_ANCHORED_HEADER_TABLE_WITH_VML';
  } else if (modelLoc.anyFloating) {
    family = 'FAMILY_B_STANDALONE_MODEL_NUMBER_VML';
  } else if (modelLoc.allInFlow && !modelLoc.anyAnchoredTable) {
    family = 'FAMILY_C_IN_FLOW_PARAGRAPH';
  } else if (modelLoc.anyAnchoredTable === false) {
    family = 'FAMILY_D_IN_FLOW_TABLE';
  }

  return {
    modelNumberToken,
    issuanceNoteToken,
    modelNumberLocation: modelLoc,
    issuanceNoteLocation: issuanceLoc,
    structural: {
      hasAnchoredTable,
      hasVmlTextbox,
      hasDrawingMlTextbox,
      hasTitlePg,
      hasHeaderReference,
      hasBorderlessTable,
      sectionCount,
    },
    family,
  };
}
