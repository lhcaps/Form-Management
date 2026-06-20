import assert from "node:assert/strict";
import test from "node:test";
import {
  compileContract,
  createEmptyContract,
  formContractV2Schema,
  stableHash,
  stableStringify,
  type FormContractV2,
} from "../src/index.js";

function syntheticContract(): FormContractV2 {
  const contract = createEmptyContract({
    templateCode: "CUS-VKS01-0001",
    agencyId: "1",
    templateHash: "template-sha",
    title: "Synthetic coverage form",
  });

  contract.sections.push({
    id: "identity",
    title: "Thông tin",
    order: 0,
    columns: 2,
  });
  contract.fields.push(
    {
      id: "full-name",
      key: "person.fullName",
      sectionId: "identity",
      label: "Họ và tên",
      control: "TEXT",
      order: 0,
      width: 12,
      required: true,
      dataSource: { kind: "MANUAL" },
    },
    {
      id: "summary",
      key: "document.summary",
      sectionId: "identity",
      label: "Tóm tắt",
      control: "COMPUTED",
      order: 1,
      width: 12,
      required: true,
      dataSource: {
        kind: "COMPUTED",
        expression: {
          op: "concat",
          args: [
            { op: "literal", value: "Người khai: " },
            { op: "field", path: "person.fullName" },
          ],
        },
      },
    },
    {
      id: "witness-name",
      key: "witnesses.fullName",
      sectionId: "identity",
      label: "Họ tên người làm chứng",
      control: "TEXT",
      order: 2,
      width: 12,
      required: false,
      dataSource: { kind: "MANUAL" },
      repeatableGroupId: "witnesses",
    },
  );
  contract.repeatableGroups.push({
    id: "witnesses",
    key: "witnesses",
    label: "Người làm chứng",
    minItems: 0,
    maxItems: 20,
    fieldKeys: ["witnesses.fullName"],
  });
  contract.tables.push({
    id: "evidence-table",
    key: "evidenceItems",
    label: "Vật chứng",
    rowLoopStart: "evidenceItems",
    columns: [
      { key: "description", label: "Mô tả", control: "TEXT", required: true },
      { key: "quantity", label: "Số lượng", control: "NUMBER", required: false },
    ],
  });
  contract.renderBindings.push(
    {
      id: "binding-name",
      target: { kind: "SLOT", slotId: "person.fullName" },
      source: { kind: "FIELD", fieldKey: "person.fullName" },
      transform: "identity",
      fallback: "",
    },
    {
      id: "binding-table",
      target: { kind: "TABLE", tableKey: "evidenceItems" },
      source: { kind: "TABLE", tableKey: "evidenceItems" },
      transform: "identity",
      fallback: [],
    },
  );
  return contract;
}

test("stable serialization and hash are independent from object key order", () => {
  const first = { b: 2, a: { d: 4, c: 3 } };
  const second = { a: { c: 3, d: 4 }, b: 2 };

  assert.equal(stableStringify(first), stableStringify(second));
  assert.equal(stableHash(first), stableHash(second));
});

test("compiler emits one deterministic artifact for UI, API and renderer", () => {
  const result = compileContract(syntheticContract());

  assert.equal(result.ok, true);
  assert.equal(result.issues.length, 0);
  assert.equal(result.artifact?.schemaVersion, "2.0");
  assert.deepEqual(result.artifact?.requiredFieldKeys, [
    "document.summary",
    "person.fullName",
  ]);
  assert.equal(result.artifact?.uiSchema.sections[0]?.fields.length, 3);
  assert.equal(result.artifact?.renderPlan.bindings.length, 2);
  assert.equal(result.artifact?.jsonSchema.required?.length, 2);
  assert.match(result.artifact?.contractHash ?? "", /^[a-f0-9]{64}$/);
});

test("schema rejects unknown controls and unsafe expression operators", () => {
  const input = syntheticContract() as unknown as Record<string, unknown>;
  const fields = input.fields as Array<Record<string, unknown>>;
  fields[0] = { ...fields[0], control: "HTML_SCRIPT" };
  fields[1] = {
    ...fields[1],
    dataSource: {
      kind: "COMPUTED",
      expression: { op: "eval", value: "process.exit()" },
    },
  };

  const parsed = formContractV2Schema.safeParse(input);
  assert.equal(parsed.success, false);
});

test("compiler blocks a required manual field without a render binding", () => {
  const contract = syntheticContract();
  contract.renderBindings = contract.renderBindings.filter(
    (binding) => binding.id !== "binding-name",
  );

  const result = compileContract(contract);

  assert.equal(result.ok, false);
  assert.ok(
    result.issues.some(
      (issue) =>
        issue.code === "REQUIRED_FIELD_UNBOUND" &&
        issue.path === "fields.person.fullName",
    ),
  );
});

test("compiler blocks invalid expression references and unexplained hidden required fields", () => {
  const contract = syntheticContract();
  contract.conditionalRules.push({
    id: "hide-name",
    targetFieldKey: "person.fullName",
    effect: "HIDE",
    when: { op: "field", path: "missing.flag" },
  });

  const result = compileContract(contract);

  assert.equal(result.ok, false);
  assert.ok(
    result.issues.some((issue) => issue.code === "EXPRESSION_FIELD_NOT_FOUND"),
  );
  assert.ok(
    result.issues.some((issue) => issue.code === "HIDDEN_REQUIRED_UNRESOLVED"),
  );
});
