import { ConfigurationError } from './application-error';

export type CorsOriginPolicy = {
  allowAll: boolean;
  origins: string[];
};

export type CorsOriginCallback = (error: Error | null, allow?: boolean) => void;

const DEVELOPMENT_LOOPBACK_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://[::1]:3000',
];

/**
 * Parse the configured CORS allow-list into a deterministic policy.
 */
export function resolveCorsPolicy(
  configured: string | undefined,
  environment: string,
): CorsOriginPolicy {
  const raw = configured?.trim() ?? '';

  if (raw === '*') {
    if (environment === 'production') {
      throw new ConfigurationError(
        'PRODUCTION_CORS_WILDCARD',
        'API_CORS_ORIGIN="*" is forbidden in production.',
      );
    }
    return {
      allowAll: true,
      origins: [],
    };
  }

  if (!raw && environment === 'production') {
    throw new ConfigurationError(
      'PRODUCTION_CORS_REQUIRED',
      'WEB_ORIGIN or API_CORS_ORIGIN must be configured in production.',
    );
  }

  const origins = new Set(
    raw
      .split(',')
      .map((origin) => origin.trim())
      .map(normalizeConfiguredOrigin)
      .filter(Boolean),
  );

  if (environment !== 'production') {
    for (const origin of DEVELOPMENT_LOOPBACK_ORIGINS) {
      origins.add(origin);
    }
  }

  if (origins.size === 0 && environment !== 'production') {
    for (const origin of DEVELOPMENT_LOOPBACK_ORIGINS) {
      origins.add(origin);
    }
  }

  return {
    allowAll: false,
    origins: [...origins],
  };
}

/**
 * Build the callback expected by the Express CORS integration.
 */
export function createCorsOriginValidator(policy: CorsOriginPolicy) {
  const allowedOrigins = new Set(policy.origins);

  return (origin: string | undefined, callback: CorsOriginCallback): void => {
    if (policy.allowAll || !origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS origin is not allowed: ${origin}`), false);
  };
}

function normalizeConfiguredOrigin(origin: string): string {
  if (!origin) return '';

  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch (cause) {
    throw new ConfigurationError(
      'INVALID_CORS_ORIGIN',
      `API_CORS_ORIGIN contains invalid origin "${origin}". Use absolute http(s) origins only.`,
      cause,
    );
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ConfigurationError(
      'INVALID_CORS_ORIGIN',
      `API_CORS_ORIGIN contains invalid origin "${origin}". Use absolute http(s) origins only.`,
    );
  }

  if (parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new ConfigurationError(
      'INVALID_CORS_ORIGIN',
      `API_CORS_ORIGIN contains invalid origin "${origin}". Do not include paths, query strings, or fragments.`,
    );
  }

  return parsed.origin;
}
