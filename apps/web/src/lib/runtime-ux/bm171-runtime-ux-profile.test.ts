import assert from "node:assert/strict";
import test from "node:test";

import {
  getRuntimeUxProfile,
  listRegisteredRuntimeUxProfiles,
} from "./runtime-ux-profile";
// Importing the barrel eagerly side-effects `bm171-runtime-ux-profile.ts`,
// which is what we want to exercise in this test.
import "./bm171-runtime-ux-profile";

test("BM-171 profile is registered in the runtime UX profile registry", () => {
  const codes = listRegisteredRuntimeUxProfiles();
  assert.ok(
    codes.includes("BM-171"),
    `expected registry to include BM-171, got: ${codes.join(", ")}`,
  );

  const profile = getRuntimeUxProfile("BM-171");
  assert.ok(profile, "expected BM-171 profile to be retrievable");
  assert.equal(profile?.templateCode, "BM-171");
});

test("BM-171 profile section titles are domain-specific and not generic fallbacks", () => {
  const profile = getRuntimeUxProfile("BM-171");
  assert.ok(profile, "profile is required for this assertion");

  const titles = profile!.sections.map((section) => section.title.trim());

  // Sanity: must have at least 5 sections
  assert.ok(
    profile!.sections.length >= 5,
    `expected BM-171 profile to declare at least 5 sections, got ${profile!.sections.length}`,
  );

  // Sanity: no section may be the generic fallback "Thông tin bổ sung"
  for (const title of titles) {
    assert.notStrictEqual(
      title.toLowerCase(),
      "thông tin bổ sung",
      `section title '${title}' must not be the generic fallback`,
    );
  }

  // Sanity: no duplicate titles
  const dedup = new Set(titles);
  assert.equal(
    dedup.size,
    titles.length,
    `expected unique section titles, got duplicates: ${titles.join(" | ")}`,
  );

  // Sanity: must include the canonical BM-171 legal workflow sections
  const expectedFragments = [
    "Cơ quan", // agency + document
    "Căn cứ pháp lý", // legal basis
    "người nhận tài sản", // asset owner / recipient
    "Yêu cầu", // Điều 2
    "Nơi nhận", // recipients
    "Ký ban hành", // signature
  ];
  for (const fragment of expectedFragments) {
    assert.ok(
      titles.some((title) => title.includes(fragment)),
      `expected a section containing '${fragment}', got titles: ${titles.join(" | ")}`,
    );
  }
});

test("BM-171 profile declares UX labels for every field in the demo fixture", () => {
  const profile = getRuntimeUxProfile("BM-171");
  assert.ok(profile, "profile is required for this assertion");

  const demoKeys = Object.keys(profile!.demo);

  // Each demo key must either have an explicit UX override OR a label
  // resolved through the contract (verified separately). For this test we
  // require the profile to declare an override entry for every demo key.
  for (const key of demoKeys) {
    assert.ok(
      profile!.fields[key],
      `BM-171 profile must declare a field override for demo key '${key}'`,
    );
    assert.ok(
      profile!.fields[key].label,
      `BM-171 profile must declare a label for demo key '${key}'`,
    );
  }

  // UX lock-in: helpText noise was removed across the BM-171 profile. The
  // operator-facing surface relies on labels + placeholders only. If a
  // future contributor re-introduces a helpText block they must justify
  // it explicitly in the next EXECUTOR REPORT.
  for (const key of Object.keys(profile!.fields)) {
    assert.ok(
      profile!.fields[key].helpText === undefined,
      `BM-171 profile field '${key}' must not carry a helpText block (placeholders only)`,
    );
  }
});

test("BM-171 profile demo fixture covers every required BM-171 slot", () => {
  const profile = getRuntimeUxProfile("BM-171");
  assert.ok(profile, "profile is required for this assertion");

  // Required slots per the locked contract. Demo fixture must provide a
  // recognisably synthetic value for every one.
  const requiredSlots = [
    "agency.parentName",
    "agency.name",
    "document.documentCode",
    "official.issuerTitle",
    "legalBasis.procedureArticlesLine",
    "caseDecision.prosecutionDecisionLegalBasisLine",
    "accusedDecision.prosecutionDecisionLegalBasisLine",
    "assetReturn.investigationConclusionLegalBasisLine",
    "assetReturn.caseSuspensionDecisionLegalBasisLine",
    "assetReturn.accusedSuspensionDecisionLegalBasisLine",
    "assetReturn.considerationLine",
    "assetReturn.assetListLine",
    "assetOwner.fullName",
    "assetOwner.genderText",
    "assetOwner.dateOfBirthText",
    "assetOwner.placeOfBirth",
    "assetOwner.nationality",
    "assetOwner.ethnicity",
    "assetOwner.religion",
    "assetOwner.occupation",
    "assetOwner.identityNo",
    "assetOwner.identityIssuedDateText",
    "assetOwner.identityIssuedPlace",
    "assetOwner.permanentResidence",
    "assetOwner.currentResidence",
    "assetReturn.executionRequestLine",
    "recipients.line1",
    "recipients.archiveLine",
    "signature.signMode",
    "signature.positionTitle",
    "signature.signerName",
  ];

  for (const slot of requiredSlots) {
    assert.ok(
      profile!.demo[slot],
      `demo fixture must provide a value for slot '${slot}'`,
    );
    // No placeholder leakage like 'undefined', 'null', '{{...}}', 'Invalid Date'.
    const value = profile!.demo[slot];
    assert.doesNotMatch(value, /^\{\{.*\}\}$/, `demo slot '${slot}' has placeholder leak`);
    assert.doesNotMatch(value, /undefined|null/, `demo slot '${slot}' has null/undefined literal`);
    assert.doesNotMatch(value, /Invalid Date/, `demo slot '${slot}' has Invalid Date literal`);
  }
});

test("BM-171 profile forces TEXTAREA on long legal-basis and asset fields", () => {
  const profile = getRuntimeUxProfile("BM-171");
  assert.ok(profile, "profile is required for this assertion");

  const textareaSlots = [
    "legalBasis.procedureArticlesLine",
    "assetReturn.considerationLine",
    "assetReturn.assetListLine",
    "assetReturn.executionRequestLine",
    "assetOwner.permanentResidence",
    "assetOwner.currentResidence",
    "assetOwner.temporaryResidence",
  ];

  for (const slot of textareaSlots) {
    assert.equal(
      profile!.fields[slot]?.control,
      "TEXTAREA",
      `field '${slot}' must declare control: TEXTAREA in BM-171 profile`,
    );
  }
});

test("BM-171 profile upgrades date slots to DATE_TEXT for a real date picker", () => {
  const profile = getRuntimeUxProfile("BM-171");
  assert.ok(profile, "profile is required for this assertion");

  const dateSlots = [
    "assetOwner.dateOfBirthText",
    "assetOwner.identityIssuedDateText",
  ];

  for (const slot of dateSlots) {
    assert.equal(
      profile!.fields[slot]?.control,
      "DATE_TEXT",
      `field '${slot}' must declare control: DATE_TEXT in BM-171 profile`,
    );
  }
});

test("BM-171 profile sectionIds match the compiled contract section IDs", () => {
  // Regression guard: the previous revision used 'section-noi-dung-quyet-dinh'
  // (đ) which is NOT a sectionId in the compiled contract — the actual id is
  // 'section-noi-dung-quyet-inh' (i). The typo caused the renderer to fall
  // through to localizeSectionTitle and display "Thông tin bổ sung" for the
  // Điều 2 section.
  const profile = getRuntimeUxProfile("BM-171");
  assert.ok(profile, "profile is required for this assertion");

  const ids = profile!.sections.map((section) => section.sectionId);
  assert.ok(
    ids.includes("section-noi-dung-quyet-inh"),
    `BM-171 profile must declare override for 'section-noi-dung-quyet-inh' (Điều 2). Got: ${ids.join(", ")}`,
  );
  assert.ok(
    !ids.includes("section-noi-dung-quyet-dinh"),
    `BM-171 profile must NOT use the legacy typo id 'section-noi-dung-quyet-dinh'`,
  );
});

test("BM-171 profile does not include runtime blocklist paths in field keys", () => {
  const profile = getRuntimeUxProfile("BM-171");
  assert.ok(profile, "profile is required for this assertion");

  // Profile must not accidentally re-introduce generatedDocumentId / DB
  // session references. This is a guard against future drift.
  for (const key of Object.keys(profile!.demo)) {
    assert.doesNotMatch(
      key,
      /generatedDocumentId|generatedDocument|generated_document/i,
      `BM-171 profile demo key '${key}' must not reference generated-document DB state`,
    );
  }
});

// BM-171 VISUAL SIGNOFF — summary lines must be data-driven so they
// reflect what the operator actually typed, not a hardcoded demo label.
test("BM-171 profile summaryLines are data-driven functions, not hardcoded strings", () => {
  const profile = getRuntimeUxProfile("BM-171");
  assert.ok(profile, "profile is required for this assertion");
  const lines = profile!.summaryLines ?? [];
  assert.ok(lines.length >= 5, `expected at least 5 summary lines, got ${lines.length}`);

  for (const line of lines) {
    assert.equal(
      typeof line.value,
      "function",
      `summary line '${line.label}' must be a function (data: Record<string, unknown>) => string — hardcoded strings lie when the field is empty`,
    );
  }
});

test("BM-171 profile summaryLines reflect user-typed values, not demo labels", () => {
  const profile = getRuntimeUxProfile("BM-171");
  assert.ok(profile, "profile is required for this assertion");
  const lines = profile!.summaryLines ?? [];
  const resolve = (label: string, data: Record<string, unknown>): string => {
    const line = lines.find((entry) => entry.label === label);
    if (!line) throw new Error(`no summary line for label '${label}'`);
    if (typeof line.value !== "function") {
      throw new Error(`summary line '${label}' is hardcoded; expected a function`);
    }
    return line.value(data);
  };

  // Empty draft → every data-driven summary line must say "—" instead of
  // a stale demo label. This is the visual signoff contract: the summary
  // card must NEVER lie about a value the operator cleared.
  const emptyDraft: Record<string, unknown> = {};
  assert.equal(resolve("Người nhận", emptyDraft), "—", "empty draft must show '—' for Người nhận");
  assert.equal(resolve("Tài sản", emptyDraft), "—", "empty draft must show '—' for Tài sản");
  assert.equal(resolve("Điều 2", emptyDraft), "—", "empty draft must show '—' for Điều 2");
  assert.equal(resolve("Lưu hồ sơ", emptyDraft), "—", "empty draft must show '—' for Lưu hồ sơ");

  // User-typed values must surface verbatim, no demo override.
  const userDraft = {
    assetOwner: { fullName: "Trần Văn User" },
    assetReturn: {
      assetListLine: "01 điện thoại iPhone 15 màu xanh",
      executionRequestLine: "Yêu cầu đơn vị A chuyển giao trong 03 ngày.",
    },
    recipients: { archiveLine: "Lưu: HSVA-USER, HSKS-USER, VP-USER." },
    signature: {
      signMode: "Ký thay",
      positionTitle: "VIỆN TRƯỞNG",
      signerName: "Người Ký User",
    },
  };
  assert.equal(resolve("Người nhận", userDraft), "Trần Văn User");
  assert.equal(resolve("Tài sản", userDraft), "01 điện thoại iPhone 15 màu xanh");
  assert.equal(resolve("Điều 2", userDraft), "Yêu cầu đơn vị A chuyển giao trong 03 ngày.");
  assert.equal(resolve("Lưu hồ sơ", userDraft), "Lưu: HSVA-USER, HSKS-USER, VP-USER.");
  // The "Ký" line must concatenate signMode + positionTitle + signerName
  // in a human-friendly way and must include the typed signer name.
  const ky = resolve("Ký", userDraft);
  assert.ok(ky.includes("VIỆN TRƯỞNG"), `'Ký' must include positionTitle, got '${ky}'`);
  assert.ok(ky.includes("Người Ký User"), `'Ký' must include signerName, got '${ky}'`);
  assert.ok(!ky.includes("(mẫu)"), `'Ký' must NOT include a demo "(mẫu)" marker when the user typed a real signer, got '${ky}'`);

  // Document number line must surface the typed code, not the demo.
  const docDraft = {
    document: {
      documentCode: "99/QĐ-USER",
      issuePlaceAndDateLine: "Bình Dương, ngày 04 tháng 7 năm 2026",
    },
  };
  assert.equal(
    resolve("Số QĐ", docDraft),
    "99/QĐ-USER — Bình Dương, ngày 04 tháng 7 năm 2026",
  );
});