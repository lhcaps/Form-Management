"use client";

import type { CompiledFormContract } from "@qllaw/form-contracts";
import { readPath } from "@qllaw/form-contracts/browser";
import { useEffect, useState } from "react";
import { ContractV2Renderer } from "@/features/forms-contracts/ContractV2Renderer";
import { getSampleData, mergeWithSampleData } from "@/features/forms-contracts/sample-data";
import { absoluteApiUrl, readApi } from "@/lib/api-client";

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sampleMode, setSampleMode] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    setLoading(true);
    void readApi<Record<string, unknown>>(
      `/documents/generated/${documentId}/render-payload`,
      { cache: "no-store" },
    )
      .then((payload) => {
        if (!active) return;
        setData({
          ...record(payload.formInputs),
          ...record(payload.renderPayloadOverrides),
        });
      })
      .catch(() => {
        if (active) setData({});
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
    if (Object.keys(nextErrors).length > 0) {
      setSaving(false);
      setError("Vui lòng hoàn thành các trường bắt buộc.");
      return;
    }
    try {
      const response = await fetch(
        absoluteApiUrl(
          `/documents/generated/${documentId}/contract-form-inputs`,
        ),
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({ contractHash, data }),
        },
      );
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message || "Không lưu được dữ liệu biểu mẫu.");
      }
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
    const merged = mergeWithSampleData(data, sample);
    setData(merged);
    setSampleMode(true);
    setError("");
  }

  return (
    <section className="space-y-4">
      {sampleMode ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Đang sử dụng dữ liệu mẫu. Dữ liệu này chỉ được lưu khi bạn bấm Lưu dữ liệu biểu mẫu.
        </div>
      ) : null}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Đang tải dữ liệu published form…
        </div>
      ) : (
        <ContractV2Renderer
          contract={contract}
          data={data}
          errors={fieldErrors}
          onChange={(next) => {
            setData(next);
            setFieldErrors({});
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
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {message}
        </div>
      ) : null}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          disabled={saving || loading}
          onClick={() => void applySampleData()}
          className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-50"
        >
          Điền dữ liệu mẫu
        </button>
        <button
          type="button"
          disabled={saving || loading}
          onClick={() => void save()}
          className="min-h-11 rounded-xl bg-slate-950 px-5 text-sm font-extrabold text-white disabled:opacity-50"
        >
          {saving ? "Đang lưu…" : "Lưu dữ liệu biểu mẫu"}
        </button>
      </div>
    </section>
  );
}
