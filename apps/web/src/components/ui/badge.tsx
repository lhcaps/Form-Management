import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Shared `Badge` primitive for QUANLYVKS.
 *
 * Tone contract (legal/admin workstation, not SaaS marketing):
 * - Quiet, compact, scannable. Status badges support scanning, they do
 *   not dominate the page.
 * - Low-chroma light-tint backgrounds with borders; no saturated fills
 *   (no `bg-emerald-500`, `bg-amber-500`, etc.) on passive status.
 * - No `text-white` on passive status. No `font-black`. No default
 *   `rounded-full` — passive badges are `rounded-md` so dense tables
 *   don't look like a game dashboard.
 * - `bg-primary text-primary-foreground` is reserved for primary
 *   actions, active filter states, and brand accents — never as the
 *   default badge surface.
 *
 * Variants:
 * - `default`: neutral, slate subtle surface — passive default.
 * - `secondary` / `muted`: slate subtle.
 * - `success`: very light emerald tint with muted emerald text.
 * - `warning`: very light amber tint with muted amber text.
 * - `destructive`: very light rose tint with muted rose text.
 * - `blue`: very light blue tint with muted blue text.
 * - `violet`: subtle violet tint (used only where already in use).
 * - `outline`: light border, surface background, slate text.
 */
const badgeVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium leading-5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-secondary text-secondary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-rose-200 bg-rose-50 text-rose-700",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        warning:
          "border-amber-200 bg-amber-50 text-amber-700",
        outline: "text-foreground",
        muted:
          "border-transparent bg-muted text-muted-foreground",
        blue: "border-blue-200 bg-blue-50 text-blue-700",
        violet: "border-violet-200 bg-violet-50 text-violet-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };