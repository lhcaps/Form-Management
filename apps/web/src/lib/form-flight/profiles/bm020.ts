/**
 * AUTO-GENERATED SKELETON — NOT FIDELITY COMPLETE.
 *
 * Source: QLLAW_DOCX_FIDELITY_SOURCE_EXTRACT.latest.json + locked
 * contract `docs\audit\docx\contracts\locked\BM-020__0f61c04c750d.contract.locked.json`.
 *
 * This file is a skeleton, NOT a runtime-ready profile. It is
 * discovered by the Form Flight inventory tooling but is ignored by
 * both adapters (`template-runtime-adapter`,
 * `generated-document-adapter`) because:
 *
 *   - `runtimeReady` is false (or omitted).
 *   - `profileStatus` is "skeleton".
 *
 * `isRuntimeReadyProfile` is fail-closed: a profile that does not
 * match `runtimeReady === true && profileStatus === "runtime-ready"`
 * is treated as "no profile" by the shared core. So this skeleton
 * cannot affect the runtime template lifecycle or the generated-
 * document lifecycle.
 *
 * What is provided here (safe, auto-generated):
 *   - fieldPaths           (locked contract fields, alphabetically sorted)
 *   - requiredFieldPaths   (empty — no explicit required evidence)
 *   - title                (placeholder, hand-curate later)
 *
 * What is INTENTIONALLY left empty (must be hand-authored):
 *   - demo                 (must be hand-curated synthetic fixture)
 *   - summaryLines         (must be authored for quick-check)
 *   - acceptance           (must list real anchors)
 *   - staleFallbacks       (only when evidence exists)
 *
 * Do NOT set `runtimeReady: true` or `profileStatus: "runtime-ready"`
 * on this file until demo, summaryLines, acceptance, and render
 * validation have been hand-authored.
 */

import type { FormFlightProfile } from "../types";
import { registerFormFlightProfile } from "../registry";

const BM020_FIELD_PATHS = [
  "agency.name",
  "agency.parentName",
  "document.documentCode",
  "document.issuePlaceAndDateLine",
  "initiationRequest.article1Line",
  "initiationRequest.article2Line",
  "initiationRequest.orderedAuthorityName",
  "initiationRequest.reasonLine",
  "official.issuerTitle",
  "recipients.archiveLine",
  "signature.positionTitle",
  "signature.signMode",
  "signature.signerName",
] as const;

// No explicit required-field evidence is available in the verified
// extract. Empty array is the safe skeleton default — it matches the
// BM-001 skeleton pattern. A future task may populate this from the
// locked contract's `requiredFieldKeys` list once that evidence is
// promoted.
const BM020_REQUIRED_FIELD_PATHS = [] as const;

export const BM020_FORM_FLIGHT_PROFILE: FormFlightProfile = {
  templateCode: "BM-020",
  title: "Biểu mẫu BM-020",
  // SKELETON: never runtime-ready. Adapter helpers skip this profile.
  runtimeReady: false,
  profileStatus: "skeleton",
  fieldPaths: BM020_FIELD_PATHS,
  requiredFieldPaths: BM020_REQUIRED_FIELD_PATHS,
  // SKELETON: empty demo. Hand-curated fixture required before any
  // `runtime-ready` promotion.
  demo: {},
  // SKELETON: empty acceptance contract. Real BM-020 anchors must
  // be added by hand before promotion.
  acceptance: {
    requiredText: [],
    forbiddenText: [],
  },
};

registerFormFlightProfile(BM020_FORM_FLIGHT_PROFILE);
