/**
 * lib/permissions.ts
 *
 * Role and permission helpers for QUANLYVKS.
 *
 * Backend is the authoritative source of truth for permissions.
 * These helpers only drive frontend UI visibility — they do NOT secure data.
 */

import type { AuthUser, FormPermission } from "./auth-client";

/** ADMIN can do everything */
export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === "ADMIN";
}

/** OFFICIAL role (includes ADMIN since ADMIN has all permissions) */
export function isOfficial(user: AuthUser | null): boolean {
  return user?.role === "ADMIN" || user?.role === "OFFICIAL";
}

/** Check a specific FormPermission */
export function hasPermission(
  user: AuthUser | null,
  permission: FormPermission,
): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return user.permissions.includes(permission);
}

/** Form Studio — open/edit existing forms */
export function canOpenFormStudio(user: AuthUser | null): boolean {
  return hasPermission(user, "FORM_TEMPLATE_EDIT");
}

/** Form Studio — approve/reject submitted forms */
export function canApproveForms(user: AuthUser | null): boolean {
  return hasPermission(user, "FORM_TEMPLATE_APPROVE");
}

/** Form Studio — edit form content */
export function canEditForms(user: AuthUser | null): boolean {
  return hasPermission(user, "FORM_TEMPLATE_EDIT");
}

/** Form Studio — manage permissions for other officials */
export function canManageFormPermissions(user: AuthUser | null): boolean {
  return hasPermission(user, "FORM_TEMPLATE_PERMISSION_ADMIN");
}

/**
 * Check if user can view a specific agency's data.
 * For now: ADMIN sees all, OFFICIAL sees own agency only.
 * In the future this could expand to regional supervisors.
 */
export function canViewAgency(
  user: AuthUser | null,
  agencyId: string,
): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return user.agencyId === agencyId;
}

/**
 * Check if the current user is associated with a given agency.
 */
export function isInAgency(user: AuthUser | null, agencyId: string): boolean {
  if (!user) return false;
  return user.agencyId === agencyId;
}
