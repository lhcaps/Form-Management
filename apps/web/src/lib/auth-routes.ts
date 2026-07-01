export const SIGN_IN_PATH = "/sign-in";
export const SIGN_UP_PATH = "/sign-up";
export const LEGACY_LOGIN_PATH = "/login";

const AUTH_BYPASS_PATHS = [
  LEGACY_LOGIN_PATH,
  SIGN_IN_PATH,
  SIGN_UP_PATH,
  "/healthz",
  "/health",
  "/_next",
  "/favicon.ico",
] as const;

const PUBLIC_ASSET_PATTERN =
  /\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|txt|csv|docx?|xlsx?|zip|webmanifest)$/i;

function isAtOrUnderPath(pathname: string, basePath: string): boolean {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

export function isAuthBypassPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return AUTH_BYPASS_PATHS.some((basePath) => isAtOrUnderPath(pathname, basePath));
}

export function isPublicAssetPath(pathname: string | null | undefined): boolean {
  return typeof pathname === "string" && PUBLIC_ASSET_PATTERN.test(pathname);
}

export function normalizeInternalReturnPath(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  if (!trimmed || !trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }

  try {
    const parsed = new URL(trimmed, "http://quanlyvks.local");
    if (parsed.origin !== "http://quanlyvks.local") return null;
    if (isAuthBypassPath(parsed.pathname)) return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

export function buildSignInPath(returnPath?: string | null): string {
  const normalizedReturnPath = normalizeInternalReturnPath(returnPath);
  if (!normalizedReturnPath) return SIGN_IN_PATH;

  const params = new URLSearchParams();
  params.set("return_url", normalizedReturnPath);
  return `${SIGN_IN_PATH}?${params.toString()}`;
}

export function buildSignUpPath(returnPath?: string | null): string {
  const normalizedReturnPath = normalizeInternalReturnPath(returnPath);
  if (!normalizedReturnPath) return SIGN_UP_PATH;

  const params = new URLSearchParams();
  params.set("return_url", normalizedReturnPath);
  return `${SIGN_UP_PATH}?${params.toString()}`;
}

export function firstSearchParamValue(
  value: string | string[] | null | undefined,
): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function normalizeReturnPathParam(
  value: string | null | undefined,
  options: { currentOrigin?: string | null } = {},
): string | null {
  const internalPath = normalizeInternalReturnPath(value);
  if (internalPath) return internalPath;

  const currentOrigin = options.currentOrigin?.replace(/\/$/, "");
  if (!value || !currentOrigin) return null;

  try {
    const parsed = new URL(value);
    if (parsed.origin !== currentOrigin) return null;
    return normalizeInternalReturnPath(
      `${parsed.pathname}${parsed.search}${parsed.hash}`,
    );
  } catch {
    return null;
  }
}

export function returnPathFromSearchParams(
  searchParams: Pick<URLSearchParams, "get">,
  options: { currentOrigin?: string | null } = {},
): string | null {
  return (
    normalizeReturnPathParam(searchParams.get("return_url"), options) ??
    normalizeReturnPathParam(searchParams.get("returnUrl"), options) ??
    normalizeReturnPathParam(searchParams.get("redirect_url"), options)
  );
}
