import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import PizZip from "pizzip";

import { remediateSemanticTemplate } from "../../scripts/docx-contract/lib/semantic-template-remediator.mjs";

const BM019_SOURCE = Object.freeze([
  "VIỆN KIỂM SÁT … .................................................",
  "Số: …/YC-VKS…-…",
  "…, ngày … tháng … năm 20…",
  "VIỆN TRƯỞNG VIỆN KIỂM SÁT2…",
  "Xét thấy Quyết định khởi tố vụ án hình sự số … ngày … tháng … năm … của5… về tội … quy định tại khoản ... Điều … của Bộ luật Hình sự, ngoài tội phạm đã khởi tố còn có căn cứ xác định dấu hiệu của tội … quy định tại khoản ... Điều … của Bộ luật Hình sự nhưng chưa được khởi tố,",
  "Cơ quan, người có thẩm quyền5… ra Quyết định bổ sung Quyết định khởi tố vụ án hình sự về tội … quy định tại khoản ... Điều … của Bộ luật Hình sự, để tiến hành điều tra theo quy định của Bộ luật Tố tụng hình sự./.",
  "- 5...;",
  "- Lưu: HSVA, HSKS, VP.",
  "6………………..……………",
]);

const BM020_SOURCE = Object.freeze([
  "VIỆN KIỂM SÁT … .................................................",
  "Số: …/YC-VKS…-…",
  "…, ngày … tháng … năm 20...",
  "VIỆN TRƯỞNG VIỆN KIỂM SÁT2…",
  "Xét Quyết định khởi tố vụ án hình sự số … ngày … tháng … năm … (Quyết định thay đổi/bổ sung Quyết định khởi tố vụ án hình sự số … ngày … tháng … năm …, nếu có) của6… về tội … quy định tại khoản … Điều … của Bộ luật Hình sự/Quyết định không khởi tố vụ án hình sự số … ngày … tháng … năm … của6… là không có căn cứ và trái pháp luật;",
  "Điều 1. Cơ quan, người có thẩm quyền6… ra Quyết định hủy bỏ Quyết định khởi tố vụ án hình sự số … ngày … tháng … năm … của6… về tội … quy định tại khoản … Điều … của Bộ luật Hình sự/Quyết định không khởi tố vụ án hình sự số … ngày … tháng … năm … của6….",
  "Điều 2. Yêu cầu cơ quan, người có thẩm quyền6... tiếp tục giải quyết nguồn tin về tội phạm theo quy định của Bộ luật Tố tụng hình sự/ra Quyết định khởi tố vụ án hình sự./.",
  "- 6…;",
  "- Lưu: HSVV/VA, HSKS, VP.",
  "7………………………………",
]);

const BM058_SOURCE = Object.freeze([
  "Thời hạn tạm hoãn xuất cảnh {{measure.exitPostponementDurationText}} kể từ {{measure.exitPostponementFromDateText}} đến {{measure.exitPostponementToDateText}}.",
]);

const BM213_SOURCE = Object.freeze([
  "VIỆN KIỂM SÁT … .................................................",
  "Số: …/YC-VKS…-…",
  "…, ngày … tháng … năm 20…",
  "VIỆN TRƯỞNG VIỆN KIỂM SÁT2…",
  "Họ tên:......................................................................................... Giới tính:………",
  "Tên gọi khác: …………...........................................................................................",
  "Sinh ngày ............ tháng ............ năm ...................... tại:…………………….. …...",
  "Quốc tịch: .............................................; Dân tộc: ......................; Tôn giáo:… …...",
  "Nghề nghiệp:.............................................................................................................",
  "Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu/Số định danh cá nhân:……..…………..",
  "Cấp ngày............ tháng ............ năm ................... Nơi cấp:………………..……...",
  "Nơi thường trú: ……………………………………………………………………",
  "Nơi tạm trú: ………………………………………………………………………..",
  "Nơi ở hiện tại: ……………………………………………………………………..",
  "là bị hại/người làm chứng trong vụ án… có thông tin/hình ảnh/… cá nhân đã/đang/có nguy cơ bị phát tán trên không gian mạng, ảnh hưởng nghiêm trọng đến quyền riêng tư, danh dự, nhân phẩm và quyền lợi ích hợp pháp của người chưa thành niên theo quy định pháp luật,",
  "1. Cơ quan, người có thẩm quyền… áp dụng các biện pháp kỹ thuật để bảo vệ thông tin cá nhân, danh dự, nhân phẩm của người chưa thành niên là bị hại/người làm chứng bị phát tán trên không gian mạng.",
  "Cơ quan, người có thẩm quyền7… thông báo kết quả thực hiện cho Viện kiểm sát2 … trước … giờ … ngày … tháng … năm ….",
  "2. Cơ quan/tổ chức/cá nhân liên quan… phối hợp chặt chẽ với7… trong việc rà soát, cung cấp thông tin, phát hiện và xử lý hành vi phát tán trái pháp luật thông tin/hình ảnh/… cá nhân của người chưa thành niên để bảo đảm quyền và lợi hợp pháp của người chưa thành niên./.",
  "- 5…;",
  "- 7…;",
  "- 8…;",
  "- Lưu: HSVV/VA, HSKS, VP.",
  "……………………………..",
]);

function encodeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function paragraph(text) {
  const splitAt = Math.max(1, Math.floor(text.length / 2));
  const first = encodeXml(text.slice(0, splitAt));
  const second = encodeXml(text.slice(splitAt));
  return (
    '<w:p><w:pPr><w:jc w:val="both"/></w:pPr>' +
    `<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${first}</w:t></w:r>` +
    `<w:r><w:rPr><w:i/></w:rPr><w:t xml:space="preserve">${second}</w:t></w:r>` +
    "</w:p>"
  );
}

function makeDocx(paragraphs) {
  const zip = new PizZip();
  zip.file("[Content_Types].xml", "<Types/>");
  zip.file(
    "word/document.xml",
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' +
      paragraphs.map(paragraph).join("") +
      "</w:body></w:document>",
  );
  zip.file("word/header1.xml", "<w:hdr>SENTINEL</w:hdr>");
  return zip.generate({ type: "nodebuffer" });
}

function documentXml(buffer) {
  return new PizZip(buffer).file("word/document.xml")?.asText() ?? "";
}

function visibleText(xml) {
  return xml
    .replace(/<w:tab\/?>/gu, "\t")
    .replace(/<w:br\/?>/gu, "\n")
    .replace(/<[^>]+>/gu, "")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

test("BM-019 remediation inserts only reviewed semantic placeholders", () => {
  const input = makeDocx(["UNRELATED", ...BM019_SOURCE]);
  const output = remediateSemanticTemplate("BM-019", input);
  const text = visibleText(documentXml(output));

  assert.match(text, /\{\{agency\.parentName\}\} \{\{agency\.name\}\}/u);
  assert.match(text, /Số: \{\{document\.documentCode\}\}/u);
  assert.match(text, /\{\{document\.issuePlaceAndDateLine\}\}/u);
  assert.match(text, /\{\{official\.issuerTitle\}\}/u);
  assert.match(text, /\{\{initiationRequest\.originatingDecisionCode\}\}/u);
  assert.match(text, /\{\{initiationRequest\.originatingDecisionDateText\}\}/u);
  assert.match(text, /\{\{initiationRequest\.originalOffenseName\}\}/u);
  assert.match(text, /\{\{initiationRequest\.additionalOffenseName\}\}/u);
  assert.match(text, /- \{\{initiationRequest\.orderedAuthorityName\}\};/u);
  assert.match(text, /- \{\{recipients\.archiveLine\}\}\./u);
  assert.match(
    text,
    /\{\{signature\.signMode\}\}\{\{signature\.positionTitle\}\}\{\{signature\.signerName\}\}/u,
  );
  assert.match(text, /UNRELATED/u);
  assert.equal(
    new PizZip(output).file("word/header1.xml")?.asText(),
    "<w:hdr>SENTINEL</w:hdr>",
  );
});

test("BM-020 remediation binds reviewed generated lines without guessing slash branches", () => {
  const input = makeDocx(["UNRELATED", ...BM020_SOURCE]);
  const output = remediateSemanticTemplate("BM-020", input);
  const text = visibleText(documentXml(output));

  assert.match(text, /\{\{agency\.parentName\}\} \{\{agency\.name\}\}/u);
  assert.match(text, /Số: \{\{document\.documentCode\}\}/u);
  assert.match(text, /\{\{document\.issuePlaceAndDateLine\}\}/u);
  assert.match(text, /\{\{official\.issuerTitle\}\}/u);
  assert.match(text, /\{\{initiationRequest\.reasonLine\}\}/u);
  assert.match(text, /Điều 1\. \{\{initiationRequest\.article1Line\}\}/u);
  assert.match(text, /Điều 2\. \{\{initiationRequest\.article2Line\}\}/u);
  assert.match(text, /- \{\{initiationRequest\.orderedAuthorityName\}\};/u);
  assert.match(text, /- \{\{recipients\.archiveLine\}\}\./u);
  assert.match(
    text,
    /\{\{signature\.signMode\}\}\{\{signature\.positionTitle\}\}\{\{signature\.signerName\}\}/u,
  );
  assert.doesNotMatch(text, /Quyết định thay đổi\/bổ sung/u);
  assert.match(text, /UNRELATED/u);
});

test("BM-058 remediation uses detention fields for the detention duration line", () => {
  const input = makeDocx(["UNRELATED", ...BM058_SOURCE]);
  const output = remediateSemanticTemplate("BM-058", input);
  const text = visibleText(documentXml(output));

  assert.match(
    text,
    /Thời hạn tạm giam \{\{measure\.detentionDurationText\}\} kể từ \{\{measure\.detentionFromDateText\}\} đến \{\{measure\.detentionToDateText\}\}\./u,
  );
  assert.doesNotMatch(text, /exitPostponement/u);
  assert.match(text, /UNRELATED/u);
});

test("BM-213 remediation binds every fillable line to juvenile-protection semantics", () => {
  const input = makeDocx(["UNRELATED", ...BM213_SOURCE]);
  const output = remediateSemanticTemplate("BM-213", input);
  const text = visibleText(documentXml(output));

  assert.match(text, /\{\{agency\.parentName\}\} \{\{agency\.name\}\}/u);
  assert.match(text, /Họ tên: \{\{person\.fullName\}\} Giới tính: \{\{person\.genderLabel\}\}/u);
  assert.match(text, /\{\{person\.identityIssueLine\}\}/u);
  assert.match(text, /\{\{juvenileProtection\.contextLine\}\}/u);
  assert.match(text, /1\. \{\{juvenileProtection\.article1Line\}\}/u);
  assert.match(text, /\{\{juvenileProtection\.resultDeadlineLine\}\}/u);
  assert.match(text, /2\. \{\{juvenileProtection\.article2Line\}\}/u);
  assert.match(text, /- \{\{recipients\.primaryLine\}\};/u);
  assert.match(text, /- \{\{recipients\.investigationAuthorityLine\}\};/u);
  assert.match(text, /- \{\{recipients\.otherRecipientsLine\}\};/u);
  assert.match(text, /- \{\{recipients\.archiveLine\}\}\./u);
  assert.match(text, /\{\{signature\.signerName\}\}/u);
  assert.doesNotMatch(text, /\{\{(?:document|recipients)\.field\d*\}\}/u);
  assert.match(text, /UNRELATED/u);
});

test("semantic remediation is idempotent", () => {
  const once = remediateSemanticTemplate("BM-019", makeDocx(BM019_SOURCE));
  const twice = remediateSemanticTemplate("BM-019", once);

  assert.equal(documentXml(twice), documentXml(once));
});

test("semantic remediation fails when a required anchor is missing", () => {
  const missingSignature = BM019_SOURCE.slice(0, -1);

  assert.throws(
    () => remediateSemanticTemplate("BM-019", makeDocx(missingSignature)),
    /required paragraph was not found.*signature/u,
  );
});

test("semantic remediation fails when a required anchor is duplicated", () => {
  assert.throws(
    () =>
      remediateSemanticTemplate(
        "BM-020",
        makeDocx([BM020_SOURCE[0], ...BM020_SOURCE]),
      ),
    /required paragraph is ambiguous.*agency/u,
  );
});

test("semantic remediation rejects unsupported template codes", () => {
  assert.throws(
    () => remediateSemanticTemplate("BM-021", makeDocx([])),
    /Unsupported semantic remediation template: BM-021/u,
  );
});

test("semantic remediation CLI writes a separate output without changing input", () => {
  const workDir = mkdtempSync(join(tmpdir(), "qllaw-semantic-remediation-"));
  const inputPath = join(workDir, "input.docx");
  const outputPath = join(workDir, "output.docx");
  const input = makeDocx(BM019_SOURCE);

  try {
    writeFileSync(inputPath, input);
    execFileSync(
      process.execPath,
      [
        "scripts/docx-contract/remediate-semantic-template.mjs",
        "BM-019",
        inputPath,
        outputPath,
      ],
      { cwd: process.cwd(), stdio: "pipe" },
    );

    assert.deepEqual(readFileSync(inputPath), input);
    assert.match(
      visibleText(documentXml(readFileSync(outputPath))),
      /\{\{initiationRequest\.additionalOffenseName\}\}/u,
    );
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

for (const [templateCode, expectedPlaceholder] of [
  ["BM-019", "{{initiationRequest.additionalLegalArticle}}"],
  ["BM-020", "{{initiationRequest.article2Line}}"],
  ["BM-058", "{{measure.detentionDurationText}}"],
  ["BM-213", "{{juvenileProtection.article2Line}}"],
]) {
  test(`${templateCode} checked-in normalized DOCX is fully remediated`, () => {
    const templatePath = join(
      process.cwd(),
      "storage",
      "templates",
      "normalized-docx",
      templateCode,
      `${templateCode}_normalized.docx`,
    );
    const input = readFileSync(templatePath);
    const zip = new PizZip(input);
    const output = remediateSemanticTemplate(templateCode, input);

    assert.ok(zip.file("[Content_Types].xml"));
    assert.ok(zip.file("_rels/.rels"));
    assert.ok(zip.file("word/document.xml"));
    assert.ok(documentXml(input).includes(expectedPlaceholder));
    if (templateCode === "BM-058") {
      assert.ok(documentXml(input).includes("{{measure.detentionFromDateText}}"));
      assert.ok(documentXml(input).includes("{{measure.detentionToDateText}}"));
      assert.ok(documentXml(input).includes("Thời hạn tạm giam"));
      assert.ok(!documentXml(input).includes("exitPostponement"));
    }
    if (templateCode === "BM-213") {
      assert.ok(documentXml(input).includes("{{person.fullName}}"));
      assert.ok(documentXml(input).includes("{{person.identityIssueLine}}"));
      assert.ok(documentXml(input).includes("{{signature.signerName}}"));
      assert.ok(!/\{\{(?:document|recipients)\.field\d*\}\}/u.test(documentXml(input)));
    }
    assert.equal(documentXml(output), documentXml(input));
  });
}
