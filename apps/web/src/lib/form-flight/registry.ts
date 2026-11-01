/**
 * Form Flight profile registry — canonical per-template profile
 * indexed by `templateCode`. Both adapters (runtime + generated
 * document) look up the same entry here.
 *
 * Architecture mirrors the existing `runtime-ux` registry
 * (side-effect registration via module-level call). Profiles never
 * touch contracts, DB, or files; they are pure metadata.
 *
 * Public surface:
 *   - `registerFormFlightProfile(profile)` — side-effect registration
 *   - `getFormFlightProfile(templateCode)` — defensive deep-clone
 *   - `listFormFlightProfiles()` — diagnostics
 *   - `__resetFormFlightProfilesForTests()` — test-only
 *
 * The deep-clone preserves function nodes in `summaryLines.value` so
 * adapters that consume the returned profile never accidentally share
 * function identity across calls (mutating one caller's data would
 * otherwise leak into another caller's profile).
 */

import type { FormFlightProfile } from "./types";

const FORM_FLIGHT_PROFILES: Map<string, FormFlightProfile> = new Map();

export function registerFormFlightProfile(
  profile: FormFlightProfile,
): void {
  FORM_FLIGHT_PROFILES.set(profile.templateCode, profile);
}

export function getFormFlightProfile(
  templateCode: string,
): FormFlightProfile | null {
  const profile = FORM_FLIGHT_PROFILES.get(templateCode);
  return profile ? clonePreservingFunctions(profile) : null;
}

export function listFormFlightProfiles(): readonly string[] {
  return Array.from(FORM_FLIGHT_PROFILES.keys()).sort();
}

export function __resetFormFlightProfilesForTests(): void {
  FORM_FLIGHT_PROFILES.clear();
}

function clonePreservingFunctions<T>(value: T): T {
  if (typeof value === "function") return value;
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map((entry) =>
      clonePreservingFunctions(entry),
    ) as unknown as T;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = clonePreservingFunctions(v);
  }
  return out as T;
}