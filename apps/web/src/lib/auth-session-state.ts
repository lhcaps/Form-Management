import type { AuthUser } from "./auth-client";

export type AuthSessionStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthSessionState {
  status: AuthSessionStatus;
  user: AuthUser | null;
}

export interface ClerkUserLike {
  id: string;
  username?: string | null;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  primaryEmailAddress?: { emailAddress?: string | null } | null;
  primaryPhoneNumber?: { phoneNumber?: string | null } | null;
}

export function authUserFromClerkUser(user: ClerkUserLike): AuthUser {
  const email = user.primaryEmailAddress?.emailAddress?.trim() || null;
  const phone = user.primaryPhoneNumber?.phoneNumber?.trim() || null;
  const username =
    user.username?.trim() || (email ? email.split("@")[0] || null : null);
  const nameParts = [user.firstName, user.lastName]
    .map((part) => part?.trim())
    .filter(Boolean);
  const fullName =
    user.fullName?.trim() ||
    nameParts.join(" ") ||
    username ||
    email ||
    "Clerk account";

  return {
    id: `clerk:${user.id}`,
    username,
    fullName,
    positionTitle: null,
    rankTitle: null,
    email,
    phone,
    role: "VIEWER",
    agencyId: null,
    agencyName: null,
    agencyCode: null,
    isActive: true,
    permissions: [],
  };
}

export function resolveAuthSessionState({
  apiUser,
  clerkUser,
  clerkLoaded,
}: {
  apiUser: AuthUser | null;
  clerkUser: ClerkUserLike | null;
  clerkLoaded: boolean;
}): AuthSessionState {
  if (apiUser) {
    return { status: "authenticated", user: apiUser };
  }

  if (clerkUser) {
    return {
      status: "authenticated",
      user: authUserFromClerkUser(clerkUser),
    };
  }

  if (!clerkLoaded) {
    return { status: "loading", user: null };
  }

  return { status: "unauthenticated", user: null };
}
