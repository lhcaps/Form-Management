/**
 * Canonical navigation route map for the authenticated shell.
 *
 * Every visible sidebar / topbar item, post-login redirect, and dynamic
 * detail route must reuse these constants. Do not hardcode URLs elsewhere.
 *
 * BM-200 policy is intentionally omitted: BM-200 stays out of the runtime
 * roster regardless of how the canonical map evolves.
 */

export const APP_ROUTES = {
  dashboard: "/",
  cases: "/cases",
  caseDetail: (caseId: string) => {
    if (!caseId || caseId.trim() === "") {
      throw new Error("caseId must be a non-empty canonical id");
    }
    return `/cases/${encodeURIComponent(caseId)}`;
  },
  documents: "/documents",
  documentDetail: (documentId: string) => {
    if (!documentId || documentId.trim() === "") {
      throw new Error("documentId must be a non-empty canonical id");
    }
    return `/documents/${encodeURIComponent(documentId)}`;
  },
  createDocument: "/documents",
  review: "/templates",
  templateDetail: (templateCode: string) => {
    if (!templateCode || templateCode.trim() === "") {
      throw new Error("templateCode must be a non-empty canonical id");
    }
    return `/templates/${encodeURIComponent(templateCode)}`;
  },
  imports: "/imports",
  reports: "/reports",
  settings: "/settings",
  accountLinking: "/admin/auth/identities",
  signIn: "/sign-in",
} as const;

export type AppRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES];
