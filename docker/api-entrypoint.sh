#!/bin/sh
set -eu

log() {
  printf '[entrypoint] %s %s\n' "$(date '+%Y-%m-%dT%H:%M:%S%z')" "$*"
}

DB_HOST="${DB_HOST:-mysql}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${MYSQL_USER:?MYSQL_USER must be set}"
DB_PASS="${MYSQL_PASSWORD:?MYSQL_PASSWORD must be set}"
MAX_RETRIES="${DB_MAX_RETRIES:-30}"
RETRY_INTERVAL="${DB_RETRY_INTERVAL_SECONDS:-5}"

case "$MAX_RETRIES:$RETRY_INTERVAL" in
  *[!0-9:]* | :* | *:)
    log 'FATAL: DB retry settings must be positive integers.'
    exit 2
    ;;
esac

export MYSQL_PWD="$DB_PASS"
log 'Waiting for MySQL readiness...'
i=1
while [ "$i" -le "$MAX_RETRIES" ]; do
  if mysqladmin ping \
    --protocol=tcp \
    -h "$DB_HOST" \
    -P "$DB_PORT" \
    -u "$DB_USER" \
    --silent 2>/dev/null; then
    log 'MySQL is ready.'
    break
  fi

  if [ "$i" -eq "$MAX_RETRIES" ]; then
    log "FATAL: MySQL is unavailable after $MAX_RETRIES attempts."
    exit 1
  fi

  log "MySQL not ready (attempt $i/$MAX_RETRIES); retrying."
  sleep "$RETRY_INTERVAL"
  i=$((i + 1))
done

# Phase 8C: fail-closed font verification before Prisma migrate.
# QLLAW_FONT_POLICY=required is the production default. When set to
# required, the entrypoint refuses to start the API unless the bind mount
# at $QLLAW_CONTAINER_TNR_FONT_DIR carries the exact Times New Roman
# family in the four required styles (Regular/Bold/Italic/Bold Italic).
# When set to fallback-allowed, the verifier still runs and writes a
# JSON/MD report so docker-verify.mjs can prove the policy choice.
case "${QLLAW_FONT_POLICY:-required}" in
  required)
    log 'Verifying required font policy (Times New Roman exact).'
    if ! node /app/scripts/fonts/verify-font-policy.mjs \
        --output /tmp/qllaw-font-verification.json; then
      log 'FATAL: font policy=required but Times New Roman verification failed.'
      log '       see /tmp/qllaw-font-verification.json for detail.'
      exit 4
    fi
    log 'Font verification: PASS.'
    ;;
  fallback-allowed)
    log 'Verifying fallback-allowed font policy (will not fail boot).'
    if node /app/scripts/fonts/verify-font-policy.mjs \
      --output /tmp/qllaw-font-verification.json; then
      log 'Font verification: report written.'
    else
      log 'Font verification: report failed; continuing because policy=fallback-allowed.'
    fi
    ;;
  *)
    log "FATAL: QLLAW_FONT_POLICY must be 'required' or 'fallback-allowed'; got '${QLLAW_FONT_POLICY}'."
    exit 3
    ;;
esac

cd /app/apps/api
log 'Running Prisma migrate deploy...'
pnpm exec prisma migrate deploy

case "${SEED_DATA:-false}" in
  true)
    log 'SEED_DATA=true; running the controlled idempotent seed.'
    pnpm seed
    ;;
  false | '')
    log 'Seed disabled.'
    ;;
  *)
    log 'FATAL: SEED_DATA must be exactly true or false.'
    exit 2
    ;;
esac

log 'Starting QUANLYVKS API.'
exec node dist/src/main.js
