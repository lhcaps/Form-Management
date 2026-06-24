"use client";

/**
 * EmptyState — standard empty state for lists, searches, etc.
 *
 * Usage:
 *   <EmptyState
 *     icon={<FileSearch />}
 *     title="Không có hồ sơ nào"
 *     description="Hãy tạo hồ sơ mới ở menu Hồ sơ."
 *     action={<Button onClick={...}>Tạo hồ sơ</Button>}
 *   />
 */

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm",
        className,
      )}
    >
      {icon && (
        <div className="text-muted-foreground opacity-40">{icon}</div>
      )}
      <div className="space-y-1">
        <h3 className="text-lg font-black text-foreground">{title}</h3>
        {description && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export { EmptyState };
