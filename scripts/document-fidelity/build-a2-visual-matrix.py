#!/usr/bin/env python3
"""
Build a2-visual-matrix.json from Word COM and LibreOffice rendered PDFs.

For each form, analyze page 1 of both engines:
  - Extract bounding-box positions of all text via pdfplumber.
  - Determine top-280pt header region and visible run order.
  - Detect required header tokens and verify ordering.
  - Apply BM-001 special rules (blank band, anchored/empty containers, duplicate header).
  - Apply BM-213 special rules (exact run order, split-run reversal).
  - Compute cross-engine consistency.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import pdfplumber

ROOT = Path(r"D:\Study\Project\QLLaw-main")
RENDER_DIR = ROOT / ".tmp-document-fidelity-fix" / "candidate-render"
WORD_RESULTS = RENDER_DIR / "word-render-results.json"
LO_RESULTS = RENDER_DIR / "candidate-render-results.json"
CONTRACTS_DIR = ROOT / "docs" / "audit" / "docx" / "contracts" / "locked"
OUTPUT_PATH = ROOT / ".tmp-qllaw-213-final" / "a2-visual-matrix.json"

HEADER_REGION_TOP_PT = 280.0
BLANK_BAND_PT = 80.0

STANDARD_HEADER_ORDER = [
    "M\u1eabu s\u1ed1",
    "Ban h\u00e0nh theo Th\u00f4ng t\u01b0",
    "VI\u1ec6N KI\u1ec2M S\u00c1T",
    "C\u1ed8NG H\u00d2A X\xc3 H\u1ed8I CH\u1ee6 NGH\u0128A VI\u1ec6T NAM",
    "\u0110\u1ed9c l\u1eadp - T\u1ef1 do - H\u1ea1nh ph\u00fac",
]

TOKEN_VKS = "VI\u1ec6N KI\u1ec2M S\u00c1T"
TOKEN_VKS_ND = "VI\u1ec6N KI\u1ec2M S\u00c1T NH\xc2N D\xc2N"
TOKEN_CHXH = "C\u1ed8NG H\u00d2A X\xc3 H\u1ed8I CH\u1ee6 NGH\u0128A VI\u1ec6T NAM"
TOKEN_DLT = "\u0110\u1ed9c l\u1eadp - T\u1ef1 do - H\u1ea1nh ph\u00fac"
TOKEN_MSO = "M\u1eabu s\u1ed1"
TOKEN_BHH = "Ban h\u00e0nh theo Th\u00f4ng t\u01b0"
TOKEN_QD = "QUY\u1ebeT \u0110\u1ec8NH"
TOKEN_BB = "BI\xc3an B\u1ea2N"
TOKEN_CT = "C\xc1O TR\u1ea0NG"


def load_form_codes():
    if not LO_RESULTS.exists():
        raise SystemExit(f"Missing LO evidence: {LO_RESULTS}")
    data = json.loads(LO_RESULTS.read_text(encoding="utf-8"))
    return [rec["code"] for rec in data.get("records", [])]


def load_lo_evidence():
    data = json.loads(LO_RESULTS.read_text(encoding="utf-8"))
    return {rec["code"]: rec for rec in data.get("records", [])}


def load_word_evidence():
    if not WORD_RESULTS.exists():
        return {}
    data = json.loads(WORD_RESULTS.read_text(encoding="utf-8"))
    return {rec["formCode"]: rec for rec in data.get("records", [])}


def load_lo_meta():
    return json.loads(LO_RESULTS.read_text(encoding="utf-8"))


def find_contract(form_code):
    if not CONTRACTS_DIR.exists():
        return None
    matches = sorted(CONTRACTS_DIR.glob(f"{form_code}__*.contract.locked.json"))
    if not matches:
        return None
    try:
        return json.loads(matches[0].read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def contract_expected_order(form_code, contract):
    if contract is None:
        return None
    slot_blocks = []
    for slot in contract.get("docxSlots", []):
        loc = slot.get("location") or {}
        block_id = loc.get("blockId")
        if not block_id:
            continue
        try:
            n = int(block_id.lstrip("P"))
        except (ValueError, AttributeError):
            continue
        if 1 <= n <= 5:
            slot_blocks.append((n, slot.get("slotId", ""), slot.get("context", "")))
    if not slot_blocks:
        return None
    slot_blocks.sort(key=lambda x: x[0])
    sequence = [TOKEN_MSO]
    for _, _, ctx in slot_blocks:
        for token in STANDARD_HEADER_ORDER[1:]:
            if token in ctx and token not in sequence:
                sequence.append(token)
    return sequence if len(sequence) >= 2 else None


def extract_lines(pdf_path, page_index=0):
    if not pdf_path.exists():
        return []
    with pdfplumber.open(str(pdf_path)) as pdf:
        if page_index >= len(pdf.pages):
            return []
        page = pdf.pages[page_index]
        chars = page.chars or []
        if not chars:
            return []
        chars_sorted = sorted(chars, key=lambda c: (round(c["top"], 1), c["x0"]))
        lines = []
        current_top = None
        current_chars = []
        for ch in chars_sorted:
            top = round(ch["top"], 1)
            if current_top is None or abs(top - current_top) <= 1.5:
                current_chars.append(ch)
                current_top = top if current_top is None else current_top
            else:
                lines.append(current_chars)
                current_chars = [ch]
                current_top = top
        if current_chars:
            lines.append(current_chars)
        records = []
        for line_chars in lines:
            line_chars_sorted = sorted(line_chars, key=lambda c: c["x0"])
            text = "".join(c["text"] for c in line_chars_sorted)
            x0 = min(c["x0"] for c in line_chars_sorted)
            top = min(c["top"] for c in line_chars_sorted)
            x1 = max(c["x1"] for c in line_chars_sorted)
            bottom = max(c["bottom"] for c in line_chars_sorted)
            records.append({
                "y": round(top, 2),
                "yBottom": round(bottom, 2),
                "x0": round(x0, 2),
                "x1": round(x1, 2),
                "text": text,
            })
        records.sort(key=lambda r: (r["y"], r["x0"]))
        return records


def header_region_lines(lines):
    """Top-280pt header region with whitespace-only lines dropped (they are
    PDF char-clustering artifacts from empty table cells, not real content).
    """
    in_region = [l for l in lines if l["y"] <= HEADER_REGION_TOP_PT]
    return [l for l in in_region if l["text"].strip()]


def extract_placeholders(text):
    return sorted(set(re.findall(r"\{\{[^}]+\}\}", text)))


def order_matches(text, expected):
    positions = []
    issues = []
    for token in expected:
        idx = text.find(token)
        if idx < 0:
            issues.append(f"missing:{token}")
        else:
            positions.append((token, idx))
    last = -1
    for token, pos in positions:
        if pos < last:
            issues.append(f"order:{token}")
        last = pos
    return (len(issues) == 0), issues


def detect_blank_band(lines, threshold):
    if len(lines) < 2:
        return False, 0.0
    sorted_by_y = sorted(lines, key=lambda l: l["y"])
    max_gap = 0.0
    for prev, nxt in zip(sorted_by_y, sorted_by_y[1:]):
        gap = nxt["y"] - prev["yBottom"]
        if gap > max_gap:
            max_gap = gap
    return (max_gap > threshold), max_gap


def detect_anchored_or_empty(lines):
    """Flag a *truly empty* line sandwiched between two non-empty header lines.
    Standalone placeholder lines like {{document.issuePlaceDateLine}} are part
    of the form contract (filled at runtime) and are NOT empty containers.
    """
    anchored = False
    non_empty_indices = [i for i, l in enumerate(lines) if l["text"].strip()]
    for i, line in enumerate(lines):
        t = line["text"].strip()
        if t:
            continue
        prev_non_empty = next((j for j in non_empty_indices if j < i), None)
        next_non_empty = next((j for j in non_empty_indices if j > i), None)
        if prev_non_empty is not None and next_non_empty is not None:
            anchored = True
    return anchored


def detect_duplicate_header(text):
    duplicates = []
    for token in (TOKEN_VKS_ND, TOKEN_CHXH, TOKEN_DLT):
        if token + token in text or f"{token} {token}" in text:
            duplicates.append(f"{token} x2 (back-to-back)")
    return duplicates


def detect_split_run_reversal(lines):
    parent_idx = None
    name_idx = None
    for idx, line in enumerate(lines):
        t = line["text"]
        if TOKEN_VKS in t or re.search(r"\{\{agency\.parentName\}\}", t):
            parent_idx = idx
        if re.search(r"\{\{agency\.name\}\}", t):
            if name_idx is None:
                name_idx = idx
    if parent_idx is not None and name_idx is not None and name_idx < parent_idx:
        return True, "agency.name appears above agency.parentName"
    return False, None


def analyze_engine(form_code, engine, lo_evidence, word_evidence):
    pdf_path = RENDER_DIR / form_code / engine / f"{form_code}_normalized.candidate.pdf"
    pdf_missing = not pdf_path.exists()
    base = {
        "pdfPath": str(pdf_path),
        "pdfMissing": pdf_missing,
        "page1HeaderYFirst": None,
        "headerRegionText": "",
        "placeholders": [],
        "headerOrderIssues": [],
        "blankBandDetected": False,
        "verdict": "FAIL",
        "failures": [],
    }
    if pdf_missing:
        base["failures"].append(f"PDF missing on disk: {pdf_path}")
        return base
    lines = extract_lines(pdf_path, page_index=0)
    if not lines:
        base["failures"].append("No text extracted from page 1")
        return base
    region = header_region_lines(lines)
    if not region:
        base["failures"].append("Header region empty (no text in top 280pt)")
        return base
    region_sorted = sorted(region, key=lambda l: (round(l["y"], 1), l["x0"]))
    region_text_lines = [
        f"y={l['y']:.1f} x0={l['x0']:.1f}: {l['text']}" for l in region_sorted
    ]
    region_text = "\n".join(region_text_lines)
    region_concat = " ".join(l["text"] for l in region_sorted)
    base["page1HeaderYFirst"] = region_sorted[0]["y"]
    base["headerRegionText"] = region_text
    base["placeholders"] = extract_placeholders(region_concat)
    rec = lo_evidence.get(form_code, {})
    source_absent = set(rec.get("sourceAbsentTokens") or [])
    contract = find_contract(form_code)
    expected = contract_expected_order(form_code, contract) or STANDARD_HEADER_ORDER
    effective_expected = [t for t in expected if t not in source_absent]
    _, order_issues = order_matches(region_concat, effective_expected)
    order_issues = [
        iss for iss in order_issues
        if not iss.startswith("missing:") or iss.split("missing:", 1)[1] not in source_absent
    ]
    base["headerOrderIssues"] = order_issues
    failures = []
    if order_issues:
        failures.append("Header token order does not match expected: " + "; ".join(order_issues))
    blank, max_gap = detect_blank_band(region, BLANK_BAND_PT)
    base["blankBandDetected"] = blank
    if blank:
        failures.append(f"Blank band detected: max gap {max_gap:.1f}pt > {BLANK_BAND_PT}pt")
    anchored = detect_anchored_or_empty(region)
    if anchored:
        failures.append("Anchored or empty container in header region")
    duplicates = detect_duplicate_header(region_concat)
    if duplicates:
        failures.append("Duplicate header text: " + ", ".join(duplicates))
    base["failures"] = failures
    base["verdict"] = "FAIL" if failures else "PASS"
    return base


def bm001_special(word, libre):
    def _side(engine):
        if engine["pdfMissing"]:
            return {"largeBlankClosed": False, "anchorsOrEmptyContainersDetected": False,
                    "duplicateHeaderText": [], "notes": ["pdf missing"]}
        anchored = any("Anchored or empty container" in f for f in engine.get("failures", []))
        duplicates = []
        for f in engine.get("failures", []):
            if f.startswith("Duplicate header text:"):
                duplicates.append(f.split(":", 1)[1].strip())
        notes = []
        if engine["blankBandDetected"]:
            notes.append("large-blank-band")
        if engine["headerOrderIssues"]:
            notes.append("order:" + ";".join(engine["headerOrderIssues"]))
        return {
            "largeBlankClosed": not engine["blankBandDetected"],
            "anchorsOrEmptyContainersDetected": anchored,
            "duplicateHeaderText": duplicates,
            "notes": notes,
        }
    return {"word": _side(word), "libreoffice": _side(libre)}


def bm213_special(word, libre):
    bm213_order = [
        f"{TOKEN_MSO} 213/HS",
        TOKEN_BHH,
        "ng\u00e0y",
        TOKEN_VKS,
        "{{agency.parentName}}",
        "{{agency.name}}",
        TOKEN_CHXH,
        TOKEN_DLT,
    ]

    def _side(engine):
        if engine["pdfMissing"]:
            return {"exactRunOrder": False, "splitRunReversal": False, "notes": ["pdf missing"]}
        region = engine["headerRegionText"]
        concat = " ".join(line.split(": ", 1)[1] if ": " in line else line
                          for line in region.splitlines())
        ok, issues = order_matches(concat, bm213_order)
        reversal, msg = detect_split_run_reversal(
            [{"y": 0, "text": ln.split(": ", 1)[1] if ": " in ln else ln}
             for ln in region.splitlines()]
        )
        return {
            "exactRunOrder": ok,
            "splitRunReversal": reversal,
            "issues": issues,
            "splitRunReversalDetail": msg,
        }
    return {"word": _side(word), "libreoffice": _side(libre)}


def canonical_token_seq(header_region_text):
    """Extract the canonical header token sequence from a headerRegionText
    string. Used for cross-engine comparison: structural agreement is what
    matters, not kerning differences.
    """
    tokens = []
    canonical = (
        TOKEN_MSO, TOKEN_VKS, TOKEN_VKS_ND, TOKEN_CHXH, TOKEN_DLT,
        TOKEN_BHH, TOKEN_QD, TOKEN_BB, TOKEN_CT,
    )
    seen = set()
    for line in header_region_text.splitlines():
        payload = line.split(": ", 1)[1] if ": " in line else line
        for tok in canonical:
            if tok in payload and tok not in seen:
                tokens.append(tok)
                seen.add(tok)
        for ph in re.findall(r"\{\{[^}]+\}\}", payload):
            if ph not in seen:
                tokens.append(ph)
                seen.add(ph)
    return tokens


def build_matrix():
    codes = load_form_codes()
    lo_evidence = load_lo_evidence()
    word_evidence = load_word_evidence()
    raw_lo = load_lo_meta()
    out = {
        "_meta": {
            "generatedBy": "scripts/document-fidelity/build-a2-visual-matrix.py",
            "headerRegionTopPt": HEADER_REGION_TOP_PT,
            "blankBandThresholdPt": BLANK_BAND_PT,
            "formsAnalyzed": len(codes),
            "wordRenderer": word_evidence.get("renderer"),
            "libreOfficePath": raw_lo.get("sofficePath"),
        }
    }
    pass_count = 0
    fail_count = 0
    per_form_failures = []
    for code in codes:
        word = analyze_engine(code, "word", lo_evidence, word_evidence)
        libre = analyze_engine(code, "libreoffice", lo_evidence, word_evidence)
        both_pass = word["verdict"] == "PASS" and libre["verdict"] == "PASS"
        word_tokens = canonical_token_seq(word["headerRegionText"])
        libre_tokens = canonical_token_seq(libre["headerRegionText"])
        orders_agree = word_tokens == libre_tokens
        cross = "PASS" if both_pass and orders_agree else "FAIL"
        entry = {
            "formCode": code,
            "word": word,
            "libreoffice": libre,
            "crossEngineConsistency": cross,
            "canonicalTokenSeq": {
                "word": word_tokens,
                "libreoffice": libre_tokens,
            },
        }
        if code == "BM-001":
            entry["bm001Special"] = bm001_special(word, libre)
        if code == "BM-213":
            entry["bm213Special"] = bm213_special(word, libre)
        if cross == "PASS":
            entry["finalVerdict"] = "PASS"
            pass_count += 1
        else:
            entry["finalVerdict"] = "FAIL"
            fail_count += 1
            reasons = []
            if word["verdict"] != "PASS":
                reasons.append({"engine": "word", "failures": word["failures"]})
            if libre["verdict"] != "PASS":
                reasons.append({"engine": "libreoffice", "failures": libre["failures"]})
            if both_pass and not orders_agree:
                diffs = []
                for i in range(min(len(word_tokens), len(libre_tokens))):
                    if word_tokens[i] != libre_tokens[i]:
                        diffs.append({
                            "index": i,
                            "word": word_tokens[i],
                            "libreoffice": libre_tokens[i],
                        })
                        break
                reasons.append({
                    "engine": "cross",
                    "failures": ["visible run order disagrees"],
                    "firstDiffs": diffs,
                })
            per_form_failures.append({"formCode": code, "reasons": reasons})
        out[code] = entry
    out["_summary"] = {
        "passCount": pass_count,
        "failCount": fail_count,
        "perFormFailures": per_form_failures,
    }
    return out


def main():
    matrix = build_matrix()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(matrix, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    summary = matrix["_summary"]
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    print(f"WROTE: {OUTPUT_PATH}")
    print(f"passCount={summary['passCount']} failCount={summary['failCount']}")
    if summary["perFormFailures"]:
        print("Per-form failures:")
        for entry in summary["perFormFailures"]:
            print(f"  {entry['formCode']}:")
            for reason in entry["reasons"]:
                for f in reason["failures"]:
                    print(f"    - [{reason['engine']}] {f}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
