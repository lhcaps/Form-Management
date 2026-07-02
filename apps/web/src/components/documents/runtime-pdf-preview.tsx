"use client";

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchRuntimePreviewPdfBlob } from "../../lib/runtime-template-preview";

type RuntimePdfPreviewProps = {
  pdfUrl: string;
  fileName: string;
};

type LoadState = "loading" | "ready" | "error";

function pdfFileNameFromDocx(fileName: string): string {
  return fileName.replace(/\.docx$/i, ".pdf");
}

export function RuntimePdfPreviewUnavailableMessage() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
        Đã tạo file DOCX tạm thời
      </p>
      <p className="mt-1 text-sm leading-6 text-amber-800">
        File DOCX đã được tạo tạm thời nhưng hiện chưa thể hiển thị trực tiếp
        trong trình duyệt. Bạn có thể tải DOCX để kiểm tra định dạng.
      </p>
      <p className="mt-2 text-xs italic text-slate-600">
        Tính năng xem trước PDF đang được phát triển.
      </p>
    </div>
  );
}

export function RuntimePdfPreview({ pdfUrl, fileName }: RuntimePdfPreviewProps) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const pdfFileNameMemo = useMemo(() => pdfFileNameFromDocx(fileName), [fileName]);

  useEffect(() => {
    let cancelled = false;

    // Reset state for new URL
    setLoadState("loading");
    setErrorMessage("");

    // Revoke previous blob URL if exists
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setBlobUrl(null);

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    void fetchRuntimePreviewPdfBlob(pdfUrl, { signal: controller.signal })
      .then((blob) => {
        if (cancelled) return;
        const objectUrl = URL.createObjectURL(blob);
        blobUrlRef.current = objectUrl;
        setBlobUrl(objectUrl);
        setLoadState("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // Ignore AbortError — it's from intentional cancellation, not a user-visible error
        if (err instanceof Error && err.name === "AbortError") return;
        const message =
          err instanceof Error
            ? err.message
            : "Không thể tải bản xem trước PDF.";
        setErrorMessage(message);
        setLoadState("error");
      });

    return () => {
      cancelled = true;
      controller.abort();
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [pdfUrl]);

  // Fallback UI when PDF fetch fails
  if (loadState === "error") {
    return <RuntimePdfPreviewUnavailableMessage />;
  }

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-slate-950">Bản xem trước PDF</p>
          {loadState === "loading" ? (
            <p role="status" className="mt-1 text-xs text-slate-500">
              Đang tải bản xem trước PDF...
            </p>
          ) : null}
        </div>
        {loadState === "ready" && blobUrl ? (
          <a
            href={blobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-blue-700 underline-offset-4 hover:underline"
          >
            Mở PDF
          </a>
        ) : (
          <span className="text-sm font-semibold text-slate-400">Mở PDF</span>
        )}
      </div>
      <iframe
        title={`Bản xem trước PDF ${pdfFileNameMemo}`}
        src={blobUrl ?? "about:blank"}
        className="h-[72vh] min-h-[520px] w-full bg-slate-100"
        onLoad={() => setLoadState("ready")}
      />
    </div>
  );
}
