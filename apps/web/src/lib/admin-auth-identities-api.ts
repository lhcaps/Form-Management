/**
 * API client for admin auth identity linking management.
 */

import { readApi } from "./api-client";

export type IdentitySummary = {
  id: string;
  provider: string;
  providerUserId: string;
  email: string | null;
  username: string | null;
  fullName: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
  linkedOfficial: {
    officialId: string;
    fullName: string;
    email: string | null;
    role: string;
    agencyName: string | null;
    isActive: boolean;
  } | null;
};

export type OfficialSearchResult = {
  officialId: string;
  fullName: string;
  email: string | null;
  username: string | null;
  role: string;
  agencyId: string | null;
  agencyName: string | null;
  alreadyLinked: boolean;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type ListIdentitiesParams = {
  q?: string;
  linked?: "linked" | "unlinked" | "all";
  page?: string;
  pageSize?: string;
};

export type SearchOfficialsParams = {
  q?: string;
  agencyId?: string;
  page?: string;
  pageSize?: string;
};

export type LinkIdentityBody = {
  officialId: string;
  reason?: string;
};

export type UnlinkIdentityBody = {
  reason?: string;
};

function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== "",
  );
  if (entries.length === 0) return "";
  return "?" + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&");
}

export async function listAuthIdentities(
  params: ListIdentitiesParams = {},
): Promise<PaginatedResult<IdentitySummary>> {
  const query = buildQuery({
    q: params.q,
    linked: params.linked,
    page: params.page,
    pageSize: params.pageSize,
  });
  return readApi<PaginatedResult<IdentitySummary>>(
    `/admin/auth/identities${query}`,
    { cache: "no-store" },
  );
}

export async function searchActiveOfficials(
  params: SearchOfficialsParams = {},
): Promise<PaginatedResult<OfficialSearchResult>> {
  const query = buildQuery({
    q: params.q,
    agencyId: params.agencyId,
    page: params.page,
    pageSize: params.pageSize,
  });
  return readApi<PaginatedResult<OfficialSearchResult>>(
    `/admin/auth/identities/officials/search${query}`,
    { cache: "no-store" },
  );
}

export async function linkAuthIdentity(
  identityId: string,
  body: LinkIdentityBody,
): Promise<IdentitySummary> {
  return readApi<IdentitySummary>(
    `/admin/auth/identities/${encodeURIComponent(identityId)}/link`,
    { method: "POST", body: JSON.stringify(body) },
  );
}

export async function unlinkAuthIdentity(
  identityId: string,
  body: UnlinkIdentityBody = {},
): Promise<IdentitySummary> {
  return readApi<IdentitySummary>(
    `/admin/auth/identities/${encodeURIComponent(identityId)}/unlink`,
    { method: "POST", body: JSON.stringify(body) },
  );
}
