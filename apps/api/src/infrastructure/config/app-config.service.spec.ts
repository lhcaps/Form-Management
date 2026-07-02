import { ConfigurationError } from '../../common/application-error';
import { AppConfigService } from './app-config.service';

const productionBaseEnv = {
  NODE_ENV: 'production',
  WEB_ORIGIN: 'https://app.test',
  AUTH_COOKIE_SECURE: 'true',
  SEED_ADMIN_PASSWORD: 'strong-password',
  CLERK_SECRET_KEY: 'test-clerk-secret-key-value',
  CLERK_WEBHOOK_SECRET: 'test-clerk-webhook-secret-value',
};

describe('AppConfigService', () => {
  it('parses comma-separated CORS origins and adds development loopback', () => {
    const config = new AppConfigService({
      NODE_ENV: 'development',
      API_CORS_ORIGIN: 'http://a.test, http://b.test, http://a.test',
    });

    expect(config.corsPolicy).toEqual({
      allowAll: false,
      origins: [
        'http://a.test',
        'http://b.test',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://[::1]:3000',
      ],
    });
  });

  it('normalizes the API global prefix', () => {
    const config = new AppConfigService({
      API_GLOBAL_PREFIX: '/api/v2/',
    });

    expect(config.apiGlobalPrefix).toBe('api/v2');
  });

  it('returns the configured repository-root override', () => {
    const config = new AppConfigService({
      REPO_ROOT: ' D:/workspace/quanlyvks ',
    });

    expect(config.repoRootOverride).toBe('D:/workspace/quanlyvks');
  });

  it('exposes validated auth cookie and session settings', () => {
    const config = new AppConfigService({
      AUTH_SESSION_COOKIE_NAME: ' custom_session ',
      AUTH_SESSION_TTL_DAYS: '30',
      AUTH_COOKIE_SECURE: 'true',
      AUTH_COOKIE_DOMAIN: ' .qlv.local ',
      AUTH_COOKIE_SAMESITE: 'strict',
    });

    expect(config.authSessionCookieName).toBe('custom_session');
    expect(config.authSessionTtlMs).toBe(30 * 24 * 60 * 60 * 1000);
    expect(config.authCookieSecure).toBe(true);
    expect(config.authCookieDomain).toBe('.qlv.local');
    expect(config.authCookieSameSite).toBe('strict');
  });

  it('rejects invalid auth session settings', () => {
    const invalidTtl = new AppConfigService({
      AUTH_SESSION_TTL_DAYS: '0',
    });
    const invalidSameSite = new AppConfigService({
      AUTH_COOKIE_SAMESITE: 'sometimes',
    });

    expect(() => invalidTtl.authSessionTtlMs).toThrow(
      'AUTH_SESSION_TTL_DAYS must be a positive integer',
    );
    expect(() => invalidSameSite.authCookieSameSite).toThrow(
      'AUTH_COOKIE_SAMESITE must be one of',
    );
  });

  it('normalizes the optional LibreOffice executable path', () => {
    const config = new AppConfigService({
      LIBREOFFICE_PATH: ' "C:\\Program Files\\LibreOffice\\soffice.exe" ',
    });

    expect(config.libreOfficePath).toBe(
      'C:\\Program Files\\LibreOffice\\soffice.exe',
    );
  });

  it('rejects wildcard CORS in production', () => {
    const config = new AppConfigService({
      ...productionBaseEnv,
      API_CORS_ORIGIN: '*',
    });

    expect(() => config.assertProductionSafety()).toThrow(
      new ConfigurationError(
        'PRODUCTION_CORS_WILDCARD',
        'API_CORS_ORIGIN="*" is forbidden in production.',
      ),
    );
  });

  it('rejects an insecure production auth cookie', () => {
    const config = new AppConfigService({
      ...productionBaseEnv,
      API_CORS_ORIGIN: 'https://app.test',
      AUTH_COOKIE_SECURE: 'false',
    });

    expect(() => config.assertProductionSafety()).toThrow(
      'AUTH_COOKIE_SECURE must be "true" in production.',
    );
  });

  it('rejects the default administrator password in production', () => {
    const config = new AppConfigService({
      ...productionBaseEnv,
      API_CORS_ORIGIN: 'https://app.test',
      SEED_ADMIN_PASSWORD: 'admin123',
    });

    expect(() => config.assertProductionSafety()).toThrow(
      'SEED_ADMIN_PASSWORD must be changed before production.',
    );
  });

  it('rejects TUNNEL_TEST in production', () => {
    const config = new AppConfigService({
      ...productionBaseEnv,
      TUNNEL_TEST: 'true',
    });

    expect(() => config.assertProductionSafety()).toThrow(
      'TUNNEL_TEST must be false in production.',
    );
  });

  it('requires WEB_ORIGIN and Clerk secrets in production', () => {
    const missingWebOrigin = new AppConfigService({
      ...productionBaseEnv,
      WEB_ORIGIN: undefined,
    });
    const missingClerkSecret = new AppConfigService({
      ...productionBaseEnv,
      CLERK_SECRET_KEY: undefined,
    });
    const missingWebhookSecret = new AppConfigService({
      ...productionBaseEnv,
      CLERK_WEBHOOK_SECRET: undefined,
    });
    const missingSeedPassword = new AppConfigService({
      ...productionBaseEnv,
      SEED_ADMIN_PASSWORD: undefined,
    });

    expect(() => missingWebOrigin.assertProductionSafety()).toThrow(
      'WEB_ORIGIN must be configured in production.',
    );
    expect(() => missingClerkSecret.assertProductionSafety()).toThrow(
      'CLERK_SECRET_KEY must be configured in production.',
    );
    expect(() => missingWebhookSecret.assertProductionSafety()).toThrow(
      'CLERK_WEBHOOK_SECRET must be configured in production.',
    );
    expect(() => missingSeedPassword.assertProductionSafety()).toThrow(
      'SEED_ADMIN_PASSWORD must be configured in production.',
    );
  });

  it('rejects production placeholder secrets and passwords', () => {
    const placeholderClerkSecret = new AppConfigService({
      ...productionBaseEnv,
      CLERK_SECRET_KEY: 'replace-with-clerk-secret-key',
    });
    const placeholderWebhookSecret = new AppConfigService({
      ...productionBaseEnv,
      CLERK_WEBHOOK_SECRET: '<set-in-secret-store>',
    });
    const placeholderSeedPassword = new AppConfigService({
      ...productionBaseEnv,
      SEED_ADMIN_PASSWORD: 'change-me',
    });

    expect(() => placeholderClerkSecret.assertProductionSafety()).toThrow(
      'CLERK_SECRET_KEY must be set to a real production value.',
    );
    expect(() => placeholderWebhookSecret.assertProductionSafety()).toThrow(
      'CLERK_WEBHOOK_SECRET must be set to a real production value.',
    );
    expect(() => placeholderSeedPassword.assertProductionSafety()).toThrow(
      'SEED_ADMIN_PASSWORD must be set to a real production value.',
    );
  });

  it('adds WEB_ORIGIN to the production CORS policy', () => {
    const config = new AppConfigService({
      ...productionBaseEnv,
      API_CORS_ORIGIN: 'https://ops.test',
    });

    expect(config.corsPolicy).toEqual({
      allowAll: false,
      origins: ['https://ops.test', 'https://app.test'],
    });
  });

  it('enables secure SameSite=None cookies in tunnel test mode only outside production', () => {
    const config = new AppConfigService({
      NODE_ENV: 'development',
      TUNNEL_TEST: 'true',
      API_CORS_ORIGIN: 'https://app.test',
    });

    expect(() => config.assertProductionSafety()).not.toThrow();
    expect(config.effectiveAuthCookieSecure).toBe(true);
    expect(config.effectiveAuthCookieSameSite).toBe('none');
  });

  it('rejects an invalid API port', () => {
    const config = new AppConfigService({
      API_PORT: 'not-a-port',
    });

    expect(() => config.apiPort).toThrow('API_PORT must be an integer');
  });

  it('defaults contract rendering to off with an empty allow-list', () => {
    const config = new AppConfigService({});

    expect(config.documentRendererMode).toBe('off');
    expect(config.documentRendererContractTemplates).toEqual([]);
  });

  it('normalizes contract renderer mode and template allow-list', () => {
    const config = new AppConfigService({
      DOCUMENT_RENDERER_MODE: ' ShAdOw ',
      DOCUMENT_RENDERER_CONTRACT_TEMPLATES: ' bm-001, BM-002, bm-001 ',
    });

    expect(config.documentRendererMode).toBe('shadow');
    expect(config.documentRendererContractTemplates).toEqual([
      'BM-001',
      'BM-002',
    ]);
  });

  it('rejects invalid contract renderer configuration', () => {
    const invalidMode = new AppConfigService({
      DOCUMENT_RENDERER_MODE: 'automatic',
    });
    const invalidTemplate = new AppConfigService({
      DOCUMENT_RENDERER_CONTRACT_TEMPLATES: 'BM-001, not a code',
    });

    expect(() => invalidMode.documentRendererMode).toThrow(
      'DOCUMENT_RENDERER_MODE must be one of',
    );
    expect(() => invalidTemplate.documentRendererContractTemplates).toThrow(
      'DOCUMENT_RENDERER_CONTRACT_TEMPLATES contains invalid code',
    );
  });
});
