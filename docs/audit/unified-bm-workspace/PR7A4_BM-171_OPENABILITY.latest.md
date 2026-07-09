# PR7A.4 — BM-171 Openability Audit

**STATUS**: `READY_OPENABLE_MECHANICAL_WORD_REPAIR_DIALOG_CHECK_MANUAL_REQUIRED`
**Generated**: 2026-07-05T11:03:40.784Z
**Rendered DOCX**: `D:\Study\Project\QLLaw-main\docs\audit\bm-visual-signoff\BM-171\rendered.latest.docx` (21557 bytes)

## 1. Unzip

- ok: yes
- part count: 21

## 2. Required parts present

| part | present | bytes |
|---|---|---|
| [Content_Types].xml | yes | 1431 |
| _rels/.rels | yes | 737 |
| word/document.xml | yes | 61186 |
| word/styles.xml | yes | 23575 |
| word/settings.xml | yes | 5919 |

## 3. XML parts parse successfully

| part | well-formed |
|---|---|
| _rels/.rels | yes |
| customXml/_rels/item1.xml.rels | yes |
| customXml/item1.xml | yes |
| customXml/itemProps1.xml | yes |
| docProps/app.xml | yes |
| docProps/core.xml | yes |
| docProps/custom.xml | yes |
| word/_rels/document.xml.rels | yes |
| word/document.xml | yes |
| word/fontTable.xml | yes |
| word/settings.xml | yes |
| word/styles.xml | yes |
| word/theme/theme1.xml | yes |
| [Content_Types].xml | yes |

## 4. Relationship targets sane

- present: true
- total relationships: 5
- empty targets: 0
- ok: true

## 5. LibreOffice → PDF export

- available: no
- reason: soffice / libreoffice not on PATH

## 6. Word COM openability check

- ok: NOT_AVAILABLE — Word COM probe failed (exit 4294770688): 
PowerShell[.exe] [-PSConsoleFile <file> | -Version <version>]
    [-NoLogo] [-NoExit] [-Sta] [-Mta] [-NoProfile] [-NonInteractive]
    [-InputFormat {Text | XML}] [-OutputFormat {Text | XML}]
   Cannot process the command because of a missing parameter. A command must follow -Command.


## Acceptance

- DOCX unzips: PASS
- Required parts present: PASS
- XML parts parse: PASS
- Relationship targets sane: PASS
- LibreOffice PDF export: NOT_AVAILABLE
- Word open without repair prompt: NOT_AVAILABLE

