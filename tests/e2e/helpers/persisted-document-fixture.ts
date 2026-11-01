/**
 * Persisted Document Fixture Factory — Phase 13b
 *
 * Creates an execution-owned generated_document via the supported
 * `POST /api/v1/documents/draft-from-template` endpoint and returns
 * the route + identity needed for Phase 13b browser persistence tests.
 *
 * SCOPE: This factory is TEST FIXTURE PROVISIONING. It is NOT promotion.
 * It does NOT change the runtime roster, promotion manifests, or any
 * runtime-ready allowlist. It creates one DB row per call (or reuses an
 * existing draft for the same case+templateCode), tagged with the runId.
 *
 * NO DIRECT DATABASE WRITES.
 * NO LOCKED CONTRACT MUTATIONS.
 * NO PROMOTION MANIFEST EDITS.
 *
 * Usage:
 *   const fixture = await createPersistedDraft(page, { runId, formCode, caseId });
 *   await page.goto(fixture.documentRoute); // /documents/<documentId>
 */
import { expect, type APIRequestContext, type Page } from "@playwright/test";

const APP_BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const API_BASE_URL =
  process.env.E2E_API_BASE_URL ?? "http://localhost:3001/api/v1";

export type PersistedDraftFixtureOptions = {
  runId: string;
  formCode: string;
  caseId: string;
  targetPersonId?: string;
  api?: APIRequestContext;
  page?: Page;
};

export type PersistedDraftFixture = {
  runId: string;
  formCode: string;
  templateId: string | null;
  templateCode: string;
  caseId: string;
  documentId: string;
  documentRoute: string;
  createdAt: string;
  creationRequestStatus: number;
  creationResponseStatus: number;
  auditEventExpected: boolean;
  cleanupSupported: boolean;
  cleanupStatus: "NOT_ATTEMPTED" | "UNSUPPORTED";
  ownershipTag: string;
  reused: boolean;
  isNew: boolean;
  reviewStatus: string;
  documentTitle: string;
};

/**
 * Validate the form code matches the locked format BM-NNN.
 */
export function isValidFormCode(formCode: string): boolean {
  return /^BM-\d{3}$/.test(formCode);
}

/**
 * Resolve which APIRequestContext to use for the POST.
 * If a page is supplied, use page.request (inherits the page's auth state).
 * Otherwise use the explicitly passed APIRequestContext.
 */
function resolveRequest(opts: PersistedDraftFixtureOptions): APIRequestContext {
  if (opts.page) return opts.page.request;
  if (opts.api) return opts.api;
  throw new Error(
    "createPersistedDraft requires either `page` or `api` (APIRequestContext).",
  );
}

/**
 * Create an execution-owned persisted draft document.
 *
 * Returns the fixture metadata block required by Phase 13b. The DB row is
 * retained and tagged with the runId; cleanup is unsupported through the
 * application API, so this implementation marks CLEANUP_STATUS=UNSUPPORTED.
 */
export async function createPersistedDraft(
  opts: PersistedDraftFixtureOptions,
): Promise<PersistedDraftFixture> {
  if (!isValidFormCode(opts.formCode)) {
    throw new Error(`Invalid formCode: ${opts.formCode}`);
  }
  if (!opts.caseId || !/^\d+$/.test(opts.caseId)) {
    throw new Error(`Invalid caseId: ${opts.caseId}`);
  }
  if (!opts.runId || !/^[A-Z0-9_]+$/.test(opts.runId)) {
    throw new Error(
      `Invalid runId: ${opts.runId} (must match /^[A-Z0-9_]+$/ for safe ownership tagging)`,
    );
  }

  const ownershipTag = `QLLAW_PHASE13B_${opts.runId}_${opts.formCode}`;
  const request = resolveRequest(opts);
  const createdAt = new Date().toISOString();

  const response = await request.post(
    `${API_BASE_URL}/documents/draft-from-template`,
    {
      data: {
        templateCode: opts.formCode,
        caseId: opts.caseId,
        targetPersonId: opts.targetPersonId,
      },
      failOnStatusCode: false,
      timeout: 30_000,
      headers: {
        "x-qllaw-fixture-ownership": ownershipTag,
      },
    },
  );

  const creationRequestStatus = response.status();

  if (!response.ok()) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `draft-from-template failed for ${opts.formCode}: HTTP ${response.status()} ${body.slice(0, 500)}`,
    );
  }

  const body = (await response.json()) as {
    documentId?: string;
    templateCode?: string;
    isNew?: boolean;
    reused?: boolean;
    caseId?: string;
    reviewStatus?: string;
    documentTitle?: string;
  };

  if (!body.documentId || !/^\d+$/.test(body.documentId)) {
    throw new Error(
      `draft-from-template did not return a numeric documentId for ${opts.formCode}: ${JSON.stringify(body).slice(0, 500)}`,
    );
  }
  if (body.templateCode !== opts.formCode) {
    throw new Error(
      `draft-from-template returned templateCode=${body.templateCode} but requested ${opts.formCode} — aborting to prevent cross-fixture contamination.`,
    );
  }

  const fixture: PersistedDraftFixture = {
    runId: opts.runId,
    formCode: opts.formCode,
    templateId: null,
    templateCode: body.templateCode ?? opts.formCode,
    caseId: body.caseId ?? opts.caseId,
    documentId: body.documentId,
    documentRoute: `/documents/${body.documentId}`,
    createdAt,
    creationRequestStatus,
    creationResponseStatus: response.status(),
    auditEventExpected: true,
    cleanupSupported: false,
    cleanupStatus: "UNSUPPORTED",
    ownershipTag,
    reused: body.reused ?? false,
    isNew: body.isNew ?? false,
    reviewStatus: body.reviewStatus ?? "DRAFT",
    documentTitle: body.documentTitle ?? "",
  };

  return fixture;
}

/**
 * Load the render payload for a document and assert that templateCode matches.
 *
 * Returns the JSON payload from the API. Throws on status>=400 or mismatch.
 */
export async function loadRenderPayload(
  page: Page,
  fixture: PersistedDraftFixture,
): Promise<unknown> {
  const response = await page.request.get(
    `${API_BASE_URL}/documents/generated/${fixture.documentId}/render-payload`,
    { failOnStatusCode: false, timeout: 30_000 },
  );
  expect(response.status(), `loadRenderPayload ${fixture.formCode}`).toBe(200);
  const payload = await response.json();
  const p = payload as { template?: { templateCode?: string } };
  expect(
    p.template?.templateCode,
    `template identity for ${fixture.formCode}`,
  ).toBe(fixture.formCode);
  return payload;
}

/**
 * Save form-inputs through the real API endpoint. Returns the response status.
 */
export async function saveFormInputs(
  page: Page,
  fixture: PersistedDraftFixture,
  body: Record<string, unknown>,
): Promise<{ status: number; body: unknown }> {
  const response = await page.request.put(
    `${API_BASE_URL}/documents/generated/${fixture.documentId}/form-inputs`,
    {
      data: { ...body, updatedByName: "phase13b-fixture" },
      failOnStatusCode: false,
      timeout: 30_000,
    },
  );
  let parsed: unknown = null;
  try {
    parsed = await response.json();
  } catch {
    parsed = null;
  }
  return { status: response.status(), body: parsed };
}

/**
 * Render DOCX through the real API endpoint and return bytes + sha256.
 *
 * Phase 13b treats the response body as a binary blob and hashes it without
 * parsing DOCX content; render content validation lives in Phase 10
 * (cross-pipeline parity).
 */
export async function renderDocx(
  page: Page,
  fixture: PersistedDraftFixture,
  opts: { preview?: boolean } = {},
): Promise<{ status: number; bytes: Buffer; sha256: string; revision: number | null }> {
  const response = await page.request.post(
    `${API_BASE_URL}/documents/generated/${fixture.documentId}/render-docx`,
    {
      data: { previewMode: opts.preview ?? false },
      failOnStatusCode: false,
      timeout: 60_000,
    },
  );

  const status = response.status();
  if (status >= 400) {
    return { status, bytes: Buffer.alloc(0), sha256: "", revision: null };
  }

  const ab = await response.body();
  const buf = Buffer.from(ab);
  const { createHash } = await import("node:crypto");
  const sha256 = createHash("sha256").update(buf).digest("hex");
  // Phase 13b does NOT trust a server-side numeric revision field. We track
  // revision parity by audit-event count + DOCX package hash instead.
  return { status, bytes: buf, sha256, revision: null };
}

export const APP_URL = APP_BASE_URL;
export const API_URL = API_BASE_URL;