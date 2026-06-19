export type DocxFormatAuditStatus = 'pass' | 'fail' | 'warning';
export type DocxFormatCheckStatus =
  | 'pass'
  | 'fail'
  | 'warning'
  | 'not_applicable'
  | 'not_detectable';

export type DocxFormatCheck = Readonly<{
  id: string;
  requirement: string;
  status: DocxFormatCheckStatus;
  evidence?: string;
}>;

export type DocxFormatAudit = Readonly<{
  status: DocxFormatAuditStatus;
  checks: readonly DocxFormatCheck[];
}>;

interface DocxOoxmlParts {
  documentXml: string;
  stylesXml?: string;
  settingsXml?: string;
  headerXmls?: string[];
  footerXmls?: string[];
}

function regexInXml(xml: string, pattern: RegExp): boolean {
  return pattern.test(xml);
}

function extractWordElements(xml: string, tagName: string): string[] {
  const pattern = new RegExp(
    `<w:${tagName}\\b[\\s\\S]*?<\\/w:${tagName}>`,
    'giu',
  );
  return xml.match(pattern) ?? [];
}

function extractVisibleText(xml: string): string {
  return [...xml.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/giu)]
    .map((match) => match[1])
    .join('')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function containsWordProperty(xml: string, propertyName: string): boolean {
  return new RegExp(
    `<w:${propertyName}(?:\\s[^>]*)?(?:\\/>|>[\\s\\S]*?<\\/w:${propertyName}>)`,
    'iu',
  ).test(xml);
}

function containsHalfPointSize(xml: string, halfPoints: number): boolean {
  return new RegExp(
    `<w:sz(?:Cs)?\\s[^>]*w:val="${halfPoints}"[^>]*(?:\\/>|>)`,
    'iu',
  ).test(xml);
}

function containsExplicitColor(xml: string, color: string): boolean {
  return new RegExp(
    `<w:color\\s[^>]*w:val="${color}"[^>]*(?:\\/>|>)`,
    'iu',
  ).test(xml);
}

function findVisibleRuns(xml: string): string[] {
  return extractWordElements(xml, 'r').filter(
    (runXml) => extractVisibleText(runXml).length > 0,
  );
}

function findRunsContaining(xml: string, textPattern: RegExp): string[] {
  return extractWordElements(xml, 'r').filter((runXml) =>
    textPattern.test(extractVisibleText(runXml)),
  );
}

function findParagraphsContaining(xml: string, textPattern: RegExp): string[] {
  return extractWordElements(xml, 'p').filter((paragraphXml) =>
    textPattern.test(extractVisibleText(paragraphXml)),
  );
}

function findNormalStyle(stylesXml: string | undefined): string | undefined {
  if (!stylesXml) return undefined;
  return extractWordElements(stylesXml, 'style').find((styleXml) =>
    /w:styleId="Normal"/iu.test(styleXml),
  );
}

export function auditDocxFormat(parts: DocxOoxmlParts): DocxFormatAudit {
  const { documentXml, stylesXml, settingsXml, headerXmls, footerXmls } = parts;

  const allXml = [
    documentXml,
    ...(stylesXml ? [stylesXml] : []),
    ...(settingsXml ? [settingsXml] : []),
    ...(headerXmls ?? []),
    ...(footerXmls ?? []),
  ].join('\n');

  const checks: DocxFormatCheck[] = [];

  // FMT-001: Times New Roman base font
  const normalStyle = findNormalStyle(stylesXml);
  const normalUsesTimesNewRoman = normalStyle
    ? /Times New Roman/iu.test(normalStyle)
    : false;
  const normalUsesSize13 = normalStyle
    ? containsHalfPointSize(normalStyle, 26)
    : false;
  const hasTimesNewRoman = regexInXml(allXml, /Times New Roman/i);
  const baselineStatus: DocxFormatCheckStatus = normalStyle
    ? normalUsesTimesNewRoman && normalUsesSize13
      ? 'pass'
      : 'fail'
    : hasTimesNewRoman
      ? 'pass'
      : 'not_detectable';
  checks.push({
    id: 'FMT-001',
    requirement: 'Times New Roman size 13 baseline',
    status: baselineStatus,
    evidence: normalStyle
      ? `Normal style: Times New Roman=${normalUsesTimesNewRoman}, size13=${normalUsesSize13}`
      : hasTimesNewRoman
        ? 'Times New Roman found; Normal style unavailable'
        : undefined,
  });

  // FMT-002: Agency header line 1
  const hasVKSHeader = regexInXml(allXml, /VIỆN KIỂM SÁT NHÂN DÂN/i);
  checks.push({
    id: 'FMT-002',
    requirement: 'Header: VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH',
    status: hasVKSHeader ? 'pass' : 'not_detectable',
    evidence: hasVKSHeader ? 'Agency header found in document XML' : undefined,
  });

  // FMT-003: KHU VỰC 7 bold in header
  const khuVucRuns = findRunsContaining(allXml, /KHU VỰC\s*7/iu);
  const hasKhuVucBold = khuVucRuns.length > 0;
  const khuVucBoldWithTag = khuVucRuns.some((runXml) =>
    containsWordProperty(runXml, 'b'),
  );
  checks.push({
    id: 'FMT-003',
    requirement: 'Header: VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7 bold',
    status: hasKhuVucBold
      ? khuVucBoldWithTag
        ? 'pass'
        : 'warning'
      : 'not_detectable',
    evidence: hasKhuVucBold
      ? `KHU VỰC 7 found; bold tag proximity: ${khuVucBoldWithTag}`
      : undefined,
  });

  // FMT-004: Underline under KHU VỰC 7 only (not full line)
  // Whether the underline is ONLY under KHU VỰC 7 (and not the whole line) cannot be verified structurally.
  const hasKhuVucUnderline = regexInXml(
    allXml,
    /KHU VỰC\s*7[\s\S]{0,200}<w:u[\s"][^>]*(?:\/>|>)/i,
  );
  checks.push({
    id: 'FMT-004',
    requirement: 'Underline under KHU VỰC 7 only (not full line)',
    status: hasKhuVucUnderline ? 'not_detectable' : 'not_detectable',
    evidence: hasKhuVucUnderline
      ? 'Underline found near KHU VỰC 7; exact placement requires visual/PDF pipeline'
      : 'Underline not detectable from OOXML proximity check',
  });

  // FMT-005: Legal basis line
  const legalBasisParagraphs = findParagraphsContaining(
    allXml,
    /Thông tư\s+số\s+03\/2026\/TT-VKSTC/iu,
  );
  const hasLegalBasis = legalBasisParagraphs.length > 0;
  const legalBasisSize8 = legalBasisParagraphs.some((paragraphXml) => {
    const textRuns = extractWordElements(paragraphXml, 'r').filter(
      (runXml) => extractVisibleText(runXml).length > 0,
    );
    return (
      textRuns.length > 0 &&
      textRuns.every((runXml) => containsHalfPointSize(runXml, 16))
    );
  });
  checks.push({
    id: 'FMT-005',
    requirement: 'Legal basis line size 8 (w:sz val=16 in half-points)',
    status: hasLegalBasis
      ? legalBasisSize8
        ? 'pass'
        : 'warning'
      : 'not_detectable',
    evidence: hasLegalBasis
      ? 'Legal basis line found; font size 8 proximity check'
      : undefined,
  });

  // FMT-006: Quốc hiệu size 13
  const hasQuocHieu = regexInXml(
    allXml,
    /CỘNG\s*HÒA\s*XÃ\s*HỘI\s*CHỦ\s*NGHĨA\s*VIỆT\s*NAM/i,
  );
  checks.push({
    id: 'FMT-006',
    requirement: 'Quốc hiệu size 13',
    status: hasQuocHieu ? 'pass' : 'not_detectable',
    evidence: hasQuocHieu ? 'National motto found in document XML' : undefined,
  });

  // FMT-007: Độc lập - Tự do - Hạnh phúc size 14
  const mottoRuns = findRunsContaining(
    allXml,
    /Độc\s*lập\s*-\s*Tự\s*do\s*-\s*Hạnh\s*phúc/iu,
  );
  const hasMotto = mottoRuns.length > 0;
  const mottoSize14 = mottoRuns.some((runXml) =>
    containsHalfPointSize(runXml, 28),
  );
  checks.push({
    id: 'FMT-007',
    requirement: 'Độc lập - Tự do - Hạnh phúc size 14',
    status: hasMotto ? (mottoSize14 ? 'pass' : 'warning') : 'not_detectable',
    evidence: hasMotto
      ? 'Motto found; size 14 (w:val=28) proximity check'
      : undefined,
  });

  // FMT-008: Underline under motto matches exact line width
  // Exact pixel-width cannot be verified structurally; but presence of underline is detectable.
  const hasMottoUnderline = regexInXml(
    allXml,
    /Độc[\s\S]{0,500}<w:u[\s"][^>]*(?:\/>|>)/i,
  );
  checks.push({
    id: 'FMT-008',
    requirement: 'Underline under motto matches exact line width',
    status: hasMottoUnderline ? 'warning' : 'not_detectable',
    evidence: hasMottoUnderline
      ? 'Underline found near motto; exact width requires visual/PDF pipeline'
      : 'Underline not detectable from OOXML proximity check',
  });

  // FMT-009: Issue date italic size 14
  const hasIssueDate = regexInXml(
    allXml,
    /ngày\s*\d{1,2}\s*tháng\s*\d{1,2}\s*năm\s*\d{4}/i,
  );
  checks.push({
    id: 'FMT-009',
    requirement: 'Issue date line italic size 14',
    status: hasIssueDate ? 'pass' : 'not_detectable',
    evidence: hasIssueDate
      ? 'Issue date pattern found in document XML'
      : undefined,
  });

  // FMT-010: Số line and ngày/tháng/năm on same horizontal level
  // Structural proximity check only; exact horizontal alignment requires visual pipeline.
  const hasSoLine = regexInXml(allXml, /Số\s*:?\s*[A-ZÀ-ỹ0-9/-]+/i);
  checks.push({
    id: 'FMT-010',
    requirement: 'Số... line and ngày/tháng/năm line on same horizontal level',
    status: 'not_detectable',
    evidence: hasSoLine
      ? 'Số line found; horizontal alignment requires visual/PDF pipeline'
      : 'Số line not detected',
  });

  // FMT-011: Body titles bold size 14
  const titleRuns = findRunsContaining(
    allXml,
    /^(?:BIÊN BẢN|QUYẾT ĐỊNH|CÁO TRẠNG|THÔNG BÁO|LỆNH|KẾ HOẠCH)$/iu,
  );
  const hasTitleBold14 = titleRuns.some(
    (runXml) =>
      containsWordProperty(runXml, 'b') && containsHalfPointSize(runXml, 28),
  );
  checks.push({
    id: 'FMT-011',
    requirement: 'Body titles / main title bold size 14',
    status:
      titleRuns.length === 0
        ? 'not_detectable'
        : hasTitleBold14
          ? 'pass'
          : 'warning',
    evidence:
      titleRuns.length === 0
        ? 'Known body title not found'
        : `Known title runs=${titleRuns.length}, bold14=${hasTitleBold14}`,
  });

  // FMT-012: Điều paragraphs bold
  // Proximity across element boundaries is unreliable; mark as not_detectable.
  const hasDieuBold = regexInXml(allXml, /<w:b[\s/][\s\S]{0,200}Điều\s*\d+/i);
  const hasSectionBold = regexInXml(
    allXml,
    /<w:b[\s/][\s\S]{0,200}>\s*\d+\s*<\/?w:t>/i,
  );
  checks.push({
    id: 'FMT-012',
    requirement: 'Điều 1, Điều 2, or section headings 1., 2. bold',
    status: hasDieuBold || hasSectionBold ? 'warning' : 'not_detectable',
    evidence:
      hasDieuBold || hasSectionBold
        ? 'Điều/section bold proximity detected; not_detectable across element boundaries'
        : 'Điều or numbered section bold not detected in proximity',
  });

  // FMT-013: Nơi nhận bold italic size 12
  const hasNoiNhan = regexInXml(allXml, /Nơi\s*nhận\s*:/i);
  checks.push({
    id: 'FMT-013',
    requirement: 'Footer: Nơi nhận: bold italic size 12',
    status: hasNoiNhan ? 'pass' : 'not_detectable',
    evidence: hasNoiNhan ? 'Nơi nhận: label found' : undefined,
  });

  // FMT-014: Footer recipient lines size 11
  const noiNhanSize11 = regexInXml(
    allXml,
    /Nơi\s*nhận[\s\S]{0,500}<w:sz\s[^>]*w:val="22"/i,
  );
  checks.push({
    id: 'FMT-014',
    requirement: 'Footer recipient lines size 11',
    status: noiNhanSize11 ? 'pass' : 'not_detectable',
    evidence: noiNhanSize11
      ? 'Size 11 (w:val=22) found near Nơi nhận'
      : undefined,
  });

  // FMT-015: Signature title bold size 14
  const hasChucVu = regexInXml(
    allXml,
    /(Viện\s*trưởng|Kiểm\s*sát\s*viên|Kiểm\s*sát\s*viên\s*trung\s*ương)/i,
  );
  checks.push({
    id: 'FMT-015',
    requirement:
      'Signature title bold size 14; 2-3 lines between title and name',
    status: hasChucVu ? 'warning' : 'not_detectable',
    evidence: hasChucVu
      ? 'Signature title found; vertical spacing not verifiable structurally'
      : undefined,
  });

  // FMT-016: Page number for long documents
  const hasPageNumber = regexInXml(
    allXml,
    /<w:fldChar[\s\S]*?w:fldCharType="begin"[\s\S]*?PAGE/i,
  );
  checks.push({
    id: 'FMT-016',
    requirement: 'Page number present for documents > 2 pages',
    status: hasPageNumber ? 'pass' : 'not_detectable',
    evidence: hasPageNumber ? 'PAGE field found in document' : undefined,
  });

  // FMT-017: Different First Page enabled
  const hasDifferentFirstPage = regexInXml(
    documentXml,
    /<w:sectPr[\s\S]*?<w:titlePg[\s/]/i,
  );
  checks.push({
    id: 'FMT-017',
    requirement: 'Different First Page section property enabled',
    status: hasDifferentFirstPage ? 'pass' : 'not_detectable',
    evidence: hasDifferentFirstPage
      ? 'w:titlePg element found in document section properties'
      : 'w:titlePg not found in document section properties',
  });

  // FMT-018: BM-001 receiver identity legal content must print in black.
  const documentVisibleText = extractVisibleText(documentXml);
  const isBm001 =
    /Mẫu\s*số\s*01\/HS/iu.test(documentVisibleText) ||
    /BIÊN\s*BẢN\s+TIẾP\s+NHẬN\s+NGUỒN\s+TIN/iu.test(documentVisibleText);
  const receiverIdentityParagraph = isBm001
    ? findParagraphsContaining(documentXml, /Tôi\s*:/iu)[0]
    : undefined;
  const receiverVisibleRuns = receiverIdentityParagraph
    ? findVisibleRuns(receiverIdentityParagraph)
    : [];
  const receiverRunsAreBlack =
    receiverVisibleRuns.length > 0 &&
    receiverVisibleRuns.every((runXml) =>
      containsExplicitColor(runXml, '000000'),
    );
  checks.push({
    id: 'FMT-018',
    requirement:
      'BM-001 receiver identity legal content uses explicit black text',
    status: receiverIdentityParagraph
      ? receiverRunsAreBlack
        ? 'pass'
        : 'fail'
      : 'not_applicable',
    evidence: receiverIdentityParagraph
      ? `Visible runs=${receiverVisibleRuns.length}, all explicit black=${receiverRunsAreBlack}`
      : isBm001
        ? 'BM-001 receiver identity paragraph not present'
        : 'BM-001 identifying text not present',
  });

  // FMT-019: BM-001 top-right form note must remain legible in print output.
  const formNoteTextbox = extractWordElements(documentXml, 'txbxContent').find(
    (textboxXml) => /Mẫu\s*số\s*01\/HS/iu.test(extractVisibleText(textboxXml)),
  );
  const formNoteVisibleRuns = formNoteTextbox
    ? findVisibleRuns(formNoteTextbox)
    : [];
  const formNoteRunsAreBlackAndSize8 =
    formNoteVisibleRuns.length > 0 &&
    formNoteVisibleRuns.every(
      (runXml) =>
        containsExplicitColor(runXml, '000000') &&
        containsHalfPointSize(runXml, 16),
    );
  checks.push({
    id: 'FMT-019',
    requirement:
      'BM-001 Mẫu số 01/HS form note uses explicit black text at 8pt',
    status: formNoteTextbox
      ? formNoteRunsAreBlackAndSize8
        ? 'pass'
        : 'fail'
      : 'not_applicable',
    evidence: formNoteTextbox
      ? `Visible runs=${formNoteVisibleRuns.length}, all black8pt=${formNoteRunsAreBlackAndSize8}`
      : 'BM-001 Mẫu số 01/HS textbox not present',
  });

  // Compute overall status:
  // - fail if any check fails (hard failure)
  // - warning if any check warns OR if all checks are not_detectable (no confirmation)
  // - pass only when at least one check passes and no fails/warnings exist
  const statuses = checks.map((c) => c.status);
  const hasFail = statuses.includes('fail');
  const hasWarning = statuses.includes('warning');
  const hasPass = statuses.includes('pass');

  const overallStatus: DocxFormatAuditStatus = hasFail
    ? 'fail'
    : hasWarning || !hasPass
      ? 'warning'
      : 'pass';

  return Object.freeze({
    status: overallStatus,
    checks: Object.freeze(checks),
  });
}

export async function extractOoxmlPartsFromDocx(
  zipBuffer: Buffer,
): Promise<DocxOoxmlParts> {
  const PizZip = require('pizzip') as typeof import('pizzip');
  const zip = new PizZip(zipBuffer);

  const docXml = zip.file('word/document.xml');
  if (!docXml) {
    throw new Error('word/document.xml not found in DOCX archive.');
  }
  const documentXml = docXml.asText();

  const stylesXml = zip.file('word/styles.xml')?.asText();
  const settingsXml = zip.file('word/settings.xml')?.asText();

  const headerXmls: string[] = [];
  const footerXmls: string[] = [];

  for (let i = 1; i <= 5; i++) {
    const header = zip.file(`word/header${i}.xml`);
    if (header) headerXmls.push(header.asText());
    const footer = zip.file(`word/footer${i}.xml`);
    if (footer) footerXmls.push(footer.asText());
  }

  return { documentXml, stylesXml, settingsXml, headerXmls, footerXmls };
}
