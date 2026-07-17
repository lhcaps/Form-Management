const s = "if (!res.ok) throw new Error(`HTTP ${res.status}`);";
let j = 0;
let inS = null;
let esc = false;
while (j < s.length) {
  const ch = s[j];
  if (esc) { esc = false; j++; continue; }
  if (inS) {
    if (ch === "\\") { esc = true; j++; continue; }
    if (ch === inS) inS = null;
    j++; continue;
  }
  if (ch === '"' || ch === "'" || ch === "`") { inS = ch; j++; continue; }
  if (ch === ";") { console.log('found ; at', j); j++; break; }
  j++;
}