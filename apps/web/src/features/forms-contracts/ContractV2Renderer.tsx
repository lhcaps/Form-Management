"use client";

import { evaluateExpression, readPath } from "@qllaw/form-contracts/browser";
import type {
  CompiledFormContract,
  FieldDefinition,
  FormContractV2,
} from "@qllaw/form-contracts";
import { useMemo } from "react";
import { localizeSectionTitle } from "@/components/documents/form-section-labels";
import { type RuntimeUxProfile } from "@/lib/runtime-ux";
import {
  formatVietnameseIssueLine,
  parseIsoDate,
  toDayMonthYear,
  type SmartField,
} from "@/lib/runtime-ux/smart-field-helpers";

type FormData = Record<string, unknown>;

const FIELD_SPAN_CLASSES: Record<number, string> = {
  1: "md:col-span-1",
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
  7: "md:col-span-7",
  8: "md:col-span-8",
  9: "md:col-span-9",
  10: "md:col-span-10",
  11: "md:col-span-11",
  12: "md:col-span-12",
};

/**
 * Convert an arbitrary stored value to the `YYYY-MM-DD` ISO format that
 * `<input type="date">` expects as its `value`. Accepts strings like
 * `"08/9/1985"`, `"14/12/2021"`, or `"1985-09-08"`. Returns `""` for any
 * unparseable input so the picker renders empty (never "Invalid Date").
 */
function toDateInputValue(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") return "";
  const trimmed = value.trim();

  // ISO already
  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${pad2(m)}-${pad2(d)}`;
  }

  // Slash-form DD/MM/YYYY or D/M/YYYY (Vietnamese legal text)
  const slashMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (slashMatch) {
    const [, d, m, y] = slashMatch;
    return `${y}-${pad2(m)}-${pad2(d)}`;
  }

  // Native Date.parse fallback (covers "ngày DD tháng MM năm YYYY" etc.)
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${pad2(String(parsed.getMonth() + 1))}-${pad2(String(parsed.getDate()))}`;
  }

  return "";
}

/**
 * Convert a `<input type="date">` ISO value (`YYYY-MM-DD`) to the
 * Vietnamese DD/MM/YYYY format the BM-171 locked contract expects.
 * Returns `""` for an empty picker.
 */
function fromDateInputValue(isoValue: string): string {
  if (!isoValue) return "";
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(isoValue);
  if (!match) return "";
  const [, y, m, d] = match;
  return `${pad2(d)}/${pad2(m)}/${y}`;
}

function pad2(value: string): string {
  return value.length === 1 ? `0${value}` : value;
}

export type ContractV2RendererProps = {
  contract: FormContractV2 | CompiledFormContract;
  data: FormData;
  onChange?: (data: FormData) => void;
  readOnly?: boolean;
  selectedFieldId?: string | null;
  onSelectField?: (fieldId: string) => void;
  compact?: boolean;
  errors?: Record<string, string>;
  /**
   * Optional runtime UX profile. When provided, the renderer applies
   * per-template overrides (section titles, descriptions, field labels,
   * placeholders, help text, and limited control-type overrides).
   *
   * No profile → existing behaviour is preserved exactly.
   */
  uxProfile?: RuntimeUxProfile | null;
};

function source(contract: FormContractV2 | CompiledFormContract): FormContractV2 {
  return "source" in contract ? contract.source : contract;
}

function setPath(
  data: FormData,
  path: string,
  value: unknown,
): FormData {
  const next = structuredClone(data);
  const parts = path.split(".");
  let cursor = next;
  for (const part of parts.slice(0, -1)) {
    const nested = cursor[part];
    if (!nested || typeof nested !== "object" || Array.isArray(nested)) {
      cursor[part] = {};
    }
    cursor = cursor[part] as FormData;
  }
  const last = parts.at(-1);
  if (last) cursor[last] = value;
  return next;
}

function isVisible(
  contract: FormContractV2,
  field: FieldDefinition,
  data: FormData,
) {
  const rules = contract.conditionalRules.filter(
    (rule) => rule.targetFieldKey === field.key,
  );
  let visible = true;
  for (const rule of rules) {
    const matches = Boolean(evaluateExpression(rule.when, data));
    if (rule.effect === "SHOW") visible = matches;
    if (rule.effect === "HIDE" && matches) visible = false;
  }
  return visible;
}

function fieldSpanClass(width: number) {
  const normalized = Math.min(12, Math.max(1, Math.round(width || 12)));
  return FIELD_SPAN_CLASSES[normalized] ?? FIELD_SPAN_CLASSES[12];
}

export function ContractV2Renderer({
  contract: input,
  data,
  onChange,
  readOnly = false,
  selectedFieldId,
  onSelectField,
  compact = false,
  errors = {},
  uxProfile = null,
}: ContractV2RendererProps) {
  const contract = source(input);
  // Profile lookup tables. We only build them when a profile is supplied;
  // otherwise the renderer stays bit-for-bit identical to the no-profile
  // path.
  const sectionOverrideById = useMemo(() => {
    if (!uxProfile) return null;
    const map: Record<string, { title: string; description?: string }> = {};
    for (const section of uxProfile.sections) {
      map[section.sectionId] = {
        title: section.title,
        description: section.description,
      };
    }
    return map;
  }, [uxProfile]);

  const fieldOverrideByKey = useMemo(() => {
    if (!uxProfile) return null;
    return uxProfile.fields;
  }, [uxProfile]);

  // Smart-field registry: flatten `fields[*].smart` into an array the
  // renderer can use for visibility filtering + control selection.
  // Empty array (not null) when no smart metadata exists, so the
  // dependent hooks can branch on truthiness instead of nullability.
  const smartEntries = useMemo<SmartField[]>(() => {
    if (!uxProfile) return [];
    const out: SmartField[] = [];
    for (const [fieldKey, override] of Object.entries(uxProfile.fields)) {
      if (override && override.smart) {
        out.push({ ...override.smart, key: override.smart.key || fieldKey });
      }
    }
    return out;
  }, [uxProfile]);

  // Set of contract field keys hidden by smart overrides — fields
  // whose values are produced by a smart control's `derivedTargets`
  // must NOT also render as a raw <input>.
  const hiddenBySmart = useMemo(() => {
    const hidden = new Set<string>();
    for (const entry of smartEntries) {
      if (!entry.derivedTargets) continue;
      for (const target of entry.derivedTargets) hidden.add(target);
    }
    return hidden;
  }, [smartEntries]);

  // Map of contract field key → smart override. Used by `FieldControl`
  // to know whether to render a smart control instead of the legacy
  // text/textarea/select branch.
  const smartByKey = useMemo(() => {
    const out = new Map<string, SmartField>();
    for (const entry of smartEntries) out.set(entry.key, entry);
    return out;
  }, [smartEntries]);

  const computedData = useMemo(() => {
    let next = structuredClone(data);
    for (const field of contract.computedFields) {
      next = setPath(next, field.key, evaluateExpression(field.expression, next));
    }
    for (const field of contract.fields) {
      if (field.dataSource.kind === "COMPUTED") {
        next = setPath(
          next,
          field.key,
          evaluateExpression(field.dataSource.expression, next),
        );
      }
    }
    return next;
  }, [contract, data]);

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      {[...contract.sections]
        .sort((a, b) => a.order - b.order)
        .map((section) => {
          const sectionOverride = sectionOverrideById?.[section.id];
          const sectionTitle = sectionOverride?.title
            ?? localizeSectionTitle(section.title);
          const sectionDescription = sectionOverride?.description
            ?? section.description;
          const fields = contract.fields
            .filter(
              (field) =>
                field.sectionId === section.id &&
                !field.repeatableGroupId &&
                isVisible(contract, field, computedData) &&
                !hiddenBySmart.has(field.key),
            )
            .sort((a, b) => a.order - b.order);
          return (
            <section
              key={section.id}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="mb-4 border-b border-slate-100 pb-3">
                <h3 className="text-[15px] font-extrabold text-slate-950">
                  {sectionTitle}
                </h3>
                {sectionDescription ? (
                  <p className="mt-1 text-sm text-slate-500">
                    {sectionDescription}
                  </p>
                ) : null}
              </div>
              {fields.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
                  Chưa có trường dữ liệu trong phần này.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                  {fields.map((field) => (
                    <FieldControl
                      key={field.id}
                      field={field}
                      fieldOverride={fieldOverrideByKey?.[field.key]}
                      smart={smartByKey.get(field.key) ?? null}
                      value={readPath(computedData, field.key)}
                      disabled={
                        readOnly ||
                        field.control === "READONLY" ||
                        field.control === "COMPUTED"
                      }
                      selected={selectedFieldId === field.id}
                      error={errors[field.key]}
                      onSelect={() => onSelectField?.(field.id)}
                      onChange={(value) => {
                        // Smart derived fields emit a multi-target write
                        // envelope instead of a single value. Apply it
                        // here so the parent only sees one `setData`
                        // shape.
                        if (
                          value &&
                          typeof value === "object" &&
                          "__smartWrites" in (value as Record<string, unknown>)
                        ) {
                          const writes = (
                            value as { __smartWrites: Array<[string, string]> }
                          ).__smartWrites;
                          let next = data;
                          for (const [path, val] of writes) {
                            next = setPath(next, path, val);
                          }
                          onChange?.(next);
                          return;
                        }
                        onChange?.(setPath(data, field.key, value));
                      }}
                    />
                  ))}
                </div>
              )}
              {contract.repeatableGroups
                .filter((group) =>
                  group.fieldKeys.some((key) =>
                    contract.fields.some(
                      (field) =>
                        field.key === key && field.sectionId === section.id,
                    ),
                  ),
                )
                .map((group) => (
                  <RepeaterControl
                    key={group.id}
                    contract={contract}
                    group={group}
                    fieldOverrideByKey={fieldOverrideByKey}
                    smartByKey={smartByKey}
                    data={data}
                    readOnly={readOnly}
                    onChange={onChange}
                  />
                ))}
            </section>
          );
        })}

      {contract.tables.map((table) => (
        <TableControl
          key={table.id}
          table={table}
          rows={(readPath(data, table.key) as FormData[] | undefined) ?? []}
          readOnly={readOnly}
          onChange={(rows) => onChange?.(setPath(data, table.key, rows))}
        />
      ))}
    </div>
  );
}

function FieldControl({
  field,
  fieldOverride,
  smart,
  value,
  disabled,
  selected,
  onSelect,
  onChange,
  error,
}: {
  field: FieldDefinition;
  fieldOverride?: RuntimeUxProfile["fields"][string];
  /**
   * Optional smart-field override. When present, the field renders a
   * smart control (date picker / time picker / select / textarea / or
   * derived multi-target fields). When absent, the legacy renderer
   * branches unchanged.
   */
  smart?: SmartField | null;
  value: unknown;
  disabled: boolean;
  selected: boolean;
  onSelect: () => void;
  onChange: (value: unknown) => void;
  error?: string;
}) {
  const common =
    "min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-[15px] text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500 sm:min-h-11";
  const inputId = `contract-field-${field.id}`;
  const errorId = `${inputId}-error`;
  const labelText = fieldOverride?.label ?? field.label;
  const placeholderText = fieldOverride?.placeholder ?? field.placeholder;
  // Profile helpText wins over contract description so we can surface the
  // "Smart prefill không điền trường này" guard hint, etc.
  const helpText = fieldOverride?.helpText;
  const descriptionText =
    helpText
      ?? (field.description ||
        (field.control === "DATE" ? "Chọn ngày theo bộ chọn của trình duyệt." : ""));
  const descriptionId =
    descriptionText && field.control !== "CHECKBOX"
      ? `${inputId}-description`
      : undefined;
  const describedBy =
    [descriptionId, error ? errorId : undefined]
      .filter((value): value is string => Boolean(value))
      .join(" ") || undefined;
  // Only allow safe overrides — TEXT / TEXTAREA for free text fields, and
  // DATE_TEXT for date fields that the locked contract declares as TEXT
  // (renders as a native browser date picker; the renderer maps the picked
  // ISO date to the contract's expected DD/MM/YYYY text format on write).
  const effectiveControl =
    fieldOverride?.control &&
    (fieldOverride.control === "TEXT" ||
      fieldOverride.control === "TEXTAREA" ||
      fieldOverride.control === "DATE_TEXT")
      ? fieldOverride.control
      : field.control;
  return (
    <div
      className={[
        "rounded-xl border p-3 transition",
        fieldSpanClass(field.width),
        selected
          ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-100"
          : "border-transparent hover:border-slate-200",
      ].join(" ")}
      onClick={onSelect}
    >
      <label
        htmlFor={inputId}
        className="mb-1.5 block text-sm font-bold text-slate-700"
      >
        {labelText}
        {field.required ? <span className="ml-1 text-rose-600">*</span> : null}
      </label>
      {smart ? (
        <SmartControl
          field={field}
          smart={smart}
          fieldOverride={fieldOverride}
          value={value}
          disabled={disabled}
          inputId={inputId}
          error={error}
          descriptionId={descriptionId}
          describedBy={describedBy}
          onChange={onChange}
        />
      ) : effectiveControl === "TEXTAREA" ? (
        <textarea
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`${common} min-h-24 py-2 ${error ? "border-rose-500" : ""}`}
          value={String(value ?? "")}
          disabled={disabled}
          placeholder={placeholderText}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : field.control === "SELECT" || field.control === "RADIO" ? (
        <select
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`${common} ${error ? "border-rose-500" : ""}`}
          value={String(value ?? "")}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Chọn giá trị</option>
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : field.control === "CHECKBOX" ? (
        <label className="flex min-h-10 items-center gap-3 rounded-lg border border-slate-300 px-3 text-sm font-medium sm:min-h-11">
          <input
            id={inputId}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            type="checkbox"
            checked={Boolean(value)}
            disabled={disabled}
            onChange={(event) => onChange(event.target.checked)}
          />
          {field.description || "Đánh dấu nếu áp dụng"}
        </label>
      ) : (
        <input
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`${common} ${error ? "border-rose-500" : ""}`}
          type={
            effectiveControl === "DATE_TEXT"
              ? "date"
              : effectiveControl === "NUMBER"
                ? "number"
                : field.control === "DATE"
                  ? "date"
                  : field.control === "TIME"
                    ? "time"
                    : "text"
          }
          value={
            effectiveControl === "DATE_TEXT"
              ? toDateInputValue(value)
              : String(value ?? "")
          }
          disabled={disabled}
          placeholder={
            effectiveControl === "DATE_TEXT" ? undefined : placeholderText
          }
          onChange={(event) =>
            onChange(
              effectiveControl === "DATE_TEXT"
                ? fromDateInputValue(event.target.value)
                : effectiveControl === "NUMBER"
                  ? event.target.value === ""
                    ? ""
                    : Number(event.target.value)
                  : event.target.value,
            )
          }
        />
      )}
      {descriptionText && field.control !== "CHECKBOX" ? (
        <p id={descriptionId} className="mt-1.5 text-xs text-slate-500">
          {descriptionText}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs font-semibold text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Smart-field branch of `FieldControl`. Renders a smart control based
 * on `smart.kind`. Each kind produces a small visual block that maps
 * the operator's input back into the contract payload via
 * `applySmartFieldWrites` (multi-target helpers) or the simple
 * raw-value write for `text` / `textarea` / `date` / `time` / `select`.
 *
 * The component never reaches into `data` for sibling lookups; the
 * renderer wires derived writes through `onChange`. The smart control
 * ALSO fires `onChange` for the visible key when a visible value
 * exists (so a UI re-render reflects the typed ISO date string),
 * but for `date-parts` / `year-or-date` the visible key is the
 * synthetic "display" key, not the derived target.
 */
function SmartControl({
  field,
  smart,
  fieldOverride,
  value,
  disabled,
  inputId,
  error,
  descriptionId,
  describedBy,
  onChange,
}: {
  field: FieldDefinition;
  smart: SmartField;
  fieldOverride?: RuntimeUxProfile["fields"][string];
  value: unknown;
  disabled: boolean;
  inputId: string;
  error?: string;
  descriptionId?: string;
  describedBy?: string;
  onChange: (value: unknown) => void;
}) {
  const common =
    "min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-[15px] text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500 sm:min-h-11";
  const kind = smart.kind ?? "text";
  const placeholderText = smart.placeholder ?? fieldOverride?.placeholder ?? field.placeholder;

  // For derived smart kinds the visible "value" passed in by the
  // renderer is the value at the contract field key — which is one
  // of the derived targets (e.g. `informant.birthDay = "08"`). We
  // re-construct the ISO representation the picker expects.
  const isoFromParts = (): string => {
    if (typeof value !== "string") return "";
    const parts = toDayMonthYear(value);
    if (!parts) return "";
    return `${parts.year}-${parts.month}-${parts.day}`;
  };

  switch (kind) {
    case "date": {
      const iso = typeof value === "string" ? value : "";
      return (
        <input
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`${common} ${error ? "border-rose-500" : ""}`}
          type="date"
          value={iso}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    }
    case "time": {
      const t = typeof value === "string" ? value : "";
      return (
        <input
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`${common} ${error ? "border-rose-500" : ""}`}
          type="time"
          value={t}
          disabled={disabled}
          onChange={(event) => {
            // BM-001 stores reception.*TimeText as "08 giờ 00 phút";
            // the contract expects that exact Vietnamese phrasing on
            // render. The smart control writes HH:mm to the visible
            // key; the locked contract render still sees the original
            // string. To stay backward-compatible we format the HH:mm
            // into the Vietnamese phrase before writing.
            const v = event.target.value;
            if (!v) return onChange("");
            const [hh, mm] = v.split(":");
            onChange(`${hh} giờ ${mm} phút`);
          }}
        />
      );
    }
    case "select": {
      const options = smart.options ?? [];
      const current = typeof value === "string" ? value : "";
      return (
        <select
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`${common} ${error ? "border-rose-500" : ""}`}
          value={current}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Chọn giá trị</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }
    case "textarea": {
      const rows = smart.rows ?? 3;
      return (
        <textarea
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          rows={rows}
          className={`${common} min-h-24 py-2 ${error ? "border-rose-500" : ""}`}
          value={typeof value === "string" ? value : ""}
          disabled={disabled}
          placeholder={placeholderText}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    }
    case "date-parts":
    case "year-or-date": {
      const iso = isoFromParts();
      return (
        <input
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`${common} ${error ? "border-rose-500" : ""}`}
          type="date"
          value={iso}
          disabled={disabled}
          onChange={(event) => {
            // Fire the derived write via the helper. We pass the
            // CURRENT data + the smart override so the helper can
            // spread the derived triplet onto the right keys. The
            // renderer's `onChange` only takes a `value`, so we
            // reconstruct the derived triplet here and let the
            // parent's `setPath` overwrite each derived key. To stay
            // minimal we emit a single value: the ISO string. The
            // parent writes it to `field.key` (the visible synthetic
            // key — same as the contract field key when the smart
            // override binds to it). For date-parts the binding is to
            // the FIRST derived target (Day), so the helper output
            // materialises via the renderer's existing `setPath`.
            const v = event.target.value;
            // Compute the parts; the renderer is responsible for
            // calling applySmartFieldWrites via its own internal
            // smart-aware onChange wiring. We surface the ISO value
            // so the caller can re-derive; simpler: we emit the parts
            // object as an array of [path, value] pairs.
            const parsed = parseIsoDate(v);
            if (!parsed) {
              onChange({ __smartWrites: (smart.derivedTargets ?? []).map((t) => [t, ""] as [string, string]) });
              return;
            }
            const day = String(parsed.d).padStart(2, "0");
            const month = String(parsed.m).padStart(2, "0");
            const year = String(parsed.y);
            onChange({
              __smartWrites: [
                [smart.derivedTargets?.[0] ?? "", day],
                [smart.derivedTargets?.[1] ?? "", month],
                [smart.derivedTargets?.[2] ?? "", year],
              ].filter(([p]) => p.length > 0),
            });
          }}
        />
      );
    }
    case "issue-place-date-line": {
      // The visible value at this key is the locked-contract string
      // ("<place>, ngày DD tháng MM năm YYYY"). We split it back into
      // a place + ISO date so the operator can edit each part.
      const current = typeof value === "string" ? value : "";
      // Parse the current line so the place input and date picker
      // both repopulate on reload.
      const placeMatch = /^(.*?),\s*ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})\s*$/.exec(current);
      let place = "";
      let iso = "";
      if (placeMatch) {
        place = placeMatch[1] ?? "";
        const d = placeMatch[2]?.padStart(2, "0") ?? "";
        const m = placeMatch[3]?.padStart(2, "0") ?? "";
        const y = placeMatch[4] ?? "";
        iso = `${y}-${m}-${d}`;
      } else {
        // No current line: start with empty place and today's date.
        place = "";
        iso = "";
      }
      return (
        <div className="space-y-2">
          <input
            id={`${inputId}-place`}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={`${common} ${error ? "border-rose-500" : ""}`}
            type="text"
            value={place}
            disabled={disabled}
            placeholder={smart.placeholder ?? "Thành phố Hồ Chí Minh"}
            onChange={(event) => {
              const newPlace = event.target.value;
              const line = formatVietnameseIssueLine(newPlace, iso);
              // Emit a multi-target write: visible key + the first
              // derived target (same for BM-001).
              const writes: Array<[string, string]> = [[smart.key, line]];
              if (smart.derivedTargets?.[0] && smart.derivedTargets[0] !== smart.key) {
                writes.push([smart.derivedTargets[0], line]);
              }
              onChange({ __smartWrites: writes });
            }}
          />
          <input
            id={inputId}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={`${common} ${error ? "border-rose-500" : ""}`}
            type="date"
            value={iso}
            disabled={disabled}
            onChange={(event) => {
              const newIso = event.target.value;
              const line = formatVietnameseIssueLine(place, newIso);
              const writes: Array<[string, string]> = [[smart.key, line]];
              if (smart.derivedTargets?.[0] && smart.derivedTargets[0] !== smart.key) {
                writes.push([smart.derivedTargets[0], line]);
              }
              onChange({ __smartWrites: writes });
            }}
          />
          <p className="text-[11px] text-slate-500">
            Dòng sẽ sinh: <span className="font-mono">{formatVietnameseIssueLine(place, iso) || "(trống)"}</span>
          </p>
        </div>
      );
    }
    case "text":
    default: {
      return (
        <input
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`${common} ${error ? "border-rose-500" : ""}`}
          type="text"
          value={typeof value === "string" ? value : ""}
          disabled={disabled}
          placeholder={placeholderText}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    }
  }
}

function RepeaterControl({
  contract,
  group,
  fieldOverrideByKey,
  smartByKey,
  data,
  readOnly,
  onChange,
}: {
  contract: FormContractV2;
  group: FormContractV2["repeatableGroups"][number];
  fieldOverrideByKey: Record<
    string,
    RuntimeUxProfile["fields"][string]
  > | null;
  smartByKey: ReadonlyMap<string, SmartField> | null;
  data: FormData;
  readOnly: boolean;
  onChange?: (data: FormData) => void;
}) {
  const items = (readPath(data, group.key) as FormData[] | undefined) ?? [];
  // Repeater internal fields explicitly opt out of smart metadata
  // (smart={null} is passed to nested FieldControl). The filter here
  // is defensive — if a smart control ever leaks in, hide its derived
  // targets the same way the parent grid does.
  const hiddenBySmart = useMemo(() => {
    const set = new Set<string>();
    if (!smartByKey) return set;
    for (const entry of smartByKey.values()) {
      if (!entry.derivedTargets) continue;
      for (const target of entry.derivedTargets) set.add(target);
    }
    return set;
  }, [smartByKey]);
  const fields = contract.fields.filter((field) =>
    group.fieldKeys.includes(field.key),
  );
  const updateItems = (next: FormData[]) =>
    onChange?.(setPath(data, group.key, next));

  return (
    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <h4 className="text-sm font-extrabold text-slate-800">{group.label}</h4>
        {!readOnly && items.length < group.maxItems ? (
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700"
            onClick={() => updateItems([...items, {}])}
          >
            + Thêm dòng
          </button>
        ) : null}
      </div>
      <div className="mt-3 space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-12"
          >
            {fields
              .filter((field) => !hiddenBySmart.has(field.key))
              .map((field) => {
                const leafKey = field.key.split(".").at(-1) ?? field.key;
                return (
                  <FieldControl
                    key={field.id}
                    field={{ ...field, width: 12 }}
                    fieldOverride={fieldOverrideByKey?.[field.key]}
                    smart={null}
                    value={item[leafKey]}
                    disabled={readOnly}
                    selected={false}
                    onSelect={() => {}}
                    onChange={(value) => {
                      const next = [...items];
                      next[index] = { ...item, [leafKey]: value };
                      updateItems(next);
                    }}
                    error={undefined}
                  />
                );
              })}
            {!readOnly ? (
              <button
                type="button"
                className="col-span-12 justify-self-end text-sm font-bold text-rose-600"
                onClick={() =>
                  updateItems(items.filter((_, itemIndex) => itemIndex !== index))
                }
              >
                Xóa dòng
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function TableControl({
  table,
  rows,
  readOnly,
  onChange,
}: {
  table: FormContractV2["tables"][number];
  rows: FormData[];
  readOnly: boolean;
  onChange: (rows: FormData[]) => void;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-[15px] font-extrabold text-slate-950">
          {table.label}
        </h3>
        {!readOnly ? (
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold"
            onClick={() => onChange([...rows, {}])}
          >
            + Thêm hàng
          </button>
        ) : null}
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-slate-600">
              {table.columns.map((column) => (
                <th key={column.key} className="border p-2 font-bold">
                  {column.label}
                </th>
              ))}
              {!readOnly ? <th className="border p-2">Thao tác</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {table.columns.map((column) => (
                  <td key={column.key} className="border p-2">
                    <input
                      className="min-h-10 w-full rounded-md border border-slate-300 px-2"
                      type={column.control === "NUMBER" ? "number" : "text"}
                      disabled={readOnly}
                      value={String(row[column.key] ?? "")}
                      onChange={(event) => {
                        const next = [...rows];
                        next[rowIndex] = {
                          ...row,
                          [column.key]:
                            column.control === "NUMBER"
                              ? Number(event.target.value)
                              : event.target.value,
                        };
                        onChange(next);
                      }}
                    />
                  </td>
                ))}
                {!readOnly ? (
                  <td className="border p-2">
                    <button
                      type="button"
                      className="font-bold text-rose-600"
                      onClick={() =>
                        onChange(
                          rows.filter((_, index) => index !== rowIndex),
                        )
                      }
                    >
                      Xóa
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
