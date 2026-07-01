import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSignInPath,
  buildSignUpPath,
  isAuthBypassPath,
  isPublicAssetPath,
  normalizeInternalReturnPath,
  returnPathFromSearchParams,
} from "./auth-routes";

test("buildSignInPath preserves an internal return path with one encoding pass", () => {
  assert.equal(
    buildSignInPath("/documents"),
    "/sign-in?return_url=%2Fdocuments",
  );
  assert.equal(
    buildSignInPath("/documents?status=locked"),
    "/sign-in?return_url=%2Fdocuments%3Fstatus%3Dlocked",
  );
});

test("buildSignInPath omits unsafe or auth-page return targets", () => {
  assert.equal(buildSignInPath("https://example.test/documents"), "/sign-in");
  assert.equal(buildSignInPath("//example.test/documents"), "/sign-in");
  assert.equal(buildSignInPath("/sign-in"), "/sign-in");
  assert.equal(buildSignInPath("/sign-up/verify"), "/sign-in");
});

test("buildSignUpPath preserves the same safe internal return path contract", () => {
  assert.equal(
    buildSignUpPath("/templates"),
    "/sign-up?return_url=%2Ftemplates",
  );
  assert.equal(buildSignUpPath("https://example.test/templates"), "/sign-up");
  assert.equal(buildSignUpPath("/sign-in"), "/sign-up");
});

test("normalizeInternalReturnPath accepts only same-origin app paths", () => {
  assert.equal(normalizeInternalReturnPath("/templates"), "/templates");
  assert.equal(normalizeInternalReturnPath(""), null);
  assert.equal(normalizeInternalReturnPath("documents"), null);
  assert.equal(normalizeInternalReturnPath("https://example.test"), null);
  assert.equal(normalizeInternalReturnPath("//example.test"), null);
});

test("returnPathFromSearchParams accepts app return_url and legacy same-origin redirect_url", () => {
  assert.equal(
    returnPathFromSearchParams(new URLSearchParams("return_url=%2Fdocuments")),
    "/documents",
  );
  assert.equal(
    returnPathFromSearchParams(
      new URLSearchParams(
        "redirect_url=http%3A%2F%2Flocalhost%3A3000%2Ftemplates%3Fq%3D1",
      ),
      { currentOrigin: "http://localhost:3000" },
    ),
    "/templates?q=1",
  );
  assert.equal(
    returnPathFromSearchParams(
      new URLSearchParams("redirect_url=https%3A%2F%2Fevil.test%2Fdocuments"),
      { currentOrigin: "http://localhost:3000" },
    ),
    null,
  );
});

test("isAuthBypassPath covers canonical Clerk routes and legacy redirect route", () => {
  assert.equal(isAuthBypassPath("/login"), true);
  assert.equal(isAuthBypassPath("/sign-in"), true);
  assert.equal(isAuthBypassPath("/sign-in/factor-one"), true);
  assert.equal(isAuthBypassPath("/sign-up/verify-email-address"), true);
  assert.equal(isAuthBypassPath("/healthz"), true);
  assert.equal(isAuthBypassPath("/documents"), false);
});

test("isPublicAssetPath covers common static assets outside Next internals", () => {
  assert.equal(isPublicAssetPath("/logo.png"), true);
  assert.equal(isPublicAssetPath("/fonts/agency.woff2"), true);
  assert.equal(isPublicAssetPath("/robots.txt"), true);
  assert.equal(isPublicAssetPath("/documents"), false);
});
