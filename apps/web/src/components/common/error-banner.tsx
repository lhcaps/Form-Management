"use client";

/**
 * ErrorBanner — structured error display for QUANLYVKS.
 *
 * Designed to work with ApiError from api-client.ts:
 *   <ErrorBanner error={err} />
 *
 * Shows: title (optional), message, code, requestId.
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ApiError } from "@/lib/api-client";

interface ErrorBannerProps {
  error: unknown;
  title?: string;
  className?: string;
}

function ErrorBanner({ error, title, className }: ErrorBannerProps) {
  const isApiError = error instanceof ApiError;
  const isPlainString = typeof error === "string";

  const message = isApiError
    ? error.message
    : isPlainString
      ? error
      : error instanceof Error
        ? error.message
        : "Đã xảy ra lỗi không xác định.";

  const code = isApiError ? error.code : null;
  const requestId = isApiError ? error.requestId : null;

  return (
    <Alert variant="destructive" className={className}>
      <AlertTitle>{title ?? "Lỗi"}</AlertTitle>
      <AlertDescription>
        <p className="mt-1">{message}</p>
        {code && (
          <p className="mt-1 text-xs opacity-75">
            Mã lỗi: {code}
          </p>
        )}
        {requestId && (
          <p className="mt-0.5 text-xs opacity-50">
            Request ID: {requestId}
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}

export { ErrorBanner };
