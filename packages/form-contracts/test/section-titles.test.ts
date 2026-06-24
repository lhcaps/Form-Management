/**
 * Unit tests for the Vietnamese section title helpers (PLAN.md v2.3 §B2).
 *
 * Covers:
 *  - The minimum SECTION_TITLES entries from the B2 brief.
 *  - getSectionTitle()'s Vietnamese lookup for known keys.
 *  - getSectionTitle()'s English humanizeSectionKey fallback for unknown keys.
 *  - humanizeSectionKey() handling camelCase, snake_case, kebab-case.
 *  - humanizeSectionKey() never returning an empty string.
 *  - deriveFormInputSchema() using the Vietnamese title for at least one
 *    representative BM section.
 */

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { deriveFormInputSchema } from "../src/derive-form-input-schema.js";
import {
  SECTION_TITLES,
  getSectionTitle,
  humanizeSectionKey,
} from "../src/section-titles.js";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..", "..");
const LOCKED_DIR = resolve(
  REPO_ROOT,
  "docs",
  "audit",
  "docx",
  "contracts",
  "locked",
);

const MINIMUM_SECTION_TITLES: Record<string, string> = {
  agency: "Cơ quan",
  document: "Văn bản",
  caseInfo: "Thông tin vụ án",
  content: "Nội dung",
  recipients: "Nơi nhận",
  signature: "Chữ ký",
  decision: "Quyết định",
  legalBasis: "Căn cứ pháp lý",
  offense: "Hành vi / tội danh",
  measure: "Biện pháp tố tụng",
  reception: "Tiếp nhận",
  receiver: "Người tiếp nhận",
  informant: "Người cung cấp tin",
  crimeReport: "Tin báo / tố giác",
  accusedDecision: "Quyết định về bị can",
  caseDecision: "Quyết định vụ án",
  attachments: "Tài liệu kèm theo",
  indictment: "Cáo trạng",
  monitoring: "Kiểm sát",
  proposal: "Đề xuất",
  investigation: "Điều tra",
  investigationConclusion: "Kết luận điều tra",
  caseJoinder: "Nhập vụ án",
  caseRecovery: "Khôi phục vụ án",
  investigationExtension: "Gia hạn điều tra",
  prosecutionExtension: "Gia hạn truy tố",
  prosecutionTransfer: "Chuyển truy tố",
  approval: "Phê duyệt",
  // B3 pre-step: high-frequency keys surfaced by the B2 corpus scan.
  official: "Thông tin người có thẩm quyền",
  person: "Thông tin cá nhân",
};

function loadLockedContract(templateCode: string): Record<string, unknown> {
  const entries = readdirSync(LOCKED_DIR);
  const match = entries.find((entry) => entry.startsWith(`${templateCode}__`));
  if (!match) {
    throw new Error(`No locked contract found for ${templateCode}`);
  }
  const raw = readFileSync(resolve(LOCKED_DIR, match), "utf8");
  return JSON.parse(raw) as Record<string, unknown>;
}

test("SECTION_TITLES contains every entry required by the B2 brief", () => {
  for (const [key, expected] of Object.entries(MINIMUM_SECTION_TITLES)) {
    assert.equal(
      SECTION_TITLES[key],
      expected,
      `SECTION_TITLES["${key}"] must equal "${expected}"`,
    );
  }
});

test("getSectionTitle returns the Vietnamese title for known keys", () => {
  assert.equal(getSectionTitle("agency"), "Cơ quan");
  assert.equal(getSectionTitle("legalBasis"), "Căn cứ pháp lý");
  assert.equal(getSectionTitle("informant"), "Người cung cấp tin");
  assert.equal(getSectionTitle("caseRecovery"), "Khôi phục vụ án");
  assert.equal(getSectionTitle("indictment"), "Cáo trạng");
  // B3 pre-step: high-frequency keys from the B2 corpus scan.
  assert.equal(
    getSectionTitle("official"),
    "Thông tin người có thẩm quyền",
  );
  assert.equal(getSectionTitle("person"), "Thông tin cá nhân");
});

test("getSectionTitle falls back to humanizeSectionKey for unknown keys", () => {
  assert.equal(
    getSectionTitle("unknownFutureSection"),
    "Unknown Future Section",
  );
  assert.equal(
    getSectionTitle("someBrandNewKey"),
    "Some Brand New Key",
  );
  // An unknown key with snake_case is still humanized.
  assert.equal(getSectionTitle("not_yet_translated"), "Not Yet Translated");
});

test("humanizeSectionKey handles camelCase, snake_case, and kebab-case", () => {
  assert.equal(humanizeSectionKey("caseInfo"), "Case Info");
  assert.equal(humanizeSectionKey("legalBasis"), "Legal Basis");
  assert.equal(humanizeSectionKey("case_recovery"), "Case Recovery");
  assert.equal(humanizeSectionKey("case-recovery"), "Case Recovery");
  assert.equal(humanizeSectionKey("unknownFutureSection"), "Unknown Future Section");
});

test("humanizeSectionKey never returns an empty string for non-empty keys", () => {
  for (const key of [
    "agency",
    "caseInfo",
    "case_recovery",
    "case-recovery",
    "X",
    "singleword",
  ]) {
    const result = humanizeSectionKey(key);
    assert.ok(result.length > 0, `expected non-empty for "${key}", got "${result}"`);
  }
  // Whitespace-only input is coerced to a sensible non-empty string so
  // downstream consumers never have to handle an empty title.
  const trimmed = humanizeSectionKey("   ");
  assert.ok(trimmed.length > 0);
  assert.equal(humanizeSectionKey(""), "Section");
});

test("getSectionTitle never throws and always returns a non-empty string", () => {
  for (const key of [
    "agency",
    "legalBasis",
    "notInMap",
    "x",
    "",
    "  ",
    "with spaces inside",
  ]) {
    const result = getSectionTitle(key);
    assert.equal(typeof result, "string");
    assert.ok(result.length > 0, `expected non-empty for "${key}", got "${result}"`);
  }
});

test("deriveFormInputSchema uses the Vietnamese title for at least one known section in BM-001", () => {
  // BM-001 has sections document, receiver, informant, recipients.
  // receiver and informant are in the SECTION_TITLES map.
  const contract = loadLockedContract("BM-001");
  const schema = deriveFormInputSchema(contract);
  const titles = schema.sections.map((s) => s.title);
  assert.ok(
    titles.includes("Người tiếp nhận"),
    `expected "Người tiếp nhận" in BM-001 sections, got ${JSON.stringify(titles)}`,
  );
  assert.ok(
    titles.includes("Người cung cấp tin"),
    `expected "Người cung cấp tin" in BM-001 sections, got ${JSON.stringify(titles)}`,
  );
});

test("deriveFormInputSchema uses the Vietnamese title for legalBasis in BM-053", () => {
  const contract = loadLockedContract("BM-053");
  const schema = deriveFormInputSchema(contract);
  const legalBasis = schema.sections.find((s) => s.key === "legalBasis");
  assert.ok(legalBasis, "BM-053 should produce a legalBasis section");
  assert.equal(legalBasis!.title, "Căn cứ pháp lý");
});

test("deriveFormInputSchema returns the Vietnamese title for agency in BM-051", () => {
  const contract = loadLockedContract("BM-051");
  const schema = deriveFormInputSchema(contract);
  const agency = schema.sections.find((s) => s.key === "agency");
  assert.ok(agency, "BM-051 should produce an agency section");
  assert.equal(agency!.title, "Cơ quan");
});

test("deriveFormInputSchema never fails for unknown section keys (non-blocking fallback)", () => {
  // A contract whose canonical fields use a section key that is NOT
  // in SECTION_TITLES must still derive without throwing. The section
  // title must fall back to the English humanize output.
  const schema = deriveFormInputSchema({
    templateCode: "CUS-UNKNOWN-SECTION",
    sourceId: "unknown-section",
    canonicalFields: [
      {
        path: "futureSection.firstField",
        type: "string",
        label: "First Field",
        source: "manual",
        required: false,
        uiComponent: "text",
        reviewRequired: false,
      },
      {
        path: "futureSection.secondField",
        type: "string",
        label: "Second Field",
        source: "manual",
        required: false,
        uiComponent: "text",
        reviewRequired: false,
      },
    ],
    docxSlots: [],
    renderBindings: [],
    rejectedCandidates: [],
  });

  const section = schema.sections.find((s) => s.key === "futureSection");
  assert.ok(section, "expected a section for the unknown key");
  assert.equal(section!.title, "Future Section");
  // The schema is fully usable: every field is reachable, the section
  // has a non-empty title, no warnings about unknown sections exist
  // (unknown-section is a contract drift signal, not a title signal).
  assert.equal(schema.sections.length, 1);
  assert.equal(section!.fields.length, 2);
});
