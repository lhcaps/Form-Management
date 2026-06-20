# QLLaw Form Studio — Design System and Interaction Contract

## Experience principles

Form Studio should feel like a precise professional workstation: dense enough
for real configuration work, calm enough for long sessions, and explicit about
governance state. It favors direct manipulation with a reliable inspector over
wizard screens.

The editor is desktop-first. Tablet and mobile provide review and read-only
inspection, not structural editing.

## Information architecture

Route: `/admin/form-studio`

- **Catalog** — search, filter, import, clone, create blank, and inspect status.
- **Editor** — three-pane workspace with Form, Bindings, DOCX Preview,
  Validation, and Versions tabs.
- **Review** — immutable revision diff, comments, request changes, approve.
- **Permissions** — grant Editor, Approver, and Permission Administrator
  capabilities.

The existing `/templates` route remains the generated-document review queue.

## Editor layout

### Header

- Breadcrumb and template identity.
- Agency scope, draft version, revision, and lifecycle status.
- Save state: saving, saved, conflict, offline.
- Primary actions: validate, preview, submit review, publish when eligible.

### Left pane — structure and palette

- Section and field tree.
- Add section, text, textarea, number, date, partial date, time, select, radio,
  checkbox, picker, readonly, computed, repeater, and table.
- Drag handle plus keyboard move controls.
- Duplicate, move, and delete actions.

### Center pane — end-user canvas

- Renders the same component registry used by the normal-user runtime.
- Desktop, tablet, and mobile viewport switches.
- Selection is visible but does not alter the rendered field geometry.
- Empty states explain the next valid action.

### Right pane — inspector

- Identity: label, key, description, section.
- Control: type, placeholder, options, picker source.
- Data: default source, computed expression, preset.
- Rules: required, visibility, validation, migration.
- Layout: width and order.
- DOCX: slot, transform, fallback, loop binding, plugin.

## Visual language

- Neutral slate surfaces with restrained blue for selection and primary action.
- Amber for review warnings, red for blocking validation, green for verified
  technical gates.
- 8px spacing grid; 12–18px radii; crisp 1px borders; shallow shadows only for
  elevated menus and active drag items.
- Minimum 44px pointer target. Body text remains at least 15px in configuration
  panes and 16px in runtime inputs.
- Avoid decorative gradients, oversized hero typography, and dashboard cards
  that reduce information density.

## Component states

Every interactive component must define:

- default, hover, focus-visible, selected, disabled, loading, invalid;
- keyboard behavior and accessible label;
- error text associated through `aria-describedby`;
- optimistic saving and revision-conflict recovery where applicable.

Drag-and-drop must also support keyboard pickup, movement, cancellation, screen
reader instructions, and live announcements.

## Editing and concurrency

- Local changes are represented as typed operations.
- Autosave is debounced by 800 ms.
- Each mutation includes `expectedRevision`.
- `409 DRAFT_REVISION_CONFLICT` pauses autosave and offers reload or compare.
- Undo and redo replay revision operations; they never mutate a published
  snapshot.

## Review and publishing

- Submitting review freezes the current revision.
- Approvers see field-level and binding-level diffs against the previous
  published version.
- Approvers cannot edit the submitted revision.
- Publish is available only after approval and all technical gates pass.
- Publishing creates a deterministic immutable compiled artifact and hashes.

## Responsive behavior

- At widths below 1024px, editing controls are disabled and the surface changes
  to review mode.
- The structure and inspector become drawers for read-only inspection.
- Validation issues remain navigable and link to the relevant field.

## Safety and accessibility

- Never evaluate user expressions with `eval` or `Function`.
- Unknown controls, transforms, plugins, and field paths are blocking errors.
- Uploaded Office files are size-limited, path-normalized, and inspected before
  extraction.
- Focus is restored after dialogs and destructive actions require confirmation.
- Color is never the only carrier of status.
