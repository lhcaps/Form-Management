# BM-052 Approved DOCX Placeholder Renormalization Decisions

Mode: `APPROVED_FOR_APPLY_WITH_PREFLIGHT_GATES`

## Approved Occurrences

| Original placeholder | Occurrence | New placeholder | Semantic field |
|---|---:|---|---|
| `decision.decisionLine2` | 0 | `person.fullName` | `person.fullName` |
| `decision.decisionLine2` | 1 | `person.fullName` | `person.fullName` |
| `recipients.personLine6` | 3 | `person.idNumber` | `person.idNumber` |
| `recipients.personLine6` | 4 | `person.temporaryAddress` | `person.temporaryAddress` |

## Deferred

| Placeholder | Occurrence | Reason |
|---|---:|---|
| `recipients.personLine6` | 0 | `DEFER_AMBIGUOUS_PERSON_NAME` |
| `recipients.personLine6` | 1 | `DEFER_AMBIGUOUS_PERSON_NAME` |
| `recipients.personLine6` | 2 | `DEFER_AMBIGUOUS_PERSON_NAME` |
| `recipients.personLine6` | 5 | `DEFER_REQUIRES_HUMAN_DOCX_REVIEW` |

## Rejected Name Guard

The apply runner must abort if any legacy occurrence-suffix proposal name appears in the approved decision payload. The approved decisions above intentionally use only stable semantic names.

## Binding Model

`docxSlots[].slotId` and `renderBindings[].slotId` target the actual DOCX placeholder. `renderBindings[].from` targets the semantic source field. In this BM-052 apply, the approved new placeholders are already semantic field paths, so `slotId` and `from` may be equal for the newly repaired bindings.
