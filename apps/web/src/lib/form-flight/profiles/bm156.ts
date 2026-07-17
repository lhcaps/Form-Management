/**
 * AUTO-GENERATED SKELETON — NOT FIDELITY COMPLETE.
 *
 * Source: QLLAW_DOCX_FIDELITY_SOURCE_EXTRACT.latest.json + locked
 * contract `docs\audit\docx\contracts\locked\BM-156__ef438a40e567.contract.locked.json`.
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

const BM156_FIELD_PATHS = [
  "accusedDecision.prosecutionDecisionLegalBasisLine",
  "agency.name",
  "agency.parentName",
  "caseDecision.prosecutionDecisionLegalBasisLine",
  "caseJoinder.legalBasisLine",
  "caseRecovery.legalBasisLine",
  "document.documentCode",
  "document.issuePlaceAndDateLine",
  "indictment.absentAccusedNoteLine",
  "indictment.administrativeViolationLine",
  "indictment.aggravatingMitigatingAnalysisLine",
  "indictment.aggravatingMitigatingLine",
  "indictment.article1Line",
  "indictment.caseFileLine",
  "indictment.civilLiabilityLine",
  "indictment.crimeConclusionLine",
  "indictment.criminalActDescriptionLine",
  "indictment.criminalRecordLine",
  "indictment.defendantIdentityLine",
  "indictment.evidenceHandlingLine",
  "indictment.evidenceListLine",
  "indictment.familyBackgroundLine",
  "indictment.otherFactsLine",
  "indictment.preventiveMeasureLine",
  "indictment.replacementLine",
  "indictment.separatedCaseHandlingLine",
  "indictment.specialStatusLine",
  "indictment.summaryConclusionLine",
  "indictment.summonedPersonsLine",
  "investigationConclusion.legalBasisLine",
  "legalBasis.procedureArticlesLine",
  "official.issuerTitle",
  "recipients.accusedLine",
  "recipients.archiveLine",
  "recipients.courtLine",
  "recipients.defenseCounselLine",
  "recipients.investigatingAgencyLine",
  "recipients.otherRecipientLine",
  "signature.positionTitle",
  "signature.signMode",
  "signature.signerName",
] as const;

// No explicit required-field evidence is available in the verified
// extract. Empty array is the safe skeleton default — it matches the
// BM-001 skeleton pattern. A future task may populate this from the
// locked contract's `requiredFieldKeys` list once that evidence is
// promoted.
const BM156_REQUIRED_FIELD_PATHS = [] as const;

export const BM156_FORM_FLIGHT_PROFILE: FormFlightProfile = {
  templateCode: "BM-156",
  title: "Biểu mẫu BM-156",
  // SKELETON: never runtime-ready. Adapter helpers skip this profile.
  runtimeReady: false,
  profileStatus: "skeleton",
  fieldPaths: BM156_FIELD_PATHS,
  requiredFieldPaths: BM156_REQUIRED_FIELD_PATHS,
  // SKELETON: empty demo. Hand-curated fixture required before any
  // `runtime-ready` promotion.
  demo: {},
  // SKELETON: empty acceptance contract. Real BM-156 anchors must
  // be added by hand before promotion.
  acceptance: {
    requiredText: [],
    forbiddenText: [],
  },
};

registerFormFlightProfile(BM156_FORM_FLIGHT_PROFILE);
