import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const repoRoot = resolve(import.meta.dirname, "..");
const modulePath = join(
  repoRoot,
  "scripts",
  "form-refinement",
  "normalized-contract-refinement.mjs",
);
const contractsDir = join(repoRoot, "docs", "audit", "docx", "contracts");

const EXPECTED_FIELDS = Object.freeze({
  "BM-005": [
    "agency.parentName",
    "agency.name",
    "document.documentCode",
    "document.issuePlaceAndDateLine",
    "sourceVerification.requestRoundText",
    "sourceVerification.procedureArticlesLine",
    "sourceVerification.reasonLine",
    "sourceVerification.requestedAuthorityLine",
    "sourceVerification.issue1Line",
    "sourceVerification.issue2Line",
    "sourceVerification.issue3Line",
    "sourceVerification.additionalIssuesLine",
    "sourceVerification.resultSubmissionLine",
    "recipients.investigatingAgencyLine",
    "recipients.archiveLine",
    "signature.signerName",
  ],
  "BM-006": [
    "agency.parentName",
    "agency.name",
    "document.documentCode",
    "document.issuePlaceAndDateLine",
    "official.issuerTitle",
    "sourceRequest.reasonLine",
    "sourceRequest.receiverName",
    "sourceRequest.actionLine",
    "sourceRequest.caseSummary",
    "sourceRequest.actionResultLine",
    "agency.bodyName",
    "recipients.primaryLine",
    "signature.signMode",
    "signature.positionTitle",
    "signature.signerName",
  ],
  "BM-007": [
    "agency.parentName",
    "agency.name",
    "document.documentCode",
    "document.issuePlaceAndDateLine",
    "official.issuerTitle",
    "legalBasis.procedureArticlesLine",
    "sourceMaterialRequest.reasonLine",
    "sourceMaterialRequest.article1Line",
    "sourceMaterialRequest.documentItem1Line",
    "sourceMaterialRequest.documentItem2Line",
    "sourceMaterialRequest.documentItem3Line",
    "sourceMaterialRequest.additionalDocumentItemsLine",
    "sourceMaterialRequest.deadlineLine",
    "recipients.primaryLine",
    "recipients.archiveLine",
    "signature.positionTitle",
    "signature.signerName",
  ],
  "BM-008": [
    "agency.parentName",
    "agency.name",
    "document.documentCode",
    "document.issuePlaceAndDateLine",
    "official.issuerTitle",
    "sourceTransfer.caseSummary",
    "sourceTransfer.reasonLine",
    "sourceTransfer.senderName",
    "sourceTransfer.receiverName",
    "agency.bodyName",
    "recipients.primaryLine",
    "signature.signMode",
    "signature.positionTitle",
    "signature.signerName",
  ],
  "BM-009": [
    "agency.parentName",
    "agency.name",
    "document.documentCode",
    "document.issuePlaceAndDateLine",
    "official.issuerTitle",
    "sourceResolutionExtension.procedureArticlesLine",
    "sourceResolutionExtension.receptionLegalBasisLine",
    "sourceResolutionExtension.proposalLegalBasisLine",
    "sourceResolutionExtension.reasonLine",
    "sourceResolutionExtension.article1Line",
    "sourceResolutionExtension.article2Line",
    "sourceResolutionExtension.requestingAgencyRecipientLine",
    "recipients.archiveLine",
    "signature.signMode",
    "signature.positionTitle",
    "signature.signerName",
  ],
  "BM-010": [
    "agency.parentName",
    "agency.name",
    "document.documentCode",
    "document.issuePlaceAndDateLine",
    "official.issuerTitle",
    "sourceSuspension.reasonLine",
    "sourceSuspension.caseSummary",
    "agency.bodyName",
    "sourceSuspension.receivedDateLine",
    "sourceSuspension.article2Line",
    "sourceSuspension.article3Line",
    "recipients.primaryLine",
    "signature.signMode",
    "signature.positionTitle",
    "signature.signerName",
  ],
  "BM-011": [
    "agency.parentName",
    "agency.name",
    "document.documentCode",
    "document.issuePlaceAndDateLine",
    "official.issuerTitle",
    "legalBasis.procedureArticlesLine",
    "sourceSuspensionCancellation.considerationLine",
    "sourceSuspensionCancellation.article1Line",
    "sourceSuspensionCancellation.article2Line",
    "recipients.primaryLine",
    "recipients.sourceProviderLine",
    "recipients.archiveLine",
    "signature.signMode",
    "signature.positionTitle",
    "signature.signerName",
  ],
  "BM-012": [
    "agency.parentName",
    "agency.name",
    "document.documentCode",
    "document.issuePlaceAndDateLine",
    "official.issuerTitle",
    "sourceRecovery.reasonLine",
    "sourceRecovery.suspensionDecisionCode",
    "sourceRecovery.suspensionDecisionIssueDateLine",
    "sourceRecovery.suspensionDecisionIssuedBy",
    "sourceRecovery.caseSummary",
    "recipients.primaryLine",
    "signature.signMode",
    "signature.positionTitle",
    "signature.signerName",
  ],
  "BM-014": [
    "agency.parentName",
    "agency.name",
    "document.documentCode",
    "document.issuePlaceAndDateLine",
    "official.issuerTitle",
    "legalBasis.procedureArticlesLine",
    "sourceDirectInspection.article1Line",
    "sourceDirectInspection.teamLeaderLine",
    "sourceDirectInspection.member1Line",
    "sourceDirectInspection.member2Line",
    "sourceDirectInspection.additionalMembersLine",
    "sourceDirectInspection.article3Line",
    "sourceDirectInspection.article4Line",
    "recipients.primaryLine",
    "recipients.teamMembersLine",
    "recipients.archiveLine",
    "signature.signMode",
    "signature.positionTitle",
    "signature.signerName",
  ],
  "BM-015": [
    "agency.parentName",
    "agency.name",
    "document.documentCode",
    "document.issuePlaceAndDateLine",
    "sourceDirectInspectionPlan.attachedDecisionLine",
    "sourceDirectInspectionPlan.purposeLine1",
    "sourceDirectInspectionPlan.purposeLine2",
    "sourceDirectInspectionPlan.purposeLine3",
    "sourceDirectInspectionPlan.receivedStatsBlock",
    "sourceDirectInspectionPlan.resolvedStatsBlock",
    "sourceDirectInspectionPlan.prosecutionDecisionStatsLine",
    "sourceDirectInspectionPlan.nonProsecutionDecisionStatsLine",
    "sourceDirectInspectionPlan.transferredStatsLine",
    "sourceDirectInspectionPlan.pendingStatsLine",
    "sourceDirectInspectionPlan.suspendedStatsLine",
    "sourceDirectInspectionPlan.advantagesLine",
    "sourceDirectInspectionPlan.limitationsLine",
    "sourceDirectInspectionPlan.recommendationsLine",
    "sourceDirectInspectionPlan.inspectionTimeLine",
    "sourceDirectInspectionPlan.dataPeriodLine",
    "sourceDirectInspectionPlan.methodsBlock",
    "sourceDirectInspectionPlan.requestPreparationLine",
    "recipients.primaryLine",
    "recipients.teamMembersLine",
    "recipients.archiveLine",
    "signature.signMode",
    "signature.positionTitle",
    "signature.signerName",
  ],
  "BM-016": [
    "agency.parentName",
    "agency.name",
    "document.documentCode",
    "document.issuePlaceAndDateLine",
    "legalBasis.procedureArticlesLine",
    "sourceDirectInspectionConclusion.implementationDecisionLine",
    "sourceDirectInspectionConclusion.receivedTotalLine",
    "sourceDirectInspectionConclusion.receivedDenunciationLine",
    "sourceDirectInspectionConclusion.receivedCrimeReportLine",
    "sourceDirectInspectionConclusion.receivedProsecutionRequestLine",
    "sourceDirectInspectionConclusion.receivedDirectDiscoveryLine",
    "sourceDirectInspectionConclusion.receivedSelfSurrenderLine",
    "sourceDirectInspectionConclusion.receivedOtherLine",
    "sourceDirectInspectionConclusion.resolvedStatsBlock",
    "sourceDirectInspectionConclusion.prosecutionDecisionStatsLine",
    "sourceDirectInspectionConclusion.nonProsecutionDecisionStatsLine",
    "sourceDirectInspectionConclusion.transferredStatsLine",
    "sourceDirectInspectionConclusion.pendingStatsLine",
    "sourceDirectInspectionConclusion.suspendedStatsLine",
    "sourceDirectInspectionConclusion.advantagesLine",
    "sourceDirectInspectionConclusion.violationsLine",
    "sourceDirectInspectionConclusion.violationReasonsLine",
    "sourceDirectInspectionConclusion.recommendationsBlock",
    "sourceDirectInspectionConclusion.implementationRequestLine",
    "recipients.primaryLine",
    "recipients.teamMembersLine",
    "recipients.archiveLine",
    "signature.signMode",
    "signature.positionTitle",
    "signature.signerName",
  ],
  "BM-017": [
    "agency.parentName",
    "agency.name",
    "document.documentCode",
    "document.issuePlaceAndDateLine",
    "official.issuerTitle",
    "caseInitiationRequest.procedureArticlesLine",
    "caseInitiationRequest.assessmentLine",
    "caseInitiationRequest.article1Line",
    "caseInitiationRequest.article2Line",
    "caseInitiationRequest.investigationAuthorityRecipientLine",
    "recipients.archiveLine",
    "signature.signMode",
    "signature.positionTitle",
    "signature.signerName",
  ],
  "BM-018": [
    "agency.parentName",
    "agency.name",
    "document.documentCode",
    "document.issuePlaceAndDateLine",
    "official.issuerTitle",
    "legalBasis.procedureArticlesLine",
    "caseInitiationChangeRequest.considerationLine",
    "caseInitiationChangeRequest.currentOffenseLegalLine",
    "caseInitiationChangeRequest.changeGroundLine",
    "caseInitiationChangeRequest.newOffenseLegalLine",
    "caseInitiationChangeRequest.requestAuthorityLine",
    "caseInitiationChangeRequest.requestChangeDecisionLine",
    "recipients.primaryLine",
    "recipients.archiveLine",
    "signature.signMode",
    "signature.positionTitle",
    "signature.signerName",
  ],
});

let refinement = null;
if (existsSync(modulePath)) {
  refinement = await import(pathToFileURL(modulePath));
}

function requireRefinement() {
  assert.ok(
    refinement,
    "normalized contract refinement module must exist before these tests can pass",
  );
  return refinement;
}

function loadContract(code) {
  const fileName = refinement.findContractFile(repoRoot, code);
  return JSON.parse(readFileSync(join(contractsDir, fileName), "utf8"));
}

test("normalized contract refinement module exists", () => {
  requireRefinement();
});

test("selected-code parsing is deterministic and rejects malformed codes", () => {
  const api = requireRefinement();
  assert.deepEqual(api.parseSelectedCodes(["--codes", "BM-010,BM-005 BM-010"]), [
    "BM-005",
    "BM-010",
  ]);
  assert.throws(
    () => api.parseSelectedCodes(["--codes", "BM-5"]),
    /Invalid BM code/u,
  );
});

test("contract preparation is a side-effect-free dry run", () => {
  const api = requireRefinement();
  const contractPath = join(contractsDir, api.findContractFile(repoRoot, "BM-005"));
  const before = readFileSync(contractPath, "utf8");
  const prepared = api.prepareContractRefinement(repoRoot, "BM-005");
  const after = readFileSync(contractPath, "utf8");

  assert.equal(prepared.code, "BM-005");
  assert.ok(prepared.original.canonicalFields.length > 0);
  assert.equal(prepared.refined.canonicalFields.length, 16);
  assert.equal(after, before);
});

test("refinement evidence markdown ends with exactly one newline", () => {
  const api = requireRefinement();
  const markdown = api.formatRefinementEvidenceMarkdown({
    codes: ["BM-011"],
    overallStatus: "PASS",
    results: [
      {
        code: "BM-011",
        status: "PASS",
        normalizedDocxPath:
          "storage/templates/normalized-docx/BM-011/BM-011_normalized.docx",
        normalizedDocxSha256: "abc123",
        fields: 15,
        bindings: 15,
        compile: { ok: true },
        packageIntegrity: { status: "pass" },
        unresolvedPlaceholders: [],
        missingSampleValues: [],
        literalLeakage: [],
      },
    ],
  });

  assert.match(markdown, /\n$/u);
  assert.doesNotMatch(markdown, /\n\n$/u);
});

test("every refinement profile uses a registered field taxonomy namespace", () => {
  const api = requireRefinement();
  const taxonomy = JSON.parse(
    readFileSync(join(repoRoot, "docs", "contracts", "field-taxonomy.json"), "utf8"),
  );
  const namespaces = new Set(Object.keys(taxonomy.namespaces));

  for (const code of Object.keys(EXPECTED_FIELDS)) {
    const profile = api.loadRefinementProfile(repoRoot, code);
    for (const path of Object.keys(profile.fields)) {
      assert.ok(
        namespaces.has(path.split(".")[0]),
        `${code} uses unregistered namespace in ${path}`,
      );
    }
  }
});

for (const [code, expectedFields] of Object.entries(EXPECTED_FIELDS)) {
  test(`${code} normalized DOCX placeholders exactly match its reviewed profile`, () => {
    const api = requireRefinement();
    const profile = api.loadRefinementProfile(repoRoot, code);
    const discovery = api.discoverNormalizedPlaceholders(repoRoot, code);

    assert.deepEqual(discovery.orderedPaths, expectedFields);
    assert.deepEqual(Object.keys(profile.fields), expectedFields);
    assert.deepEqual(api.validateProfileParity(profile, discovery), []);
  });

  test(`${code} builds a semantic review-required draft that compiles`, () => {
    const api = requireRefinement();
    const profile = api.loadRefinementProfile(repoRoot, code);
    const discovery = api.discoverNormalizedPlaceholders(repoRoot, code);
    const refined = api.buildRefinedContract({
      repoRoot,
      code,
      profile,
      discovery,
      contract: loadContract(code),
    });

    assert.equal(refined.status, "draft");
    assert.equal(refined.docxSlots.length, expectedFields.length);
    assert.equal(refined.canonicalFields.length, expectedFields.length);
    assert.equal(refined.renderBindings.length, expectedFields.length);
    assert.deepEqual(
      refined.canonicalFields.map((field) => field.path),
      expectedFields,
    );
    assert.deepEqual(
      refined.canonicalFields.filter((field) => field.source !== "unknown"),
      [],
    );
    assert.deepEqual(
      [
        ...refined.docxSlots,
        ...refined.canonicalFields,
        ...refined.renderBindings,
      ].filter((item) => item.reviewRequired !== true),
      [],
    );
    assert.deepEqual(
      refined.canonicalFields.filter((field) => /\.field\d+$/u.test(field.path)),
      [],
    );
    assert.equal(
      refined.warnings.some((warning) => warning.startsWith("Clx parse error:")),
      false,
      `${code} normalized-DOCX refinement must not retain an obsolete legacy .doc parser warning`,
    );
    assert.ok(
      refined.warnings.some((warning) =>
        warning.includes("human semantic/legal review is still required"),
      ),
      `${code} must retain the human-review warning`,
    );

    const requireFromContracts = createRequire(
      join(repoRoot, "packages", "form-contracts", "package.json"),
    );
    const { adaptV1Contract, compileContract } =
      requireFromContracts("@qllaw/form-contracts");
    const adapted = adaptV1Contract(refined);
    adapted.templateHash = discovery.sha256;
    adapted.normalizedDocxPath = discovery.relativePath;
    const compiled = compileContract(adapted);
    assert.equal(
      compiled.ok,
      true,
      compiled.issues.map((issue) => `${issue.code}:${issue.path}`).join(", "),
    );
  });

  test(`${code} sample preview resolves fields without damaging the DOCX package`, () => {
    const api = requireRefinement();
    const profile = api.loadRefinementProfile(repoRoot, code);
    const preview = api.renderRefinementPreview({ repoRoot, code, profile });

    assert.equal(preview.packageIntegrity.status, "pass");
    assert.deepEqual(preview.unresolvedPlaceholders, []);
    assert.deepEqual(preview.missingSampleValues, []);
    assert.deepEqual(preview.literalLeakage, []);
    assert.ok(preview.renderedBuffer.length > 0);
  });
}
