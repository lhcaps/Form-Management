import fs from "node:fs";
import PizZip from "pizzip";

// BM-004: positional mapping between form fields and DOCX mustaches
const buf = fs.readFileSync("D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/BM-004/BM-004_normalized.docx");
const zip = new PizZip(buf);
const docXml = zip.file("word/document.xml").asText();

// Extract all paragraphs with mustaches in document order
const paraRe = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/g;
const paraData = [];
let m;
while ((m = paraRe.exec(docXml)) !== null) {
  const para = m[0];
  if (!para.includes("{{")) continue;
  const text = [...para.matchAll(/<w:t\b[^>]*>([^<]*)<\/w:t>/g)].map(r => r[1]).join("");
  const stripped = text.replace(/\s+/g, " ").trim();
  const mustaches = [...para.matchAll(/\{\{([^}]+)\}\}/g)].map(r => r[1]);
  paraData.push({ text: stripped, mustaches });
}

console.log("=== Paragraphs with mustaches in BM-004 ===");
paraData.forEach((p, i) => console.log((i+1) + ". \"" + p.text.slice(0,120) + "\" => " + p.mustaches.join(", ")));

// Form fields for BM-004 (from debug output)
const formFields = [
  "Viện kiểm sát cấp trên",
  "Viện kiểm sát ban hành",
  "Tên cơ quan trong thân văn bản",
  "Viết tắt tên VKS (nếu có)",
  "�ịa danh ban hành",
  "Ngày ban hành",
  "Số văn bản",
  "Chức danh người ký (VIỆN TRƯỞNG …)",
  "Số QĐ phân công cũ",
  "Ngày QĐ phân công cũ (dd/MM/yyyy)",
  "Họ tên người hiện đang THQCT",
  "Chức danh người hiện tại",
  "Họ tên người thay thế",
  "Chức danh người thay thế",
  "Lý do thay đổi",
  "Mô tả vụ việc / nguồn tin bị ảnh hưởng",
  "Điều 1 (tự sinh, có thể chỉnh tay)",
  "Điều 2 (tự sinh, có thể chỉnh tay)",
  "Dòng lưu",
  "Chế độ ký",
  "Chức vụ ký",
  "Họ tên người ký",
];

console.log("\n=== Positional mapping (form field index -> mustache position) ===");
// All mustaches in doc order
const allMustaches = paraData.flatMap(p => p.mustaches);
console.log("DOCX mustache count:", allMustaches.length);
console.log("Form field count:", formFields.length);
console.log("\nPositional match (form[i] -> mustache[i]):");
for (let i = 0; i < Math.min(allMustaches.length, formFields.length); i++) {
  const docMustache = allMustaches[i];
  const formField = formFields[i];
  console.log("  [" + i + "] form: \"" + formField + "\" -> mustache: {{" + docMustache + "}}");
}
