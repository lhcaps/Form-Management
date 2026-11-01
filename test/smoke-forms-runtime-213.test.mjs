import assert from "node:assert/strict";
import test from "node:test";
import { runSmoke } from "../scripts/smoke-forms-runtime-213.mjs";

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    json: async () => body,
  };
}

const validRuntimeContract = {
  source: "GLOBAL_PUBLISHED",
  compiledContract: {
    schemaVersion: "2.0",
    uiSchema: { sections: [] },
    renderPlan: { bindings: [] },
    source: { fields: [] },
  },
};

test("uses supplied Clerk bearer authorization instead of the retired session login", async () => {
  const calls = [];
  let authorizationCalls = 0;
  const result = await runSmoke({
    getAuthorization: async () => {
      authorizationCalls += 1;
      return "Bearer clerk-test-token";
    },
    requestDelayMs: 0,
    fetchImpl: async (url, init = {}) => {
      calls.push({ url: String(url), headers: init.headers ?? {} });
      if (String(url).endsWith("/api/v1/health")) {
        return jsonResponse({ ok: true });
      }
      if (String(url).includes("/api/v1/forms/runtime/")) {
        return jsonResponse(validRuntimeContract);
      }
      return jsonResponse({ message: "unexpected legacy endpoint" }, 404);
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.passedCount, 213);
  assert.equal(authorizationCalls, 214);
  assert.equal(
    calls.some((call) => call.url.endsWith("/api/v1/auth/login")),
    false,
  );
  for (const call of calls) {
    assert.equal(call.headers.Authorization, "Bearer clerk-test-token");
    assert.equal(Object.hasOwn(call.headers, "Cookie"), false);
  }
});
