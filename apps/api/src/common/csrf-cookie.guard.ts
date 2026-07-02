import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { AppConfigService } from '../infrastructure/config/app-config.service';

/**
 * CSRF guard for cross-origin cookie auth.
 *
 * When AUTH_COOKIE_SAMESITE=none, unsafe cookie-authenticated requests must
 * carry an Origin or Referer that matches the configured frontend origin.
 *
 * Safe-ignores OPTIONS, safe methods, and bearer-only API requests that do not
 * carry the session cookie.
 */
@Injectable()
export class CsrfCookieGuard implements CanActivate {
  constructor(private readonly config: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.config.effectiveAuthCookieSameSite !== 'none') {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;

    if (method === 'OPTIONS') return true;
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) return true;
    if (!this.hasSessionCookie(request)) return true;

    const allowedOrigins = this.getAllowedOrigins(request);

    if (!this.hasValidOriginHeader(request, allowedOrigins)) {
      throw new ForbiddenException(
        'CSRF validation failed: request Origin/Referer does not match allowed origin. ' +
          'Ensure the request is sent from the configured frontend origin.',
      );
    }

    return true;
  }

  private getAllowedOrigins(request: Request): string[] {
    const policy = this.config.corsPolicy;
    if (policy.allowAll) {
      const host = this.normalizeHost(
        request.get('origin') ?? request.get('host') ?? '',
      );
      return [host];
    }
    return policy.origins;
  }

  private hasSessionCookie(request: Request): boolean {
    const cookieName = this.config.authSessionCookieName;
    const cookies = request.cookies as Record<string, unknown> | undefined;
    if (typeof cookies?.[cookieName] === 'string') {
      return true;
    }

    const cookieHeader = request.get('cookie');
    if (!cookieHeader) return false;

    return cookieHeader
      .split(';')
      .map((cookie) => cookie.trim().split('=')[0])
      .some((name) => name === cookieName);
  }

  private hasValidOriginHeader(
    request: Request,
    allowedOrigins: string[],
  ): boolean {
    const origin = request.get('origin');
    const referer = request.get('referer');

    if (!origin && !referer) {
      return false;
    }

    if (origin) {
      const normalized = this.normalizeOrigin(origin);
      if (
        allowedOrigins.some((allowed) => this.matchOrigin(normalized, allowed))
      ) {
        return true;
      }
    }

    if (referer) {
      const normalized = this.normalizeOrigin(
        this.extractOriginFromReferer(referer),
      );
      if (
        normalized &&
        allowedOrigins.some((allowed) => this.matchOrigin(normalized, allowed))
      ) {
        return true;
      }
    }

    return false;
  }

  private normalizeHost(value: string): string {
    return value
      .trim()
      .replace(/^https?:\/\//i, '')
      .replace(/\/.*$/, '')
      .toLowerCase();
  }

  private normalizeOrigin(value: string): string {
    return value.trim().toLowerCase();
  }

  private extractOriginFromReferer(referer: string): string {
    try {
      const url = new URL(referer);
      return url.origin;
    } catch {
      return referer.replace(/\/.*$/, '');
    }
  }

  private matchOrigin(origin: string, allowed: string): boolean {
    const normalizedAllowed = allowed
      .replace(/^https?:\/\//i, '')
      .replace(/\/.*$/, '');
    return (
      origin === normalizedAllowed ||
      origin === `https://${normalizedAllowed}` ||
      origin === `http://${normalizedAllowed}`
    );
  }
}
