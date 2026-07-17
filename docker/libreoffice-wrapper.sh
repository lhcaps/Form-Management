#!/bin/sh
set -eu

INPUT=''
OUTPUT=''
OUTDIR=''
PREVIOUS=''
PROFILE_DIR="$(mktemp -d /tmp/qllaw-libreoffice-profile.XXXXXX)"

cleanup() {
  rm -rf "$PROFILE_DIR"
}
trap cleanup EXIT HUP INT TERM

for ARG in "$@"; do
  case "$ARG" in
    *.docx | *.DOCX) INPUT="$ARG" ;;
    *.pdf | *.PDF) OUTPUT="$ARG" ;;
  esac

  case "$PREVIOUS" in
    -InputPath | -DocxPath | -SourcePath | -Path | -InputFile | -DocxFile)
      INPUT="$ARG"
      ;;
    -OutputPath | -PdfPath | -TargetPath | -OutputFile | -PdfFile)
      OUTPUT="$ARG"
      ;;
    -OutputDir | -OutDir | -TargetDir)
      OUTDIR="$ARG"
      ;;
  esac
  PREVIOUS="$ARG"
done

if [ -z "$INPUT" ] || [ ! -f "$INPUT" ]; then
  echo '[qllaw-libreoffice] ERROR: a readable DOCX input is required.' >&2
  exit 2
fi

if [ -n "$OUTPUT" ]; then
  OUTDIR="$(dirname "$OUTPUT")"
fi
if [ -z "$OUTDIR" ]; then
  OUTDIR="$(dirname "$INPUT")"
fi
mkdir -p "$OUTDIR"

TIMEOUT_SECONDS="${LIBREOFFICE_TIMEOUT_SECONDS:-120}"
case "$TIMEOUT_SECONDS" in
  '' | *[!0-9]*)
    echo '[qllaw-libreoffice] ERROR: timeout must be a positive integer.' >&2
    exit 2
    ;;
esac

LIBREOFFICE_BIN="${LIBREOFFICE_PATH:-/usr/bin/libreoffice}"
timeout "$TIMEOUT_SECONDS" "$LIBREOFFICE_BIN" \
  "-env:UserInstallation=file://$PROFILE_DIR" \
  --headless \
  --nologo \
  --nodefault \
  --nofirststartwizard \
  --nolockcheck \
  --convert-to pdf \
  --outdir "$OUTDIR" \
  "$INPUT" >/dev/null 2>&1

INPUT_NAME="$(basename "$INPUT")"
CREATED="$OUTDIR/${INPUT_NAME%.*}.pdf"
if [ ! -f "$CREATED" ]; then
  echo '[qllaw-libreoffice] ERROR: conversion completed without a PDF artifact.' >&2
  exit 3
fi

if [ -n "$OUTPUT" ] && [ "$CREATED" != "$OUTPUT" ]; then
  mv -f "$CREATED" "$OUTPUT"
fi

echo '[qllaw-libreoffice] conversion completed.' >&2
