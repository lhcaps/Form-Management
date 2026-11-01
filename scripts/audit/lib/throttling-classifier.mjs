function asFiniteStatus(value) {
  const status = Number(value);
  return Number.isFinite(status) ? status : null;
}

function structuredText(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value !== "object") return String(value);
  return [value.name, value.code, value.error, value.message, value.type]
    .filter(Boolean)
    .join(" ");
}

export function classifyThrottlingEvidence(evidence = {}) {
  const structuredError = evidence.structuredError ?? null;
  const httpStatus = asFiniteStatus(
    evidence.httpStatus ?? structuredError?.status ?? structuredError?.statusCode,
  );
  const errorMessage = `${evidence.errorMessage ?? ""}`;
  const explicitText = `${structuredText(structuredError)} ${errorMessage}`.trim();
  const retryAfter = evidence.retryAfter ?? evidence.responseHeaders?.["retry-after"] ?? null;

  const explicitRateLimit =
    httpStatus === 429 ||
    /\bThrottlerException\b/i.test(explicitText) ||
    /\bToo Many Requests\b/i.test(explicitText) ||
    /\brate[_ -]?limit(?:ed|ing| exceeded)?\b/i.test(explicitText) ||
    /\bHTTP(?:_ERROR)?(?:\s+(?:status|code))?\s*[:=]?\s*429\b/i.test(explicitText) ||
    /\bstatus(?:Code)?\s*[:=]?\s*429\b/i.test(explicitText);

  if (explicitRateLimit) {
    return {
      classification: "THROTTLED_TRANSIENT",
      reason: httpStatus === 429
        ? "explicit HTTP 429"
        : "explicit structured rate-limit signal",
      httpStatus,
      retryAfter,
    };
  }

  if (
    /\b(?:timeout|timed out)\b|element\(s\) not found/i.test(errorMessage) ||
    (typeof evidence.durationMs === "number" && evidence.durationMs > 15_000)
  ) {
    return {
      classification: "TIMING_ONLY_UNVERIFIED",
      reason: "timing or timeout evidence is not proof of throttling",
      httpStatus,
      retryAfter,
    };
  }

  if (/ERR_INSUFFICIENT_RESOURCES|ECONNRESET|net::ERR_|net error|net::ABORTED/i.test(errorMessage)) {
    return {
      classification: "NETWORK_TRANSIENT_UNVERIFIED",
      reason: "generic network failure is not proof of throttling",
      httpStatus,
      retryAfter,
    };
  }

  return {
    classification: "UNVERIFIED",
    reason: "no explicit structured rate-limit evidence",
    httpStatus,
    retryAfter,
  };
}

export function classifyAuthenticatedThrottlingEvidence(evidence = {}) {
  const httpStatus = asFiniteStatus(evidence.httpStatus);
  const retryAfter =
    evidence.retryAfter ?? evidence.responseHeaders?.["retry-after"] ?? null;

  if (evidence.authValid !== true || evidence.collectorComplete !== true) {
    return {
      classification: "UNVERIFIED",
      reason: "authenticated collection did not complete",
      httpStatus,
      retryAfter,
    };
  }

  const signal = classifyThrottlingEvidence(evidence);
  if (signal.classification === "THROTTLED_TRANSIENT") {
    return {
      classification: "THROTTLED_VERIFIED",
      reason: signal.reason,
      httpStatus: signal.httpStatus,
      retryAfter: signal.retryAfter,
    };
  }

  if (httpStatus === 200) {
    return {
      classification: "NOT_THROTTLED_VERIFIED",
      reason: "authenticated collector completed with HTTP 200 and no explicit rate-limit signal",
      httpStatus,
      retryAfter,
    };
  }

  return {
    classification: "UNVERIFIED",
    reason: "authenticated response was neither HTTP 200 nor explicit rate-limit evidence",
    httpStatus,
    retryAfter,
  };
}
