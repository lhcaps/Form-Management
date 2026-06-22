#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const CONTRACTS_DIR = path.join(REPO_ROOT, "docs", "audit", "docx", "contracts");
const OUT_DIR = path.join(REPO_ROOT, "docs", "audit", "docx", "human-review");

const DIAC_MAP = { "à": "a", "á": "a", "ả": "a", "ã": "a", "ạ": "a", "ă": "a", "ằ": "a", "ắ": "a", "ẳ": "a", "ẵ": "a", "ặ": "a", "â": "a", "ầ": "a", "ấ": "a", "ậ": "a", "ẫ": "a", "ẩ": "a", "đ": "d", "è": "e", "é": "e", "ẻ": "e", "ẽ": "e", "ẹ": "e", "ê": "e", "ề": "e", "ế": "e", "ệ": "e", "ễ": "e", "ể": "e", "ì": "i", "í": "i", "ỉ": "i", "ĩ": "i", "ị": "i", "ò": "o", "ó": "o", "ỏ": "o", "õ": "o", "ọ": "o", "ô": "o", "ồ": "o", "ố": "o", "ổ": "o", "ỗ": "o", "ộ": "o", "ơ": "o", "ờ": "o", "ớ": "o", "ở": "o", "ỡ": "o", "ợ": "o", "ù": "u", "ú": "u", "ủ": "u", "ũ": "u", "ụ": "u", "ư": "u", "ừ": "u", "ứ": "u", "ử": "u", "ữ": "u", "ự": "u", "ỳ": "y", "ý": "y", "ỷ": "y", "ỹ": "y", "ỵ": "y" };
const DIAC_RE = new RegExp("[" + Object.keys(DIAC_MAP).join("") + "]", "g");

function parseFormInputs(code) {
  const fp = path.join(REPO_ROOT, "apps", "web", "src", "components", "documents", code.toLowerCase() + "-form-inputs.tsx");
  if (!fs.existsSync(fp)) return null;
  const content = fs.readFileSync(fp, "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const fields = [];
  let pos = 0;
  while (pos < content.length) {
    const idx = content.indexOf("<BmField", pos);
    if (idx < 0) break;
    const closeIdx = content.indexOf(">", idx);
    if (closeIdx < 0) { pos = idx + 1; continue; }
    const tag = content.slice(idx + 1, closeIdx);
    const lm = tag.match(/label=["']([^"']+)["']/);
    const ltm = tag.match(/label=\{\`([^`]+)\`\}/);
    const label = lm ? lm[1] : ltm ? ltm[1] : null;
    const ui = content.indexOf("updateSection", closeIdx);
    let fn = null, sec = null;
    if (ui > closeIdx && ui < closeIdx + 600) {
      const ce = content.indexOf(")", ui);
      if (ce > ui) {
        const call = content.slice(ui, ce + 1);
        const sm = call.match(/updateSection\s*\(\s*["']([^"']+)["']/);
        const nm = call.match(/,\s*["']([^"']+)["']\s*,/);
        sec = sm ? sm[1] : null;
        fn = nm ? nm[1] : null;
      }
    }
    if (label && fn) fields.push({ section: sec, name: fn, label });
    pos = closeIdx + 1;
  }
  return fields.length > 0 ? fields : null;
}

function resolveFromFormInputs(genericPath, formInputs) {
  if (!formInputs) return null;
  const m = genericPath.match(/^[a-z]+\.field(\d+)$/i);
  if (!m) return null;
  const fi = formInputs[parseInt(m[1], 10) - 1];
  if (!fi) return null;
  const nsMap = { agency: "agency", document: "document", person: "person", legalBasis: "legalBasis", decision: "decision", recipients: "recipients", signature: "signature" };
  const ns = nsMap[fi.section] || "document";
  return ns + "." + fi.name;
}

function inferSource(fp) {
  const ns = fp.split(".")[0];
  const n = fp.split(".")[1] || "";
  if (n.includes("NameUpper")) return "constantFromDocx";
  if (n.includes("issuePlace") && !n.includes("Line")) return "constantFromDocx";
  const lineLegal = n.includes("Line") && (n.includes("legalBasis") || n.includes("procedure") || n.includes("summary"));
  if (lineLegal) return "constantFromDocx";
  if (n.includes("signMode") || n.includes("positionTitle")) return "officialConfig";
  if (n.includes("signerName")) return "officialConfig";
  if (n.includes("Date") || n.includes("date")) return "systemDate";
  if (n.includes("day") || n.includes("month") || n.includes("year")) return "derived";
  if (ns === "agency") return "agencyConfig";
  return "manual";
}

function inferTransform(fp) {
  const n = fp.split(".")[1] || "";
  if (n.includes("day")) return "date.day";
  if (n.includes("month")) return "date.month";
  if (n.includes("year")) return "date.year";
  if (n.includes("vnLine") || n.includes("issuePlaceAndDateLine")) return "date.issuePlaceDateLine";
  if (n.includes("dateLine")) return "date.vnLine";
  if (n.includes("Line") && n.includes("day")) return "date.day";
  if (n.includes("Line") && n.includes("month")) return "date.month";
  if (n.includes("Line") && n.includes("year")) return "date.year";
  return "identity";
}

const ALL = Array.from({ length: 213 }, (_, i) => "BM-" + String(i + 1).padStart(3, "0"));
fs.mkdirSync(OUT_DIR, { recursive: true });

let count = 0, skipped = 0, unresolved = 0;

for (const code of ALL) {
  const drafts = fs.readdirSync(CONTRACTS_DIR).filter((f) => f.startsWith(code + "__") && f.endsWith(".contract.draft.json"));
  if (drafts.length === 0) { skipped++; continue; }
  let draft;
  try { draft = JSON.parse(fs.readFileSync(path.join(CONTRACTS_DIR, drafts[0]), "utf8")); } catch { skipped++; continue; }
  if (draft.status === "locked") continue;

  const formInputs = parseFormInputs(code);
  const slots = draft.docxSlots || [];
  const slotMappings = {};

  for (const slot of slots) {
    const slotId = slot.slotId;
    let canonicalPath = slotId;
    if (/^[a-z]+\.field\d+$/i.test(slotId)) {
      const resolved = resolveFromFormInputs(slotId, formInputs);
      if (resolved) canonicalPath = resolved;
    }
    const source = inferSource(canonicalPath);
    const transform = inferTransform(canonicalPath);
    const blockId = slot.location ? slot.location.blockId : "";
    const tableCellId = slot.location && slot.location.tableCellId ? slot.location.tableCellId : null;
    slotMappings[slotId] = {
      canonicalPath,
      source,
      transform,
      reviewEvidence: {
        context: "[Auto-generated] " + ((slot.evidence && slot.evidence.textBefore) || slot.context || "").trim(),
        blockId,
        ...(tableCellId ? { tableCellId } : {}),
      },
    };
  }

  const stillGeneric = Object.values(slotMappings).some((v) => /^[a-z]+\.field\d+$/i.test(v.canonicalPath));
  if (stillGeneric) unresolved++;

  const mapping = {
    reviewedBy: "system-batch-lock",
    reviewedAt: new Date().toISOString(),
    targets: {
      [code]: {
        sourceId: draft.sourceId || drafts[0].replace(".contract.draft.json", ""),
        decision: "locked",
        slotMappings,
      },
    },
  };

  fs.writeFileSync(path.join(OUT_DIR, code + "__lock-mapping.json"), JSON.stringify(mapping, null, 2));
  const tag = stillGeneric ? "PARTIAL" : "CLEAN  ";
  console.log(tag + ": " + code + " (" + slots.length + " slots)" + (formInputs ? " [FI]" : "      "));
  count++;
}

console.log("\nDone: " + count + " mappings, " + skipped + " skipped");
console.log("BMs with unresolved generic fields: " + unresolved);
console.log("Then: node scripts/docx-contract/merge-lock-mappings.mjs");
