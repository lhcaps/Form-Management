export const CONTRACT_STATUSES = [
  "DRAFT",
  "IN_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "PUBLISHED",
  "ARCHIVED",
] as const;

export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const CONTROL_TYPES = [
  "TEXT",
  "TEXTAREA",
  "NUMBER",
  "DATE",
  "PARTIAL_DATE",
  "TIME",
  "SELECT",
  "RADIO",
  "CHECKBOX",
  "AGENCY_PICKER",
  "OFFICIAL_PICKER",
  "PERSON_PICKER",
  "READONLY",
  "COMPUTED",
] as const;

export type ControlType = (typeof CONTROL_TYPES)[number];

export type LiteralExpression = {
  op: "literal";
  value: string | number | boolean | null;
};

export type FieldExpression = {
  op: "field";
  path: string;
};

export type VariadicExpression = {
  op: "concat" | "coalesce";
  args: Expression[];
};

export type UnaryExpression = {
  op:
    | "trim"
    | "upper"
    | "lower"
    | "dateDay"
    | "dateMonth"
    | "dateYear"
    | "vietnameseDate"
    | "count"
    | "sum";
  value: Expression;
};

export type ConditionalExpression = {
  op: "condition";
  when: Expression;
  then: Expression;
  else: Expression;
};

export type JoinExpression = {
  op: "join";
  value: Expression;
  separator: string;
};

export type Expression =
  | LiteralExpression
  | FieldExpression
  | VariadicExpression
  | UnaryExpression
  | ConditionalExpression
  | JoinExpression;

export type FieldDataSource =
  | { kind: "MANUAL" }
  | { kind: "CASE"; path: string }
  | { kind: "AGENCY"; path: string }
  | { kind: "OFFICIAL"; path: string }
  | { kind: "SYSTEM"; value: "CURRENT_DATE" | "CURRENT_TIME" }
  | { kind: "CONSTANT"; value: string | number | boolean }
  | { kind: "DEFAULT"; value: unknown }
  | { kind: "COMPUTED"; expression: Expression };

export type SelectOption = {
  label: string;
  value: string;
};

export type SectionDefinition = {
  id: string;
  title: string;
  description?: string;
  order: number;
  columns: 1 | 2 | 3 | 4;
};

export type FieldDefinition = {
  id: string;
  key: string;
  sectionId: string;
  label: string;
  description?: string;
  placeholder?: string;
  control: ControlType;
  order: number;
  width: 3 | 4 | 6 | 8 | 9 | 12;
  required: boolean;
  options?: SelectOption[];
  dataSource: FieldDataSource;
  repeatableGroupId?: string;
  hiddenRequiredReason?: string;
};

export type RepeatableGroupDefinition = {
  id: string;
  key: string;
  label: string;
  minItems: number;
  maxItems: number;
  fieldKeys: string[];
};

export type TableColumnDefinition = {
  key: string;
  label: string;
  control: Extract<
    ControlType,
    "TEXT" | "TEXTAREA" | "NUMBER" | "DATE" | "SELECT" | "CHECKBOX"
  >;
  required: boolean;
  options?: SelectOption[];
};

export type TableDefinition = {
  id: string;
  key: string;
  label: string;
  rowLoopStart: string;
  columns: TableColumnDefinition[];
};

export type ComputedFieldDefinition = {
  key: string;
  expression: Expression;
};

export type ConditionalRule = {
  id: string;
  targetFieldKey: string;
  effect: "SHOW" | "HIDE" | "ENABLE" | "DISABLE" | "REQUIRE";
  when: Expression;
};

export type ValidationRule = {
  id: string;
  fieldKey: string;
  kind: "MIN_LENGTH" | "MAX_LENGTH" | "MIN" | "MAX" | "PATTERN" | "CUSTOM";
  value?: string | number;
  message: string;
};

export type DefaultRule = {
  id: string;
  fieldKey: string;
  value: unknown;
};

export type PresetRule = {
  id: string;
  name: string;
  values: Record<string, unknown>;
};

export type RenderBindingTarget =
  | { kind: "SLOT"; slotId: string }
  | { kind: "TABLE"; tableKey: string };

export type RenderBindingSource =
  | { kind: "FIELD"; fieldKey: string }
  | { kind: "TABLE"; tableKey: string }
  | { kind: "EXPRESSION"; expression: Expression }
  | { kind: "CONSTANT"; value: unknown };

export type RenderBinding = {
  id: string;
  target: RenderBindingTarget;
  source: RenderBindingSource;
  transform: string;
  fallback: unknown;
  plugin?: string;
};

export type FieldMigrationRule = {
  id: string;
  fromKey: string;
  toKey: string;
  strategy: "COPY" | "MOVE" | "DROP" | "TRANSFORM";
  expression?: Expression;
};

export type ExtensionPoint = {
  id: string;
  kind: "CONTROL" | "TRANSFORM" | "RENDER_PLUGIN";
  name: string;
  config?: Record<string, unknown>;
};

export type FormContractV2 = {
  schemaVersion: "2.0";
  templateCode: string;
  title: string;
  agencyId: string | null;
  version: number;
  status: ContractStatus;
  baseContractHash: string | null;
  contractHash: string;
  templateHash: string;
  normalizedDocxPath?: string;
  sections: SectionDefinition[];
  fields: FieldDefinition[];
  repeatableGroups: RepeatableGroupDefinition[];
  tables: TableDefinition[];
  computedFields: ComputedFieldDefinition[];
  conditionalRules: ConditionalRule[];
  validationRules: ValidationRule[];
  defaultRules: DefaultRule[];
  presetRules: PresetRule[];
  renderBindings: RenderBinding[];
  migrationRules: FieldMigrationRule[];
  extensionPoints: ExtensionPoint[];
};

export type ContractIssueSeverity = "ERROR" | "WARNING";

export type ContractIssue = {
  code: string;
  severity: ContractIssueSeverity;
  path: string;
  message: string;
};

export type CompiledFormContract = {
  schemaVersion: "2.0";
  templateCode: string;
  title: string;
  agencyId: string | null;
  version: number;
  contractHash: string;
  templateHash: string;
  compiledAt: string;
  uiSchema: {
    sections: Array<
      SectionDefinition & {
        fields: FieldDefinition[];
      }
    >;
    repeatableGroups: RepeatableGroupDefinition[];
    tables: TableDefinition[];
    conditionalRules: ConditionalRule[];
  };
  jsonSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties: boolean;
  };
  renderPlan: {
    bindings: RenderBinding[];
    computedFields: ComputedFieldDefinition[];
    transforms: string[];
    plugins: string[];
  };
  requiredFieldKeys: string[];
  source: FormContractV2;
};

export type CompileResult = {
  ok: boolean;
  issues: ContractIssue[];
  artifact?: CompiledFormContract;
};

export type V1Contract = {
  schemaVersion: string;
  sourceId: string;
  templateCode: string;
  templateTitle: string;
  documentKind: "form" | "reference";
  status: "locked" | "draft";
  docx?: { sha256?: string };
  extractionSource?: { sha256?: string; relativePath?: string };
  docxSlots?: Array<{
    slotId: string;
    required?: boolean;
    reviewRequired?: boolean;
    label?: string;
  }>;
  canonicalFields?: Array<{
    path: string;
    type?: string;
    source?: string;
    uiComponent?: string;
    section?: string;
    required?: boolean;
  }>;
  renderBindings?: Array<{
    slotId: string;
    from: string;
    transform?: string;
    fallback?: unknown;
  }>;
};
