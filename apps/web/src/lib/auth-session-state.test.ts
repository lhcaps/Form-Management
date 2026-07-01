import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  authUserFromClerkUser,
  resolveAuthSessionState,
} from "./auth-session-state";
import type { AuthUser } from "./auth-client";

const apiUser: AuthUser = {
  id: "42",
  username: "admin",
  fullName: "Nguyen Van Kiem",
  positionTitle: "Kiem sat vien",
  rankTitle: null,
  email: "kiem@example.test",
  phone: null,
  role: "ADMIN",
  agencyId: "1",
  agencyName: "VKSND Quan 1",
  agencyCode: "Q1",
  isActive: true,
  permissions: ["FORM_TEMPLATE_EDIT"],
};

describe("authUserFromClerkUser", () => {
  it("maps a Clerk user into a safe viewer auth user", () => {
    const user = authUserFromClerkUser({
      id: "user_123",
      username: null,
      fullName: null,
      firstName: "Minh",
      lastName: "Tran",
      primaryEmailAddress: { emailAddress: "minh.tran@example.test" },
      primaryPhoneNumber: { phoneNumber: "+84901234567" },
    });

    assert.deepEqual(user, {
      id: "clerk:user_123",
      username: "minh.tran",
      fullName: "Minh Tran",
      positionTitle: null,
      rankTitle: null,
      email: "minh.tran@example.test",
      phone: "+84901234567",
      role: "VIEWER",
      agencyId: null,
      agencyName: null,
      agencyCode: null,
      isActive: true,
      permissions: [],
    });
  });
});

describe("resolveAuthSessionState", () => {
  it("keeps the app loading while Clerk is still resolving", () => {
    assert.deepEqual(
      resolveAuthSessionState({
        apiUser: null,
        clerkUser: null,
        clerkLoaded: false,
      }),
      { status: "loading", user: null },
    );
  });

  it("prefers the API user when legacy session data exists", () => {
    assert.deepEqual(
      resolveAuthSessionState({
        apiUser,
        clerkUser: {
          id: "user_123",
          fullName: "Clerk User",
          primaryEmailAddress: { emailAddress: "clerk@example.test" },
        },
        clerkLoaded: true,
      }),
      { status: "authenticated", user: apiUser },
    );
  });

  it("uses Clerk as an authenticated viewer fallback when API session is absent", () => {
    const result = resolveAuthSessionState({
      apiUser: null,
      clerkUser: {
        id: "user_123",
        fullName: "Clerk User",
        primaryEmailAddress: { emailAddress: "clerk@example.test" },
      },
      clerkLoaded: true,
    });

    assert.equal(result.status, "authenticated");
    assert.equal(result.user?.id, "clerk:user_123");
    assert.equal(result.user?.role, "VIEWER");
    assert.deepEqual(result.user?.permissions, []);
  });

  it("marks unauthenticated only after Clerk is loaded and no session exists", () => {
    assert.deepEqual(
      resolveAuthSessionState({
        apiUser: null,
        clerkUser: null,
        clerkLoaded: true,
      }),
      { status: "unauthenticated", user: null },
    );
  });
});
