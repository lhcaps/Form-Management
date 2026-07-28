import type { Request, Response } from 'express';
import {
  buildRequestCompletionRecord,
  resolveRequestRouteTemplate,
  type RequestWithContext,
} from './request-context.middleware';

describe('request completion telemetry', () => {
  it('uses the Express route template and never the raw URL', () => {
    const request = {
      method: 'GET',
      originalUrl: '/api/v1/cases/123?token=secret',
      route: { path: '/api/v1/cases/:caseId' },
      requestId: 'request-123',
    } as unknown as RequestWithContext;

    expect(resolveRequestRouteTemplate(request)).toBe('/api/v1/cases/:caseId');
    expect(
      resolveRequestRouteTemplate({ originalUrl: '/private/value' } as Request),
    ).toBe('<unmatched>');
  });

  it('contains only the approved completion fields', () => {
    const request = {
      method: 'POST',
      route: { path: '/api/v1/documents/:id' },
      requestId: 'request-456',
      headers: { authorization: 'Bearer do-not-log' },
      body: { secret: 'do-not-log' },
    } as unknown as RequestWithContext;
    const response = { statusCode: 201 } as Response;

    expect(buildRequestCompletionRecord(request, response, 12.3456)).toEqual({
      event: 'http_request_completed',
      requestId: 'request-456',
      method: 'POST',
      route: '/api/v1/documents/:id',
      status: 201,
      durationMs: 12.346,
    });
  });
});
