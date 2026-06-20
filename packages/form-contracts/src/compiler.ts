import {
  collectFieldReferences,
  detectComputedCycles,
} from "./expression.js";
import { stableHash } from "./hash.js";
import { formContractV2Schema } from "./schema.js";
import type {
  CompileResult,
  CompiledFormContract,
  ContractIssue,
  ControlType,
  FormContractV2,
} from "./types.js";

const BUILTIN_TRANSFORMS = new Set([
  "identity",
  "trim",
  "uppercase",
  "lowercase",
  "vietnameseDate",
  "number",
  "booleanMark",
  "derived",
]);

function jsonTypeForControl(control: ControlType): Record<string, unknown> {
  if (control === "NUMBER") return { type: "number" };
  if (control === "CHECKBOX") return { type: "boolean" };
  return { type: "string" };
}

function duplicateIssues(
  values: Array<{ id: string }>,
  path: string,
): ContractIssue[] {
  const seen = new Set<string>();
  const issues: ContractIssue[] = [];
  for (const value of values) {
    if (seen.has(value.id)) {
      issues.push({
        code: "DUPLICATE_ID",
        severity: "ERROR",
        path: `${path}.${value.id}`,
        message: `Duplicate id "${value.id}".`,
      });
    }
    seen.add(value.id);
  }
  return issues;
}

export function validateContract(contract: FormContractV2): ContractIssue[] {
  const parsed = formContractV2Schema.safeParse(contract);
  if (!parsed.success) {
    return parsed.error.issues.map((issue) => ({
      code: "SCHEMA_INVALID",
      severity: "ERROR" as const,
      path: issue.path.join("."),
      message: issue.message,
    }));
  }

  const issues: ContractIssue[] = [
    ...duplicateIssues(contract.sections, "sections"),
    ...duplicateIssues(contract.fields, "fields"),
    ...duplicateIssues(contract.repeatableGroups, "repeatableGroups"),
    ...duplicateIssues(contract.tables, "tables"),
    ...duplicateIssues(contract.renderBindings, "renderBindings"),
  ];
  const sectionIds = new Set(contract.sections.map((section) => section.id));
  const fieldKeys = new Set<string>();
  const computedKeys = new Set(contract.computedFields.map((field) => field.key));
  const tableKeys = new Set(contract.tables.map((table) => table.key));
  const repeaterKeys = new Set(
    contract.repeatableGroups.map((group) => group.key),
  );
  const boundFields = new Set(
    contract.renderBindings
      .filter((binding) => binding.source.kind === "FIELD")
      .map((binding) =>
        binding.source.kind === "FIELD" ? binding.source.fieldKey : "",
      ),
  );

  for (const field of contract.fields) {
    if (fieldKeys.has(field.key)) {
      issues.push({
        code: "DUPLICATE_FIELD_KEY",
        severity: "ERROR",
        path: `fields.${field.key}`,
        message: `Field key "${field.key}" is duplicated.`,
      });
    }
    fieldKeys.add(field.key);
    if (!sectionIds.has(field.sectionId)) {
      issues.push({
        code: "SECTION_NOT_FOUND",
        severity: "ERROR",
        path: `fields.${field.key}.sectionId`,
        message: `Section "${field.sectionId}" does not exist.`,
      });
    }
    const resolvedWithoutBinding = ["DEFAULT", "COMPUTED", "CONSTANT", "SYSTEM"].includes(
      field.dataSource.kind,
    );
    if (field.required && !boundFields.has(field.key) && !resolvedWithoutBinding) {
      issues.push({
        code: "REQUIRED_FIELD_UNBOUND",
        severity: "ERROR",
        path: `fields.${field.key}`,
        message: `Required manual field "${field.key}" has no render binding.`,
      });
    }
    if (
      !field.required &&
      field.dataSource.kind === "MANUAL" &&
      !field.repeatableGroupId &&
      !boundFields.has(field.key)
    ) {
      issues.push({
        code: "FIELD_UNBOUND",
        severity: "ERROR",
        path: `fields.${field.key}`,
        message: `Manual field "${field.key}" has no render binding.`,
      });
    }
    if (
      ["SELECT", "RADIO"].includes(field.control) &&
      (!field.options || field.options.length === 0)
    ) {
      issues.push({
        code: "OPTIONS_REQUIRED",
        severity: "ERROR",
        path: `fields.${field.key}.options`,
        message: `${field.control} requires at least one option.`,
      });
    }
  }

  for (const group of contract.repeatableGroups) {
    for (const fieldKey of group.fieldKeys) {
      if (!fieldKeys.has(fieldKey)) {
        issues.push({
          code: "REPEATER_FIELD_NOT_FOUND",
          severity: "ERROR",
          path: `repeatableGroups.${group.key}`,
          message: `Repeater field "${fieldKey}" does not exist.`,
        });
      }
    }
  }

  const knownExpressionPaths = new Set([
    ...fieldKeys,
    ...computedKeys,
    ...tableKeys,
    ...repeaterKeys,
  ]);
  const validateExpressionReferences = (
    expression: Parameters<typeof collectFieldReferences>[0],
    path: string,
  ) => {
    for (const reference of collectFieldReferences(expression)) {
      if (!knownExpressionPaths.has(reference)) {
        issues.push({
          code: "EXPRESSION_FIELD_NOT_FOUND",
          severity: "ERROR",
          path,
          message: `Expression references unknown field "${reference}".`,
        });
      }
    }
  };

  for (const computed of contract.computedFields) {
    validateExpressionReferences(
      computed.expression,
      `computedFields.${computed.key}`,
    );
  }
  for (const field of contract.fields) {
    if (field.dataSource.kind === "COMPUTED") {
      validateExpressionReferences(
        field.dataSource.expression,
        `fields.${field.key}.dataSource`,
      );
    }
  }
  for (const rule of contract.conditionalRules) {
    if (!fieldKeys.has(rule.targetFieldKey)) {
      issues.push({
        code: "CONDITIONAL_TARGET_NOT_FOUND",
        severity: "ERROR",
        path: `conditionalRules.${rule.id}`,
        message: `Conditional target "${rule.targetFieldKey}" does not exist.`,
      });
    }
    validateExpressionReferences(rule.when, `conditionalRules.${rule.id}.when`);
    const target = contract.fields.find(
      (field) => field.key === rule.targetFieldKey,
    );
    const hasDefault =
      target?.dataSource.kind === "DEFAULT" ||
      target?.dataSource.kind === "COMPUTED" ||
      contract.defaultRules.some(
        (defaultRule) => defaultRule.fieldKey === rule.targetFieldKey,
      );
    if (
      target?.required &&
      ["SHOW", "HIDE"].includes(rule.effect) &&
      !hasDefault &&
      !target.hiddenRequiredReason
    ) {
      issues.push({
        code: "HIDDEN_REQUIRED_UNRESOLVED",
        severity: "ERROR",
        path: `fields.${target.key}`,
        message:
          "A condition can hide this required field, but no default/computed source or explanation is configured.",
      });
    }
  }
  for (const rule of contract.validationRules) {
    if (!fieldKeys.has(rule.fieldKey)) {
      issues.push({
        code: "VALIDATION_FIELD_NOT_FOUND",
        severity: "ERROR",
        path: `validationRules.${rule.id}`,
        message: `Validation field "${rule.fieldKey}" does not exist.`,
      });
    }
  }
  for (const binding of contract.renderBindings) {
    if (binding.source.kind === "EXPRESSION") {
      validateExpressionReferences(
        binding.source.expression,
        `renderBindings.${binding.id}.source`,
      );
    }
  }
  for (const migration of contract.migrationRules) {
    if (migration.expression) {
      validateExpressionReferences(
        migration.expression,
        `migrationRules.${migration.id}.expression`,
      );
    }
  }

  for (const binding of contract.renderBindings) {
    if (
      binding.source.kind === "FIELD" &&
      !fieldKeys.has(binding.source.fieldKey) &&
      !computedKeys.has(binding.source.fieldKey)
    ) {
      issues.push({
        code: "BINDING_SOURCE_NOT_FOUND",
        severity: "ERROR",
        path: `renderBindings.${binding.id}`,
        message: `Binding field "${binding.source.fieldKey}" does not exist.`,
      });
    }
    if (
      (binding.source.kind === "TABLE" &&
        !tableKeys.has(binding.source.tableKey)) ||
      (binding.target.kind === "TABLE" &&
        !tableKeys.has(binding.target.tableKey))
    ) {
      issues.push({
        code: "TABLE_NOT_FOUND",
        severity: "ERROR",
        path: `renderBindings.${binding.id}`,
        message: "A table binding references an unknown table.",
      });
    }
    const customTransform = contract.extensionPoints.some(
      (extension) =>
        extension.kind === "TRANSFORM" && extension.name === binding.transform,
    );
    if (!BUILTIN_TRANSFORMS.has(binding.transform) && !customTransform) {
      issues.push({
        code: "UNKNOWN_TRANSFORM",
        severity: "ERROR",
        path: `renderBindings.${binding.id}.transform`,
        message: `Unknown transform "${binding.transform}".`,
      });
    }
    if (
      binding.plugin &&
      !contract.extensionPoints.some(
        (extension) =>
          extension.kind === "RENDER_PLUGIN" &&
          extension.name === binding.plugin,
      )
    ) {
      issues.push({
        code: "UNKNOWN_PLUGIN",
        severity: "ERROR",
        path: `renderBindings.${binding.id}.plugin`,
        message: `Unknown renderer plugin "${binding.plugin}".`,
      });
    }
  }

  for (const cycle of detectComputedCycles([
    ...contract.computedFields,
    ...contract.fields
      .filter((field) => field.dataSource.kind === "COMPUTED")
      .map((field) => ({
        key: field.key,
        expression:
          field.dataSource.kind === "COMPUTED"
            ? field.dataSource.expression
            : { op: "literal" as const, value: null },
      })),
  ])) {
    issues.push({
      code: "COMPUTED_CYCLE",
      severity: "ERROR",
      path: `computedFields.${cycle[0] ?? ""}`,
      message: `Computed dependency cycle: ${cycle.join(" -> ")}.`,
    });
  }

  return issues.sort((left, right) =>
    `${left.path}:${left.code}`.localeCompare(`${right.path}:${right.code}`),
  );
}

export function compileContract(contract: FormContractV2): CompileResult {
  const issues = validateContract(contract);
  if (issues.some((issue) => issue.severity === "ERROR")) {
    return { ok: false, issues };
  }

  const sourceForHash = { ...contract, contractHash: "" };
  const contractHash = stableHash(sourceForHash);
  const requiredFieldKeys = contract.fields
    .filter((field) => field.required)
    .map((field) => field.key)
    .sort();
  const sections = [...contract.sections]
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))
    .map((section) => ({
      ...section,
      fields: contract.fields
        .filter((field) => field.sectionId === section.id)
        .sort(
          (left, right) =>
            left.order - right.order || left.key.localeCompare(right.key),
        ),
    }));
  const properties = Object.fromEntries(
    [...contract.fields]
      .sort((left, right) => left.key.localeCompare(right.key))
      .map((field) => [
        field.key,
        {
          ...jsonTypeForControl(field.control),
          title: field.label,
          "x-control": field.control,
        },
      ]),
  );
  const artifact: CompiledFormContract = {
    schemaVersion: "2.0",
    templateCode: contract.templateCode,
    title: contract.title,
    agencyId: contract.agencyId,
    version: contract.version,
    contractHash,
    templateHash: contract.templateHash,
    compiledAt: new Date(0).toISOString(),
    uiSchema: {
      sections,
      repeatableGroups: contract.repeatableGroups,
      tables: contract.tables,
      conditionalRules: contract.conditionalRules,
    },
    jsonSchema: {
      type: "object",
      properties,
      required: requiredFieldKeys,
      additionalProperties: false,
    },
    renderPlan: {
      bindings: contract.renderBindings,
      computedFields: [
        ...contract.computedFields,
        ...contract.fields
          .filter((field) => field.dataSource.kind === "COMPUTED")
          .map((field) => ({
            key: field.key,
            expression:
              field.dataSource.kind === "COMPUTED"
                ? field.dataSource.expression
                : { op: "literal" as const, value: null },
          })),
      ],
      transforms: [
        ...new Set(contract.renderBindings.map((binding) => binding.transform)),
      ].sort(),
      plugins: [
        ...new Set(
          contract.renderBindings
            .map((binding) => binding.plugin)
            .filter((plugin): plugin is string => Boolean(plugin)),
        ),
      ].sort(),
    },
    requiredFieldKeys,
    source: { ...contract, contractHash },
  };
  return { ok: true, issues, artifact };
}
