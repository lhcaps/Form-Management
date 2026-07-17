/**
 * Profile runtime-readiness guard.
 *
 * Single point of truth for "should the Form Flight adapter helpers
 * treat this profile as authoritative?". Adopted in
 * RESTORE_BM001_PRE_PR7B_RUNTIME_UI_AND_BLOCK_SKELETON_TAKEOVER.
 *
 * Rules (intentionally strict):
 *
 *   1. `runtimeReady === true` AND `profileStatus === "runtime-ready"`
 *      → consult the profile.
 *
 *   2. Either flag missing / set to a non-runtime value → ignore the
 *      profile. The adapter helpers return the no-profile default
 *      (gate → `{ok:true, missing:[]}`, summary → `null`,
 *      acceptance scan → `{passed:true, missingRequired:[], foundForbidden:[]}`,
 *      missing-list → `[]`).
 *
 * The intent is "fail closed": a forgotten `runtimeReady` flag must
 * never silently promote a skeleton profile to authoritative. Skeleton
 * / audit-only profiles must always round-trip through the no-profile
 * default.
 *
 * This module is dependency-free and safe to import from any adapter or
 * test. Do not import React, DOM, fetch.
 */

import type { FormFlightProfile, FormFlightProfileStatus } from "./types";

export function isRuntimeReadyProfile(
  profile: FormFlightProfile | null | undefined,
): profile is FormFlightProfile {
  if (!profile) return false;
  if (profile.runtimeReady !== true) return false;
  return profile.profileStatus === "runtime-ready";
}

/**
 * Persisted-document readiness guard. It is intentionally separate from
 * runtime readiness: a profile accepted here may be used only by a real
 * `/documents/:id` workflow and must never take over `/templates/:code`.
 */
export function isPersistedReadyProfile(
  profile: FormFlightProfile | null | undefined,
): profile is FormFlightProfile {
  if (!profile) return false;
  if (profile.persistedReady !== true) return false;
  return profile.profileStatus === "persisted-ready";
}

/**
 * Coerce the canonical status string for diagnostics and audit
 * pipelines. Defaults to `audit-only` for missing / falsy flags so the
 * rollout factory always has a stable signal.
 */
export function effectiveProfileStatus(
  profile: Pick<
    FormFlightProfile,
    "runtimeReady" | "persistedReady" | "profileStatus"
  >,
): FormFlightProfileStatus {
  if (
    profile.runtimeReady === true &&
    profile.profileStatus === "runtime-ready"
  ) {
    return "runtime-ready";
  }
  if (
    profile.persistedReady === true &&
    profile.profileStatus === "persisted-ready"
  ) {
    return "persisted-ready";
  }
  if (
    profile.profileStatus === "skeleton" ||
    profile.profileStatus === "audit-only"
  ) {
    return profile.profileStatus;
  }
  return "audit-only";
}
