import { Inject, Injectable, Optional } from '@nestjs/common';
import { ConfigurationError } from '../../common/application-error';
import {
  resolveCorsPolicy,
  type CorsOriginPolicy,
} from '../../common/cors-origin';

type Environment = Readonly<Record<string, string | undefined>>;
type AuthCookieSameSite = 'lax' | 'strict' | 'none';
export type DocumentRendererMode = 'off' | 'shadow' | 'active';

export const APP_ENV = Symbol('APP_ENV');

@Injectable()
export class AppConfigService {
  private readonly env: Environment;

  constructor(
    @Optional()
    @Inject(APP_ENV)
    env?: Environment,
  ) {
    this.env = env ?? process.env;
  }

  get environment(): string {
    return this.read('NODE_ENV') ?? 'development';
  }

  get isProduction(): boolean {
    return this.environment === 'production';
  }

  /** Enables cross-origin cookie (SameSite=None, Secure) for local tunnel tests.
   *  This mode is forbidden in production. */
  get tunnelTestMode(): boolean {
    return this.readBoolean('TUNNEL_TEST', false);
  }

  get apiPort(): number {
    const raw = this.read('API_PORT') ?? '3001';
    const port = Number(raw);
    if (!Number.isInteger(port) || port < 1 || port > 65_535) {
      throw new ConfigurationError(
        'INVALID_API_PORT',
        `API_PORT must be an integer between 1 and 65535; received "${raw}".`,
      );
    }
    return port;
  }

  get apiGlobalPrefix(): string {
    const prefix = (this.read('API_GLOBAL_PREFIX') ?? 'api/v1')
      .replace(/^\/+|\/+$/g, '')
      .trim();

    if (!prefix) {
      throw new ConfigurationError(
        'INVALID_API_GLOBAL_PREFIX',
        'API_GLOBAL_PREFIX must not be empty.',
      );
    }
    return prefix;
  }

  get corsPolicy(): CorsOriginPolicy {
    const configuredCorsOrigin = this.read('API_CORS_ORIGIN');
    const configured =
      configuredCorsOrigin?.trim() === '*'
        ? configuredCorsOrigin
        : [configuredCorsOrigin, this.webOrigin].filter(Boolean).join(',');

    return resolveCorsPolicy(
      configured || (this.isProduction ? undefined : 'http://localhost:3000'),
      this.environment,
    );
  }

  private get webOrigin(): string | undefined {
    return this.read('WEB_ORIGIN');
  }

  get repoRootOverride(): string | undefined {
    return this.read('REPO_ROOT');
  }

  get storageRoot(): string {
    return this.read('STORAGE_ROOT') ?? './storage';
  }

  get isSwaggerEnabled(): boolean {
    return !this.isProduction || this.readBoolean('SWAGGER_ENABLED', false);
  }

  get authCookieSecure(): boolean {
    return this.readBoolean('AUTH_COOKIE_SECURE', false);
  }

  get authSessionCookieName(): string {
    return this.read('AUTH_SESSION_COOKIE_NAME') ?? 'qlv_session';
  }

  get authSessionTtlMs(): number {
    const raw = this.read('AUTH_SESSION_TTL_DAYS') ?? '14';
    const days = Number(raw);
    if (!Number.isInteger(days) || days < 1) {
      throw new ConfigurationError(
        'INVALID_AUTH_SESSION_TTL',
        `AUTH_SESSION_TTL_DAYS must be a positive integer; received "${raw}".`,
      );
    }
    return days * 24 * 60 * 60 * 1000;
  }

  get authCookieDomain(): string | undefined {
    return this.read('AUTH_COOKIE_DOMAIN');
  }

  get authCookieSameSite(): AuthCookieSameSite {
    const value = (this.read('AUTH_COOKIE_SAMESITE') ?? 'lax').toLowerCase();
    if (value === 'lax' || value === 'strict' || value === 'none') {
      return value;
    }
    throw new ConfigurationError(
      'INVALID_AUTH_COOKIE_SAMESITE',
      `AUTH_COOKIE_SAMESITE must be one of "lax", "strict", or "none"; received "${value}".`,
    );
  }

  get clerkSecretKey(): string | undefined {
    return this.read('CLERK_SECRET_KEY');
  }

  get clerkWebhookSecret(): string | undefined {
    return this.read('CLERK_WEBHOOK_SECRET');
  }

  get clerkJwtAuthorizedParties(): readonly string[] {
    const raw = this.read('CLERK_AUTHORIZED_PARTIES');
    if (!raw) return [];
    return raw
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }

  get libreOfficePath(): string | undefined {
    return this.read('LIBREOFFICE_PATH')?.replace(/^"|"$/g, '');
  }

  get documentRendererMode(): DocumentRendererMode {
    const value = (this.read('DOCUMENT_RENDERER_MODE') ?? 'off').toLowerCase();

    if (value === 'off' || value === 'shadow' || value === 'active') {
      return value;
    }

    throw new ConfigurationError(
      'INVALID_DOCUMENT_RENDERER_MODE',
      `DOCUMENT_RENDERER_MODE must be one of "off", "shadow", or "active"; received "${value}".`,
    );
  }

  get documentRendererContractTemplates(): readonly string[] {
    const raw = this.read('DOCUMENT_RENDERER_CONTRACT_TEMPLATES');
    if (!raw) return [];

    const templates = [
      ...new Set(
        raw
          .split(',')
          .map((value) => value.trim().toUpperCase())
          .filter(Boolean),
      ),
    ];

    const invalidCode = templates.find(
      (value) => !/^[A-Z0-9][A-Z0-9_-]*$/u.test(value),
    );

    if (invalidCode) {
      throw new ConfigurationError(
        'INVALID_DOCUMENT_RENDERER_CONTRACT_TEMPLATE',
        `DOCUMENT_RENDERER_CONTRACT_TEMPLATES contains invalid code "${invalidCode}".`,
      );
    }

    return templates;
  }

  assertProductionSafety(): void {
    if (this.isProduction && this.tunnelTestMode) {
      throw new ConfigurationError(
        'TUNNEL_TEST_FORBIDDEN_IN_PRODUCTION',
        'TUNNEL_TEST must be false in production.',
      );
    }

    if (!this.isProduction) {
      if (this.tunnelTestMode && this.corsPolicy.allowAll) {
        throw new ConfigurationError(
          'TUNNEL_TEST_CORS_WILDCARD',
          'API_CORS_ORIGIN="*" is forbidden when TUNNEL_TEST=true.',
        );
      }
      return;
    }

    this.requireProductionEnv('WEB_ORIGIN');
    this.requireProductionEnv('CLERK_SECRET_KEY');
    this.requireProductionEnv('CLERK_WEBHOOK_SECRET');
    this.requireProductionEnv('SEED_ADMIN_PASSWORD');

    if (!this.effectiveAuthCookieSecure) {
      throw new ConfigurationError(
        'INSECURE_PRODUCTION_COOKIE',
        'AUTH_COOKIE_SECURE must be "true" in production.',
      );
    }

    this.rejectProductionPlaceholder(
      'CLERK_SECRET_KEY',
      this.read('CLERK_SECRET_KEY'),
    );
    this.rejectProductionPlaceholder(
      'CLERK_WEBHOOK_SECRET',
      this.read('CLERK_WEBHOOK_SECRET'),
    );
    this.rejectProductionPlaceholder(
      'SEED_ADMIN_PASSWORD',
      this.read('SEED_ADMIN_PASSWORD'),
    );

    if ((this.read('SEED_ADMIN_PASSWORD') ?? '') === 'admin123') {
      throw new ConfigurationError(
        'DEFAULT_PRODUCTION_ADMIN_PASSWORD',
        'SEED_ADMIN_PASSWORD must be changed before production.',
      );
    }

    if (this.corsPolicy.allowAll) {
      throw new ConfigurationError(
        'PRODUCTION_CORS_WILDCARD',
        'API_CORS_ORIGIN="*" is forbidden in production.',
      );
    }
  }

  /** Effective cookie Secure flag.
   *  Defaults to true when tunnelTestMode is active, so cross-origin cookies work
   *  without needing to set AUTH_COOKIE_SECURE explicitly. */
  get effectiveAuthCookieSecure(): boolean {
    if (this.tunnelTestMode) return true;
    return this.authCookieSecure;
  }

  /** Effective cookie SameSite value.
   *  Defaults to "none" when tunnelTestMode is active for cross-origin browser
   *  compatibility with Cloudflare Tunnel URLs. Falls back to configured value. */
  get effectiveAuthCookieSameSite(): AuthCookieSameSite {
    if (this.tunnelTestMode) return 'none';
    return this.authCookieSameSite;
  }

  private read(key: string): string | undefined {
    const value = this.env[key]?.trim();
    return value ? value : undefined;
  }

  private requireProductionEnv(key: string): string {
    const value = this.read(key);
    if (!value) {
      throw new ConfigurationError(
        'MISSING_PRODUCTION_ENV',
        `${key} must be configured in production.`,
      );
    }
    return value;
  }

  private rejectProductionPlaceholder(
    key: string,
    value: string | undefined,
  ): void {
    if (!value) return;

    const normalized = value.toLowerCase();
    const isPlaceholder =
      normalized === 'change-me' ||
      normalized === 'changeme' ||
      normalized.includes('replace-with') ||
      normalized.includes('placeholder') ||
      /^<.+>$/u.test(value);

    if (isPlaceholder) {
      throw new ConfigurationError(
        'PLACEHOLDER_PRODUCTION_ENV',
        `${key} must be set to a real production value.`,
      );
    }
  }

  private readBoolean(key: string, fallback: boolean): boolean {
    const value = this.read(key);
    if (value === undefined) return fallback;
    return value === '1' || value.toLowerCase() === 'true';
  }
}
