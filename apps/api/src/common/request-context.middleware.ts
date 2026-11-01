import { randomUUID } from 'node:crypto';
import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';

const VALID_REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;
const completionLogger = new Logger('HttpRequest');

export type RequestWithContext = Request & {
  requestId?: string;
};

export type RequestCompletionRecord = {
  event: 'http_request_completed';
  requestId: string;
  method: string;
  route: string;
  status: number;
  durationMs: number;
};

function readIncomingRequestId(request: Request): string | undefined {
  const value = request.headers[REQUEST_ID_HEADER];
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && VALID_REQUEST_ID.test(candidate) ? candidate : undefined;
}

export function resolveRequestRouteTemplate(request: Request): string {
  const route = (request as Request & { route?: { path?: unknown } }).route
    ?.path;
  return typeof route === 'string' && route ? route : '<unmatched>';
}

export function buildRequestCompletionRecord(
  request: RequestWithContext,
  response: Response,
  durationMs: number,
): RequestCompletionRecord {
  return {
    event: 'http_request_completed',
    requestId: request.requestId ?? 'unavailable',
    method: request.method ?? 'UNKNOWN',
    route: resolveRequestRouteTemplate(request),
    status: response.statusCode,
    durationMs: Math.round(Math.max(0, durationMs) * 1000) / 1000,
  };
}

/**
 * Attach a safe correlation ID to every HTTP request and response.
 */
export function requestContextMiddleware(
  request: RequestWithContext,
  response: Response,
  next: NextFunction,
): void {
  const startedAt = process.hrtime.bigint();
  const requestId = readIncomingRequestId(request) ?? randomUUID();
  request.requestId = requestId;
  response.setHeader(REQUEST_ID_HEADER, requestId);

  let logged = false;
  const logCompletion = (): void => {
    if (logged) return;
    logged = true;
    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    completionLogger.log(
      JSON.stringify(
        buildRequestCompletionRecord(request, response, elapsedMs),
      ),
    );
  };
  response.once('finish', logCompletion);
  response.once('close', logCompletion);
  next();
}
