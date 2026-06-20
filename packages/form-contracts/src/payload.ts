import { evaluateExpression, readPath } from "./expression.js";
import type { FormContractV2, RenderBinding } from "./types.js";

function sanitize(value: unknown): unknown {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) return value.map(sanitize);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        sanitize(nested),
      ]),
    );
  }
  return value;
}

function setPath(target: Record<string, unknown>, path: string, value: unknown) {
  const segments = path.split(".");
  let cursor = target;
  for (const segment of segments.slice(0, -1)) {
    const existing = cursor[segment];
    if (!existing || typeof existing !== "object" || Array.isArray(existing)) {
      cursor[segment] = {};
    }
    cursor = cursor[segment] as Record<string, unknown>;
  }
  const last = segments.at(-1);
  if (last) cursor[last] = sanitize(value);
}

function bindingValue(
  binding: RenderBinding,
  data: Record<string, unknown>,
): unknown {
  switch (binding.source.kind) {
    case "FIELD":
      return readPath(data, binding.source.fieldKey);
    case "TABLE":
      return readPath(data, binding.source.tableKey);
    case "EXPRESSION":
      return evaluateExpression(binding.source.expression, data);
    case "CONSTANT":
      return binding.source.value;
  }
}

export function buildRenderPayload(
  contract: FormContractV2,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const context = structuredClone(data);
  for (const rule of contract.defaultRules) {
    const current = readPath(context, rule.fieldKey);
    if (current === undefined || current === null || current === "") {
      setPath(context, rule.fieldKey, rule.value);
    }
  }
  for (const field of contract.fields) {
    const current = readPath(context, field.key);
    if (
      field.dataSource.kind === "DEFAULT" &&
      (current === undefined || current === null || current === "")
    ) {
      setPath(context, field.key, field.dataSource.value);
    }
    if (field.dataSource.kind === "CONSTANT") {
      setPath(context, field.key, field.dataSource.value);
    }
    if (field.dataSource.kind === "SYSTEM") {
      const now = new Date();
      setPath(
        context,
        field.key,
        field.dataSource.value === "CURRENT_DATE"
          ? now.toISOString().slice(0, 10)
          : now.toISOString().slice(11, 19),
      );
    }
  }
  const computedFields = [
    ...contract.computedFields,
    ...contract.fields
      .filter((field) => field.dataSource.kind === "COMPUTED")
      .map((field) => ({
        key: field.key,
        expression:
          field.dataSource.kind === "COMPUTED"
            ? field.dataSource.expression
            : ({ op: "literal", value: "" } as const),
      })),
  ];
  for (
    let pass = 0;
    pass < Math.max(1, computedFields.length);
    pass += 1
  ) {
    for (const computed of computedFields) {
      setPath(
        context,
        computed.key,
        evaluateExpression(computed.expression, context),
      );
    }
  }

  const payload: Record<string, unknown> = {};
  for (const binding of contract.renderBindings) {
    const value = bindingValue(binding, context);
    const resolved = value === undefined || value === null ? binding.fallback : value;
    if (binding.target.kind === "SLOT") {
      setPath(payload, binding.target.slotId, resolved);
    } else {
      setPath(payload, binding.target.tableKey, resolved);
    }
  }
  return sanitize(payload) as Record<string, unknown>;
}
