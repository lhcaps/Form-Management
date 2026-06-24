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
 * When AUTH_COOKIE_SAMESITE=none (cross-origin session cookies), browsers
 * suppress the Origin/Referer headers on state-changing POST/PATCH/PUT/DELETE
 * requests. This guard enforces that at least one safe header is present and
 * originates from the allowlisted CORS origin.
 *
 * Safe-ignores OPTIONS (CORS preflight), public routes, and same-site contexts.
 */
@Injectable()
export class CsrfCookieGuard implements CanActivate {
  constructor(private readonly config: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    // Only check when sameSite is 'none' (cross-origin cookie mode)
    if (this.config.effectiveAuthCookieSameSite !== 'none') {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;

    // OPTIONS requests are always safe (CORS preflight handled by middleware)
    if (method === 'OPTIONS') return true;

    // Only guard state-changing methods
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) return true;

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

  private hasValidOriginHeader(
    request: Request,
    allowedOrigins: string[],
  ): boolean {
    const origin = request.get('origin');
    const referer = request.get('referer');

    // Same-site request with no Origin header — safe (browser same-origin POST)
    if (!origin && !referer) {
      return true;
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
    // allowed may be "https://example.com" or just "example.com"
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
