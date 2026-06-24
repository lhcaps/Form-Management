/**
 * Auth client — đăng nhập / lấy user hiện tại / đăng xuất qua session cookie.
 *
 * Tất cả các `*` options khác (signer name, agency, ...) sẽ đọc từ đây.
 * Không có hardcode fallback trong production — nếu chưa đăng nhập, trả về ''.
 */

import { absoluteApiUrl, readApi } from "./api-client";
import { ApiError } from "./api-client";

export type UserRole = "ADMIN" | "OFFICIAL" | "VIEWER";
export type FormPermission =
  | "FORM_TEMPLATE_EDIT"
  | "FORM_TEMPLATE_APPROVE"
  | "FORM_TEMPLATE_PERMISSION_ADMIN";

export interface AuthUser {
  id: string;
  username: string | null;
  fullName: string;
  positionTitle: string | null;
  rankTitle: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  agencyId: string | null;
  agencyName: string | null;
  agencyCode: string | null;
  isActive: boolean;
  permissions: FormPermission[];
}

export async function login(username: string, password: string): Promise<AuthUser> {
  try {
    const result = await readApi<{ user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: username.trim(), password }),
    });
    return result.user;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new Error(
      "Không kết nối được API đăng nhập. Kiểm tra server API ở cổng 3001 rồi thử lại.",
    );
  }
}

export async function logout(): Promise<void> {
  await readApi<void>("/auth/logout", { method: "POST" });
}

export async function fetchMe(): Promise<AuthUser | null> {
  try {
    return await readApi<AuthUser>("/auth/me", { noStore: true });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    return null;
  }
}

export async function fetchOfficials(): Promise<
  Array<{ id: string; fullName: string; positionTitle: string | null; agencyName: string | null }>
> {
  try {
    return await readApi<
      Array<{ id: string; fullName: string; positionTitle: string | null; agencyName: string | null }>
    >("/auth/users", { noStore: true });
  } catch {
    return [];
  }
}

export async function fetchCurrentAgency(): Promise<{
  id: string;
  name: string;
  code: string | null;
  parentName: string | null;
} | null> {
  try {
    return await readApi<{
      id: string;
      name: string;
      code: string | null;
      parentName: string | null;
    }>("/auth/agency", { noStore: true });
  } catch {
    return null;
  }
}
