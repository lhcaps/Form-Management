"use client";

/**
 * PageShell — thin wrapper for page layout consistency.
 *
 * Phase 3 will migrate pages to use this instead of self-defined <main>.
 * For now this is the canonical structure; do NOT force-migrate every page yet.
 */

import { cn } from "@/lib/utils";

interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Max-width container variant. "default" = max-w-7xl, "wide" = max-w-screen-xl */
  maxWidth?: "default" | "wide" | "full";
}

function PageShell({
  children,
  className,
  id = "main-content",
  maxWidth = "default",
  ...props
}: PageShellProps) {
  return (
    <main
      id={id}
      className={cn(
        "min-h-screen bg-background",
        maxWidth === "default" && "px-6 py-8",
        maxWidth === "wide" && "px-6 py-8 xl:px-8",
        maxWidth === "full" && "px-0 py-0",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "mx-auto space-y-6",
          maxWidth === "default" && "max-w-7xl",
          maxWidth === "wide" && "max-w-screen-xl",
          maxWidth === "full" && "max-w-full",
        )}
      >
        {children}
      </div>
    </main>
  );
}

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function PageHeader({ children, className, ...props }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface PageSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Shadow card appearance, matches existing pages */
  card?: boolean;
}

function PageSection({
  children,
  className,
  card = true,
  ...props
}: PageSectionProps) {
  return (
    <section
      className={cn(
        card && "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

interface PageActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function PageActions({ children, className, ...props }: PageActionsProps) {
  return (
    <div
      className={cn("flex flex-col gap-2", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { PageShell, PageHeader, PageSection, PageActions };
