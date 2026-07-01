/**
 * Thin bridge between api-client's token provider and the file download helper.
 * This avoids a circular import: api-client sets the provider, file-download
 * reads it via the same mechanism without pulling in the full api-client module.
 */

import type { ApiAuthTokenProvider } from "./api-client";

let _provider: ApiAuthTokenProvider | null = null;

/**
 * Register the token provider (called by api-client on mount).
 * @internal — do not call directly.
 */
export function setAuthTokenProvider(provider: ApiAuthTokenProvider | null): void {
  _provider = provider;
}

/**
 * Resolve the current Clerk Bearer token.
 * Returns null if no provider is registered or resolution fails.
 */
export async function getApiAuthToken(): Promise<string | null> {
  if (!_provider) return null;
  try {
    const token = await _provider();
    return token?.trim() || null;
  } catch {
    return null;
  }
}
