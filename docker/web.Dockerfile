FROM node:22-bookworm-slim AS deps

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@10.33.2

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/form-contracts/package.json ./packages/form-contracts/package.json
# The root postinstall generates the API Prisma client for the workspace,
# even in the web dependency stage.
COPY apps/api/prisma.config.ts ./apps/api/prisma.config.ts
COPY apps/api/prisma/schema.prisma ./apps/api/prisma/schema.prisma

RUN pnpm install --frozen-lockfile


FROM node:22-bookworm-slim AS builder

WORKDIR /app

ENV NODE_ENV=production

ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

RUN npm install -g pnpm@10.33.2

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/form-contracts/node_modules ./packages/form-contracts/node_modules

COPY . .

RUN pnpm --filter @qllaw/form-contracts build
RUN pnpm --filter web build


FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production \
    TZ=Asia/Ho_Chi_Minh \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    HOME=/tmp \
    TMPDIR=/tmp

ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

RUN npm install -g pnpm@10.33.2

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/form-contracts/package.json ./packages/form-contracts/package.json

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/form-contracts/node_modules ./packages/form-contracts/node_modules
COPY --from=builder --chown=node:node /app/packages/form-contracts/dist ./packages/form-contracts/dist
COPY --from=builder --chown=node:node /app/apps/web/.next ./apps/web/.next
COPY --from=builder --chown=node:node /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=node:node /app/apps/web/next.config.* ./apps/web/

RUN mkdir -p /app/apps/web/.next/cache \
    && chown -R node:node /app/apps/web /app/packages/form-contracts

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=4s --start-period=30s --retries=12 \
  CMD node -e "const http=require('node:http');const r=http.get('http://127.0.0.1:3000/healthz',res=>process.exit(res.statusCode===200?0:1));r.on('error',()=>process.exit(1));r.setTimeout(3000,()=>{r.destroy();process.exit(1)})"

USER node
WORKDIR /app/apps/web
CMD ["node", "node_modules/next/dist/bin/next", "start", "-H", "0.0.0.0", "-p", "3000"]
