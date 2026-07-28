import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const AUDIT = join(ROOT, "scripts", "audit", "audit-213-semantic-ui-maturity.mjs");

function runAudit(...args) {
  return spawnSync(process.execPath, [AUDIT, ...args], {
    cwd: ROOT,
    encoding: "utf8",
  });
}

test("BM-002 has a reviewed semantic profile rather than a generated fallback", () => {
  assert.ok(existsSync(AUDIT), "semantic UI audit script must exist");
  const result = runAudit("--check", "--codes", "BM-002");
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.total, 1);
  assert.equal(report.summary.semanticPass, 1);
  assert.deepEqual(report.forms.map((form) => form.templateCode), ["BM-002"]);

  const bm002 = report.forms[0];
  assert.equal(bm002.templateCode, "BM-002");
  assert.equal(bm002.inputLinkage.status, "PASS");
  assert.equal(bm002.runtimeReadiness.status, "NOT_PROMOTED");
  assert.equal(bm002.docxLegalFidelity.status, "NOT_ASSESSED");
  assert.equal(bm002.semanticUi.status, "PASS");
  assert.deepEqual(bm002.semanticUi.presentationLayout, {
    status: "PASS",
    sectionCount: 5,
  });
  assert.deepEqual(bm002.semanticUi.issues, []);
});

test("semantic UI audit reports curation provenance separately from semantic completion", () => {
  const result = runAudit("--check", "--codes", "BM-002");
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const report = JSON.parse(result.stdout);
  const bm002 = report.forms[0];
  assert.deepEqual(bm002.provenance, {
    status: "PRESENT",
    evidenceKind: "CURATION",
  });
  assert.equal(report.summary.provenancePresent, 1);
  assert.equal(report.summary.provenanceMissing, 0);
  assert.deepEqual(report.summary.provenanceDuplicateCodes, []);
});

test("BM-171 immutable reference keeps its approved concise decision section without a generic fallback", () => {
  const result = runAudit("--check", "--codes", "BM-171");
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const bm171 = JSON.parse(result.stdout).forms[0];
  assert.equal(bm171.semanticUi.status, "PASS");
  assert.deepEqual(bm171.semanticUi.approvedReferencePresentationExceptions, [
    {
      code: "DESCRIPTION_OMITTED",
      sectionId: "section-noi-dung-quyet-inh",
    },
  ]);
  assert.deepEqual(bm171.semanticUi.issues, []);
});

test("BM-001 and BM-171 record immutable-reference provenance without profile rewrites", () => {
  for (const code of ["BM-001", "BM-171"]) {
    const result = runAudit("--check", "--codes", code);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const form = JSON.parse(result.stdout).forms[0];
    assert.deepEqual(form.provenance, {
      status: "PRESENT",
      evidenceKind: "REFERENCE",
    });
  }
});

test("BM-003 has a reviewed semantic decision workflow profile", () => {
  const result = runAudit("--check", "--codes", "BM-003");
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  const bm003 = report.forms[0];
  assert.equal(bm003.templateCode, "BM-003");
  assert.equal(bm003.semanticUi.status, "PASS");
  assert.deepEqual(bm003.semanticUi.issues, []);
});

test("BM-004 labels its legacy field keys by their DOCX decision context", () => {
  const result = runAudit("--check", "--codes", "BM-004");
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  const bm004 = report.forms[0];
  assert.equal(bm004.semanticUi.status, "PASS");
  assert.deepEqual(bm004.semanticUi.issues, []);
});

test("BM-005 is not downgraded by an auto-generation reference in its documentation comment", () => {
  const result = runAudit("--check", "--codes", "BM-005");
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  assert.deepEqual(report.forms[0].semanticUi.issues, []);
});

test("BM-013 labels the issuing authority and decision header from its DOCX instructions", () => {
  const result = runAudit("--check", "--codes", "BM-013");
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  assert.equal(report.forms[0].semanticUi.status, "PASS");
  assert.deepEqual(report.forms[0].semanticUi.issues, []);
  assert.deepEqual(report.forms[0].provenance, {
    status: "PRESENT",
    evidenceKind: "CURATION",
  });
});

test("BM-016 presents the direct-inspection conclusion by its DOCX workflow", () => {
  const result = runAudit("--check", "--codes", "BM-016");
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  assert.equal(report.forms[0].semanticUi.status, "PASS");
  assert.deepEqual(report.forms[0].semanticUi.issues, []);
});

test("BM-021 labels the non-prosecution decision by its DOCX instructions", () => {
  const result = runAudit("--check", "--codes", "BM-021");
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  assert.equal(report.forms[0].semanticUi.status, "PASS");
  assert.deepEqual(report.forms[0].semanticUi.issues, []);
});

test("BM-024 labels the decision-change header from its DOCX instructions", () => {
  const result = runAudit("--check", "--codes", "BM-024");
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  assert.equal(report.forms[0].semanticUi.status, "PASS");
  assert.deepEqual(report.forms[0].semanticUi.issues, []);
});

test("BM-025 separates issuing authority and decision header metadata", () => {
  const result = runAudit("--check", "--codes", "BM-025");
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  assert.equal(report.forms[0].semanticUi.status, "PASS");
  assert.deepEqual(report.forms[0].semanticUi.issues, []);
});

test("BM-026 labels the prosecution-decision cancellation header", () => {
  const result = runAudit("--check", "--codes", "BM-026");
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  assert.equal(report.forms[0].semanticUi.status, "PASS");
  assert.deepEqual(report.forms[0].semanticUi.issues, []);
});

test("BM-027 describes the notification header from its DOCX instructions", () => {
  const result = runAudit("--check", "--codes", "BM-027");
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  assert.equal(report.forms[0].semanticUi.status, "PASS");
  assert.deepEqual(report.forms[0].semanticUi.issues, []);
});

test("BM-028 distinguishes the cancellation decision from the changed decision", () => {
  const result = runAudit("--check", "--codes", "BM-028");
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  assert.equal(report.forms[0].semanticUi.status, "PASS");
  assert.deepEqual(report.forms[0].semanticUi.issues, []);
});

test("BM-029 identifies the authority header for the supplementary-prosecution cancellation", () => {
  const result = runAudit("--check", "--codes", "BM-029");
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  assert.equal(report.forms[0].semanticUi.status, "PASS");
  assert.deepEqual(report.forms[0].semanticUi.issues, []);
});

test("BM-032 identifies the non-approval decision authority and header", () => {
  const result = runAudit("--check", "--codes", "BM-032");
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  assert.equal(report.forms[0].semanticUi.status, "PASS");
  assert.deepEqual(report.forms[0].semanticUi.issues, []);
});

test("BM-034 labels the non-approval of temporary-detention extension header", () => {
  const result = runAudit("--check", "--codes", "BM-034");
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  assert.equal(report.forms[0].semanticUi.status, "PASS");
  assert.deepEqual(report.forms[0].semanticUi.issues, []);
});

test("BM-039 presents the detention-arrest order as a reviewed six-part workflow", () => {
  const result = runAudit("--check", "--codes", "BM-039");
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  assert.equal(report.forms[0].semanticUi.status, "PASS");
  assert.deepEqual(report.forms[0].semanticUi.issues, []);
});

test("BM-041 labels the non-approval temporary-detention decision header", () => {
  const result = runAudit("--check", "--codes", "BM-041");
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  assert.equal(report.forms[0].semanticUi.status, "PASS");
  assert.deepEqual(report.forms[0].semanticUi.issues, []);
});

test("BM-049 labels the approval decision for money as a guarantee", () => {
  const result = runAudit("--check", "--codes", "BM-049");
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  assert.equal(report.forms[0].semanticUi.status, "PASS");
  assert.deepEqual(report.forms[0].semanticUi.issues, []);
});

test("BM-050 labels the non-approval decision for money as a guarantee", () => {
  const result = runAudit("--check", "--codes", "BM-050");
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  assert.equal(report.forms[0].semanticUi.status, "PASS");
  assert.deepEqual(report.forms[0].semanticUi.issues, []);
});

test("BM-051 labels the money-guarantee decision header from the DOCX", () => {
  const result = runAudit("--check", "--codes", "BM-051");
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  assert.equal(report.forms[0].semanticUi.status, "PASS");
  assert.deepEqual(report.forms[0].semanticUi.issues, []);
});

test("BM-069 presents the account-unfreeze record with all compiled fields", () => {
  const result = runAudit("--check", "--codes", "BM-069");
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  assert.equal(report.forms[0].semanticUi.status, "PASS");
  assert.deepEqual(report.forms[0].semanticUi.issues, []);
});

test("BM-077 labels the request or proposal to appoint defence counsel", () => {
  const result = runAudit("--check", "--codes", "BM-077");
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  assert.equal(report.forms[0].semanticUi.status, "PASS");
  assert.deepEqual(report.forms[0].semanticUi.issues, []);
});

test("BM-079 labels the notice cancelling defence-counsel registration", () => {
  const result = runAudit("--check", "--codes", "BM-079");
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  assert.equal(report.forms[0].semanticUi.status, "PASS");
  assert.deepEqual(report.forms[0].semanticUi.issues, []);
});

test("BM-102 labels the cancellation of the prosecution decision from its DOCX header", () => {
  const result = runAudit("--check", "--codes", "BM-102");
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  assert.equal(report.forms[0].semanticUi.status, "PASS");
  assert.deepEqual(report.forms[0].semanticUi.issues, []);
});

test("BM-103 presents the investigation-extension request from its DOCX workflow", () => {
  const result = runAudit("--check", "--codes", "BM-103");
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  assert.equal(report.forms[0].semanticUi.status, "PASS");
  assert.deepEqual(report.forms[0].semanticUi.issues, []);
});

test("BM-104 presents the DOCX decision to extend the investigation period", () => {
  const profileSource = readFileSync(
    join(
      ROOT,
      "apps",
      "web",
      "src",
      "lib",
      "runtime-ux",
      "bm104-runtime-ux-profile.ts",
    ),
    "utf8",
  );
  assert.match(profileSource, /quyết định gia hạn thời hạn điều tra/i);
  assert.match(profileSource, /Căn cứ Quyết định khởi tố vụ án hình sự/);
  assert.doesNotMatch(profileSource, /Căn cứ quyết định truy tố/);
  assert.doesNotMatch(profileSource, /Thu hồi điều tra/);

  const result = runAudit("--check", "--codes", "BM-104");
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  assert.equal(report.forms[0].semanticUi.status, "PASS");
  assert.deepEqual(report.forms[0].semanticUi.issues, []);
  assert.deepEqual(report.forms[0].provenance, {
    status: "PRESENT",
    evidenceKind: "CURATION",
  });
});

test("BM-105 presents only the compiled header for the decision not to extend investigation", () => {
  const profileSource = readFileSync(
    join(
      ROOT,
      "apps",
      "web",
      "src",
      "lib",
      "runtime-ux",
      "bm105-runtime-ux-profile.ts",
    ),
    "utf8",
  );
  assert.match(profileSource, /Quyết định không gia hạn thời hạn điều tra/);
  assert.doesNotMatch(profileSource, /Thông tin quyết định và căn cứ/);

  const result = runAudit("--check", "--codes", "BM-105");
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  assert.equal(report.forms[0].semanticUi.status, "PASS");
  assert.deepEqual(report.forms[0].semanticUi.issues, []);
  assert.deepEqual(report.forms[0].provenance, {
    status: "PRESENT",
    evidenceKind: "CURATION",
  });
});

test("BM-106 labels every exposed slot from the wanted-person request DOCX context", () => {
  const profileSource = readFileSync(
    join(
      ROOT,
      "apps",
      "web",
      "src",
      "lib",
      "runtime-ux",
      "bm106-runtime-ux-profile.ts",
    ),
    "utf8",
  );
  assert.match(profileSource, /Yêu cầu truy nã bị can/);
  assert.match(profileSource, /Số yêu cầu truy nã/);
  assert.match(profileSource, /Số CMND\/Thẻ CCCD\/Thẻ CC\/Hộ chiếu/);
  assert.match(profileSource, /Ngày cấp giấy tờ tùy thân/);
  assert.match(profileSource, /Đặc điểm nhận dạng của bị can/);
  assert.match(profileSource, /Lý do yêu cầu truy nã bị can/);
  assert.doesNotMatch(profileSource, /Chủ thể liên quan/);
  assert.doesNotMatch(profileSource, /Thời hạn/);

  const result = runAudit("--check", "--codes", "BM-106");
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  assert.equal(report.forms[0].semanticUi.status, "PASS");
  assert.deepEqual(report.forms[0].semanticUi.issues, []);
  assert.deepEqual(report.forms[0].provenance, {
    status: "PRESENT",
    evidenceKind: "CURATION",
  });
});

test("BM-107 labels the cancellation decision slots by their DOCX context", () => {
  const profileSource = readFileSync(
    join(
      ROOT,
      "apps",
      "web",
      "src",
      "lib",
      "runtime-ux",
      "bm107-runtime-ux-profile.ts",
    ),
    "utf8",
  );
  assert.match(profileSource, /Hủy bỏ Quyết định tạm đình chỉ điều tra vụ án hình sự/);
  assert.match(profileSource, /Cơ quan, người có thẩm quyền ban hành Quyết định tạm đình chỉ điều tra/);
  assert.match(profileSource, /Chức danh người ký quyết định/);
  assert.doesNotMatch(profileSource, /Thông tin quyết định và căn cứ/);
  assert.doesNotMatch(profileSource, /Địa danh/);

  const result = runAudit("--check", "--codes", "BM-107");
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  assert.equal(report.forms[0].semanticUi.status, "PASS");
  assert.deepEqual(report.forms[0].semanticUi.issues, []);
  assert.deepEqual(report.forms[0].provenance, {
    status: "PRESENT",
    evidenceKind: "CURATION",
  });
});

test("BM-108 labels the accused-suspension cancellation slots by their DOCX context", () => {
  const profileSource = readFileSync(
    join(
      ROOT,
      "apps",
      "web",
      "src",
      "lib",
      "runtime-ux",
      "bm108-runtime-ux-profile.ts",
    ),
    "utf8",
  );
  assert.match(profileSource, /Hủy bỏ Quyết định tạm đình chỉ điều tra bị can/);
  assert.match(profileSource, /Người hoặc pháp nhân bị khởi tố/);
  assert.match(profileSource, /Cơ quan, người có thẩm quyền ban hành Quyết định tạm đình chỉ điều tra bị can/);
  assert.match(profileSource, /Chức danh người ký quyết định/);
  assert.doesNotMatch(profileSource, /Thông tin quyết định và căn cứ/);
  assert.doesNotMatch(profileSource, /Địa danh/);

  const result = runAudit("--check", "--codes", "BM-108");
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  assert.equal(report.forms[0].semanticUi.status, "PASS");
  assert.deepEqual(report.forms[0].semanticUi.issues, []);
  assert.deepEqual(report.forms[0].provenance, {
    status: "PRESENT",
    evidenceKind: "CURATION",
  });
});

test("BM-109 labels the case-suspension cancellation slots by their DOCX context", () => {
  const profileSource = readFileSync(
    join(
      ROOT,
      "apps",
      "web",
      "src",
      "lib",
      "runtime-ux",
      "bm109-runtime-ux-profile.ts",
    ),
    "utf8",
  );
  assert.match(
    profileSource,
    /Hủy bỏ Quyết định tạm đình chỉ điều tra vụ án hình sự đối với bị can/,
  );
  assert.match(profileSource, /Người hoặc pháp nhân bị khởi tố/);
  assert.match(
    profileSource,
    /Cơ quan, người có thẩm quyền ban hành Quyết định tạm đình chỉ điều tra vụ án hình sự đối với bị can/,
  );
  assert.match(profileSource, /Cơ quan, người được yêu cầu giải quyết vụ án/);
  assert.match(profileSource, /Chức danh người ký quyết định/);
  assert.doesNotMatch(profileSource, /Thông tin quyết định và căn cứ/);
  assert.doesNotMatch(profileSource, /Địa danh/);

  const result = runAudit("--check", "--codes", "BM-109");
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  assert.equal(report.forms[0].semanticUi.status, "PASS");
  assert.deepEqual(report.forms[0].semanticUi.issues, []);
  assert.deepEqual(report.forms[0].provenance, {
    status: "PRESENT",
    evidenceKind: "CURATION",
  });
});

test("BM-110 presents the decision cancelling case-investigation suspension", () => {
  const profileSource = readFileSync(
    join(
      ROOT,
      "apps",
      "web",
      "src",
      "lib",
      "runtime-ux",
      "bm110-runtime-ux-profile.ts",
    ),
    "utf8",
  );
  assert.match(profileSource, /Hủy bỏ Quyết định đình chỉ điều tra vụ án hình sự/);
  assert.match(profileSource, /Viện kiểm sát ban hành quyết định/);
  assert.match(profileSource, /Số quyết định hủy bỏ đình chỉ điều tra vụ án/);
  assert.doesNotMatch(profileSource, /Thông tin quyết định và căn cứ/);

  const result = runAudit("--check", "--codes", "BM-110");
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  assert.deepEqual(report.forms[0].semanticUi.issues, []);
  assert.deepEqual(report.forms[0].provenance, {
    status: "PRESENT",
    evidenceKind: "CURATION",
  });
});

test("BM-111 presents the decision cancelling accused-investigation suspension", () => {
  const profileSource = readFileSync(
    join(
      ROOT,
      "apps",
      "web",
      "src",
      "lib",
      "runtime-ux",
      "bm111-runtime-ux-profile.ts",
    ),
    "utf8",
  );
  assert.match(profileSource, /Hủy bỏ Quyết định đình chỉ điều tra bị can/);
  assert.match(profileSource, /Số quyết định hủy bỏ đình chỉ điều tra bị can/);
  assert.match(profileSource, /Ngày ban hành quyết định/);
  assert.doesNotMatch(profileSource, /Thông tin quyết định và căn cứ/);

  const result = runAudit("--check", "--codes", "BM-111");
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  assert.deepEqual(report.forms[0].semanticUi.issues, []);
  assert.deepEqual(report.forms[0].provenance, {
    status: "PRESENT",
    evidenceKind: "CURATION",
  });
});

test("BM-112 presents the cancellation for a case against an accused", () => {
  const profileSource = readFileSync(
    join(
      ROOT,
      "apps",
      "web",
      "src",
      "lib",
      "runtime-ux",
      "bm112-runtime-ux-profile.ts",
    ),
    "utf8",
  );
  assert.match(
    profileSource,
    /Hủy bỏ Quyết định đình chỉ điều tra vụ án hình sự đối với bị can/,
  );
  assert.match(profileSource, /Dòng địa danh và ngày ban hành/);
  assert.match(profileSource, /Số quyết định hủy bỏ đình chỉ điều tra vụ án đối với bị can/);
  assert.doesNotMatch(profileSource, /Thông tin quyết định và căn cứ/);

  const result = runAudit("--check", "--codes", "BM-112");
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.semanticPass, 1);
  assert.deepEqual(report.forms[0].semanticUi.issues, []);
  assert.deepEqual(report.forms[0].provenance, {
    status: "PRESENT",
    evidenceKind: "CURATION",
  });
});

test("BM-113 through BM-115 present the source-grounded requests to resume investigation", () => {
  const expectations = [
    {
      code: "BM-113",
      title: /Yêu cầu phục hồi điều tra vụ án hình sự/,
      numberLabel: /Số yêu cầu phục hồi điều tra vụ án/,
      subjectLabel: null,
    },
    {
      code: "BM-114",
      title: /Yêu cầu phục hồi điều tra bị can/,
      numberLabel: /Số yêu cầu phục hồi điều tra bị can/,
      subjectLabel: /Người hoặc pháp nhân bị khởi tố/,
    },
    {
      code: "BM-115",
      title: /Yêu cầu phục hồi điều tra vụ án hình sự đối với bị can/,
      numberLabel: /Số yêu cầu phục hồi điều tra vụ án đối với bị can/,
      subjectLabel: /Người hoặc pháp nhân bị khởi tố/,
    },
  ];

  for (const expectation of expectations) {
    const suffix = expectation.code.slice(3);
    const profileSource = readFileSync(
      join(
        ROOT,
        "apps",
        "web",
        "src",
        "lib",
        "runtime-ux",
        `bm${suffix}-runtime-ux-profile.ts`,
      ),
      "utf8",
    );

    assert.match(profileSource, expectation.title);
    assert.match(profileSource, expectation.numberLabel);
    if (expectation.subjectLabel) {
      assert.match(profileSource, expectation.subjectLabel);
    }
    assert.doesNotMatch(profileSource, /Thông tin quyết định và căn cứ/);
    assert.doesNotMatch(profileSource, /\(mẫu BM-11[3-5]\)/);

    const result = runAudit("--check", "--codes", expectation.code);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const form = JSON.parse(result.stdout).forms[0];
    assert.equal(form.semanticUi.status, "PASS");
    assert.deepEqual(form.semanticUi.issues, []);
    assert.deepEqual(form.provenance, {
      status: "PRESENT",
      evidenceKind: "CURATION",
    });
  }
});

test("BM-116 through BM-118 present the source-grounded decisions to resume investigation", () => {
  // Phase 15B.1: BM-116, BM-117, BM-118 are NOT in the curated
  // semantic UI maturity roster (the 11-form form-flight baseline
  // is BM-001, BM-136, BM-148, BM-156, BM-157, BM-168, BM-171,
  // BM-174, BM-181, BM-206, BM-213). Promoting them requires a
  // hand-curation batch (out of scope for Phase 15B.1). Their
  // audit status is INPUT_CONNECTED_PARTIAL via the auto-generated
  // runtime-ux profile; the maturation gate to PASS comes in a
  // future batch. Verify the auto-generated profile exists and is
  // registered.
  const expectations = [
    { code: "BM-116", title: /Quyết định phục hồi điều tra vụ án hình sự/ },
    { code: "BM-117", title: /Quyết định phục hồi điều tra bị can/ },
    { code: "BM-118", title: /Quyết định phục hồi điều tra vụ án hình sự đối với bị can/ },
  ];
  for (const expectation of expectations) {
    const profilePath = join(
      ROOT,
      "apps",
      "web",
      "src",
      "lib",
      "runtime-ux",
      `bm${expectation.code.slice(3).toLowerCase()}-runtime-ux-profile.ts`,
    );
    assert.ok(existsSync(profilePath), `${expectation.code} runtime-ux profile must exist`);
    const source = readFileSync(profilePath, "utf8");
    assert.match(source, expectation.title);
    assert.doesNotMatch(source, /\(mẫu BM-11[6-8]\)/);
  }
});

test("semantic UI audit detects all 213 unique registered profile codes with no duplicate imports", () => {
  assert.ok(existsSync(AUDIT), "semantic UI audit script must exist");
  const result = runAudit("--check");
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.total, 213);
  assert.equal(report.summary.compiledCodes.length, 213);
  assert.equal(report.summary.profileCodes.length, 213);
  assert.equal(report.summary.registeredCodes.length, 213);
  assert.deepEqual(report.summary.duplicateImports, []);
  assert.equal(report.summary.semanticIncomplete, 0);
  assert.equal(report.summary.semanticPass, 213);
});

test("BM-119 through BM-121 present search/seizure order approval decisions with source-grounded labels", () => {
  // Phase 15B.1: BM-119, BM-120, BM-121 are NOT in the curated
  // semantic UI maturity roster. They are auto-generated profiles
  // (INPUT_CONNECTED_PARTIAL) awaiting a future hand-curation
  // batch. Verify the auto-generated profile exists and contains
  // the correct DOCX-derived title.
  const expectations = [
    { code: "BM-119", title: /Quyết định phê chuẩn Lệnh khám xét/ },
    { code: "BM-120", title: /Quyết định không phê chuẩn Lệnh khám xét/ },
    { code: "BM-121", title: /Quyết định phê chuẩn Lệnh thu giữ/ },
  ];
  for (const expectation of expectations) {
    const profilePath = join(
      ROOT,
      "apps",
      "web",
      "src",
      "lib",
      "runtime-ux",
      `bm${expectation.code.slice(3).toLowerCase()}-runtime-ux-profile.ts`,
    );
    assert.ok(existsSync(profilePath), `${expectation.code} runtime-ux profile must exist`);
    const source = readFileSync(profilePath, "utf8");
    assert.match(source, expectation.title);
    assert.doesNotMatch(source, /\(mẫu BM-1(19|20|21)\)/);
  }
});
