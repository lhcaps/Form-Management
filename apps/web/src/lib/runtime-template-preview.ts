import { getApiBaseUrl, withApiFetchAuthDefaults } from "./api-client";

export interface RuntimePreviewSessionResponse {
  sessionId: string;
  templateCode: string;
  fileName: string;
  fileSizeBytes: number;
  fileFormat: "DOCX";
  docxDownloadUrl: string;
  pdfPreviewUrl: string | null;
  audit: {
    status: "PASS" | "WARN" | "FAIL";
    summary: {
      total: number;
      pass: number;
      warning: number;
      fail: number;
      notDetectable: number;
      notApplicable: number;
    };
    findings: Array<{
      severity: "INFO" | "WARN" | "FAIL";
      code: string;
      message: string;
      location: string;
      recommendation?: string;
      sourceCheckId?: string;
    }>;
  };
  warnings: string[];
  missingRequired: unknown[];
  expiresAt: string;
  persisted: false;
}

function parseFilenameFromDisposition(
  contentDisposition: string | null,
  fallback: string,
): string {
  if (!contentDisposition) return fallback;
  const match = contentDisposition.match(
    /filename[^;=\n]*=(?:(\\?['"])(.*?)\1|([^;\n]*))/i,
  );
  if (match?.[2]) return match[2].trim();
  if (match?.[3]) return match[3].trim();
  return fallback;
}

/**
 * Create a runtime preview session for a template.
 * Returns session metadata with DOCX download URL.
 * Does NOT auto-download.
 */
export async function createRuntimePreviewSession(
  templateCode: string,
  data: Record<string, unknown>,
): Promise<RuntimePreviewSessionResponse> {
  const path = `/forms/runtime/${encodeURIComponent(templateCode.trim().toUpperCase())}/preview-session`;
  const url = `${getApiBaseUrl()}${path}`;
  const [apiInput, apiInit] = await withApiFetchAuthDefaults(url, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({ data }),
  });

  const response = await fetch(apiInput, apiInit);
  if (!response.ok) {
    let message = `Tao preview session that bai (HTTP ${response.status}).`;
    try {
      const json = await response.clone().json();
      if (json?.message) message = String(json.message);
    } catch {
      // Keep fallback message
    }
    throw new Error(message);
  }

  // Guard: endpoint MUST return JSON, not DOCX blob.
  const contentType = response.headers.get("Content-Type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      "Expected JSON response but received non-JSON Content-Type. " +
        `Content-Type was "${contentType}". Check backend preview-session endpoint.`,
    );
  }

  const result = await response.json() as RuntimePreviewSessionResponse;

  // Guard: persisted must be false for runtime preview sessions
  if (result.persisted !== false) {
    throw new Error("Unexpected: runtime preview session should have persisted=false.");
  }

  return result;
}

/**
 * Download DOCX from a runtime preview session using the session's download URL.
 * Does NOT re-render; downloads the already-rendered session artifact.
 */
export async function downloadRuntimePreviewDocxByUrl(
  docxDownloadUrl: string,
  fallbackFileName: string,
): Promise<void> {
  // docxDownloadUrl is an absolute path from the backend (e.g. "/api/v1/forms/...").
  // getApiBaseUrl() already includes the /api/v1 prefix, so we only prepend
  // the origin if docxDownloadUrl is a path (starts with "/" or "/api/v1").
  const url = docxDownloadUrl.startsWith("/")
    ? `${new URL(getApiBaseUrl()).origin}${docxDownloadUrl}`
    : `${getApiBaseUrl()}${docxDownloadUrl}`;
  const [apiInput, apiInit] = await withApiFetchAuthDefaults(url, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
  });

  const response = await fetch(apiInput, apiInit);
  if (!response.ok) {
    let message = `Tai DOCX that bai (HTTP ${response.status}).`;
    try {
      const json = await response.clone().json();
      if (json?.message) message = String(json.message);
    } catch {
      // Keep fallback message
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const filename = parseFilenameFromDisposition(
    response.headers.get("Content-Disposition"),
    fallbackFileName,
  );
  const objectUrl = URL.createObjectURL(blob);

  try {
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    }, 100);
  } catch {
    URL.revokeObjectURL(objectUrl);
    throw new Error("Trinh duyet khong ho tro tai file tu dong.");
  }
}

/**
 * Download DOCX from a runtime preview session using sessionId.
 */
export async function downloadRuntimePreviewDocx(
  sessionId: string,
  fallbackFileName: string,
): Promise<void> {
  return downloadRuntimePreviewDocxByUrl(
    `/api/v1/forms/runtime/preview-sessions/${sessionId}/docx`,
    fallbackFileName,
  );
}

/**
 * Get the PDF preview URL for a runtime preview session.
 * Returns null if PDF is not available.
 */
export function getRuntimePreviewPdfUrl(sessionId: string): string | null {
  return `/api/v1/forms/runtime/preview-sessions/${sessionId}/pdf`;
}
