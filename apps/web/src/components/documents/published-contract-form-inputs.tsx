"use client";

import type { CompiledFormContract } from "@qllaw/form-contracts";
import { readPath } from "@qllaw/form-contracts/browser";
import { useEffect, useMemo, useState } from "react";
import { ContractV2Renderer } from "@/features/forms-contracts/ContractV2Renderer";
import {
  filterContractData,
  getSampleData,
  migrateLegacyDataToContract,
  mergeWithSampleData,
} from "@/features/forms-contracts/sample-data";
import { readApi } from "@/lib/api-client";
import { savePublishedContractFormInputs } from "@/lib/document-form-api";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value);
}

function record(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function stableSnapshot(value: Record<string, unknown>): string {
  return JSON.stringify(value);
}

function PublishedContractLoadingState() {
  return (
    <div
      aria-busy="true"
      aria-label="Đang tải dữ liệu biểu mẫu"
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
    >
      <span className="sr-only">Đang tải dữ liệu biểu mẫu</span>
      <div className="space-y-3">
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="h-3 w-64 max-w-full rounded bg-slate-100" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-3 w-24 rounded bg-slate-100" />
            <div className="h-10 rounded-lg bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PublishedContractFormInputsPanel({
  documentId,
  contract,
  contractHash,
  onSaved,
}: {
  documentId: string | number;
  contract: CompiledFormContract;
  contractHash: string;
  onSaved?: () => void;
}) {
  const [data, setData] = useState<Record<string, unknown>>({});
  const [savedData, setSavedData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sampleMode, setSampleMode] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const contractPaths = useMemo(
    () => [
      ...contract.source.fields.map((field) => field.key),
      ...contract.source.tables.map((table) => table.key),
    ],
    [contract],
  );
  const currentSnapshot = useMemo(() => stableSnapshot(data), [data]);
  const savedSnapshot = useMemo(() => stableSnapshot(savedData), [savedData]);
  const isDirty = !loading && currentSnapshot !== savedSnapshot;
  const statusText = loading
    ? "Đang tải dữ liệu biểu mẫu"
    : saving
      ? "Đang lưu thay đổi"
      : isDirty
        ? "Có thay đổi chưa lưu"
        : "Dữ liệu đã đồng bộ";
  const statusTone = loading || saving ? "text-blue-700" : isDirty ? "text-amber-700" : "text-emerald-700";

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setMessage("");
    setFieldErrors({});
    setSampleMode(false);
    void readApi<Record<string, unknown>>(
      `/documents/generated/${documentId}/render-payload`,
      { cache: "no-store" },
    )
      .then((payload) => {
        if (!active) return;
        const rawData = {
          ...record(payload.formInputs),
          ...record(payload.renderPayloadOverrides),
        };
        const loadedData = filterContractData(
          {
            ...rawData,
            ...migrateLegacyDataToContract(rawData, contract.source.fields),
          },
          contractPaths,
        );
        setData(loadedData);
        setSavedData(loadedData);
      })
      .catch(() => {
        if (active) {
          setData({});
          setSavedData({});
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [documentId, contractHash]);

  async function save() {
    setSaving(true);
    setError("");
    setMessage("");
    const nextErrors: Record<string, string> = {};
    for (const field of contract.source.fields) {
      if (!field.required) continue;
      if (
        ["DEFAULT", "COMPUTED", "CONSTANT", "SYSTEM"].includes(
          field.dataSource.kind,
        )
      ) {
        continue;
      }
      const value = readPath(data, field.key);
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      ) {
        nextErrors[field.key] = `Trường "${field.label}" là bắt buộc.`;
      }
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 && !sampleMode) {
      setSaving(false);
      setError("Vui lòng hoàn thành các trường bắt buộc.");
      return;
    }
    try {
      const payload = await savePublishedContractFormInputs(documentId, { contractHash, data });
      const nextSavedData = isRecord(payload.data) ? payload.data : data;
      setData(nextSavedData);
      setSavedData(nextSavedData);
      setMessage("Đã lưu dữ liệu biểu mẫu.");
      setSampleMode(false);
      onSaved?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Lưu thất bại.");
    } finally {
      setSaving(false);
    }
  }

  function applySampleData() {
    const sample = getSampleData(contract.templateCode, contract.source.fields);
    if (Object.keys(sample).length === 0) {
      setError("Không có dữ liệu mẫu cho biểu mẫu này.");
      return;
    }
    const merged = filterContractData(
      mergeWithSampleData(data, sample),
      contractPaths,
    );
    setData(merged);
    setSampleMode(true);
    setError("");
    setMessage("");
    setFieldErrors({});
  }

  return (
    <section className="space-y-4">
      {sampleMode ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Đang sử dụng dữ liệu mẫu. Dữ liệu này chỉ được lưu khi bạn bấm Lưu dữ liệu biểu mẫu.
        </div>
      ) : null}
      {loading ? (
        <PublishedContractLoadingState />
      ) : (
        <ContractV2Renderer
          contract={contract}
          data={data}
          errors={fieldErrors}
          onChange={(next) => {
            setData(next);
            setFieldErrors({});
            setMessage("");
          }}
        />
      )}
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"
        >
          {error}
        </div>
      ) : null}
      {message ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
        >
          {message}
        </div>
      ) : null}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          role="status"
          aria-live="polite"
          className={`text-sm font-semibold ${statusTone}`}
        >
          {statusText}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={saving || loading}
            onClick={() => void applySampleData()}
            className="min-h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-50 sm:min-h-11"
          >
            Điền dữ liệu mẫu
          </button>
          <button
            type="button"
            disabled={saving || loading || !isDirty}
            onClick={() => void save()}
            className="min-h-10 rounded-xl bg-slate-950 px-5 text-sm font-extrabold text-white disabled:opacity-50 sm:min-h-11"
          >
            {saving ? "Đang lưu…" : "Lưu dữ liệu biểu mẫu"}
          </button>
        </div>
      </div>
    </section>
  );
}
