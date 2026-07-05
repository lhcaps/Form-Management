/**
 * PR6G.4 — Generic Style Profile Engine: per-template registry.
 *
 * Holds the active set of style profiles keyed by `templateCode`. The
 * registry is intentionally a thin map + lookup function — not a
 * NestJS provider — so the engine stays importable from non-NestJS
 * contexts (Jest specs, harness scripts, shadow renderers).
 *
 * The registry is the ONLY place where BM-specific text (e.g. the
 * "TP. Hồ Chí Minh" place-date marker or the "BIÊN BẢN" body title)
 * is wired into the engine. The engine itself is text-free.
 *
 * Profiles are registered at module load time (see
 * `./template-style-profile.registry.ts` for the BM-001 wiring). A
 * future per-BM registration call (`registerBm171StyleProfile(...)`)
 * follows the same shape without engine changes.
 *
 * @module rendering/infrastructure/style-profile
 */

import type { DocxStyleProfile } from './docx-style-profile.types';

const profiles = new Map<string, DocxStyleProfile>();

/**
 * Register a profile. Idempotent: re-registering the same
 * `templateCode` overwrites the previous profile. Used by the loader
 * at module init.
 */
export function registerStyleProfile(profile: DocxStyleProfile): void {
  profiles.set(profile.templateCode, profile);
}

/**
 * Look up a profile by template code. Returns `null` when no profile is
 * registered — the engine then runs as a byte-identical no-op.
 */
export function getStyleProfileForTemplate(
  templateCode: string,
): DocxStyleProfile | null {
  return profiles.get(templateCode) ?? null;
}

/**
 * Test-only helper. Clears every registered profile so specs that
 * exercise the registry in isolation start from a known state.
 * Production code MUST NOT call this — module init only.
 */
export function __resetStyleProfileRegistryForTests(): void {
  profiles.clear();
}

/**
 * List all registered template codes. Used by audit scripts and tests.
 */
export function listRegisteredTemplateCodes(): string[] {
  return [...profiles.keys()].sort();
}
