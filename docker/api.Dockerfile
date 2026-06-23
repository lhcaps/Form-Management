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

# Build workspace packages that the API depends on
RUN pnpm --filter @qllaw/form-contracts build

# Generate Prisma client and build API
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api build


FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV TZ=Asia/Ho_Chi_Minh
ENV PORT=3001
ENV STORAGE_ROOT=/app/storage
ENV GENERATED_FILES_ROOT=/app/storage/generated
ENV NORMALIZED_DOCX_ROOT=/app/storage/templates/normalized-docx
ENV LIBREOFFICE_PATH=/usr/bin/libreoffice

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    tzdata \
    libreoffice \
    fontconfig \
    fonts-dejavu \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@10.33.2

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/form-contracts/package.json ./packages/form-contracts/package.json

# node_modules from builder includes Prisma client and @qllaw/form-contracts dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/packages/form-contracts/node_modules ./packages/form-contracts/node_modules

# Built artifacts
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages/form-contracts/dist ./packages/form-contracts/dist

# LibreOffice PDF wrapper (converts DOCX -> PDF without Word)
RUN cat > /usr/local/bin/powershell.exe <<'SH'
#!/bin/sh
set -eu

echo "[quanlyvks-pdf-wrapper] args: $*" >&2

INPUT=""
OUTPUT=""
OUTDIR=""

PREV=""

for ARG in "$@"; do
  case "$ARG" in
    *.docx)
      INPUT="$ARG"
      ;;
    *.pdf)
      OUTPUT="$ARG"
      ;;
  esac

  case "$PREV" in
    -InputPath|-DocxPath|-SourcePath|-Path|-InputFile|-DocxFile)
      INPUT="$ARG"
      ;;
    -OutputPath|-PdfPath|-TargetPath|-OutputFile|-PdfFile)
      OUTPUT="$ARG"
      ;;
    -OutputDir|-OutDir|-TargetDir)
      OUTDIR="$ARG"
      ;;
  esac

  PREV="$ARG"
done

if [ -z "$INPUT" ]; then
  echo "[quanlyvks-pdf-wrapper] ERROR: Cannot find DOCX input from args" >&2
  exit 2
fi

if [ -n "$OUTPUT" ]; then
  OUTDIR="$(dirname "$OUTPUT")"
fi

if [ -z "$OUTDIR" ]; then
  OUTDIR="$(dirname "$INPUT")"
fi

mkdir -p "$OUTDIR"

libreoffice \
  --headless \
  --nologo \
  --nofirststartwizard \
  --convert-to pdf \
  --outdir "$OUTDIR" \
  "$INPUT"

CREATED="$OUTDIR/$(basename "$INPUT" .docx).pdf"

if [ ! -f "$CREATED" ]; then
  echo "[quanlyvks-pdf-wrapper] ERROR: LibreOffice did not create PDF" >&2
  exit 3
fi

if [ -n "$OUTPUT" ] && [ "$CREATED" != "$OUTPUT" ]; then
  mv -f "$CREATED" "$OUTPUT"
fi

echo "[quanlyvks-pdf-wrapper] PDF created: ${OUTPUT:-$CREATED}" >&2
exit 0
SH

RUN chmod +x /usr/local/bin/powershell.exe

EXPOSE 3001

WORKDIR /app/apps/api
CMD ["node", "dist/src/main.js"]
