import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";

const DIAC_MAP = { "à": "a", "á": "a", "ả": "a", "ã": "a", "ạ": "a", "ă": "a", "ằ": "a", "ắ": "a", "ẳ": "a", "ẵ": "a", "ặ": "a", "â": "a", "ầ": "a", "ấ": "a", "ậ": "a", "ẫ": "a", "ẩ": "a", "đ": "d", "è": "e", "é": "e", "ẻ": "e", "ẽ": "e", "ẹ": "e", "ê": "e", "ề": "e", "ế": "e", "ệ": "e", "ễ": "e", "ể": "e", "ì": "i", "í": "i", "ỉ": "i", "ĩ": "i", "ị": "i", "ò": "o", "ó": "o", "ỏ": "o", "õ": "o", "ọ": "o", "ô": "o", "ồ": "o", "ố": "o", "ổ": "o", "ỗ": "o", "ộ": "o", "ơ": "o", "ờ": "o", "ớ": "o", "ở": "o", "ỡ": "o", "ợ": "o", "ù": "u", "ú": "u", "ủ": "u", "ũ": "u", "ụ": "u", "ư": "u", "ừ": "u", "ứ": "u", "ử": "u", "ữ": "u", "ự": "u", "ỳ": "y", "ý": "y", "ỷ": "y", "ỹ": "y", "ỵ": "y" };
const DIAC_RE = new RegExp("[" + Object.keys(DIAC_MAP).join("") + "]", "g");
function stripDiac(s) { return String(s || "").replace(DIAC_RE, (c) => DIAC_MAP[c] || c).toLowerCase(); }

// BM-004: show all 9 mustaches with their context
const buf = fs.readFileSync("D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/BM-004/BM-004_normalized.docx");
const zip = new PizZip(buf);
const docXml = zip.file("word/document.xml").asText();

const mustRe = /\{\{([^}]+)\}\}/g;
let match;
while ((match = mustRe.exec(docXml)) !== null) {
  const mustache = match[1].trim();
  const pos = match.index;
  const ctxStart = Math.max(0, pos - 200);
  const rawCtx = docXml.slice(ctxStart, pos + match[0].length + 100);
  const plain = rawCtx.replace(/<[^>]+>/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
  const norm = stripDiac(plain);
  console.log("MUSTACHE:", mustache);
  console.log("  CONTEXT:", plain.slice(0, 150));
  console.log("  NORM:  ", norm.slice(0, 150));
  console.log();
}
