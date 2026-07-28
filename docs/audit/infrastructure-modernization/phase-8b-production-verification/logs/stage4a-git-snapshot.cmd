@echo off
echo === STAGED ===
git diff --cached --name-only
echo.
echo === STAGED_COUNT ===
git diff --cached --name-only | find /c /v ""
echo.
echo === MODIFIED_COUNT ===
git diff --name-only | find /c /v ""
echo.
echo === BRANCH ===
git rev-parse --abbrev-ref HEAD
echo.
echo === HEAD ===
git rev-parse HEAD