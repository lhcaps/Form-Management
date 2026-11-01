#!/bin/sh
set -eu

log() {
  printf '[contract-bootstrap] %s %s\n' "$(date '+%Y-%m-%dT%H:%M:%S%z')" "$*"
}

cd /app/apps/api
log 'Running Prisma migrate deploy before contract bootstrap.'
pnpm exec prisma migrate deploy

log 'Applying governed 213-contract bootstrap corpus.'
exec node /app/scripts/audit/build-phase-8c-bootstrap-sql.mjs --apply
