# Phase 8D Human Visual Review Packet

Status: `HUMAN_VISUAL_REVIEW_PENDING`

This packet rasterizes the existing verified PDFs only. It does not regenerate a DOCX or PDF and does not grant visual sign-off.

| Form | Pages | Automated checklist | First page | All pages | Human status |
|---|---:|---|---|---|---|
| BM-001 | 2 | 15 OK / 0 fail / 1 human | [PNG](BM-001/first-page.latest.png) | [Contact sheet](BM-001/contact-sheet.latest.png) | PENDING |
| BM-006 | 1 | 11 OK / 0 fail / 1 human | [PNG](BM-006/first-page.latest.png) | [Contact sheet](BM-006/contact-sheet.latest.png) | PENDING |
| BM-171 | 1 | 19 OK / 0 fail / 1 human | [PNG](BM-171/first-page.latest.png) | [Contact sheet](BM-171/contact-sheet.latest.png) | PENDING |

## Reviewer checklist

- Confirm no clipped or overlapping text.
- Confirm legal header, title, body, signature, and footer placement against the governing DOCX.
- Confirm page breaks and page numbering across every page.
- Confirm Times New Roman regular/bold/italic variants render as expected.
- Record an explicit reviewer identity, date, decision, and notes in the existing per-form `visual-signoff.latest.json` workflow.

## Provenance limitation

The existing conversion sidecars prove PDF byte length, page count, and embedded fonts, but the prior conversion recorded no immutable image digest. The current Phase 8D closure image is `sha256:2f0e7b8447e9ed7d65341708a1e308a6903ab17d528b6ee11f34c417366640f1`; equality with the prior conversion image is not proven. See `PHASE_8D_HUMAN_VISUAL_REVIEW_PACKET.latest.json` for hashes and exact paths.
