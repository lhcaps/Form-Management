/**
 * PR6G.4 — Generic Style Profile Engine: public API.
 *
 * This is the only file the rest of the codebase needs to import. It
 * re-exports the engine, types, and registry, and registers every
 * built-in profile at module load time (currently only BM-001).
 *
 * Adding a new BM profile:
 *   1. Create `bmXXX-style-profile.ts` next to this file.
 *   2. Import the profile constant below.
 *   3. Add it to `BUILTIN_PROFILES`.
 *   4. The render engine picks it up automatically via
 *      `getStyleProfileForTemplate(templateCode)`.
 *
 * @module rendering/infrastructure/style-profile
 */

import { BM001_STYLE_PROFILE } from './bm001-style-profile';
import { BM171_STYLE_PROFILE } from './bm171-style-profile';
import type { DocxStyleProfile } from './docx-style-profile.types';
import {
  __resetStyleProfileRegistryForTests,
  registerStyleProfile,
} from './template-style-profile.registry';

const BUILTIN_PROFILES: ReadonlyArray<DocxStyleProfile> = [
  BM001_STYLE_PROFILE,
  BM171_STYLE_PROFILE,
];

/**
 * Registers every built-in profile exactly once. Safe to call multiple
 * times — `__resetStyleProfileRegistryForTests` clears the registry
 * AND the init guard, so this re-initialises cleanly between specs.
 */
export function ensureStyleProfilesRegistered(): void {
  __resetStyleProfileRegistryForTests();
  for (const profile of BUILTIN_PROFILES) {
    registerStyleProfile(profile);
  }
}

// Eagerly register at module load. Side-effect: importing this module
// registers all built-in profiles. The registry is idempotent.
ensureStyleProfilesRegistered();

export { applyStyleProfileToDocxBuffer } from './docx-style-rule-engine';
export type {
  DocxStyleProfile,
  DocxStyleProfilePart,
  DocxStyleProfileMatch,
  DocxStyleProfileRule,
  DocxStyleProfileRunStyleRule,
  DocxStyleProfileDropParagraphRule,
  DocxStyleProfileDropEmptyBetweenRule,
  DocxStyleProfileDropTrailingEmptyRule,
  DocxStyleProfileSafety,
  DocxStyleProfileStyle,
  StyleApplicationResult,
} from './docx-style-profile.types';
export {
  getStyleProfileForTemplate,
  listRegisteredTemplateCodes,
  registerStyleProfile,
  __resetStyleProfileRegistryForTests,
} from './template-style-profile.registry';
export { BM001_STYLE_PROFILE } from './bm001-style-profile';
export { BM171_STYLE_PROFILE } from './bm171-style-profile';