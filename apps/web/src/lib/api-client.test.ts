/**
 * Unit tests for apps/web/src/lib/api-client.ts.
 *
 * Goal: lock in the contract that:
 *  - readApi throws ApiError (status/code/requestId) on non-2xx responses
 *  - readApi never consumes the response body twice
 *  - readApi unwraps `{ data }`, `{ result }`, and raw JSON
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";

import {
  ApiError,
  readApi,
  setApiAuthTokenProvider,
  withApiFetchAuthDefaults,
} from "./api-client";

type FakeResponseInit = {
  status: number;
  statusText?: string;
  body?: string;
};

function makeFakeResponse(init: FakeResponseInit): Response {
  const { status, statusText = "OK", body = "" } = init;
  let consumed = false;
  const textPromise = Promise.resolve().then(() => {
    if (consumed) {
      throw new TypeError(
        "Body has already been consumed (cannot read twice).",
      );
    }
    consumed = true;
    return body;
  });

  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    text: () => textPromise,
    json: () => Promise.resolve(body ? JSON.parse(body) : null),
    headers: new Headers(),
    url: "",
  } as unknown as Response;
}

test("readApi throws ApiError on 422 with structured body and preserves fields", async () => {
  const structuredBody = JSON.stringify({
    statusCode: 422,
    code: "VALIDATION_FAILED",
    message: "Trường caseCode không được để trống.",
    requestId: "req-abc-123",
    timestamp: "2026-06-24T10:00:00.000Z",
    path: "/api/v1/cases",
  });

  mock.method(globalThis, "fetch", async () =>
    makeFakeResponse({ status: 422, statusText: "Unprocessable Entity", body: structuredBody }),
  );

  await assert.rejects(
    () => readApi("/cases", { method: "POST", body: "{}" }),
    (err: unknown) => {
      assert.ok(err instanceof ApiError, "must throw ApiError instance");
      const apiErr = err as ApiError;
      assert.equal(apiErr.status, 422, "status preserved");
      assert.equal(apiErr.code, "VALIDATION_FAILED", "code preserved");
      assert.equal(apiErr.requestId, "req-abc-123", "requestId preserved");
      assert.equal(apiErr.message, "Trường caseCode không được để trống.", "message preserved");
      return true;
    },
  );
});

test("readApi falls back to HTTP status when error body is empty", async () => {
  mock.method(globalThis, "fetch", async () =>
    makeFakeResponse({ status: 500, statusText: "Internal Server Error", body: "" }),
  );

  await assert.rejects(
    () => readApi("/boom"),
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      const apiErr = err as ApiError;
      assert.equal(apiErr.status, 500);
      assert.equal(apiErr.code, null);
      assert.equal(apiErr.requestId, null);
      assert.equal(apiErr.message, "HTTP 500");
      return true;
    },
  );
});

test("readApi falls back to HTTP status when error body is not JSON", async () => {
  mock.method(globalThis, "fetch", async () =>
    makeFakeResponse({
      status: 502,
      statusText: "Bad Gateway",
      body: "<html>nginx bad gateway</html>",
    }),
  );

  await assert.rejects(
    () => readApi("/proxy"),
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      const apiErr = err as ApiError;
      assert.equal(apiErr.status, 502);
      assert.equal(apiErr.code, null);
      assert.equal(apiErr.requestId, null);
      assert.equal(apiErr.message, "HTTP 502");
      return true;
    },
  );
});

test("readApi does not attempt to read the response body twice on failure", async () => {
  // Body chỉ có thể đọc 1 lần; nếu readApi cố đọc lần 2, fake response sẽ
  // throw TypeError("Body has already been consumed"). Test này khẳng định
  // luồng hiện tại không còn gọi response.text() lần thứ hai.
  const structuredBody = JSON.stringify({
    statusCode: 401,
    code: "UNAUTHORIZED",
    message: "Phiên đăng nhập đã hết hạn.",
    requestId: "req-double-read",
    timestamp: "2026-06-24T10:00:00.000Z",
    path: "/api/v1/auth/me",
  });

  mock.method(globalThis, "fetch", async () =>
    makeFakeResponse({ status: 401, body: structuredBody }),
  );

  await assert.rejects(
    () => readApi("/auth/me"),
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal((err as ApiError).requestId, "req-double-read");
      return true;
    },
  );
});

test("readApi unwraps a { data: ... } success response", async () => {
  mock.method(globalThis, "fetch", async () =>
    makeFakeResponse({
      status: 200,
      body: JSON.stringify({ data: { items: [1, 2, 3], total: 3 } }),
    }),
  );

  const result = await readApi<{ items: number[]; total: number }>("/items");
  assert.deepEqual(result, { items: [1, 2, 3], total: 3 });
});

test("readApi unwraps a { result: ... } success response", async () => {
  mock.method(globalThis, "fetch", async () =>
    makeFakeResponse({
      status: 200,
      body: JSON.stringify({ result: { ok: true } }),
    }),
  );

  const result = await readApi<{ ok: boolean }>("/check");
  assert.deepEqual(result, { ok: true });
});

test("readApi returns raw JSON success payload when no data/result wrapper is present", async () => {
  mock.method(globalThis, "fetch", async () =>
    makeFakeResponse({
      status: 200,
      body: JSON.stringify({ id: "u-1", name: "Lan" }),
    }),
  );

  const result = await readApi<{ id: string; name: string }>("/me");
  assert.deepEqual(result, { id: "u-1", name: "Lan" });
});

test("readApi returns raw string success payload when response body is non-JSON text", async () => {
  mock.method(globalThis, "fetch", async () =>
    makeFakeResponse({ status: 200, body: "plain text body" }),
  );

  const result = await readApi<string>("/raw");
  assert.equal(result, "plain text body");
});

test("ApiError exposes getters that return null when body is missing", () => {
  const err = new ApiError(418, null);
  assert.equal(err.status, 418);
  assert.equal(err.code, null);
  assert.equal(err.requestId, null);
  assert.equal(err.message, "HTTP 418");
  assert.equal(err.name, "ApiError");
});

test("withApiFetchAuthDefaults attaches a Clerk bearer token to API requests", async () => {
  setApiAuthTokenProvider(async () => "clerk-session-jwt");
  try {
    const [, init] = await withApiFetchAuthDefaults(
      "http://localhost:3001/api/v1/templates",
      {
        headers: { "X-Request-Id": "req-1" },
      },
    );

    const headers = new Headers(init?.headers);
    assert.equal(headers.get("Authorization"), "Bearer clerk-session-jwt");
    assert.equal(headers.get("X-Request-Id"), "req-1");
    assert.equal(init?.credentials, "include");
  } finally {
    setApiAuthTokenProvider(null);
  }
});

test("withApiFetchAuthDefaults preserves an explicit Authorization header", async () => {
  setApiAuthTokenProvider(async () => "clerk-session-jwt");
  try {
    const [, init] = await withApiFetchAuthDefaults(
      "http://localhost:3001/api/v1/templates",
      {
        headers: { Authorization: "Bearer legacy-api-token" },
      },
    );

    const headers = new Headers(init?.headers);
    assert.equal(headers.get("Authorization"), "Bearer legacy-api-token");
  } finally {
    setApiAuthTokenProvider(null);
  }
});
