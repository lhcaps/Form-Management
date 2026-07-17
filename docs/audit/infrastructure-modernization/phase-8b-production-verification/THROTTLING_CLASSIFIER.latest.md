# Phase 8B - Nine-form throttling classification

## Verdict

`UNVERIFIED` for all nine forms. Explicit HTTP 429 evidence: `0`.

## Forms and current evidence

| Form | Source/render smoke | Browser route | Recorded duration | Accepted throttling class |
| --- | --- | --- | ---: | --- |
| BM-118 | PASS | HTTP 200 | `1,356 ms` | UNVERIFIED |
| BM-119 | PASS | HTTP 200 | `1,341 ms` | UNVERIFIED |
| BM-120 | PASS | HTTP 200 | `1,360 ms` | UNVERIFIED |
| BM-151 | PASS | HTTP 200 | `1,300 ms` | UNVERIFIED |
| BM-152 | PASS | HTTP 200 | `1,341 ms` | UNVERIFIED |
| BM-153 | PASS | HTTP 200 | `1,377 ms` | UNVERIFIED |
| BM-185 | PASS | HTTP 200 | `1,311 ms` | UNVERIFIED |
| BM-186 | PASS | HTTP 200 | `1,286 ms` | UNVERIFIED |
| BM-187 | PASS | HTTP 200 | `1,306 ms` | UNVERIFIED |

The canonical browser artifact labels each legacy main-run failure `THROTTLED_TRANSIENT`, but contains no HTTP status, no explicit `429`, no `Retry-After`, no `ThrottlerException`, no structured rate-limit payload, and no preserved raw main error supporting that label. Timing alone is not accepted as throttling evidence.

## Reproduced classifier defect and fix

The collector previously promoted generic `HTTP_ERROR`, `ERR_INSUFFICIENT_RESOURCES`, `ECONNRESET`, or an element-not-found duration above 15 seconds to `THROTTLED_TRANSIENT`. This was structurally reproducible and could mislabel generic network/timing failures.

- Pre-edit backup SHA-256: `c9e705196b5b995de4b4af50f0d5899e8cd2fb9aa2fa080470a51ce72a818f8b`.
- New guarded helper accepts throttling only from explicit status `429`, `ThrottlerException`, `Too Many Requests`, or explicit rate-limit text.
- Timing-only failures become `TIMING_ONLY_UNVERIFIED`.
- Generic network failures become `NETWORK_TRANSIENT_UNVERIFIED`.
- Focused tests: `3/3`, exit `0`.

## Rerun boundary

The source/render route proof was rerun successfully. The Clerk-protected collector was not rerun because the current process had no fresh ticket and the existing storage state could not be proven fresh; running it would also mutate the canonical artifact. The canonical matrix and browser history were left byte-unchanged. A future authenticated, raw-response-preserving rerun is required to classify these forms beyond `UNVERIFIED`.
