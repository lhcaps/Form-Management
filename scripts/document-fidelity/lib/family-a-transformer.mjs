// Family A transformer - anchored header table wrapping VML textbox.
//
// Detection: the document contains a <w:tbl> whose <w:tblPr> has a
// <w:tblpPr w:vertAnchor="page" w:horzAnchor="page" .../> child AND
// the table contains a <w:pict> with a <v:textbox> that holds the
// legal model-number token.
//
// Action:
//   1. Locate the anchored table.
//   2. Extract every <w:t> text run inside its <w:txbxContent>
//      preserving the surrounding <w:r> and <w:p> structure.
//   3. Replace the entire anchored table with an in-flow borderless
//      table laid out as:
//        row 1: left=agency heading | right=national heading
//        row 2: left=agency separator | right=motto
//        row 3: right=form number + issuance note
//        row 4: right=place/date
//      where every text string is sourced from the original runs
//      (no hardcoded strings).
//   4. Run properties (font, size, bold, italic) are preserved.

const TABLE_RE = /<w:tbl\b[\s\S]*?<\/w:tbl>/g;

function isAnchoredTable(tableXml) {
  return /<w:tblpPr\b/.test(tableXml) && /<v:textbox\b/.test(tableXml);
}

function extractTextRunsFromTextbox(textboxContentXml) {
  const re = /<w:r\b[\s\S]*?<\/w:r>/g;
  const runs = [];
  let m;
  while ((m = re.exec(textboxContentXml)) !== null) {
    const runXml = m[0];
    const textMatch = runXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/);
    if (!textMatch) continue;
    runs.push({
      runXml,
      text: textMatch[1],
      rPr: runXml.match(/<w:rPr\b[\s\S]*?<\/w:rPr>/)?.[0] ?? '<w:rPr/>',
    });
  }
  return runs;
}

function buildRunWithText(text, rPr) {
  const safeRPr = rPr.replace(/<w:t\b[\s\S]*?<\/w:t>/g, '');
  const escaped = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<w:r>${safeRPr}<w:t xml:space="preserve">${escaped}</w:t></w:r>`;
}

function groupByRole(runs) {
  const buckets = {
    agencyHeading: [],
    agencySeparator: [],
    nationalHeading: [],
    motto: [],
    modelNumber: [],
    issuanceNote: [],
    placeDate: [],
    other: [],
  };
  for (const run of runs) {
    const t = run.text.trim();
    if (!t) continue;
    if (buckets.modelNumber.length === 0 && /M[??]u s[??]/i.test(t)) {
      buckets.modelNumber.push(run);
    } else if (buckets.issuanceNote.length === 0 && /Ban h[??]nh/i.test(t)) {
      buckets.issuanceNote.push(run);
    } else if (buckets.nationalHeading.length === 0 && /C[??]NG H[??]A/i.test(t)) {
      buckets.nationalHeading.push(run);
    } else if (buckets.motto.length === 0 && /[???]c l[??]p/i.test(t)) {
      buckets.motto.push(run);
    } else if (buckets.agencyHeading.length === 0 && /VI[??]N KI[??]M S[??]T/i.test(t)) {
      buckets.agencyHeading.push(run);
    } else if (buckets.agencySeparator.length === 0 && /^[\u2500\u2501_-]{3,}$/.test(t)) {
      buckets.agencySeparator.push(run);
    } else if (buckets.placeDate.length === 0 && /\bng[??]y\b/i.test(t) && /\bth[??]ng\b/i.test(t) && /\bn[??]m\b/i.test(t)) {
      buckets.placeDate.push(run);
    } else {
      buckets.other.push(run);
    }
  }
  return buckets;
}

function inlineRPr(rPr) {
  return rPr.replace(/^<w:rPr>/, '').replace(/<\/w:rPr>$/, '') || '';
}

function buildCell(contentRuns, align = 'left') {
  const runs = contentRuns.length ? contentRuns : [{ text: '', rPr: '<w:rPr/>' }];
  const paragraphs = runs
    .map((r) => {
      const rPr = r.rPr ?? '<w:rPr/>';
      const run = buildRunWithText(r.text ?? '', rPr);
      return `<w:p><w:pPr><w:jc w:val="${align}"/><w:rPr>${inlineRPr(rPr)}</w:rPr></w:pPr>${run}</w:p>`;
    })
    .join('');
  return `<w:tc><w:tcPr><w:tcW w:w="4500" w:type="dxa"/><w:tcBorders><w:top w:val="none" w:sz="0" w:color="auto"/><w:left w:val="none" w:sz="0" w:color="auto"/><w:bottom w:val="none" w:sz="0" w:color="auto"/><w:right w:val="none" w:sz="0" w:color="auto"/></w:tcBorders></w:tcPr>${paragraphs}</w:tc>`;
}

function emptyCell() {
  return `<w:tc><w:tcPr><w:tcW w:w="4500" w:type="dxa"/><w:tcBorders><w:top w:val="none" w:sz="0" w:color="auto"/><w:left w:val="none" w:sz="0" w:color="auto"/><w:bottom w:val="none" w:sz="0" w:color="auto"/><w:right w:val="none" w:sz="0" w:color="auto"/></w:tcBorders></w:tcPr><w:p/></w:tc>`;
}

function buildInFlowTable(buckets) {
  const rows = [
    `<w:tr>${buildCell(buckets.agencyHeading, 'left')}${buildCell(buckets.nationalHeading, 'right')}</w:tr>`,
    `<w:tr>${buildCell(buckets.agencySeparator.length ? buckets.agencySeparator : buckets.other, 'left')}${buildCell(buckets.motto, 'right')}</w:tr>`,
    `<w:tr>${emptyCell()}${buildCell([...buckets.modelNumber, ...buckets.issuanceNote], 'right')}</w:tr>`,
    `<w:tr>${emptyCell()}${buildCell(buckets.placeDate, 'right')}</w:tr>`,
  ];
  return `<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblBorders><w:top w:val="none" w:sz="0" w:color="auto"/><w:left w:val="none" w:sz="0" w:color="auto"/><w:bottom w:val="none" w:sz="0" w:color="auto"/><w:right w:val="none" w:sz="0" w:color="auto"/><w:insideH w:val="none" w:sz="0" w:color="auto"/><w:insideV w:val="none" w:sz="0" w:color="auto"/></w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr>${rows.join('')}</w:tbl>`;
}

export function defloatLegalHeaderTables(documentXml) {
  let defloatedTables = 0;
  const out = documentXml.replace(TABLE_RE, (tableXml) => {
    if (!/<w:tblpPr\b/u.test(tableXml)) return tableXml;
    const text = [...tableXml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/gu)]
      .map((match) => match[1])
      .join('');
    const carriesLegalHeader =
      /VIỆN KIỂM SÁT/u.test(text) &&
      /CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM/u.test(text) &&
      (/issuePlaceDateLine/u.test(text) || /ngày.+tháng.+năm/u.test(text));
    if (!carriesLegalHeader) return tableXml;
    defloatedTables += 1;
    return tableXml.replace(/<w:tblpPr\b[^>]*\/?>(?:<\/w:tblpPr>)?/gu, '');
  });
  return { documentXml: out, defloatedTables };
}

export function transformFamilyA(documentXml) {
  let transformed = false;
  let extractedRuns = 0;
  const out = documentXml.replace(TABLE_RE, (tableXml) => {
    if (transformed) return tableXml;
    if (!isAnchoredTable(tableXml)) return tableXml;

    const textboxRe = /<w:txbxContent\b[\s\S]*?<\/w:txbxContent>/g;
    let runsTotal = [];
    tableXml.replace(textboxRe, (textboxXml) => {
      runsTotal = runsTotal.concat(extractTextRunsFromTextbox(textboxXml));
      return textboxXml;
    });

    const paraRe = /<w:p\b[\s\S]*?<\/w:p>/g;
    tableXml.replace(paraRe, (paraXml) => {
      runsTotal = runsTotal.concat(extractTextRunsFromTextbox(paraXml));
      return paraXml;
    });

    extractedRuns = runsTotal.length;
    if (extractedRuns === 0) {
      transformed = true;
      return '<w:p/>';
    }

    const buckets = groupByRole(runsTotal);
    const replacement = buildInFlowTable(buckets);
    transformed = true;
    return replacement;
  });

  if (!transformed) {
    throw new Error(
      'FAMILY_A: no anchored header table with VML textbox was found in the document; refusing to transform.',
    );
  }
  return { documentXml: out, transformed, extractedRuns };
}
