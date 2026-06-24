#!/bin/bash
set -euo pipefail

# ============================================================
# QUANLYVKS Docker Entrypoint
# Runs DB migration + seed before starting the API.
# ============================================================

log() { echo "[entrypoint] $(date '+%Y-%m-%dT%H:%M:%S%z') $*"; }

log "Waiting for MySQL to be ready..."
MAX_RETRIES=30
RETRY_INTERVAL=5
DB_HOST="${DB_HOST:-mysql}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${MYSQL_DATABASE:-quanlyvks}"
DB_USER="${MYSQL_USER:-quanlyvks}"
DB_PASS="${MYSQL_PASSWORD:-change-me}"

for i in $(seq 1 $MAX_RETRIES); do
  if mysqladmin ping \
    -h "$DB_HOST" \
    -P "$DB_PORT" \
    -u "$DB_USER" \
    -p"$DB_PASS" \
    --silent 2>/dev/null; then
    log "MySQL is ready."
    break
  fi

  if [ "$i" -eq $MAX_RETRIES ]; then
    log "FATAL: MySQL is not available after $MAX_RETRIES retries."
    exit 1
  fi

  log "MySQL not ready (attempt $i/$MAX_RETRIES), retrying in ${RETRY_INTERVAL}s..."
  sleep $RETRY_INTERVAL
done

# Ensure the database exists (for initial provision)
log "Ensuring database '$DB_NAME' exists..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" \
  -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` \
      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" \
  2>/dev/null || true

# Run Prisma migrations
log "Running Prisma migrations..."
cd /app/apps/api
pnpm exec prisma migrate deploy

# Run seed (only when SEED_DATA=true, e.g. first deploy)
if [ "${SEED_DATA:-false}" = "true" ]; then
  log "Seeding database..."
  pnpm db:seed
else
  log "Skipping seed (SEED_DATA != true)."
fi

log "Starting QUANLYVKS API..."
exec node dist/src/main.js
