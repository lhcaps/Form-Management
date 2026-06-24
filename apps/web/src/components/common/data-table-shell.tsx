"use client";

/**
 * DataTableShell — light wrapper for table pages.
 *
 * Provides consistent header + empty/loading states around table content.
 * Does NOT bring TanStack Table — current tables are simple enough.
 */

import { cn } from "@/lib/utils";
import { EmptyState } from "./empty-state";
import { LoadingState } from "./loading-state";

interface DataTableShellProps {
  children: React.ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  className?: string;
}

function DataTableShell({
  children,
  isLoading,
  isEmpty,
  emptyTitle = "Không có dữ liệu",
  emptyDescription,
  emptyAction,
  className,
}: DataTableShellProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {isLoading ? (
        <LoadingState variant="table" count={5} />
      ) : isEmpty ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      ) : (
        children
      )}
    </div>
  );
}

export { DataTableShell };
