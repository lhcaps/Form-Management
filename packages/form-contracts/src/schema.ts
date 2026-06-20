import { z } from "zod";
import { CONTRACT_STATUSES, CONTROL_TYPES } from "./types.js";
import type { Expression } from "./types.js";

const keySchema = z
  .string()
  .min(1)
  .max(200)
  .regex(
    /^[A-Za-z][A-Za-z0-9_.-]*$/,
    "Field paths may contain only letters, numbers, dots, underscores and dashes.",
  )
  .refine(
    (value) => !value.includes("..") && !value.startsWith("__"),
    "Unsafe field path.",
  );

const expressionSchema: z.ZodType<Expression> = z.lazy(
  (): z.ZodType<Expression> =>
    z.discriminatedUnion("op", [
    z.object({
      op: z.literal("literal"),
      value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
    }),
    z.object({ op: z.literal("field"), path: keySchema }),
    z.object({
      op: z.enum(["concat", "coalesce"]),
      args: z.array(expressionSchema).min(1).max(100),
    }),
    z.object({
      op: z.enum([
        "trim",
        "upper",
        "lower",
        "dateDay",
        "dateMonth",
        "dateYear",
        "vietnameseDate",
        "count",
        "sum",
      ]),
      value: expressionSchema,
    }),
    z.object({
      op: z.literal("condition"),
      when: expressionSchema,
      then: expressionSchema,
      else: expressionSchema,
    }),
    z.object({
      op: z.literal("join"),
      value: expressionSchema,
      separator: z.string().max(20),
    }),
    ]) as z.ZodType<Expression>,
);

const optionSchema = z.object({
  label: z.string().min(1).max(300),
  value: z.string().max(300),
});

const dataSourceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("MANUAL") }),
  z.object({ kind: z.literal("CASE"), path: keySchema }),
  z.object({ kind: z.literal("AGENCY"), path: keySchema }),
  z.object({ kind: z.literal("OFFICIAL"), path: keySchema }),
  z.object({
    kind: z.literal("SYSTEM"),
    value: z.enum(["CURRENT_DATE", "CURRENT_TIME"]),
  }),
  z.object({
    kind: z.literal("CONSTANT"),
    value: z.union([z.string(), z.number(), z.boolean()]),
  }),
  z.object({ kind: z.literal("DEFAULT"), value: z.unknown() }),
  z.object({ kind: z.literal("COMPUTED"), expression: expressionSchema }),
]);

export const sectionDefinitionSchema = z.object({
  id: keySchema,
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  order: z.number().int().min(0),
  columns: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
  ]),
});

export const fieldDefinitionSchema = z.object({
  id: keySchema,
  key: keySchema,
  sectionId: keySchema,
  label: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  placeholder: z.string().max(500).optional(),
  control: z.enum(CONTROL_TYPES),
  order: z.number().int().min(0),
  width: z.union([
    z.literal(3),
    z.literal(4),
    z.literal(6),
    z.literal(8),
    z.literal(9),
    z.literal(12),
  ]),
  required: z.boolean(),
  options: z.array(optionSchema).max(500).optional(),
  dataSource: dataSourceSchema,
  repeatableGroupId: keySchema.optional(),
  hiddenRequiredReason: z.string().max(1000).optional(),
});

export const repeatableGroupDefinitionSchema = z
  .object({
    id: keySchema,
    key: keySchema,
    label: z.string().min(1).max(500),
    minItems: z.number().int().min(0),
    maxItems: z.number().int().positive().max(1000),
    fieldKeys: z.array(keySchema).min(1),
  })
  .refine((group) => group.maxItems >= group.minItems, {
    message: "maxItems must be greater than or equal to minItems.",
  });

const tableColumnSchema = z.object({
  key: keySchema,
  label: z.string().min(1).max(500),
  control: z.enum(["TEXT", "TEXTAREA", "NUMBER", "DATE", "SELECT", "CHECKBOX"]),
  required: z.boolean(),
  options: z.array(optionSchema).max(500).optional(),
});

export const tableDefinitionSchema = z.object({
  id: keySchema,
  key: keySchema,
  label: z.string().min(1).max(500),
  rowLoopStart: keySchema,
  columns: z.array(tableColumnSchema).min(1).max(100),
});

const computedFieldSchema = z.object({
  key: keySchema,
  expression: expressionSchema,
});

const conditionalRuleSchema = z.object({
  id: keySchema,
  targetFieldKey: keySchema,
  effect: z.enum(["SHOW", "HIDE", "ENABLE", "DISABLE", "REQUIRE"]),
  when: expressionSchema,
});

const validationRuleSchema = z.object({
  id: keySchema,
  fieldKey: keySchema,
  kind: z.enum([
    "MIN_LENGTH",
    "MAX_LENGTH",
    "MIN",
    "MAX",
    "PATTERN",
    "CUSTOM",
  ]),
  value: z.union([z.string(), z.number()]).optional(),
  message: z.string().min(1).max(1000),
});

const renderBindingSchema = z.object({
  id: keySchema,
  target: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("SLOT"), slotId: keySchema }),
    z.object({ kind: z.literal("TABLE"), tableKey: keySchema }),
  ]),
  source: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("FIELD"), fieldKey: keySchema }),
    z.object({ kind: z.literal("TABLE"), tableKey: keySchema }),
    z.object({ kind: z.literal("EXPRESSION"), expression: expressionSchema }),
    z.object({ kind: z.literal("CONSTANT"), value: z.unknown() }),
  ]),
  transform: keySchema,
  fallback: z.unknown(),
  plugin: keySchema.optional(),
});

export const formContractV2Schema = z.object({
  schemaVersion: z.literal("2.0"),
  templateCode: z.string().min(1).max(100),
  title: z.string().min(1).max(500),
  agencyId: z.string().min(1).nullable(),
  version: z.number().int().positive(),
  status: z.enum(CONTRACT_STATUSES),
  baseContractHash: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
  contractHash: z.union([z.literal(""), z.string().regex(/^[a-f0-9]{64}$/)]),
  templateHash: z.string().min(1).max(128),
  normalizedDocxPath: z.string().min(1).max(2000).optional(),
  sections: z.array(sectionDefinitionSchema).max(200),
  fields: z.array(fieldDefinitionSchema).max(5000),
  repeatableGroups: z.array(repeatableGroupDefinitionSchema).max(500),
  tables: z.array(tableDefinitionSchema).max(500),
  computedFields: z.array(computedFieldSchema).max(1000),
  conditionalRules: z.array(conditionalRuleSchema).max(5000),
  validationRules: z.array(validationRuleSchema).max(5000),
  defaultRules: z
    .array(
      z.object({
        id: keySchema,
        fieldKey: keySchema,
        value: z.unknown(),
      }),
    )
    .max(5000),
  presetRules: z
    .array(
      z.object({
        id: keySchema,
        name: z.string().min(1).max(500),
        values: z.record(keySchema, z.unknown()),
      }),
    )
    .max(500),
  renderBindings: z.array(renderBindingSchema).max(10000),
  migrationRules: z
    .array(
      z.object({
        id: keySchema,
        fromKey: keySchema,
        toKey: keySchema,
        strategy: z.enum(["COPY", "MOVE", "DROP", "TRANSFORM"]),
        expression: expressionSchema.optional(),
      }),
    )
    .max(5000),
  extensionPoints: z
    .array(
      z.object({
        id: keySchema,
        kind: z.enum(["CONTROL", "TRANSFORM", "RENDER_PLUGIN"]),
        name: keySchema,
        config: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .max(500),
});

export { expressionSchema };
