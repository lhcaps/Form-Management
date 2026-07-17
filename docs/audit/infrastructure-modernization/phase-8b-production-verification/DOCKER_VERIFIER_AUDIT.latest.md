# Phase 8B - Docker verifier truthfulness audit

## Verdict

`PASS` after a reproduced aggregation fix.

## Reproduced defect

The prior verifier could finish with `DOCKER_VERIFY=PASS_STATIC` after static/image checks even though boot, migration, readiness, restart, shutdown, and cleanup had not been verified. That made the global PASS materially stronger than the evidence.

Pre-edit backup: `%TEMP%/qllaw-phase8b-docker-verifier-before-20260711151608/docker-verify.mjs`, SHA-256 `f7ac68c237e966e9eee0fcfbc29e95c29b358630244556a97ca3353862f1d29e`.

## Smallest fix

- Added exact API/Web image overrides and fail-closed validation that both are supplied together and exist locally.
- Added an optional boot-result input and strict validation of build isolation, health, migrations, readiness, non-root runtime, restart, graceful shutdown, and cleanup.
- A run without boot evidence now reports `DOCKER_VERIFY=PASS_IMAGE_ONLY`, never a global PASS.
- A complete successful boot artifact is required for `DOCKER_VERIFY=PASS`.
- Added UTF-8 BOM-tolerant JSON parsing after the first real Windows run exposed a PowerShell BOM.
- Exported only the parser/validator needed by the focused test; no dependency was added.

## Verification

- TDD RED: the initial truthfulness assertion failed against `PASS_STATIC`.
- Focused verifier plus existing developer-command guard: `10/10`, exit `0`.
- First real post-fix invocation: exit `1` on BOM-prefixed JSON, proving fail-closed behavior.
- BOM regression test added; focused suite returned exit `0`.
- Final real verifier with the exact images and `logs/docker-boot-202607111512.json`: exit `0`, `3,777 ms`.

Final required stages were all reported PASS: infrastructure guard, Compose config, reused exact local images, image runtime, font capability, boot, migration, readiness, restart, shutdown, and cleanup. Final token: `DOCKER_VERIFY=PASS`.
