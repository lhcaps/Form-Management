/**
 * BM-001 second pilot — skeleton FormFlightProfile.
 *
 * This file is a skeleton, not a full profile. It proves that the
 * rollout factory pipeline (FORM_FLIGHT_PROFILE_SKELETONS.latest.json)
 * can be turned into a real profile module for a non-BM-171 form
 * without touching the existing component, API helper or save path.
 *
 * What is provided here:
 *   - fieldPaths          (full set, from the Bm001FormInputs type)
 *   - requiredFieldPaths  (matches the panel's REQUIRED_FIELDS list)
 *
 * What is INTENTIONALLY left empty / marked `_todo`:
 *   - demo                (must be hand-curated synthetic fixture)
 *   - summaryLines        (must be authored for BM-001 quick-check)
 *   - acceptance          (must list real BM-001 anchors)
 *
 * Consumers of this skeleton (today: only the shared-core tests)
 * can register the profile but should treat `fieldPaths` /
 * `requiredFieldPaths` as the only stable surface. The skeleton will
 * be promoted to a production profile in a future task that does not
 * touch any of the 60 form components.
 *
 * NOTE: BM-001 is the second pilot per the task prompt — preferred
 * over BM-033 because BM-001 already has a mature API helper
 * (`apps/web/src/lib/bm001-form-inputs-api.ts`) and the largest
 * locked-contract surface among the 60 forms.
 */

import type { FormFlightProfile } from "../types";
import { registerFormFlightProfile } from "../registry";

const BM001_FIELD_PATHS = [
  "agency.parentName",
  "agency.name",
  "agency.issuePlace",
  "document.issueDate",
  "reception.startedAtTimeText",
  "reception.startedAtDate",
  "reception.locationName",
  "reception.endedAtTimeText",
  "reception.endedAtDate",
  "receiver.fullName",
  "receiver.positionTitle",
  "receiver.departmentName",
  "receiver.signerName",
  "informant.fullName",
  "informant.genderLabel",
  "informant.otherName",
  "informant.dateOfBirth",
  "informant.birthYear",
  "informant.placeOfBirth",
  "informant.nationality",
  "informant.ethnicity",
  "informant.religion",
  "informant.occupation",
  "informant.identityNo",
  "informant.identityIssuedDate",
  "informant.identityIssuedPlace",
  "informant.permanentAddress",
  "informant.temporaryAddress",
  "informant.currentAddress",
  "informant.phone",
  "informant.representedOrganization",
  "informant.signerName",
  "crimeReport.content",
  "crimeReport.attachedItemsDescription",
  "recipients.archiveLine",
] as const;

const BM001_REQUIRED_FIELD_PATHS = [
  "agency.parentName",
  "agency.name",
  "agency.issuePlace",
  "document.issueDate",
  "reception.startedAtTimeText",
  "reception.startedAtDate",
  "reception.locationName",
  "reception.endedAtTimeText",
  "reception.endedAtDate",
  "receiver.fullName",
  "receiver.positionTitle",
  "receiver.departmentName",
  "informant.fullName",
  "informant.genderLabel",
  "informant.otherName",
  "informant.placeOfBirth",
  "informant.nationality",
  "informant.occupation",
  "informant.currentAddress",
  "crimeReport.content",
  "crimeReport.attachedItemsDescription",
  "recipients.archiveLine",
] as const;

export const BM001_FORM_FLIGHT_PROFILE: FormFlightProfile = {
  templateCode: "BM-001",
  title: "Biên bản tiếp nhận nguồn tin về tội phạm",
  fieldPaths: BM001_FIELD_PATHS,
  requiredFieldPaths: BM001_REQUIRED_FIELD_PATHS,
  // SKELETON: empty demo. A future task must populate this with
  // hand-curated synthetic fixture (no real PII). Until then the
  // shared-core payload builder is a no-op for BM-001.
  demo: {},
  // SKELETON: no summary lines yet. A future task must add 4-8
  // data-driven lines keyed off BM001_FIELD_PATHS.
  summaryLines: undefined,
  // SKELETON: empty acceptance contract. A future task must add the
  // BM-001 specific requiredText / forbiddenText anchors.
  acceptance: {
    requiredText: [],
    forbiddenText: [],
  },
};

registerFormFlightProfile(BM001_FORM_FLIGHT_PROFILE);