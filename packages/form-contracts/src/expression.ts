import type {
  ComputedFieldDefinition,
  Expression,
} from "./types.js";

export function readPath(input: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((value, segment) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return undefined;
    }
    return (value as Record<string, unknown>)[segment];
  }, input);
}

function parseDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value !== "string" && typeof value !== "number") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function twoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function evaluateExpression(
  expression: Expression,
  context: Record<string, unknown>,
): unknown {
  switch (expression.op) {
    case "literal":
      return expression.value;
    case "field":
      return readPath(context, expression.path);
    case "concat":
      return expression.args
        .map((part) => evaluateExpression(part, context))
        .filter((part) => part !== undefined && part !== null)
        .join("");
    case "coalesce":
      for (const part of expression.args) {
        const value = evaluateExpression(part, context);
        if (value !== undefined && value !== null && value !== "") return value;
      }
      return "";
    case "trim":
      return String(evaluateExpression(expression.value, context) ?? "").trim();
    case "upper":
      return String(evaluateExpression(expression.value, context) ?? "").toUpperCase();
    case "lower":
      return String(evaluateExpression(expression.value, context) ?? "").toLowerCase();
    case "dateDay": {
      const date = parseDate(evaluateExpression(expression.value, context));
      return date ? twoDigits(date.getUTCDate()) : "";
    }
    case "dateMonth": {
      const date = parseDate(evaluateExpression(expression.value, context));
      return date ? twoDigits(date.getUTCMonth() + 1) : "";
    }
    case "dateYear": {
      const date = parseDate(evaluateExpression(expression.value, context));
      return date ? String(date.getUTCFullYear()) : "";
    }
    case "vietnameseDate": {
      const date = parseDate(evaluateExpression(expression.value, context));
      return date
        ? `ngày ${twoDigits(date.getUTCDate())} tháng ${twoDigits(
            date.getUTCMonth() + 1,
          )} năm ${date.getUTCFullYear()}`
        : "";
    }
    case "condition":
      return evaluateExpression(
        evaluateExpression(expression.when, context)
          ? expression.then
          : expression.else,
        context,
      );
    case "count":
      return asArray(evaluateExpression(expression.value, context)).length;
    case "sum":
      return asArray(evaluateExpression(expression.value, context)).reduce<number>(
        (total, value) => total + (Number(value) || 0),
        0,
      );
    case "join":
      return asArray(evaluateExpression(expression.value, context))
        .map((value) => String(value ?? ""))
        .join(expression.separator);
  }
}

export function collectFieldReferences(expression: Expression): string[] {
  switch (expression.op) {
    case "field":
      return [expression.path];
    case "literal":
      return [];
    case "concat":
    case "coalesce":
      return expression.args.flatMap(collectFieldReferences);
    case "condition":
      return [
        ...collectFieldReferences(expression.when),
        ...collectFieldReferences(expression.then),
        ...collectFieldReferences(expression.else),
      ];
    case "join":
    case "trim":
    case "upper":
    case "lower":
    case "dateDay":
    case "dateMonth":
    case "dateYear":
    case "vietnameseDate":
    case "count":
    case "sum":
      return collectFieldReferences(expression.value);
  }
}

export function detectComputedCycles(
  fields: ComputedFieldDefinition[],
): string[][] {
  const computedKeys = new Set(fields.map((field) => field.key));
  const graph = new Map(
    fields.map((field) => [
      field.key,
      [...new Set(collectFieldReferences(field.expression))].filter((key) =>
        computedKeys.has(key) &&
        !(
          key === field.key &&
          field.expression.op === "field" &&
          field.expression.path === field.key
        ),
      ),
    ]),
  );
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const active = new Set<string>();
  const stack: string[] = [];

  const visit = (key: string) => {
    if (active.has(key)) {
      const start = stack.indexOf(key);
      cycles.push([...stack.slice(start), key]);
      return;
    }
    if (visited.has(key)) return;
    visited.add(key);
    active.add(key);
    stack.push(key);
    for (const dependency of graph.get(key) ?? []) visit(dependency);
    stack.pop();
    active.delete(key);
  };

  [...graph.keys()].sort().forEach(visit);
  return cycles.sort((left, right) =>
    left.join(">").localeCompare(right.join(">")),
  );
}
