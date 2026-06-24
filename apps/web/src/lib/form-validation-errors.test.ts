/**
 * Unit tests for extractStructuredValidationErrors.
 *
 * Goal: lock in the contract that:
 *  - parses Axios-style errors (response.data.details)
 *  - parses bare details objects
 *  - parses a bare errors[] array
 *  - returns [] for legacy / unknown shapes so the caller can fall back
 *  - drops malformed entries silently instead of throwing
 *  - tolerates forward-compatible extra fields
 */

import assert from "node:assert/strict";
import test from "node:test";

import { extractStructuredValidationErrors } from "./form-validation-errors";

test("parses Axios-style error.response.data.details.errors", () => {
  const axiosLike = {
    response: {
      data: {
        statusCode: 422,
        code: "CONTRACT_INPUT_VALIDATION_FAILED",
        message: "Dữ liệu biểu mẫu chưa hợp lệ.",
        details: {
          ok: false,
          errors: [
            {
              path: "person.fullName",
              label: "Họ tên",
              section: "person",
              sectionTitle: "Thông tin",
              required: true,
              code: "REQUIRED",
              message: "Trường \"Họ tên\" là bắt buộc.",
            },
          ],
        },
      },
    },
  };

  const errors = extractStructuredValidationErrors(axiosLike);

  assert.equal(errors.length, 1);
  assert.equal(errors[0].path, "person.fullName");
  assert.equal(errors[0].label, "Họ tên");
  assert.equal(errors[0].section, "person");
  assert.equal(errors[0].sectionTitle, "Thông tin");
  assert.equal(errors[0].required, true);
  assert.equal(errors[0].code, "REQUIRED");
  assert.equal(errors[0].message, "Trường \"Họ tên\" là bắt buộc.");
});

test("parses bare details object", () => {
  const body = {
    details: {
      ok: false,
      errors: [
        {
          path: "document.issueDate",
          label: "Ngày ban hành",
          section: "document",
          sectionTitle: "Cơ quan và văn bản",
          required: true,
          code: "INVALID_DATE",
          message: "Ngày \"Ngày ban hành\" không đúng định dạng.",
        },
      ],
    },
  };

  const errors = extractStructuredValidationErrors(body);

  assert.equal(errors.length, 1);
  assert.equal(errors[0].code, "INVALID_DATE");
  assert.equal(errors[0].sectionTitle, "Cơ quan và văn bản");
});

test("parses bare errors array", () => {
  const errors = extractStructuredValidationErrors([
    {
      path: "document.rogueField",
      code: "UNKNOWN_FIELD",
      message: "Trường không có trong hợp đồng biểu mẫu.",
    },
  ]);

  assert.equal(errors.length, 1);
  assert.equal(errors[0].code, "UNKNOWN_FIELD");
  // Defensive defaults: missing label falls back to path tail, missing
  // section/sectionTitle fall back to first path segment.
  assert.equal(errors[0].label, "rogueField");
  assert.equal(errors[0].section, "document");
  assert.equal(errors[0].sectionTitle, "document");
});

test("parses nested data wrapping", () => {
  const wrapped = {
    data: {
      details: {
        ok: false,
        errors: [
          {
            path: "contractMeta",
            label: "Hợp đồng biểu mẫu",
            section: "contract",
            sectionTitle: "Hợp đồng biểu mẫu",
            required: false,
            code: "CONTRACT_DRIFT",
            message: "Hợp đồng đã thay đổi.",
          },
        ],
      },
    },
  };

  const errors = extractStructuredValidationErrors(wrapped);

  assert.equal(errors.length, 1);
  assert.equal(errors[0].code, "CONTRACT_DRIFT");
});

test("returns [] for legacy error shape (no details.errors)", () => {
  const legacy = {
    statusCode: 422,
    code: "CONTRACT_INPUT_VALIDATION_FAILED",
    message: "Dữ liệu biểu mẫu chưa hợp lệ.",
  };

  const errors = extractStructuredValidationErrors(legacy);

  assert.deepEqual(errors, []);
});

test("returns [] for unknown inputs without throwing", () => {
  assert.deepEqual(extractStructuredValidationErrors(null), []);
  assert.deepEqual(extractStructuredValidationErrors(undefined), []);
  assert.deepEqual(extractStructuredValidationErrors("plain text"), []);
  assert.deepEqual(extractStructuredValidationErrors(42), []);
  assert.deepEqual(extractStructuredValidationErrors({}), []);
  assert.deepEqual(extractStructuredValidationErrors({ details: {} }), []);
  assert.deepEqual(
    extractStructuredValidationErrors({ details: { errors: "not-an-array" } }),
    [],
  );
});

test("drops malformed entries silently and keeps the well-formed ones", () => {
  const body = {
    details: {
      ok: false,
      errors: [
        // well-formed
        {
          path: "person.fullName",
          label: "Họ tên",
          section: "person",
          sectionTitle: "Thông tin",
          required: true,
          code: "REQUIRED",
          message: "Trường \"Họ tên\" là bắt buộc.",
        },
        // missing code
        { path: "x", label: "x" },
        // missing path
        { code: "INVALID_TYPE" },
        // unknown code
        {
          path: "y",
          code: "NOT_A_REAL_CODE",
          message: "x",
        },
        // forward-compatible extra fields should not break parsing
        {
          path: "z",
          code: "INVALID_TYPE",
          message: "wrong type",
          futureFlag: true,
          nested: { foo: "bar" },
        },
      ],
    },
  };

  const errors = extractStructuredValidationErrors(body);

  assert.equal(errors.length, 2);
  assert.equal(errors[0].path, "person.fullName");
  assert.equal(errors[1].path, "z");
  assert.equal(errors[1].code, "INVALID_TYPE");
});

test("accepts every locked code value", () => {
  const codes = [
    "REQUIRED",
    "INVALID_TYPE",
    "INVALID_DATE",
    "UNKNOWN_FIELD",
    "CONTRACT_DRIFT",
  ] as const;

  for (const code of codes) {
    const errors = extractStructuredValidationErrors({
      details: { ok: false, errors: [{ path: "p", code, message: "m" }] },
    });
    assert.equal(errors.length, 1, `code=${code} should parse`);
    assert.equal(errors[0].code, code);
  }
});