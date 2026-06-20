# QLLaw — Product Definition

## Product promise

QLLaw helps prosecution agencies manage case records and produce legally
structured documents from controlled DOCX templates. The product must preserve
the source document's structure while making data entry faster, safer, and
auditable.

## Form Studio v2

Form Studio is an administration surface for turning a canonical DOC/DOCX
template into a governed, agency-scoped runtime form. It is not a Word editor.
The DOCX remains the layout authority; Form Studio controls fields, data
sources, validation, conditions, repeaters, tables, computed values, and their
render bindings.

### Primary users

- **Form Editor** creates and changes draft overlays for an agency.
- **Form Approver** reviews a frozen revision, comments, requests changes, and
  approves it. The approver must be a different account from the draft creator.
- **Permission Administrator** grants Form Studio capabilities.
- **Official** fills only published forms and never sees draft configuration.

### Core jobs

1. Import a DOC/DOCX, clone a standard form, or start a blank draft.
2. Add sections and fields manually, then choose and change each control type.
3. Bind every custom field to a DOCX slot, table loop, computed source, or
   governed default.
4. Preview and validate the complete form before review.
5. Publish an immutable version for one agency without rebuilding the app.
6. Preserve historical versions so existing documents can be reproduced.

### Governance rules

- Standard locked contracts are immutable base definitions.
- Agency changes are overlays; they do not rewrite the standard contract.
- Drafts may be deleted. Published versions may only be archived.
- A draft creator cannot approve their own work.
- Published JSON artifacts are immutable and addressed by contract hash.
- Blank forms cannot be published without a normalized DOCX.
- A required field must have a valid binding, default, or computed source.
- Automated checks prove technical consistency, not legal correctness.

### Runtime resolution

For an authenticated official, the runtime resolves:

1. the agency's latest published overlay;
2. the latest global published contract;
3. the existing locked-file contract.

Drafts, review revisions, and rejected versions are never returned to normal
users.

### Non-goals for this workstream

- A WYSIWYG Word page-layout editor.
- Automatic claims that a form is legally correct.
- Replacing all bespoke BM components in one release.
- Enabling `DOCUMENT_RENDERER_MODE=active`.
- Starting the D.2.3C cutover phase.

## Success measures

- An authorized editor can add a field, change its control, bind it, preview
  it, and submit it without source-code changes.
- A separate approver can review a deterministic diff and approve the exact
  revision they reviewed.
- Published forms render consistently in FE, API validation, payload building,
  and DOCX output from the same compiled contract.
- Repeater, dynamic table, conditional, and computed fields work through the
  whole pipeline.
- BM-001 remains shadow-only until its independent human gate is approved.
