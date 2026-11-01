# BM-001 Render / Export Golden Validation

Generated: 2026-07-07T16:49:15.075Z
Status: **PASS**
Strategy: direct generated render core (Docxtemplater + PizZip, same engine as DocxtemplaterContractRenderEngine.renderActiveDocx)

## Source Inputs

| Key | Path |
|---|---|
| BM-001 profile | `D:\Study\Project\QLLaw-main\apps\web\src\lib\form-flight\profiles\bm001.ts` |
| Locked contract | `D:\Study\Project\QLLaw-main\docs\audit\docx\contracts\locked\BM-001__f4c2aa3682d3.contract.locked.json` |
| Normalized DOCX | `D:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-001\BM-001_normalized.docx` |
| sourceId | `BM-001__f4c2aa3682d3` |
| contract slot count | 39 |
| contract binding count | 39 |
| demo key count | 32 |
| requiredText count | 10 |
| forbiddenText count | 7 |

## DOCX Golden

Status: **PASS**
Output: `D:\Study\Project\QLLaw-main\docs\audit\unified-bm-workspace\bm001-golden\BM001_RENDERED_GOLDEN.latest.docx`
File size: 21865 bytes
Text extracted: YES (2 parts)
requiredText passed: 10/10
forbiddenText absent: 7/7
placeholder leaks: 0
stale fallback leaks: NO

### requiredText results

| Anchor | Present |
|---|---|
| `BIÊN BẢN` | PASS |
| `Tiếp nhận nguồn tin về tội phạm` | PASS |
| `Căn cứ các điều 133, 144, 145 và 146 của Bộ luật Tố tụng hình sự` | PASS |
| `Nguyễn Thị Mai` | PASS |
| `Trần Văn Bình` | PASS |
| `I. NỘI DUNG NGUỒN TIN VỀ TỘI PHẠM` | PASS |
| `II. CÁC TÀI LIỆU, ĐỒ VẬT GIAO NỘP KÈM THEO` | PASS |
| `Việc tiếp nhận nguồn tin về tội phạm kết thúc` | PASS |
| `NGƯỜI CUNG CẤP` | PASS |
| `NGƯỜI TIẾP NHẬN` | PASS |

### forbiddenText results

| Token | Absent |
|---|---|
| `{{` | PASS |
| `}}` | PASS |
| `Ông  cung cấp` | PASS |
| `undefined` | PASS |
| `null` | PASS |
| `[object Object]` | PASS |
| `Nguyễn Thị Hồng Hạnh` | PASS |

### required sections

| Section | Present |
|---|---|
| `BIÊN BẢN` | PASS |
| `Tiếp nhận nguồn tin về tội phạm` | PASS |
| `I. NỘI DUNG NGUỒN TIN VỀ TỘI PHẠM` | PASS |
| `II. CÁC TÀI LIỆU, ĐỒ VẬT GIAO NỘP KÈM THEO` | PASS |
| `NGƯỜI CUNG CẤP` | PASS |
| `NGƯỜI TIẾP NHẬN` | PASS |

### demo names

| Name | Present |
|---|---|
| `Nguyễn Thị Mai` | PASS |
| `Trần Văn Bình` | PASS |

### known bug tokens (must be absent)

| Token | Absent |
|---|---|
| `Ông  cung cấp` | PASS |
| `Nguyễn Thị Hồng Hạnh` | PASS |

### placeholder leaks

None.

## PDF Golden

Status: **PASS**
Output: `D:\Study\Project\QLLaw-main\docs\audit\unified-bm-workspace\bm001-golden\BM001_RENDERED_GOLDEN.latest.pdf`
Helper: `D:\Study\Project\QLLaw-main\apps\api\scripts\pdf-convert-word-com.ps1`
Text extracted: YES
requiredText passed: 10/10
forbiddenText absent: 7/7
Blocker: none


### requiredText results (PDF)

| Anchor | Present |
|---|---|
| `BIÊN BẢN` | PASS |
| `Tiếp nhận nguồn tin về tội phạm` | PASS |
| `Căn cứ các điều 133, 144, 145 và 146 của Bộ luật Tố tụng hình sự` | PASS |
| `Nguyễn Thị Mai` | PASS |
| `Trần Văn Bình` | PASS |
| `I. NỘI DUNG NGUỒN TIN VỀ TỘI PHẠM` | PASS |
| `II. CÁC TÀI LIỆU, ĐỒ VẬT GIAO NỘP KÈM THEO` | PASS |
| `Việc tiếp nhận nguồn tin về tội phạm kết thúc` | PASS |
| `NGƯỜI CUNG CẤP` | PASS |
| `NGƯỜI TIẾP NHẬN` | PASS |

### forbiddenText results (PDF)

| Token | Absent |
|---|---|
| `{{` | PASS |
| `}}` | PASS |
| `Ông  cung cấp` | PASS |
| `undefined` | PASS |
| `null` | PASS |
| `[object Object]` | PASS |
| `Nguyễn Thị Hồng Hạnh` | PASS |

### required sections (PDF)

| Section | Present |
|---|---|
| `BIÊN BẢN` | PASS |
| `Tiếp nhận nguồn tin về tội phạm` | PASS |
| `I. NỘI DUNG NGUỒN TIN VỀ TỘI PHẠM` | PASS |
| `II. CÁC TÀI LIỆU, ĐỒ VẬT GIAO NỘP KÈM THEO` | PASS |
| `NGƯỜI CUNG CẤP` | PASS |
| `NGƯỜI TIẾP NHẬN` | PASS |

### demo names (PDF)

| Name | Present |
|---|---|
| `Nguyễn Thị Mai` | PASS |
| `Trần Văn Bình` | PASS |

### known bug tokens (PDF, must be absent)

| Token | Absent |
|---|---|
| `Ông  cung cấp` | PASS |
| `Nguyễn Thị Hồng Hạnh` | PASS |

### placeholder leaks (PDF)

None.

## Lifecycle

- Render strategy: direct generated render core (PizZip + Docxtemplater, same packages and delimiters as `DocxtemplaterContractRenderEngine`).
- PDF export: existing project helper `apps/api/scripts/pdf-convert-word-com.ps1` (Word COM) and/or `pdf-convert-fallback.ps1` (LibreOffice → Word COM). No new dependencies, no DB mutation.
- No DB mutation. No `/templates/:templateCode` runtime preview lifecycle used.
- No mutation of source DOCX, normalized DOCX, locked contract, or BM-001 profile.
