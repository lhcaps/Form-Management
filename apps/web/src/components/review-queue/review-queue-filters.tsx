"use client";

/**
 * ReviewQueueFilters — filter pills + search input for the review queue.
 *
 * Displays:
 * - Filter pills with per-status counts
 * - Search input (clearable)
 * - Reload button
 *
 * All filtering is client-side. The parent re-computes `filteredItems`
 * using the values passed up via onFilterChange / onSearchChange.
 */

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ReviewQueueItem, ReviewQueueSummary, ReviewStatus } from "@/lib/documents-review-api";

type FilterKey = "ALL" | ReviewStatus;

interface ReviewQueueFiltersProps {
  filters: Array<{ key: FilterKey; label: string }>;
  summary: ReviewQueueSummary;
  totalCount: number;
  activeFilter: FilterKey;
  keyword: string;
  isLoading: boolean;
  onFilterChange: (key: FilterKey) => void;
  onSearchChange: (keyword: string) => void;
  onReload: () => void;
}

export function ReviewQueueFilters({
  filters,
  summary,
  totalCount,
  activeFilter,
  keyword,
  isLoading,
  onFilterChange,
  onSearchChange,
  onReload,
}: ReviewQueueFiltersProps) {
  const getCount = (key: FilterKey): number => {
    if (key === "ALL") return totalCount;
    return summary[key] ?? 0;
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Filter pills */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc theo trạng thái">
          {filters.map((filter) => {
            const count = getCount(filter.key);
            const isActive = activeFilter === filter.key;

            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => onFilterChange(filter.key)}
                aria-pressed={isActive}
                className={
                  isActive
                    ? "rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
                    : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                }
              >
                {filter.label}
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                  aria-label={`${count} biểu mẫu`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search + reload */}
        <div className="flex gap-2">
          <div className="relative">
            <input
              type="search"
              value={keyword}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm theo mã BM, số văn bản, hồ sơ..."
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-4 pr-9 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 lg:w-64"
              aria-label="Tìm kiếm biểu mẫu"
            />
            {keyword && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 transition hover:text-slate-600"
                aria-label="Xóa tìm kiếm"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => void onReload()}
            disabled={isLoading}
            className="h-11 shrink-0 rounded-2xl px-4 text-sm font-bold"
          >
            {isLoading ? "Đang tải..." : "Tải lại"}
          </Button>
        </div>
      </div>
    </section>
  );
}
