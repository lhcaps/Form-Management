import assert from "node:assert/strict";
import test from "node:test";
import {
  detectComputedCycles,
  evaluateExpression,
  type ComputedFieldDefinition,
} from "../src/index.js";

test("safe expression evaluator supports field references and Vietnamese dates", () => {
  const value = evaluateExpression(
    {
      op: "concat",
      args: [
        { op: "upper", value: { op: "field", path: "agency.code" } },
        { op: "literal", value: " — " },
        {
          op: "vietnameseDate",
          value: { op: "field", path: "document.date" },
        },
      ],
    },
    {
      agency: { code: "vks01" },
      document: { date: "2026-06-20" },
    },
  );

  assert.equal(value, "VKS01 — ngày 20 tháng 06 năm 2026");
});

test("computed dependency cycles are reported deterministically", () => {
  const fields: ComputedFieldDefinition[] = [
    {
      key: "a",
      expression: { op: "field", path: "b" },
    },
    {
      key: "b",
      expression: {
        op: "coalesce",
        args: [
          { op: "field", path: "a" },
          { op: "literal", value: "" },
        ],
      },
    },
  ];

  assert.deepEqual(detectComputedCycles(fields), [["a", "b", "a"]]);
});
