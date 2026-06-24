/**
 * Derive a stable FormInputSchema from a locked form contract.
 *
 * Source priority (PLAN.md v2.3 §B1):
 *  1. canonicalFields  — primary source of field existence.
 *  2. renderBindings / docxSlots — fallback ONLY for bound/rendered slots
 *     that are missing from canonicalFields. Each fallback emits
 *     BOUND_SLOT_MISSING_FIELD and origin = "binding-fallback".
 *  3. formInputHints.suggestedControls — UI hint refinement only. It
 *     MUST NEVER create field existence. A hint that points to a path
 *     not present in canonical or fallback fields is silently ignored.
 *  4. rejectedCandidates — MUST NEVER become editable fields. If a
 *     path in renderBindings or docxSlots is also in rejectedCandidates,
 *     suppress it and emit REJECTED_AS_EDITABLE.
 *
 * Source normalization:
 *  - Valid output source values: manual, casePayload, agencyConfig,
 *    officialConfig, systemDate, computed.
 *  - "unknown" → output source = "manual", editable = true,
 *    visible = true, visibilityReason = "USER_INPUT", emit
 *    UNKNOWN_SOURCE_NORMALIZED warning.
 *  - Any other unrecognized string → same conservative fallback plus
 *    UNKNOWN_SOURCE_NORMALIZED warning.
 *
 * Editability/visibility per source:
 *  - manual            → editable=true,  visible=true,  USER_INPUT
 *  - casePayload       → editable=false, visible=true,  READONLY_PREVIEW (CASE_PAYLOAD)
 *  - agencyConfig      → editable=false, visible=true,  READONLY_PREVIEW (AGENCY_CONFIG)
 *  - officialConfig    → editable=false, visible=true,  READONLY_PREVIEW (OFFICIAL_CONFIG)
 *  - systemDate        → editable=false, visible=true,  READONLY_PREVIEW (SYSTEM_DATE)
 *  - computed          → editable=false, visible=false, INTERNAL_RENDER_ONLY (COMPUTED)
 *                        (only flipped to visible=true if a hint explicitly says so)
 *
 * Pure: no I/O, no thrown errors, deterministic.
 */

const VALID_SOURCES = new Set([
  "manual",
  "casePayload",
  "agencyConfig",
  "officialConfig",
  "systemDate",
  "computed",
]);

export type FormInputFieldSource =
  | "manual"
  | "casePayload"
  | "agencyConfig"
  | "officialConfig"
  | "systemDate"
  | "computed";

export type FormInputFieldInputType = "text" | "date" | "number" | "textarea";

export type FormInputFieldReadonlyReason =
  | "CASE_PAYLOAD"
  | "AGENCY_CONFIG"
  | "OFFICIAL_CONFIG"
  | "SYSTEM_DATE"
  | "COMPUTED";

export type FormInputFieldVisibilityReason =
  | "USER_INPUT"
  | "READONLY_PREVIEW"
  | "INTERNAL_RENDER_ONLY";

export type FormInputField = {
  path: string;
  label: string;
  required: boolean;
  inputType: FormInputFieldInputType;
  source: FormInputFieldSource;
  editable: boolean;
  readonlyReason?: FormInputFieldReadonlyReason;
  visible: boolean;
  visibilityReason?: FormInputFieldVisibilityReason;
  reviewRequired: boolean;
  origin: "canonical" | "binding-fallback" | "hint";
};

export type FormInputSection = {
  key: string;
  title: string;
  fields: FormInputField[];
};

export type SchemaWarning = {
  code: "BOUND_SLOT_MISSING_FIELD" | "REJECTED_AS_EDITABLE" | "UNKNOWN_SOURCE_NORMALIZED";
  path?: string;
  message: string;
};

export type FormInputSchema = {
  templateCode: string;
  sourceId: string;
  warnings: SchemaWarning[];
  sections: FormInputSection[];
};

const DATE_SUFFIX = /^(date|day|month|year|time)$/i;
const NUMERIC_SUFFIX = /^(count|quantity|amount|num|number|integer)$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function readBoolean(record: Record<string, unknown>, key: string): boolean {
  const value = record[key];
  return typeof value === "boolean" ? value : false;
}

function readArray<T = unknown>(record: Record<string, unknown>, key: string): T[] {
  const value = record[key];
  return Array.isArray(value) ? (value as T[]) : [];
}

function pathSectionKey(path: string): string {
  const head = path.split(".")[0]?.trim();
  return head ? head : path;
}

function pathTail(path: string): string {
  const tail = path.split(".").pop()?.trim();
  return tail ? tail : path;
}

function humanizeSectionKey(key: string): string {
  // English-only fallback. B2 will replace this with a Vietnamese
  // SECTION_TITLES map; B1 deliberately keeps it minimal and stable so
  // tests do not depend on a translation that does not exist yet.
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getSectionTitle(key: string): string {
  return humanizeSectionKey(key);
}

function mapInputType(input: {
  uiComponent: string;
  slotType: string;
  path: string;
}): FormInputField["inputType"] {
  const component = input.uiComponent.toLowerCase();
  if (component === "date") return "date";
  if (component === "textarea") return "textarea";
  if (component === "number") return "number";
  if (component === "text" || component === "select" || component === "") {
    const tail = pathTail(input.path);
    if (DATE_SUFFIX.test(tail)) return "date";
    if (NUMERIC_SUFFIX.test(tail)) return "number";
    if (input.slotType.toLowerCase() === "datepart") return "date";
  }
  return "text";
}

function mapSource(rawSource: string): {
  source: FormInputField["source"];
  editable: boolean;
  readonlyReason: FormInputField["readonlyReason"];
  visible: boolean;
  visibilityReason: FormInputField["visibilityReason"];
  unknown: boolean;
} {
  const value = rawSource.trim();
  if (value === "casePayload") {
    return {
      source: "casePayload",
      editable: false,
      readonlyReason: "CASE_PAYLOAD",
      visible: true,
      visibilityReason: "READONLY_PREVIEW",
      unknown: false,
    };
  }
  if (value === "agencyConfig") {
    return {
      source: "agencyConfig",
      editable: false,
      readonlyReason: "AGENCY_CONFIG",
      visible: true,
      visibilityReason: "READONLY_PREVIEW",
      unknown: false,
    };
  }
  if (value === "officialConfig") {
    return {
      source: "officialConfig",
      editable: false,
      readonlyReason: "OFFICIAL_CONFIG",
      visible: true,
      visibilityReason: "READONLY_PREVIEW",
      unknown: false,
    };
  }
  if (value === "systemDate") {
    return {
      source: "systemDate",
      editable: false,
      readonlyReason: "SYSTEM_DATE",
      visible: true,
      visibilityReason: "READONLY_PREVIEW",
      unknown: false,
    };
  }
  if (value === "computed") {
    return {
      source: "computed",
      editable: false,
      readonlyReason: "COMPUTED",
      visible: false,
      visibilityReason: "INTERNAL_RENDER_ONLY",
      unknown: false,
    };
  }
  if (value === "manual" || VALID_SOURCES.has(value)) {
    return {
      source: "manual",
      editable: true,
      readonlyReason: undefined,
      visible: true,
      visibilityReason: "USER_INPUT",
      unknown: false,
    };
  }
  // "unknown" or any unrecognized value → conservative manual fallback.
  return {
    source: "manual",
    editable: true,
    readonlyReason: undefined,
    visible: true,
    visibilityReason: "USER_INPUT",
    unknown: true,
  };
}

type CanonicalField = {
  path: string;
  type: string;
  label: string;
  source: string;
  required: boolean;
  uiComponent: string;
  reviewRequired: boolean;
};

type DocxSlot = {
  slotId: string;
  slotType: string;
  required: boolean;
  reviewRequired: boolean;
};

type RenderBinding = {
  slotId: string;
  from: string;
  transform: string;
  fallback: unknown;
  reviewRequired: boolean;
};

type RejectedCandidate = {
  slotId: string;
  reason: string;
};

type SuggestedControl = {
  path: string;
  uiComponent?: string;
  label?: string;
};

function readCanonicalField(record: Record<string, unknown>): CanonicalField | null {
  const path = readString(record, "path");
  if (!path) return null;
  return {
    path,
    type: readString(record, "type"),
    label: readString(record, "label"),
    source: readString(record, "source"),
    required: readBoolean(record, "required"),
    uiComponent: readString(record, "uiComponent"),
    reviewRequired: readBoolean(record, "reviewRequired"),
  };
}

function readDocxSlot(record: Record<string, unknown>): DocxSlot | null {
  const slotId = readString(record, "slotId");
  if (!slotId) return null;
  return {
    slotId,
    slotType: readString(record, "slotType"),
    required: readBoolean(record, "required"),
    reviewRequired: readBoolean(record, "reviewRequired"),
  };
}

function readRenderBinding(record: Record<string, unknown>): RenderBinding | null {
  const slotId = readString(record, "slotId");
  const from = readString(record, "from");
  if (!slotId || !from) return null;
  return {
    slotId,
    from,
    transform: readString(record, "transform"),
    fallback: record["fallback"],
    reviewRequired: readBoolean(record, "reviewRequired"),
  };
}

function readRejectedCandidate(
  record: Record<string, unknown>,
): RejectedCandidate | null {
  const slotId = readString(record, "slotId");
  if (!slotId) return null;
  return {
    slotId,
    reason: readString(record, "reason"),
  };
}

function readSuggestedControl(
  record: Record<string, unknown>,
): SuggestedControl | null {
  const path = readString(record, "path");
  if (!path) return null;
  return {
    path,
    uiComponent: readString(record, "uiComponent") || undefined,
    label: readString(record, "label") || undefined,
  };
}

function buildCanonicalField(
  field: CanonicalField,
  slotByPath: Map<string, DocxSlot>,
  warnings: SchemaWarning[],
): FormInputField {
  const slot = slotByPath.get(field.path);
  const source = mapSource(field.source);
  const inputType = mapInputType({
    uiComponent: field.uiComponent,
    slotType: slot?.slotType ?? "",
    path: field.path,
  });
  if (source.unknown) {
    warnings.push({
      code: "UNKNOWN_SOURCE_NORMALIZED",
      path: field.path,
      message: `Trường "${field.path}" có source không hợp lệ ("${field.source}") đã được chuẩn hoá về "manual".`,
    });
  }
  return {
    path: field.path,
    label: field.label || pathTail(field.path),
    required: field.required,
    inputType,
    source: source.source,
    editable: source.editable,
    readonlyReason: source.readonlyReason,
    visible: source.visible,
    visibilityReason: source.visibilityReason,
    reviewRequired: field.reviewRequired,
    origin: "canonical",
  };
}

function buildBindingFallbackField(
  path: string,
  slot: DocxSlot | undefined,
  binding: RenderBinding | undefined,
  warnings: SchemaWarning[],
): FormInputField {
  const uiComponent = "";
  const slotType = slot?.slotType ?? "";
  const inputType = mapInputType({ uiComponent, slotType, path });
  warnings.push({
    code: "BOUND_SLOT_MISSING_FIELD",
    path,
    message: `Slot "${path}" đã được bind nhưng chưa có canonical field; tạo fallback editable để người dùng có thể điền.`,
  });
  return {
    path,
    label: pathTail(path),
    required: Boolean(slot?.required) || Boolean(binding?.reviewRequired),
    inputType,
    source: "manual",
    editable: true,
    readonlyReason: undefined,
    visible: true,
    visibilityReason: "USER_INPUT",
    reviewRequired: true,
    origin: "binding-fallback",
  };
}

function applyHint(
  field: FormInputField,
  hint: SuggestedControl,
): FormInputField {
  // Hints may only refine label or inputType for an existing field.
  // They never change the source/origin/editability contract.
  const next: FormInputField = { ...field };
  if (hint.label && hint.label.trim().length > 0) {
    next.label = hint.label;
  }
  if (hint.uiComponent && hint.uiComponent.trim().length > 0) {
    next.inputType = mapInputType({
      uiComponent: hint.uiComponent,
      slotType: "",
      path: field.path,
    });
  }
  return next;
}

function groupFieldsBySection(
  fields: FormInputField[],
): FormInputSection[] {
  const sectionOrder: string[] = [];
  const sectionFields = new Map<string, FormInputField[]>();
  for (const field of fields) {
    const key = pathSectionKey(field.path);
    if (!sectionFields.has(key)) {
      sectionOrder.push(key);
      sectionFields.set(key, []);
    }
    sectionFields.get(key)!.push(field);
  }
  return sectionOrder.map((key) => {
    const list = sectionFields.get(key) ?? [];
    // Stable sort: keep the original insertion order. Fields within a
    // section are already added in canonical-then-fallback order, so
    // we do NOT re-sort by path (that would shuffle canonical order).
    return {
      key,
      title: getSectionTitle(key),
      fields: list,
    };
  });
}

/**
 * Pure, deterministic schema derivation. Accepts the locked v1 contract
 * (or the v2 compiled contract — any object that contains the right
 * arrays). Returns an empty schema if the contract is unreadable rather
 * than throwing.
 */
export function deriveFormInputSchema(contract: unknown): FormInputSchema {
  const empty: FormInputSchema = {
    templateCode: "",
    sourceId: "",
    warnings: [],
    sections: [],
  };
  if (!isRecord(contract)) return empty;

  const templateCode = readString(contract, "templateCode");
  const sourceId = readString(contract, "sourceId");

  const canonicalRecords = readArray(contract, "canonicalFields");
  const slotRecords = readArray(contract, "docxSlots");
  const bindingRecords = readArray(contract, "renderBindings");
  const rejectedRecords = readArray(contract, "rejectedCandidates");
  const hintRecords = readArray(
    isRecord(contract["formInputHints"])
      ? (contract["formInputHints"] as Record<string, unknown>)
      : {},
    "suggestedControls",
  );

  const canonicalFields = canonicalRecords
    .map((entry) =>
      isRecord(entry) ? readCanonicalField(entry) : null,
    )
    .filter((entry): entry is CanonicalField => entry !== null);
  const slots = slotRecords
    .map((entry) => (isRecord(entry) ? readDocxSlot(entry) : null))
    .filter((entry): entry is DocxSlot => entry !== null);
  const bindings = bindingRecords
    .map((entry) => (isRecord(entry) ? readRenderBinding(entry) : null))
    .filter((entry): entry is RenderBinding => entry !== null);
  const rejected = rejectedRecords
    .map((entry) =>
      isRecord(entry) ? readRejectedCandidate(entry) : null,
    )
    .filter((entry): entry is RejectedCandidate => entry !== null);
  const hints = hintRecords
    .map((entry) =>
      isRecord(entry) ? readSuggestedControl(entry) : null,
    )
    .filter((entry): entry is SuggestedControl => entry !== null);

  const slotById = new Map<string, DocxSlot>();
  for (const slot of slots) slotById.set(slot.slotId, slot);
  const slotByPath = new Map<string, DocxSlot>();
  for (const slot of slots) slotByPath.set(slot.slotId, slot);

  const rejectedPaths = new Set<string>();
  for (const r of rejected) rejectedPaths.add(r.slotId);

  const hintsByPath = new Map<string, SuggestedControl>();
  for (const hint of hints) hintsByPath.set(hint.path, hint);

  const warnings: SchemaWarning[] = [];
  const fieldsByPath = new Map<string, FormInputField>();
  const insertionOrder: string[] = [];

  // 1) Canonical fields first — origin = "canonical".
  for (const field of canonicalFields) {
    if (rejectedPaths.has(field.path)) {
      // Should not happen in the corpus today (canonical is the
      // reviewed set, rejected is the rejected-from-binding set),
      // but defensively suppress.
      warnings.push({
        code: "REJECTED_AS_EDITABLE",
        path: field.path,
        message: `Trường "${field.path}" đã bị reject; sẽ không hiển thị dưới dạng editable.`,
      });
      continue;
    }
    if (!fieldsByPath.has(field.path)) insertionOrder.push(field.path);
    fieldsByPath.set(field.path, buildCanonicalField(field, slotByPath, warnings));
  }

  // 2) Binding fallback — for each binding whose `from` is not in
  // canonical and not in rejected, create a fallback editable field.
  for (const binding of bindings) {
    if (fieldsByPath.has(binding.from)) continue;
    if (rejectedPaths.has(binding.from)) {
      warnings.push({
        code: "REJECTED_AS_EDITABLE",
        path: binding.from,
        message: `Slot "${binding.from}" đã bị reject; bỏ qua.`,
      });
      continue;
    }
    const slot = slotById.get(binding.slotId);
    if (!fieldsByPath.has(binding.from)) insertionOrder.push(binding.from);
    fieldsByPath.set(
      binding.from,
      buildBindingFallbackField(binding.from, slot, binding, warnings),
    );
  }

  // 3) Hint refinement — only touches existing fields, never creates.
  for (const hint of hints) {
    const existing = fieldsByPath.get(hint.path);
    if (!existing) continue;
    fieldsByPath.set(hint.path, applyHint(existing, hint));
  }

  // Build the final field list in stable insertion order.
  const fields: FormInputField[] = [];
  for (const path of insertionOrder) {
    const field = fieldsByPath.get(path);
    if (field) fields.push(field);
  }

  return {
    templateCode,
    sourceId,
    warnings,
    sections: groupFieldsBySection(fields),
  };
}