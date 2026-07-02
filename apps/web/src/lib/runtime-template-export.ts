import { getApiBaseUrl, withApiFetchAuthDefaults } from "./api-client";

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

export type RuntimeTemplateRenderMetadata = {
  documentId: string | null;
  fileId: string | null;
  fileName: string;
  fileSizeBytes: number;
  fileFormat: "DOCX";
  previewUrl: string | null;
  downloadUrl: string;
  warnings: string[];
  missingRequired: string[];
};

export function buildRuntimeTemplateDocxPath(templateCode: string): string {
  return `/forms/runtime/${encodeURIComponent(templateCode.trim().toUpperCase())}/render-docx`;
}

export function buildRuntimeTemplateMetadataPath(templateCode: string): string {
  return `/forms/runtime/${encodeURIComponent(templateCode.trim().toUpperCase())}/render-docx/metadata`;
}

/**
 * Render a runtime template and return metadata (no auto-download).
 * Use this for preview-first UX where user reviews before downloading.
 */
export async function renderRuntimeTemplateDocx(
  templateCode: string,
  data: Record<string, unknown>,
): Promise<RuntimeTemplateRenderMetadata> {
  const path = buildRuntimeTemplateMetadataPath(templateCode);
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
    let message = `Render DOCX thất bại (HTTP ${response.status}).`;
    try {
      const json = await response.clone().json();
      if (json?.message) message = String(json.message);
    } catch {
      // Keep fallback message for binary or empty errors.
    }
    throw new Error(message);
  }

  // Guard: metadata endpoint MUST return JSON, not DOCX blob.
  const contentType = response.headers.get("Content-Type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      "Expected metadata JSON but received DOCX response. " +
        `Content-Type was "${contentType}". Check backend /render-docx/metadata endpoint.`,
    );
  }

  return response.json() as Promise<RuntimeTemplateRenderMetadata>;
}

/**
 * Download a DOCX file from a given URL (for runtime templates).
 * Uses the same path as render but fetches as blob for download.
 */
export async function downloadRuntimeTemplateDocx(
  templateCode: string,
  data: Record<string, unknown>,
): Promise<void> {
  const path = buildRuntimeTemplateDocxPath(templateCode);
  const [apiInput, apiInit] = await withApiFetchAuthDefaults(
    `${getApiBaseUrl()}${path}`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        Accept:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ data }),
    },
  );

  const response = await fetch(apiInput, apiInit);
  if (!response.ok) {
    let message = `Xuất DOCX thất bại (HTTP ${response.status}).`;
    try {
      const json = await response.clone().json();
      if (json?.message) message = String(json.message);
    } catch {
      // Keep fallback message for binary or empty errors.
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const filename = parseFilenameFromDisposition(
    response.headers.get("Content-Disposition"),
    `${templateCode.trim().toUpperCase()}.docx`,
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
