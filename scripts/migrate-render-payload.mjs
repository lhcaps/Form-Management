// Bulk migration script - runs migrateFile on all offender BM panels.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";

const PANELS_DIR = "apps/web/src/components/documents";
const SEAM = "@/lib/document-form-api";

function dropApiBaseIfUnused(text) {
  // Handle both possible patterns:
  //   const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "...";
  //   const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "...";
  const patterns = [
    /\n?\n?const API_BASE_URL\s*=\s*\n?\s*process\.env\.NEXT_PUBLIC_API_BASE_URL\s*\?\?\s*["'][^"']*["']\s*;\n?/,
    /\n?\n?const apiBase\s*=\s*[\s\S]*?\?\?\s*["'][^"']*["']\s*;\n?/,
  ];
  for (const re of patterns) {
    if (re.test(text)) {
      const stripped = text.replace(re, "");
      // Check if either variable name still appears.
      if (
        !/[^A-Za-z0-9_]API_BASE_URL[^A-Za-z0-9_]/.test(stripped) &&
        !/[^A-Za-z0-9_]apiBase[^A-Za-z0-9_]/.test(stripped)
      ) {
        text = stripped;
      }
    }
  }
  return text;
}

function addGetDocumentRenderPayloadImport(text) {
  const seamRe = /import\s*\{([^}]+)\}\s*from\s*["']@\/lib\/document-form-api["']\s*;?/;
  const m = text.match(seamRe);
  if (m) {
    const names = m[1].split(",").map((s) => s.trim()).filter(Boolean);
    if (names.includes("getDocumentRenderPayload")) return text;
    names.push("getDocumentRenderPayload");
    names.sort();
    return text.replace(seamRe, `import { ${names.join(", ")} } from "${SEAM}";`);
  }
  const allImports = [...text.matchAll(/^import\s[^;]+;?\s*$/gm)];
  const last = allImports.length ? allImports[allImports.length - 1] : null;
  const insert = `import { getDocumentRenderPayload } from "${SEAM}";\n`;
  if (last) {
    const endIdx = last.index + last[0].length;
    return text.slice(0, endIdx) + "\n" + insert + text.slice(endIdx);
  }
  return insert + text;
}

function walkBalanced(text, startIdx, openChar, closeChar) {
  let depth = 0;
  let inString = null;
  let escape = false;
  let i = startIdx;
  while (i < text.length) {
    const ch = text[i];
    if (escape) { escape = false; i++; continue; }
    if (inString) {
      if (ch === "\\") { escape = true; i++; continue; }
      if (ch === inString) inString = null;
      i++; continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") { inString = ch; i++; continue; }
    if (ch === "/" && text[i+1] === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      continue;
    }
    if (ch === openChar) depth++;
    else if (ch === closeChar) { depth--; if (depth === 0) return i + 1; }
    i++;
  }
  return -1;
}

function migrateFile(filePath) {
  const src = readFileSync(filePath, "utf8");
  if (!src.includes("render-payload")) {
    return { changed: false, reason: "no offenders" };
  }

  // Match either `${API_BASE_URL}` or `${apiBase}` template literal.
  const startRe = /const\s+(\w+)\s*=\s*await\s+fetch\s*\(\s*`\$\{(API_BASE_URL|apiBase)\}\/documents\/generated\/\$\{documentId\}\/render-payload`\s*,/;
  const m = src.match(startRe);
  if (!m) return { changed: false, reason: "fetch start not matched" };

  const responseVar = m[1];
  const baseVar = m[2];
  const lineStart = src.lastIndexOf("\n", m.index) + 1;
  const indentMatch = src.slice(lineStart, m.index).match(/^[ \t]*/);
  const indent = indentMatch ? indentMatch[0] : "";

  // After the URL template literal backtick, look for either:
  //   `, {`  (fetch with options)
  //   `,` or `)` directly (fetch with no options)
  let i = m.index + m[0].length;
  while (i < src.length && /\s/.test(src[i])) i++;
  let fetchEnd;
  if (src[i] === "{") {
    fetchEnd = walkBalanced(src, i, "{", "}");
    if (fetchEnd < 0) return { changed: false, reason: "options brace not closed" };
    let j = fetchEnd;
    while (j < src.length && /[\s,]/.test(src[j])) j++;
    if (src[j] !== ")") return { changed: false, reason: "fetch close paren missing" };
    j++;
    while (j < src.length && /\s/.test(src[j])) j++;
    if (src[j] === ";") j++;
    fetchEnd = j;
  } else if (src[i] === ")") {
    // No options: fetch(url)
    let j = i + 1;
    while (j < src.length && /\s/.test(src[j])) j++;
    if (src[j] === ";") j++;
    fetchEnd = j;
  } else {
    return { changed: false, reason: "unexpected fetch end (no `{` or `)`)" };
  }
  const realFetchEnd = fetchEnd;

  const okRe = new RegExp(`if\\s*\\(\\s*!${responseVar}\\.ok\\s*\\)\\s*(?:\\{|throw)`, "s");
  const okM = src.slice(realFetchEnd).match(okRe);
  if (!okM) return { changed: false, reason: "ok-check not found" };
  const okStart = realFetchEnd + okM.index;
  const okKwEnd = okStart + okM[0].length;
  let okEnd;
  if (src[okKwEnd - 1] === "{") {
    okEnd = walkBalanced(src, okKwEnd - 1, "{", "}");
    if (okEnd < 0) return { changed: false, reason: "ok-block not closed" };
    while (okEnd < src.length && /\s/.test(src[okEnd])) okEnd++;
    if (src[okEnd] === ";") okEnd++;
  } else {
    // Inline `throw ...;`
    let j = okKwEnd;
    while (j < src.length && /[\s]/.test(src[j])) j++;
    // Scan until `;` at expression level (no nested ; inside).
    let parens = 0;
    while (j < src.length) {
      const ch = src[j];
      if (ch === "(") parens++;
      else if (ch === ")") parens--;
      else if (ch === ";" && parens === 0) { okEnd = j + 1; break; }
      j++;
    }
    if (!okEnd) return { changed: false, reason: "throw termination not found" };
  }

  const afterOk = src.slice(okEnd);

  // Try statement patterns first: `const x = (await <res>.json()) as T;` or `return (...);`
  // Match `const X = (await <res>.json()) [as T];` or `const X = await <res>.json() [as T];`
  // (some files wrap in parentheses for grouping).
  const declRe = new RegExp(
    "const\\s+([A-Za-z_]\\w*)\\s*(?::\\s*([^=]+?))?\\s*=\\s*\\(?\\s*(?:await\\s+)?" +
      responseVar +
      "\\.json\\(\\s*\\)\\s*\\)?\\s*(?:as\\s+([A-Za-z_][\\w<>,\\s\\[\\]]*))?\\s*;",
  );
  const retRe = new RegExp(
    "return\\s*\\(?\\s*(?:await\\s+)?" +
      responseVar +
      "\\.json\\(\\s*\\)\\s*\\)?\\s*(?:as\\s+([A-Za-z_][\\w<>,\\s\\[\\]]*))?\\s*;",
  );

  let jsonMatch = afterOk.match(declRe);
  let isDeclaration = true, isReturn = false, payloadVar = null, payloadTypeExplicit = null, payloadTypeAssert = null;
  if (jsonMatch) {
    payloadVar = jsonMatch[1];
    payloadTypeExplicit = jsonMatch[2]?.trim();
    payloadTypeAssert = jsonMatch[3]?.trim();
  } else {
    jsonMatch = afterOk.match(retRe);
    if (jsonMatch) {
      isDeclaration = false;
      isReturn = true;
      payloadTypeAssert = jsonMatch[1]?.trim();
    }
  }

  if (jsonMatch) {
    const jsonStartInOut = okEnd + jsonMatch.index;
    const jsonEndInOut = jsonStartInOut + jsonMatch[0].length;

    let replacement = "";
    if (isDeclaration && payloadVar) {
      const typeStr = payloadTypeExplicit
        ? `: ${payloadTypeExplicit}`
        : payloadTypeAssert
          ? `: ${payloadTypeAssert}`
          : "";
      replacement = `${indent}const ${payloadVar}${typeStr} = await getDocumentRenderPayload(documentId);`;
    } else if (isReturn) {
      replacement = `${indent}return await getDocumentRenderPayload(documentId);`;
    }

    const before = src.slice(0, lineStart);
    const after = src.slice(jsonEndInOut);
    let out = before + replacement + after;
    out = dropApiBaseIfUnused(out);
    out = addGetDocumentRenderPayloadImport(out);
    writeFileSync(filePath, out, "utf8");
    return { changed: true };
  }

  // Inline fallback: find `(await <res>.json()) as <Type>` and replace it.
  // Then separately remove the dead fetch + ok-check block.
  const inlineRe = new RegExp(
    "\\(await\\s+" + responseVar + "\\.json\\(\\s*\\)\\s*\\)\\s*(?:as\\s+([A-Za-z_][\\w<>,\\s\\[\\]]*))?",
  );
  const inlineMatch = afterOk.match(inlineRe);
  if (inlineMatch) {
    const jsonStartInOut = okEnd + inlineMatch.index;
    const jsonEndInOut = jsonStartInOut + inlineMatch[0].length;
    const replacementInline = `(await getDocumentRenderPayload(documentId))${
      inlineMatch[1] ? ` as ${inlineMatch[1]}` : ""
    }`;
    let out = src.slice(0, jsonStartInOut) + replacementInline + src.slice(jsonEndInOut);
    const fetchStartInOut = m.index;
    out = out.slice(0, fetchStartInOut) + out.slice(okEnd);
    out = out.replace(/(\n)\s*\n(\s*\n)+/g, "\n\n");
    out = dropApiBaseIfUnused(out);
    out = addGetDocumentRenderPayloadImport(out);
    writeFileSync(filePath, out, "utf8");
    return { changed: true };
  }

  return { changed: false, reason: "no json match" };
}

const files = readdirSync(PANELS_DIR).filter(
  (f) => /^bm-\d{3}-form-inputs\.tsx$/.test(f),
);

let changedCount = 0;
let errors = [];
for (const f of files) {
  const fullPath = `${PANELS_DIR}/${f}`;
  const result = migrateFile(fullPath);
  if (result.changed) {
    changedCount++;
  } else if (result.reason !== "no offenders") {
    errors.push(`${f}: ${result.reason}`);
  }
}

console.log(`Migrated: ${changedCount} files`);
console.log(`Errors: ${errors.length}`);
for (const e of errors) console.log(`  ${e}`);
