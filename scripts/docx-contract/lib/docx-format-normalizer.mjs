import PizZip from 'pizzip';

const RUN_PROPERTIES_PATTERN = /<w:rPr\b[^>]*>[\s\S]*?<\/w:rPr>/u;

function replaceOrAppendRunProperty(runProperties, tagName, replacement) {
  const pattern = new RegExp(
    `<w:${tagName}\\b[^>]*(?:\\/>|>[\\s\\S]*?<\\/w:${tagName}>)`,
    'u',
  );
  if (pattern.test(runProperties)) {
    return runProperties.replace(pattern, replacement);
  }
  return runProperties.replace('</w:rPr>', `${replacement}</w:rPr>`);
}

function normalizeRunProperties(
  runProperties,
  { fontFamily, fontSizeHalfPoints },
) {
  let normalized = replaceOrAppendRunProperty(
    runProperties,
    'rFonts',
    `<w:rFonts w:ascii="${fontFamily}" w:eastAsia="${fontFamily}" w:hAnsi="${fontFamily}" w:cs="${fontFamily}"/>`,
  );
  normalized = replaceOrAppendRunProperty(
    normalized,
    'sz',
    `<w:sz w:val="${fontSizeHalfPoints}"/>`,
  );
  return replaceOrAppendRunProperty(
    normalized,
    'szCs',
    `<w:szCs w:val="${fontSizeHalfPoints}"/>`,
  );
}

function normalizeContainerRunProperties(container, options) {
  if (RUN_PROPERTIES_PATTERN.test(container)) {
    return container.replace(RUN_PROPERTIES_PATTERN, (runProperties) =>
      normalizeRunProperties(runProperties, options),
    );
  }

  const closingTagIndex = container.lastIndexOf('</w:');
  if (closingTagIndex < 0) return container;

  const runProperties = normalizeRunProperties('<w:rPr></w:rPr>', options);
  return `${container.slice(0, closingTagIndex)}${runProperties}${container.slice(closingTagIndex)}`;
}

function normalizeStylesXml(stylesXml, options) {
  const normalStylePattern =
    /<w:style\b(?=[^>]*w:styleId="Normal")[^>]*>[\s\S]*?<\/w:style>/u;
  if (!normalStylePattern.test(stylesXml)) {
    throw new Error('DOCX styles.xml does not contain the Normal paragraph style.');
  }

  let normalized = stylesXml.replace(normalStylePattern, (normalStyle) =>
    normalizeContainerRunProperties(normalStyle, options),
  );

  const runDefaultPattern =
    /<w:rPrDefault\b[^>]*>[\s\S]*?<\/w:rPrDefault>/u;
  if (runDefaultPattern.test(normalized)) {
    normalized = normalized.replace(runDefaultPattern, (runDefault) =>
      normalizeContainerRunProperties(runDefault, options),
    );
  }

  return normalized;
}

/**
 * Applies the product baseline typography while preserving the DOCX package.
 */
export function normalizeDocxBaseTypography(docxBuffer, options) {
  const zip = new PizZip(docxBuffer);
  const stylesPart = zip.file('word/styles.xml');

  if (!stylesPart) {
    throw new Error('DOCX package is missing word/styles.xml.');
  }

  zip.file('word/styles.xml', normalizeStylesXml(stylesPart.asText(), options));
  return zip.generate({ type: 'nodebuffer' });
}
