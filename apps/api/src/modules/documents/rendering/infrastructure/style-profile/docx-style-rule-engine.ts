/**
 * PR6G.4 — Generic Style Profile Engine: rule application engine.
 *
 * Pure, no-NestJS, no-FS. Receives a DOCX `Buffer` and a
 * `DocxStyleProfile`, returns either the original buffer (no-op when no
 * rule matches OR when the registry returned no profile) or a new buffer
 * with the profile rules applied to `word/document.xml` (and to header /
 * footer / footnote / endnote parts when a profile explicitly targets
 * them — the BM-001 profile currently only targets `document`, so the
 * other parts are untouched).
 *
 * The engine intentionally does NOT depend on `DocumentPreExportService`,
 * `DocxStyleAuditService`, or `VKS_KHU_VUC_7_STYLE_PROFILE`. Those are
 * sibling concerns (pre-export user config, read-only audit, and a
 * fixed reference profile respectively). PR6G.4 introduces a *new*
 * layer that:
 *
 *   - Lives entirely under `style-profile/`.
 *   - Is invoked by `DocxtemplaterContractRenderEngine` AFTER fill.
 *   - Is byte-identical no-op when no profile is registered for the
 *     template code (the PR6G.4 non-regression contract).
 *
 * Style application rules:
 *   - `bold: true`        → add `<w:b/>` to run properties (preserves
 *                           any pre-existing bold).
 *   - `italic: true`      → add `<w:i/>` to run properties.
 *   - `fontSizePt: 14`    → set `<w:sz w:val="28"/>` and
 *                           `<w:szCs w:val="28"/>` (run properties).
 *   - `fontSizeHalfPt`    → if provided, used as-is; otherwise derived
 *                           from `fontSizePt * 2`.
 *   - Pre-existing rPr children (`rFonts`, `color`, etc.) are preserved
 *     by cloning the original `<w:rPr>` before applying overrides.
 *
 * Whitespace normalisation:
 *   - DOCX paragraphs frequently interleave `<w:t>…</w:t>` runs with
 *     `<w:br/>` (newline) and `<w:tab/>` (tab) structural elements. A
 *     profile rule whose `match.text` was authored against the visually
 *     rendered string would NOT match a paragraph that contains a
 *     literal `<w:br/>` between two halves of the same phrase.
 *   - The engine collapses every run of whitespace (incl. tabs and
 *     newlines) into a single space AT MATCH TIME. The underlying
 *     paragraph text retains its structural breaks for run-splitting
 *     purposes; only the matching coordinate space is normalised.
 *
 * Run-splitting safety:
 *   - When a match crosses multiple `<w:t>` runs, the affected runs are
 *     split at the match boundaries, the styled run inherits the FIRST
 *     affected run's properties (with the style override applied), and
 *     the leading / trailing fragments are cloned from the original
 *     runs. This matches the behaviour in `DocumentPreExportService`'s
 *     `styleTextRangeInParagraph` and is sufficient for current BM-001
 *     targets (each match is a single run in the locked template).
 *   - When splitting would mutate XML outside the matched range, the
 *     engine emits a warning and skips the rule for that match. The
 *     input buffer is still returned (mutated for any successful rules,
 *     byte-identical if zero rules applied).
 *
 * @module rendering/infrastructure/style-profile
 */

import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import * as xpath from 'xpath';
import PizZip from 'pizzip';

import type {
  DocxStyleProfile,
  DocxStyleProfileDropEmptyBetweenRule,
  DocxStyleProfileDropParagraphRule,
  DocxStyleProfileDropTrailingEmptyRule,
  DocxStyleProfilePart,
  DocxStyleProfileReplaceTextRule,
  DocxStyleProfileRule,
  DocxStyleProfileRunStyleRule,
  DocxStyleProfileSafety,
  StyleApplicationResult,
} from './docx-style-profile.types';

const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const XML_NS = 'http://www.w3.org/XML/1998/namespace';

const selectWord = xpath.useNamespaces({
  w: WORD_NS,
});

const PART_PATHS: Readonly<Record<DocxStyleProfilePart, readonly string[]>> = {
  document: ['word/document.xml'],
  header: [
    'word/header1.xml',
    'word/header2.xml',
    'word/header3.xml',
    'word/header4.xml',
    'word/header5.xml',
  ],
  footer: [
    'word/footer1.xml',
    'word/footer2.xml',
    'word/footer3.xml',
    'word/footer4.xml',
    'word/footer5.xml',
  ],
  footnote: ['word/footnotes.xml'],
  endnote: ['word/endnotes.xml'],
};

const STYLE_PROFILES_FOR_PART = (part: DocxStyleProfilePart): string[] => [
  ...PART_PATHS[part],
];

const DEFAULT_DROP_MAX_PARAGRAPHS = 100;
const DROP_RULE_PUNCTUATION_ONLY = /^[\s.,;:()\-+/\\|]+$/u;

type RunStyleRule = DocxStyleProfileRunStyleRule;

type RunSegment = {
  runElement: any;
  text: string;
  start: number;
  end: number;
};

type ParagraphContext = {
  element: any;
  text: string;
  segments: RunSegment[];
  /** First descendant <w:r> element, if any. Used by drop safety probes. */
  firstRunElement: any | null;
  /** Joined raw descendants in document order. */
  hasSuperscriptRun: boolean;
  /** Joined visible text character counts. */
  nonWhitespaceCharCount: number;
};

/**
 * Apply a style profile to a DOCX buffer. Pure function.
 *
 * Returns a `StyleApplicationResult` whose `buffer` is:
 *   - the input buffer (same reference) when no profile is provided OR
 *     the profile has no rules OR no rule produced a change.
 *   - a new buffer (re-emitted DOCX) when at least one rule matched and
 *     was applied.
 *
 * The engine never mutates the input buffer.
 */
export function applyStyleProfileToDocxBuffer(
  buffer: Buffer,
  profile: DocxStyleProfile | null,
): StyleApplicationResult {
  if (!profile || profile.rules.length === 0) {
    return {
      templateCode: profile?.templateCode ?? '',
      profileApplied: false,
      appliedRuleIds: [],
      skippedRuleIds: [],
      warnings: [],
      buffer,
    };
  }

  const zip = new PizZip(buffer);
  const warnings: string[] = [];
  const appliedRuleIds = new Set<string>();
  const skippedRuleIds = new Set<string>();
  let profileApplied = false;

  const rulesByPart = groupRulesByPart(profile.rules);

  for (const part of Object.keys(rulesByPart) as DocxStyleProfilePart[]) {
    const partRules = rulesByPart[part];
    const partPaths = STYLE_PROFILES_FOR_PART(part);
    for (const partPath of partPaths) {
      const partFile = zip.file(partPath);
      if (!partFile) continue;
      const originalXml = partFile.asText();
      const doc = new DOMParser().parseFromString(
        originalXml,
        'application/xml',
      );
      const paragraphs = collectParagraphs(doc);
      const partApplied = applyRulesToParagraphs(
        part,
        partRules,
        paragraphs,
        warnings,
        appliedRuleIds,
        skippedRuleIds,
      );
      if (partApplied) {
        const nextXml = serializeDoc(doc, originalXml);
        if (nextXml !== originalXml) {
          zip.file(partPath, nextXml);
          profileApplied = true;
        }
      }
    }
  }

  if (!profileApplied) {
    return {
      templateCode: profile.templateCode,
      profileApplied: false,
      appliedRuleIds: [...appliedRuleIds],
      skippedRuleIds: [...skippedRuleIds],
      warnings,
      buffer,
    };
  }

  const nextBuffer = zip.generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  return {
    templateCode: profile.templateCode,
    profileApplied: true,
    appliedRuleIds: [...appliedRuleIds],
    skippedRuleIds: [...skippedRuleIds],
    warnings,
    buffer: nextBuffer,
  };
}

/* ------------------------------------------------------------------------- */
/* Internal helpers                                                          */
/* ------------------------------------------------------------------------- */

function groupRulesByPart(
  rules: ReadonlyArray<DocxStyleProfileRule>,
): Record<DocxStyleProfilePart, DocxStyleProfileRule[]> {
  const out: Record<DocxStyleProfilePart, DocxStyleProfileRule[]> = {
    document: [],
    header: [],
    footer: [],
    footnote: [],
    endnote: [],
  };
  for (const rule of rules) {
    out[rule.part].push(rule);
  }
  return out;
}

function collectParagraphs(doc: any): ParagraphContext[] {
  const paragraphs = selectElementsLocal('//w:p', doc);
  const out: ParagraphContext[] = [];
  for (const element of paragraphs) {
    const firstRunElement = selectElementsLocal('.//w:r', element)[0] ?? null;
    const segments = getParagraphRunSegments(element);
    const text = segments.map((s) => s.text).join('');
    const collapsedText = collapseWhitespace(text);
    if (collapsedText.length === 0) {
      // Still record empty paragraphs — drop rules need them.
      out.push({
        element,
        text,
        segments,
        firstRunElement,
        hasSuperscriptRun: hasParagraphSuperscriptRun(element),
        nonWhitespaceCharCount: 0,
      });
      continue;
    }
    out.push({
      element,
      text,
      segments,
      firstRunElement,
      hasSuperscriptRun: hasParagraphSuperscriptRun(element),
      nonWhitespaceCharCount: collapsedText.length,
    });
  }
  return out;
}

/**
 * Walk a `<w:p>` and return true when any of its descendant
 * `<w:r>` elements carries `<w:vertAlign w:val="superscript"/>`.
 * This is the structural marker the BM-171 normalized template
 * uses to render drafter-note numbers (12, 13) as the typographic
 * equivalent of footnote markers.
 *
 * `<w:vertAlign>` lives at `<w:r>/<w:rPr>/<w:vertAlign>`. The XPath
 * `.//w:vertAlign` searches every descendant depth, so it covers
 * both the in-rPr position and the rare direct-child position
 * some Word emitters use.
 */
function hasParagraphSuperscriptRun(paragraphElement: any): boolean {
  const matches = selectElementsLocal('.//w:vertAlign', paragraphElement);
  for (const va of matches) {
    const valAttr =
      va.getAttribute?.('w:val') ?? va.getAttribute?.('val') ?? '';
    if (valAttr === 'superscript') return true;
  }
  return false;
}

function paragraphIsEmpty(paragraph: ParagraphContext): boolean {
  return paragraph.nonWhitespaceCharCount === 0;
}

function paragraphContentIsPunctuationOnly(
  paragraph: ParagraphContext,
): boolean {
  return (
    paragraph.nonWhitespaceCharCount > 0 &&
    DROP_RULE_PUNCTUATION_ONLY.test(paragraph.text)
  );
}

function isDropParagraphRule(
  rule: DocxStyleProfileRule,
): rule is DocxStyleProfileDropParagraphRule {
  return 'action' in rule && rule.action === 'dropParagraph';
}

function isDropEmptyBetweenRule(
  rule: DocxStyleProfileRule,
): rule is DocxStyleProfileDropEmptyBetweenRule {
  return 'action' in rule && rule.action === 'dropEmptyParagraphsBetween';
}

function isDropTrailingEmptyRule(
  rule: DocxStyleProfileRule,
): rule is DocxStyleProfileDropTrailingEmptyRule {
  return (
    'action' in rule && rule.action === 'dropTrailingEmptyParagraphsBefore'
  );
}

function runStyleRuleId(rule: DocxStyleProfileRule): string {
  return (rule as RunStyleRule).id;
}

function applyRulesToParagraphs(
  part: DocxStyleProfilePart,
  rules: ReadonlyArray<DocxStyleProfileRule>,
  paragraphs: ReadonlyArray<ParagraphContext>,
  warnings: string[],
  appliedRuleIds: Set<string>,
  skippedRuleIds: Set<string>,
): boolean {
  let anyApplied = false;

  // Drop rules are processed IN SOURCE ORDER so that, for example,
  // a `dropEmptyParagraphsBetween` whose `beforeAnchor` resolves to
  // a drafter-note paragraph runs BEFORE the `dropParagraph` rule
  // that targets that same drafter-note paragraph — i.e. the anchor
  // is still present at the time the between-rule needs it. Each
  // rule mutates a SHARED `working` list; run-style rules see the
  // final, narrowed paragraph list.
  //
  // PR7B.1: `replaceText` rules run AFTER drop rules but BEFORE
  // run-style rules. This is the safest order:
  //   1. Drop rules first (no orphan paragraphs, no anchors lost).
  //   2. Text replacement next (operates on the post-drop paragraph
  //      list; doesn't depend on drop-rule output).
  //   3. Run-style rules last (their matcher sees the final text
  //      AFTER any replaceText mutations, so e.g. "QUYẾT ĐỊNH"
  //      styling still targets the heading paragraph even if the
  //      preceding text was slightly tweaked by a replaceText rule).
  const runRules: DocxStyleProfileRule[] = [];
  const replaceTextRules: DocxStyleProfileReplaceTextRule[] = [];
  const orderedDropRules: DocxStyleProfileRule[] = [];
  for (const rule of rules) {
    if (isDropRule(rule)) {
      orderedDropRules.push(rule);
    } else if (isReplaceTextRule(rule)) {
      replaceTextRules.push(rule);
    } else {
      runRules.push(rule);
    }
  }

  let working: ParagraphContext[] = [...paragraphs];

  for (const rule of orderedDropRules) {
    let result: DropApplicationResult;
    if (isDropParagraphRule(rule)) {
      const r: DocxStyleProfileDropParagraphRule = rule;
      result = applyDropParagraphRule(part, working, r, warnings);
    } else if (isDropEmptyBetweenRule(rule)) {
      const r: DocxStyleProfileDropEmptyBetweenRule = rule;
      result = applyDropEmptyBetweenRule(part, working, r, warnings);
    } else {
      // `isDropRule` already filtered out the run-style variants;
      // by elimination this must be a drop-trailing-empty rule.
      result = applyDropTrailingEmptyRule(
        part,
        working,
        rule as DocxStyleProfileDropTrailingEmptyRule,
        warnings,
      );
    }
    if (result.removedAny) {
      appliedRuleIds.add(rule.id);
      anyApplied = true;
      working = result.remaining;
    } else {
      skippedRuleIds.add(rule.id);
    }
  }

  for (const rule of replaceTextRules) {
    const replaced = applyReplaceTextRule(part, working, rule, warnings);
    if (replaced.applied && replaced.remaining) {
      appliedRuleIds.add(rule.id);
      anyApplied = true;
      working = replaced.remaining;
    } else {
      skippedRuleIds.add(rule.id);
    }
  }

  for (const rule of runRules) {
    const matchResult = applyRunStyleRule(
      part,
      working,
      rule,
      warnings,
      skippedRuleIds,
    );
    if (matchResult.applied) {
      appliedRuleIds.add(runStyleRuleId(rule));
      anyApplied = true;
      if (matchResult.remaining) {
        working = matchResult.remaining;
      }
    }
    // applyRunStyleRule records skip in skippedRuleIds internally.
  }

  return anyApplied;
}

function isDropRule(rule: DocxStyleProfileRule): boolean {
  return (
    isDropParagraphRule(rule) ||
    isDropEmptyBetweenRule(rule) ||
    isDropTrailingEmptyRule(rule)
  );
}

function isReplaceTextRule(
  rule: DocxStyleProfileRule,
): rule is DocxStyleProfileReplaceTextRule {
  return 'action' in rule && rule.action === 'replaceText';
}

type DropApplicationResult = Readonly<{
  removedAny: boolean;
  remaining: ParagraphContext[];
}>;

function removeParagraphFromBody(
  paragraphs: ReadonlyArray<ParagraphContext>,
  paragraph: ParagraphContext,
): ParagraphContext[] {
  const parent = paragraph.element?.parentNode;
  if (parent && paragraph.element?.parentNode === parent) {
    parent.removeChild(paragraph.element);
  } else if (parent) {
    // Defensive: ignore — the DOM state has drifted (e.g. another
    // rule already removed the element). The caller treats this as
    // "skip" so the rule does not cause a phantom success.
    return [...paragraphs];
  }
  return paragraphs.filter((p) => p !== paragraph);
}

/**
 * Apply a `replaceText` rule (PR7B.1).
 *
 * Selects paragraphs whose normalised visible text `contains`
 * `paragraphMatch`. For each selected paragraph, scans the runs
 * for occurrences of `rule.match` (raw substring, not normalised)
 * and replaces them with `rule.replacement`. Replacement is performed
 * via the existing run-splitting helper `styleTextRangeInParagraph`
 * path: the matched substring is split into its own run inheriting
 * the first affected run's properties, and the surrounding fragments
 * are kept verbatim.
 *
 * The rule only fires on the FIRST occurrence per paragraph. The
 * intent is a surgical fix (e.g. inject one missing space after
 * `Số:`); a profile that wants to rewrite every occurrence should
 * add multiple single-occurrence rules with disjoint match strings,
 * or extend this function later.
 *
 * Returns `applied: true` only when at least one paragraph was
 * successfully mutated. Returns `applied: false` (with a warning)
 * when no paragraph matches or when run-splitting safety rejects
 * the replacement.
 */
function applyReplaceTextRule(
  part: DocxStyleProfilePart,
  paragraphs: ReadonlyArray<ParagraphContext>,
  rule: DocxStyleProfileReplaceTextRule,
  warnings: string[],
): { applied: boolean; remaining: ParagraphContext[] | null } {
  if (rule.match.length === 0) {
    warnings.push(
      `[style-profile] part=${part} rule=${rule.id}: empty match string — rule skipped`,
    );
    return { applied: false, remaining: null };
  }
  const paragraphAnchor = normaliseForSearch(rule.paragraphMatch);
  const candidates: ParagraphContext[] = [];
  for (const paragraph of paragraphs) {
    const text = normaliseForSearch(paragraph.text);
    if (paragraphAnchor.length === 0) continue;
    if (text.includes(paragraphAnchor)) candidates.push(paragraph);
  }
  if (candidates.length === 0) {
    warnings.push(
      `[style-profile] part=${part} rule=${rule.id}: no paragraph matched paragraphMatch="${rule.paragraphMatch}"`,
    );
    return { applied: false, remaining: null };
  }
  let anyApplied = false;
  let workingParagraphs: ParagraphContext[] | null = null;
  for (const paragraph of candidates) {
    if (!paragraph.text.includes(rule.match)) {
      // The matched paragraph doesn't actually carry the substring
      // to replace. This can happen when Docxtemplater emits the
      // text across runs that the engine collapses slightly
      // differently per run. Treat as no-op for this paragraph.
      continue;
    }
    const replaced = replaceFirstInParagraph(
      paragraph,
      rule.match,
      rule.replacement,
      warnings,
    );
    if (replaced) {
      anyApplied = true;
      if (!workingParagraphs) workingParagraphs = [...paragraphs];
    }
  }
  return { applied: anyApplied, remaining: workingParagraphs };
}

/**
 * Replace the FIRST occurrence of `search` in `paragraph.text` with
 * `replacement`. Splits the run that carries the match so the
 * replacement inherits the original run's properties (bold, italic,
 * sz). The replacement string may contain whitespace; if the new
 * text contains leading/trailing whitespace the engine sets
 * `xml:space="preserve"` on the replacement run to prevent Word
 * from collapsing it.
 */
function replaceFirstInParagraph(
  paragraph: ParagraphContext,
  search: string,
  replacement: string,
  warnings: string[],
): boolean {
  const start = paragraph.text.indexOf(search);
  if (start < 0) return false;
  const end = start + search.length;
  // No-op style: the helper expects a DocxStyleProfileStyle object,
  // but `applyRunStyle` is a no-op when every style field is
  // undefined. This keeps the replacement run's properties
  // unchanged from the original.
  return styleTextRangeInParagraph(paragraph, start, end, {}, warnings, {
    replacementText: replacement,
  });
}

function applyDropParagraphRule(
  part: DocxStyleProfilePart,
  paragraphs: ReadonlyArray<ParagraphContext>,
  rule: DocxStyleProfileDropParagraphRule,
  warnings: string[],
): DropApplicationResult {
  const safety = rule.safety ?? {};
  const candidates: ParagraphContext[] = [];
  for (const paragraph of paragraphs) {
    if (paragraphMatchesRunStyleMatcher(paragraph, rule.match)) {
      candidates.push(paragraph);
    }
  }
  if (candidates.length === 0) {
    warnings.push(
      `[style-profile] part=${part} rule=${rule.id}: no paragraph matched`,
    );
    return { removedAny: false, remaining: [...paragraphs] };
  }
  let working = [...paragraphs];
  let removedAny = false;
  for (const candidate of candidates) {
    if (!dropSafetyApplies(candidate, safety, working)) continue;
    working = removeParagraphFromBody(working, candidate);
    removedAny = true;
    const preview = candidate.text.slice(0, 80);
    warnings.push(
      `[style-profile] part=${part} rule=${rule.id}: dropped 1 paragraph (text="${preview}")`,
    );
    if (working.length === 0) break;
  }
  return { removedAny, remaining: working };
}

function applyDropEmptyBetweenRule(
  part: DocxStyleProfilePart,
  paragraphs: ReadonlyArray<ParagraphContext>,
  rule: DocxStyleProfileDropEmptyBetweenRule,
  warnings: string[],
): DropApplicationResult {
  const safety = rule.safety ?? {};
  const maxParagraphs = safety.maxParagraphs ?? DEFAULT_DROP_MAX_PARAGRAPHS;
  const afterIndex = findFirstParagraphIndexMatching(
    paragraphs,
    rule.afterAnchor,
  );
  const beforeIndex = findFirstParagraphIndexMatching(
    paragraphs,
    rule.beforeAnchor,
  );
  if (afterIndex === -1 || beforeIndex === -1) {
    warnings.push(
      `[style-profile] part=${part} rule=${rule.id}: anchor not found (afterAnchor=${
        afterIndex === -1 ? 'MISSING' : 'OK'
      }, beforeAnchor=${beforeIndex === -1 ? 'MISSING' : 'OK'})`,
    );
    return { removedAny: false, remaining: [...paragraphs] };
  }
  if (beforeIndex <= afterIndex) {
    warnings.push(
      `[style-profile] part=${part} rule=${rule.id}: anchors are not in source order (after=${afterIndex}, before=${beforeIndex})`,
    );
    return { removedAny: false, remaining: [...paragraphs] };
  }
  // Snapshot the candidates FIRST (using original indexes), then
  // remove them. This avoids index-shift bookkeeping after each
  // mutation.
  const candidates: ParagraphContext[] = [];
  for (let i = afterIndex + 1; i < beforeIndex; i += 1) {
    const paragraph = paragraphs[i];
    if (!paragraph) continue;
    if (safety.onlyIfAllEmpty === true && !paragraphIsEmpty(paragraph)) {
      continue;
    }
    if (
      safety.keepTrailingPunctuationParagraphs === true &&
      paragraphContentIsPunctuationOnly(paragraph)
    ) {
      continue;
    }
    if (!paragraphIsEmpty(paragraph)) continue;
    candidates.push(paragraph);
    if (candidates.length >= maxParagraphs) break;
  }
  if (candidates.length === 0) {
    return { removedAny: false, remaining: [...paragraphs] };
  }
  let working = [...paragraphs];
  let removedAny = false;
  for (const candidate of candidates) {
    working = removeParagraphFromBody(working, candidate);
    removedAny = true;
  }
  warnings.push(
    `[style-profile] part=${part} rule=${rule.id}: dropped ${
      candidates.length
    } empty paragraph(s) between anchor "${rule.afterAnchor.slice(
      0,
      40,
    )}" and "${rule.beforeAnchor.slice(0, 40)}"`,
  );
  return { removedAny, remaining: working };
}

// (snapshot-based removal — no mutable refs needed)

function applyDropTrailingEmptyRule(
  part: DocxStyleProfilePart,
  paragraphs: ReadonlyArray<ParagraphContext>,
  rule: DocxStyleProfileDropTrailingEmptyRule,
  warnings: string[],
): DropApplicationResult {
  const safety = rule.safety ?? {};
  const maxParagraphs = safety.maxParagraphs ?? DEFAULT_DROP_MAX_PARAGRAPHS;
  const beforeIndex = findFirstParagraphIndexMatching(
    paragraphs,
    rule.beforeAnchor,
  );
  if (beforeIndex === -1) {
    warnings.push(
      `[style-profile] part=${part} rule=${rule.id}: anchor '${rule.beforeAnchor.slice(
        0,
        40,
      )}' not found`,
    );
    return { removedAny: false, remaining: [...paragraphs] };
  }
  // Walk BACKWARD from `beforeIndex - 1` collecting empty / punctuation-only
  // paragraphs to remove. Stop at the first non-empty, non-punctuation
  // paragraph (or when the cap is hit).
  const candidates: ParagraphContext[] = [];
  for (let i = beforeIndex - 1; i >= 0; i -= 1) {
    const paragraph = paragraphs[i];
    if (!paragraph) continue;
    if (paragraphIsEmpty(paragraph)) {
      candidates.push(paragraph);
      if (candidates.length >= maxParagraphs) break;
      continue;
    }
    if (
      safety.keepTrailingPunctuationParagraphs === true &&
      paragraphContentIsPunctuationOnly(paragraph)
    ) {
      candidates.push(paragraph);
      if (candidates.length >= maxParagraphs) break;
      continue;
    }
    // First non-empty, non-punctuation paragraph — stop.
    break;
  }
  if (candidates.length === 0) {
    return { removedAny: false, remaining: [...paragraphs] };
  }
  let working = [...paragraphs];
  let removedAny = false;
  for (const candidate of candidates) {
    working = removeParagraphFromBody(working, candidate);
    removedAny = true;
  }
  warnings.push(
    `[style-profile] part=${part} rule=${rule.id}: dropped ${
      candidates.length
    } trailing empty paragraph(s) before anchor '${rule.beforeAnchor.slice(
      0,
      40,
    )}'`,
  );
  return { removedAny, remaining: working };
}

function findFirstParagraphIndexMatching(
  paragraphs: ReadonlyArray<ParagraphContext>,
  anchor: string,
): number {
  const collapsed = normaliseForSearch(anchor);
  for (let i = 0; i < paragraphs.length; i += 1) {
    const paragraph = paragraphs[i];
    const candidate = normaliseForSearch(paragraph.text);
    if (candidate.length === 0) continue;
    if (candidate.includes(collapsed)) return i;
  }
  return -1;
}

function dropSafetyApplies(
  paragraph: ParagraphContext,
  safety: DocxStyleProfileSafety,
  workingParagraphs: ReadonlyArray<ParagraphContext>,
): boolean {
  if (safety.requireSuperscriptPrefix === true) {
    if (!paragraph.hasSuperscriptRun) return false;
  }
  if (safety.onlyIfAllEmpty === true) {
    if (!paragraphIsEmpty(paragraph)) return false;
  }
  if (safety.keepTrailingPunctuationParagraphs === true) {
    if (paragraphContentIsPunctuationOnly(paragraph)) return false;
  }
  if (safety.requireAnchorAfterText) {
    if (
      !hasAnchorAdjacent(
        workingParagraphs,
        paragraph,
        'after',
        safety.requireAnchorAfterText,
      )
    ) {
      return false;
    }
  }
  if (safety.requireAnchorBeforeText) {
    if (
      !hasAnchorAdjacent(
        workingParagraphs,
        paragraph,
        'before',
        safety.requireAnchorBeforeText,
      )
    ) {
      return false;
    }
  }
  return true;
}

function hasAnchorAdjacent(
  paragraphs: ReadonlyArray<ParagraphContext>,
  pivot: ParagraphContext,
  direction: 'before' | 'after',
  anchorText: string,
): boolean {
  const index = paragraphs.indexOf(pivot);
  if (index === -1) return false;
  const start = direction === 'after' ? index + 1 : index - 1;
  const end = direction === 'after' ? paragraphs.length : -1;
  const step = direction === 'after' ? 1 : -1;
  const collapsed = normaliseForSearch(anchorText);
  for (let i = start; i !== end; i += step) {
    const paragraph = paragraphs[i];
    if (!paragraph) continue;
    // Skip empty paragraphs while walking for the anchor — this lets
    // a drop rule whose target sits between two dense paragraphs
    // still find the anchor even when there are residual empty
    // paragraphs (e.g. paragraph 86 of BM-171 sits after 37 empties
    // and before any "after" content).
    if (paragraphIsEmpty(paragraph)) continue;
    if (normaliseForSearch(paragraph.text).includes(collapsed)) {
      return true;
    }
    return false;
  }
  return false;
}

function paragraphMatchesRunStyleMatcher(
  paragraph: ParagraphContext,
  match: DocxStyleProfileDropParagraphRule['match'],
): boolean {
  switch (match.type) {
    case 'exactText':
      return (
        normaliseForSearch(paragraph.text) === normaliseForSearch(match.text)
      );
    case 'startsWith':
      return normaliseForSearch(paragraph.text).startsWith(
        normaliseForSearch(match.text),
      );
    case 'contains':
      return normaliseForSearch(paragraph.text).includes(
        normaliseForSearch(match.text),
      );
    case 'paragraphAll':
      // Same semantics as `startsWith` for paragraph-level filter;
      // `findAllMatches` then widens the span to the whole paragraph.
      return normaliseForSearch(paragraph.text).startsWith(
        normaliseForSearch(match.text),
      );
  }
}

/**
 * Apply run-style (typographic) rules. Kept as a separate function
 * because the semantics differ from drop rules: they MUTATE run
 * properties inside paragraphs (cannot delete them) and need
 * run-splitting safety, while drop rules DELETE whole paragraphs.
 */
function applyRunStyleRule(
  part: DocxStyleProfilePart,
  paragraphs: ReadonlyArray<ParagraphContext>,
  rule: DocxStyleProfileRule,
  warnings: string[],
  skippedRuleIds: Set<string>,
): { applied: boolean; remaining: ParagraphContext[] | null } {
  const id = runStyleRuleId(rule);
  const matches = findParagraphMatches(paragraphs, rule as RunStyleRule);
  if (matches.length === 0) {
    skippedRuleIds.add(id);
    warnings.push(
      `[style-profile] part=${part} rule=${id}: no paragraph matched`,
    );
    return { applied: false, remaining: null };
  }
  let anyApplied = false;
  let workingParagraphs: ParagraphContext[] | null = null;
  for (const paragraph of matches) {
    const changed = styleParagraphForRule(
      paragraph,
      rule as RunStyleRule,
      warnings,
    );
    if (changed) {
      anyApplied = true;
      if (!workingParagraphs) {
        workingParagraphs = [...paragraphs];
      }
    } else {
      skippedRuleIds.add(id);
      warnings.push(
        `[style-profile] part=${part} rule=${id}: match found but style application skipped (run-splitting safety)`,
      );
    }
  }
  return {
    applied: anyApplied,
    remaining: workingParagraphs,
  };
}

function findParagraphMatches(
  paragraphs: ReadonlyArray<ParagraphContext>,
  rule: DocxStyleProfileRunStyleRule,
): ParagraphContext[] {
  const matched: ParagraphContext[] = [];
  for (const paragraph of paragraphs) {
    const matches = findAllMatches(paragraph.text, rule);
    if (matches.length > 0) matched.push(paragraph);
  }
  return matched;
}

/**
 * Whitespace-normalised match search.
 *
 * DOCX paragraphs frequently interleave `<w:t>…</w:t>` runs with
 * `<w:br/>` and `<w:tab/>` structural elements. Those are preserved
 * as `\n` and `\t` in the engine's paragraph text. A profile rule
 * whose `match.text` was authored against the visually rendered
 * string would NOT match a paragraph that contains a literal
 * `<w:br/>` between two halves of the same phrase even though the
 * visible rendered output is identical.
 *
 * The fix: walk `text` once to build:
 *   - `normalised` — the paragraph text with every run of whitespace
 *     (incl. tabs / newlines) collapsed to a single space.
 *   - `rawIndexForNormalised` — a parallel array such that
 *     `rawIndexForNormalised[i]` is the raw `text` index that
 *     produced the `i`-th character in `normalised`. When a run of
 *     whitespace collapses, the mapping jumps to the LAST character
 *     of the run so that downstream run splitting can still find the
 *     right boundary.
 *
 * Matches are then found in `normalised` coordinates and translated
 * back to raw indices via the mapping.
 */
function findAllMatches(
  text: string,
  rule: DocxStyleProfileRunStyleRule,
): Array<{ start: number; end: number }> {
  const matches: Array<{ start: number; end: number }> = [];
  const target = rule.match.text;
  if (target.length === 0) return matches;

  const { normalised, rawIndex } = buildNormalisedText(text);
  const normalisedTarget = normaliseForSearch(target);
  if (normalisedTarget.length === 0) return matches;

  switch (rule.match.type) {
    case 'exactText': {
      if (normalised !== normalisedTarget) return matches;
      const start = text.indexOf(target);
      if (start < 0) return matches;
      matches.push({ start, end: start + target.length });
      return matches;
    }
    case 'startsWith': {
      if (!normalised.startsWith(normalisedTarget)) return matches;
      const start = text.indexOf(target);
      if (start < 0) return matches;
      matches.push({ start, end: start + target.length });
      return matches;
    }
    case 'contains': {
      let cursor = 0;
      while (cursor <= normalised.length - normalisedTarget.length) {
        const index = normalised.indexOf(normalisedTarget, cursor);
        if (index < 0) break;
        const rawStart = rawIndex[index] ?? -1;
        const rawEndExclusive =
          rawIndex[index + normalisedTarget.length] ?? text.length;
        if (rawStart < 0 || rawEndExclusive <= rawStart) {
          cursor = index + normalisedTarget.length;
          continue;
        }
        matches.push({ start: rawStart, end: rawEndExclusive });
        cursor = index + normalisedTarget.length;
      }
      return matches;
    }
    case 'paragraphAll': {
      // PR7B.2 — match the WHOLE paragraph when it starts with
      // the normalised target. The match span is the entire
      // paragraph text so style rules apply to every run, not
      // only the matched anchor substring.
      if (!normalised.startsWith(normalisedTarget)) return matches;
      matches.push({ start: 0, end: text.length });
      return matches;
    }
  }
}

function buildNormalisedText(text: string): {
  normalised: string;
  rawIndex: number[];
} {
  const normalised: string[] = [];
  const rawIndex: number[] = [];
  let inWhitespace = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text.charAt(i);
    if (/\s/u.test(char)) {
      if (!inWhitespace) {
        normalised.push(' ');
        // `rawIndex` always points at the FIRST character of the
        // collapsed whitespace run when the whitespace was emitted
        // (i.e. `inWhitespace` was previously false). This keeps the
        // mapping usable for run splitting.
        rawIndex.push(i);
        inWhitespace = true;
      }
      continue;
    }
    normalised.push(char);
    rawIndex.push(i);
    inWhitespace = false;
  }

  // Trim trailing whitespace from both arrays to keep
  // normalised.length === rawIndex.length and to make `normalised`
  // directly comparable with `normaliseForSearch(target)`.
  while (normalised.length > 0 && normalised[normalised.length - 1] === ' ') {
    normalised.pop();
    rawIndex.pop();
  }

  return {
    normalised: normalised.join(''),
    rawIndex,
  };
}

function normaliseForSearch(value: string): string {
  return value.replace(/\s+/gu, ' ').trim();
}

function styleParagraphForRule(
  paragraph: ParagraphContext,
  rule: DocxStyleProfileRunStyleRule,
  warnings: string[],
): boolean {
  const matches = findAllMatches(paragraph.text, rule);
  if (matches.length === 0) return false;
  let anyApplied = false;

  // Sort by start descending so earlier split indices remain valid.
  const sorted = [...matches].sort((a, b) => b.start - a.start);
  for (const range of sorted) {
    const applied = styleTextRangeInParagraph(
      paragraph,
      range.start,
      range.end,
      rule.style,
      warnings,
    );
    if (applied) anyApplied = true;
  }
  return anyApplied;
}

function styleTextRangeInParagraph(
  paragraph: ParagraphContext,
  start: number,
  end: number,
  style: DocxStyleProfileRunStyleRule['style'],
  warnings: string[],
  options?: { replacementText?: string },
): boolean {
  const segments = paragraph.segments;
  const affected = segments.filter((s) => s.end > start && s.start < end);
  if (affected.length === 0) return false;

  // PR7B.1 — `replaceText` rule path: when the match crosses multiple
  // runs, only the FIRST affected segment (the one with the earliest
  // `start`) emits the replacement text. Subsequent segments in the
  // loop only contribute their `afterText` fragment. The loop
  // iterates in REVERSE, so the "first affected" segment is the
  // LAST iteration; we mark it explicitly so the styledText is
  // emitted exactly once.
  const isReplaceMode = options?.replacementText !== undefined;
  const firstAffected = affected.reduce(
    (acc, cur) => (acc === null || cur.start < acc.start ? cur : acc),
    null as null | (typeof affected)[number],
  );

  // Per-rule style is applied to the first run only (we keep behaviour
  // aligned with `DocumentPreExportService.styleTextRangeInParagraph`).
  // Multi-run matches are supported but each styled run inherits the
  // first affected segment's properties.
  for (const segment of [...affected].reverse()) {
    const localStart = Math.max(0, start - segment.start);
    const localEnd = Math.min(segment.text.length, end - segment.start);
    if (localStart >= localEnd) continue;
    const beforeText = segment.text.slice(0, localStart);
    const matchedText = segment.text.slice(localStart, localEnd);
    const afterText = segment.text.slice(localEnd);

    const parent = segment.runElement.parentNode;
    if (!parent) {
      warnings.push('[style-profile] run parent node missing — skipped');
      return false;
    }
    const nextSibling = segment.runElement.nextSibling;

    // PR7B.1 — only the first affected segment emits the
    // replacement text; subsequent segments drop their matched
    // fragment (because the replacement has already been emitted
    // and re-emitting it would duplicate). The styledText equals
    // matchedText for run-style rules (the existing behaviour).
    const isFirstSegment = segment === firstAffected;
    const styledText =
      isReplaceMode && isFirstSegment
        ? (options.replacementText as string)
        : isReplaceMode
          ? ''
          : matchedText;

    const replacements: any[] = [];
    if (beforeText.length > 0) {
      replacements.push(cloneRunWithText(segment.runElement, beforeText));
    }
    if (styledText.length > 0) {
      const styled = cloneRunWithText(segment.runElement, styledText);
      applyRunStyle(styled, style);
      replacements.push(styled);
    }
    if (afterText.length > 0) {
      replacements.push(cloneRunWithText(segment.runElement, afterText));
    }

    for (const replacement of replacements) {
      parent.insertBefore(replacement, nextSibling);
    }
    if (segment.runElement.parentNode) {
      segment.runElement.parentNode.removeChild(segment.runElement);
    }
  }

  // Refresh paragraph-level text/segments cache.
  paragraph.segments = getParagraphRunSegments(paragraph.element);
  paragraph.text = paragraph.segments.map((s) => s.text).join('');
  return true;
}

function cloneRunWithText(runElement: any, text: string): any {
  const ownerDocument = runElement.ownerDocument;
  const clone = runElement.cloneNode(true);
  clearRunContent(clone);
  const textNode = ownerDocument.createElementNS(WORD_NS, 'w:t');
  if (/^\s|\s$/.test(text) || text.includes('  ')) {
    textNode.setAttributeNS(XML_NS, 'xml:space', 'preserve');
  }
  textNode.appendChild(ownerDocument.createTextNode(text));
  clone.appendChild(textNode);
  return clone;
}

function clearRunContent(runElement: any): void {
  const children = Array.from(runElement.childNodes ?? []);
  for (const child of children) {
    if (getLocalName(child) !== 'rPr') {
      runElement.removeChild(child);
    }
  }
}

function applyRunStyle(
  runElement: any,
  style: DocxStyleProfileRunStyleRule['style'],
): void {
  const rPr = ensureChildElementLocal(runElement, 'rPr');

  if (style.bold === true) {
    ensureChildElementLocal(rPr, 'b');
  }
  if (style.italic === true) {
    ensureChildElementLocal(rPr, 'i');
  }

  const halfPoints = computeHalfPoints(style);
  if (halfPoints !== null) {
    const value = String(halfPoints);
    const szNode = ensureChildElementLocal(rPr, 'sz');
    szNode.setAttribute('w:val', value);
    const szCsNode = ensureChildElementLocal(rPr, 'szCs');
    szCsNode.setAttribute('w:val', value);
  }
}

function computeHalfPoints(
  style: DocxStyleProfileRunStyleRule['style'],
): number | null {
  if (
    typeof style.fontSizeHalfPt === 'number' &&
    Number.isFinite(style.fontSizeHalfPt)
  ) {
    return Math.max(2, Math.round(style.fontSizeHalfPt));
  }
  if (
    typeof style.fontSizePt === 'number' &&
    Number.isFinite(style.fontSizePt)
  ) {
    return Math.max(1, Math.round(style.fontSizePt * 2));
  }
  return null;
}

function ensureChildElementLocal(parent: any, localName: string): any {
  const ownerDocument = parent.ownerDocument;
  const existing = selectElementsLocal(`./w:${localName}`, parent)[0];
  if (existing) return existing;
  const child = ownerDocument.createElementNS(WORD_NS, `w:${localName}`);
  parent.appendChild(child);
  return child;
}

function selectElementsLocal(expression: string, node: any): any[] {
  return (selectWord(expression, node) as any[]).filter(Boolean);
}

function getParagraphRunSegments(paragraph: any): RunSegment[] {
  const runs = selectElementsLocal('.//w:r', paragraph);
  const segments: RunSegment[] = [];
  let cursor = 0;
  for (const run of runs) {
    const text = getRunText(run);
    if (text.length === 0) continue;
    segments.push({
      runElement: run,
      text,
      start: cursor,
      end: cursor + text.length,
    });
    cursor += text.length;
  }
  return segments;
}

function getRunText(runElement: any): string {
  const pieces: string[] = [];
  const descendants = walkDescendants(runElement);
  for (const node of descendants) {
    const localName = getLocalName(node);
    if (localName === 't' || localName === 'instrText') {
      pieces.push(String(node.textContent ?? ''));
      continue;
    }
    if (localName === 'tab') pieces.push('\t');
    else if (localName === 'br' || localName === 'cr') pieces.push('\n');
  }
  return pieces.join('');
}

function walkDescendants(node: any): any[] {
  const nodes: any[] = [];
  const queue: any[] = Array.from(node?.childNodes ?? []);
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    nodes.push(current);
    const children = Array.from(current.childNodes ?? []);
    queue.unshift(...children);
  }
  return nodes;
}

function getLocalName(node: any): string {
  if (!node) return '';
  if (typeof node.localName === 'string' && node.localName.length > 0) {
    return node.localName;
  }
  const nodeName = String(node.nodeName ?? '');
  const parts = nodeName.split(':');
  return parts[parts.length - 1] ?? '';
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/gu, ' ').trim();
}

function serializeDoc(doc: any, originalXml: string): string {
  const serialized = new XMLSerializer().serializeToString(doc);
  const declarationMatch = originalXml.match(/^<\?xml[\s\S]*?\?>/u);
  if (declarationMatch && !serialized.startsWith('<?xml')) {
    return `${declarationMatch[0]}${serialized}`;
  }
  return serialized;
}
