import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AppConfigService } from '../infrastructure/config/app-config.service';
import { CsrfCookieGuard } from './csrf-cookie.guard';

type RequestStubInput = {
  method?: string;
  headers?: Record<string, string | undefined>;
  cookies?: Record<string, string | undefined>;
};

function createContext(input: RequestStubInput = {}): ExecutionContext {
  const headers = new Map(
    Object.entries(input.headers ?? {}).map(([key, value]) => [
      key.toLowerCase(),
      value,
    ]),
  );
  const request = {
    method: input.method ?? 'POST',
    cookies: input.cookies ?? {},
    get: (name: string) => headers.get(name.toLowerCase()),
  };

  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

function createTunnelGuard(): CsrfCookieGuard {
  return new CsrfCookieGuard(
    new AppConfigService({
      NODE_ENV: 'development',
      TUNNEL_TEST: 'true',
      API_CORS_ORIGIN: 'https://app.test',
    }),
  );
}

describe('CsrfCookieGuard', () => {
  it('allows safe methods when SameSite=None tunnel mode is active', () => {
    const guard = createTunnelGuard();

    expect(
      guard.canActivate(
        createContext({
          method: 'GET',
          cookies: { qlv_session: 'session-token' },
        }),
      ),
    ).toBe(true);
  });

  it('allows unsafe cookie requests from the configured origin', () => {
    const guard = createTunnelGuard();

    expect(
      guard.canActivate(
        createContext({
          method: 'POST',
          headers: { origin: 'https://app.test' },
          cookies: { qlv_session: 'session-token' },
        }),
      ),
    ).toBe(true);
  });

  it('allows unsafe cookie requests with a matching Referer origin', () => {
    const guard = createTunnelGuard();

    expect(
      guard.canActivate(
        createContext({
          method: 'PATCH',
          headers: { referer: 'https://app.test/cases/123' },
          cookies: { qlv_session: 'session-token' },
        }),
      ),
    ).toBe(true);
  });

  it('rejects unsafe cookie requests without Origin or Referer', () => {
    const guard = createTunnelGuard();

    expect(() =>
      guard.canActivate(
        createContext({
          method: 'POST',
          cookies: { qlv_session: 'session-token' },
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('rejects unsafe cookie requests from an untrusted origin', () => {
    const guard = createTunnelGuard();

    expect(() =>
      guard.canActivate(
        createContext({
          method: 'DELETE',
          headers: { origin: 'https://evil.test' },
          cookies: { qlv_session: 'session-token' },
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('allows bearer-only unsafe requests without Origin or Referer', () => {
    const guard = createTunnelGuard();

    expect(
      guard.canActivate(
        createContext({
          method: 'POST',
          headers: { authorization: 'Bearer token' },
        }),
      ),
    ).toBe(true);
  });

  it('does not enforce CSRF when SameSite is not none', () => {
    const guard = new CsrfCookieGuard(
      new AppConfigService({
        AUTH_COOKIE_SAMESITE: 'lax',
      }),
    );

    expect(
      guard.canActivate(
        createContext({
          method: 'POST',
          cookies: { qlv_session: 'session-token' },
        }),
      ),
    ).toBe(true);
  });
});
