"use client";

import { evaluateExpression, readPath } from "@qllaw/form-contracts/browser";
import type {
  CompiledFormContract,
  FieldDefinition,
  FormContractV2,
} from "@qllaw/form-contracts";
import { useMemo } from "react";
import { localizeSectionTitle } from "@/components/documents/form-section-labels";

type FormData = Record<string, unknown>;

export type ContractV2RendererProps = {
  contract: FormContractV2 | CompiledFormContract;
  data: FormData;
  onChange?: (data: FormData) => void;
  readOnly?: boolean;
  selectedFieldId?: string | null;
  onSelectField?: (fieldId: string) => void;
  compact?: boolean;
  errors?: Record<string, string>;
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

export function ContractV2Renderer({
  contract: input,
  data,
  onChange,
  readOnly = false,
  selectedFieldId,
  onSelectField,
  compact = false,
  errors = {},
}: ContractV2RendererProps) {
  const contract = source(input);
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
          const fields = contract.fields
            .filter(
              (field) =>
                field.sectionId === section.id &&
                !field.repeatableGroupId &&
                isVisible(contract, field, computedData),
            )
            .sort((a, b) => a.order - b.order);
          return (
            <section
              key={section.id}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="mb-4 border-b border-slate-100 pb-3">
                <h3 className="text-[15px] font-extrabold text-slate-950">
                  {localizeSectionTitle(section.title)}
                </h3>
                {section.description ? (
                  <p className="mt-1 text-sm text-slate-500">
                    {section.description}
                  </p>
                ) : null}
              </div>
              {fields.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
                  Chưa có trường dữ liệu trong phần này.
                </div>
              ) : (
                <div className="grid grid-cols-12 gap-4">
                  {fields.map((field) => (
                    <FieldControl
                      key={field.id}
                      field={field}
                      value={readPath(computedData, field.key)}
                      disabled={
                        readOnly ||
                        field.control === "READONLY" ||
                        field.control === "COMPUTED"
                      }
                      selected={selectedFieldId === field.id}
                      error={errors[field.key]}
                      onSelect={() => onSelectField?.(field.id)}
                      onChange={(value) =>
                        onChange?.(setPath(data, field.key, value))
                      }
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
  value,
  disabled,
  selected,
  onSelect,
  onChange,
  error,
}: {
  field: FieldDefinition;
  value: unknown;
  disabled: boolean;
  selected: boolean;
  onSelect: () => void;
  onChange: (value: unknown) => void;
  error?: string;
}) {
  const common =
    "min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-[15px] text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500";
  const inputId = `contract-field-${field.id}`;
  const errorId = `${inputId}-error`;
  return (
    <div
      className={[
        "rounded-xl border p-3 transition",
        selected
          ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-100"
          : "border-transparent hover:border-slate-200",
      ].join(" ")}
      style={{ gridColumn: `span ${field.width} / span ${field.width}` }}
      onClick={onSelect}
    >
      <label
        htmlFor={inputId}
        className="mb-1.5 block text-sm font-bold text-slate-700"
      >
        {field.label}
        {field.required ? <span className="ml-1 text-rose-600">*</span> : null}
      </label>
      {field.control === "TEXTAREA" ? (
        <textarea
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`${common} min-h-24 py-2 ${error ? "border-rose-500" : ""}`}
          value={String(value ?? "")}
          disabled={disabled}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : field.control === "SELECT" || field.control === "RADIO" ? (
        <select
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
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
        <label className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-300 px-3 text-sm font-medium">
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
          aria-describedby={error ? errorId : undefined}
          className={`${common} ${error ? "border-rose-500" : ""}`}
          type={
            field.control === "NUMBER"
              ? "number"
              : field.control === "DATE"
                ? "date"
                : field.control === "TIME"
                  ? "time"
                  : "text"
          }
          value={String(value ?? "")}
          disabled={disabled}
          placeholder={field.placeholder}
          onChange={(event) =>
            onChange(
              field.control === "NUMBER"
                ? event.target.value === ""
                  ? ""
                  : Number(event.target.value)
                : event.target.value,
            )
          }
        />
      )}
      {field.description && field.control !== "CHECKBOX" ? (
        <p className="mt-1.5 text-xs text-slate-500">{field.description}</p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs font-semibold text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function RepeaterControl({
  contract,
  group,
  data,
  readOnly,
  onChange,
}: {
  contract: FormContractV2;
  group: FormContractV2["repeatableGroups"][number];
  data: FormData;
  readOnly: boolean;
  onChange?: (data: FormData) => void;
}) {
  const items = (readPath(data, group.key) as FormData[] | undefined) ?? [];
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
            className="grid grid-cols-12 gap-3 rounded-lg border border-slate-200 bg-white p-3"
          >
            {fields.map((field) => {
              const leafKey = field.key.split(".").at(-1) ?? field.key;
              return (
                <FieldControl
                  key={field.id}
                  field={{ ...field, width: 12 }}
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
