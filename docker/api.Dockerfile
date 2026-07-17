FROM node:22-bookworm-slim AS deps

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@10.33.2

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/form-contracts/package.json ./packages/form-contracts/package.json
# Root postinstall invokes `pnpm --filter api exec prisma generate`; provide
# the Prisma config and schema before dependency installation, while keeping
# source changes outside this cache-friendly dependency layer.
COPY apps/api/prisma.config.ts ./apps/api/prisma.config.ts
COPY apps/api/prisma/schema.prisma ./apps/api/prisma/schema.prisma

RUN pnpm install --frozen-lockfile


FROM node:22-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@10.33.2

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/form-contracts/node_modules ./packages/form-contracts/node_modules

COPY . .

RUN pnpm --filter @qllaw/form-contracts build
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api build


FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production \
    TZ=Asia/Ho_Chi_Minh \
    API_PORT=3001 \
    PORT=3001 \
    REPO_ROOT=/app \
    STORAGE_ROOT=/app/storage \
    GENERATED_FILES_ROOT=/app/storage/generated \
    NORMALIZED_DOCX_ROOT=/app/storage/templates/normalized-docx \
    LIBREOFFICE_PATH=/usr/bin/libreoffice \
    QLLAW_FONT_POLICY=required \
    QLLAW_REQUIRED_FONT_FAMILY=Times\ New\ Roman \
    QLLAW_CONTAINER_TNR_FONT_DIR=/opt/qllaw/fonts/times-new-roman \
    HOME=/tmp \
    TMPDIR=/tmp

# Phase 8C: only install the metric-compatible fallback (Liberation) when
# QLLAW_FONT_POLICY is not "required". In production we DO NOT install a
# Liberation fontconfig alias to "Times New Roman". The Times New Roman
# family must come from the operator-provided bind mount at
# /opt/qllaw/fonts/times-new-roman. The entrypoint refuses to start the
# API under required mode if the bind mount is not present or does not
# carry the exact four styles.
ARG QLLAW_INSTALL_FALLBACK_FONTS=true
RUN if [ "$QLLAW_INSTALL_FALLBACK_FONTS" = "true" ]; then \
      apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
        openssl \
        tzdata \
        libreoffice-core \
        libreoffice-writer \
        fontconfig \
        fonts-dejavu-core \
        fonts-liberation \
        default-mysql-client \
        && rm -rf /var/lib/apt/lists/*; \
    else \
      apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
        openssl \
        tzdata \
        libreoffice-core \
        libreoffice-writer \
        fontconfig \
        default-mysql-client \
        && rm -rf /var/lib/apt/lists/*; \
    fi

RUN npm install -g pnpm@10.33.2

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/form-contracts/package.json ./packages/form-contracts/package.json

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/packages/form-contracts/node_modules ./packages/form-contracts/node_modules

COPY --from=builder --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=node:node /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder --chown=node:node /app/apps/api/src ./apps/api/src
COPY --from=builder --chown=node:node /app/apps/web/src/lib/vks-template-catalog.ts ./apps/web/src/lib/vks-template-catalog.ts
COPY --from=builder --chown=node:node /app/packages/form-contracts/dist ./packages/form-contracts/dist
COPY --from=builder --chown=node:node /app/docs/audit/docx/contracts/locked ./docs/audit/docx/contracts/locked
COPY --from=builder --chown=node:node /app/docs/audit/docx/compiled-v2 ./docs/audit/docx/compiled-v2
# The explicit Compose bootstrap job uses the same audited generator as host
# operators. It is not part of normal API startup.
COPY --from=builder --chown=node:node /app/scripts/audit/build-phase-8c-bootstrap-sql.mjs ./scripts/audit/build-phase-8c-bootstrap-sql.mjs

# Phase 8C: ship the font-policy verifier so the entrypoint can refuse
# to start under "required" policy without the operator-provided font.
COPY --chown=node:node scripts/fonts/ttf-inspector.mjs /app/scripts/fonts/ttf-inspector.mjs
COPY --chown=node:node scripts/fonts/verify-font-policy.mjs /app/scripts/fonts/verify-font-policy.mjs
COPY --chmod=755 docker/libreoffice-wrapper.sh /usr/local/bin/powershell.exe
COPY --chmod=755 docker/api-entrypoint.sh /usr/local/bin/api-entrypoint.sh
COPY --chmod=755 docker/contract-bootstrap-entrypoint.sh /usr/local/bin/contract-bootstrap-entrypoint.sh
# Phase 8C.1: make fontconfig see the operator-provided bind mount. Without
# this drop-in, /opt/qllaw/fonts/times-new-roman is invisible to soffice and
# the container falls back to DejaVu Serif. The drop-in only ADDS the path
# to fontconfig's search list; it does not copy or embed any font binary.
COPY --chmod=644 docker/qllaw-fonts.conf /etc/fonts/conf.d/99-qllaw-fonts.conf

RUN mkdir -p \
      /app/storage/generated \
      /app/storage/runtime-preview-sessions \
      /app/storage/templates/normalized-docx \
      /app/logs \
    && chown -R node:node /app/storage /app/logs /app/apps/api /app/apps/web /app/packages/form-contracts

EXPOSE 3001

HEALTHCHECK --interval=10s --timeout=4s --start-period=30s --retries=12 \
  CMD node -e "fetch('http://127.0.0.1:3001/api/v1/ready',{signal:AbortSignal.timeout(3000)}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

USER node
WORKDIR /app/apps/api
ENTRYPOINT ["/usr/local/bin/api-entrypoint.sh"]
