/**
 * Authenticated file download helper.
 *
 * Problem: raw <a href>, window.open(), and location.href bypass the
 * Authorization: Bearer token bridge — causing 401 on protected endpoints.
 *
 * Solution: fetch with Authorization header → blob → object URL → trigger download.
 * Does NOT append token to query string.
 */

import { getApiBaseUrl } from "./api-client";

/**
 * Resolve the current Clerk Bearer token (same logic as api-client's provider).
 * Re-exported here so download callers don't need to duplicate the resolution.
 */
export async function getAuthToken(): Promise<string | null> {
  const { getApiAuthToken } = await import("./api-client-auth-token");
  return getApiAuthToken();
}

function parseFilenameFromDisposition(
  contentDisposition: string | null,
  fallback: string,
): string {
  if (!contentDisposition) return fallback;
  const match = contentDisposition.match(/filename[^;=\n]*=(?:(\\?['"])(.*?)\1|([^;\n]*))/i);
  if (match?.[2]) return match[2].trim();
  if (match?.[3]) return match[3].trim();
  return fallback;
}

export type DownloadOptions = {
  /**
   * Optional explicit Authorization header value. If not provided,
   * the Clerk Bearer token is resolved automatically.
   */
  authToken?: string | null;
  /**
   * Custom filename. If not provided, parsed from Content-Disposition.
   */
  filename?: string;
  /**
   * Additional fetch headers. If Authorization is set here, it is preserved.
   */
  headers?: Record<string, string>;
};

export class DownloadError extends Error {
  readonly status: number;
  readonly isAuthError: boolean;

  constructor(message: string, status: number) {
    super(message);
    this.name = "DownloadError";
    this.status = status;
    this.isAuthError = status === 401 || status === 403;
  }
}

/**
 * Download a file from a protected API endpoint using authenticated fetch.
 *
 * - Attaches Clerk Bearer token via Authorization header (unless authToken is passed).
 * - Does NOT append token to URL query string.
 * - Preserves any explicit Authorization header passed in options.headers.
 * - Reads filename from Content-Disposition response header.
 * - Triggers <a download> for browser-native save-as behavior.
 * - Revokes object URL after trigger.
 *
 * @param url      Absolute or path-relative URL of the download endpoint.
 * @param options  Optional auth token, filename, or extra headers.
 */
export async function downloadFile(
  url: string,
  options: DownloadOptions = {},
): Promise<void> {
  const { authToken: explicitToken, filename: customFilename, headers: extraHeaders } = options;

  const resolvedUrl = url.startsWith("http")
    ? url
    : `${getApiBaseUrl()}${url.startsWith("/") ? url : `/${url}`}`;

  const resolvedToken = explicitToken ?? (await getAuthToken());

  const headers: Record<string, string> = {
    ...extraHeaders,
  };

  // Attach Bearer token only if not already provided via extraHeaders
  if (!headers["Authorization"] && resolvedToken) {
    headers["Authorization"] = `Bearer ${resolvedToken}`;
  }

  let response: Response;
  try {
    response = await fetch(resolvedUrl, {
      method: "GET",
      headers,
      credentials: "include",
    });
  } catch (networkError) {
    throw new DownloadError(
      "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.",
      0,
    );
  }

  if (!response.ok) {
    let message = `Tải file thất bại (HTTP ${response.status}).`;

    // Try to parse structured error from JSON body
    try {
      const json = await response.clone().json();
      if (json?.message) {
        message = json.message;
      }
    } catch {
      // Not JSON or empty — use default message
    }

    throw new DownloadError(message, response.status);
  }

  const blob = await response.blob();

  const contentDisposition = response.headers.get("Content-Disposition");
  const inferredFilename =
    customFilename ??
    parseFilenameFromDisposition(contentDisposition, "download");

  const objectUrl = URL.createObjectURL(blob);

  try {
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = inferredFilename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    // Small delay before revoke + remove to ensure browser starts download
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    }, 100);
  } catch {
    URL.revokeObjectURL(objectUrl);
    throw new DownloadError(
      "Trình duyệt không hỗ trợ tải file tự động. Hãy thử tải thủ công.",
      0,
    );
  }
}
