import React, { type HTMLAttributes } from "react";

import { cn } from "../../lib/utils";

type FormActionBarPosition = "bottom" | "top" | "none";

type FormActionBarProps = HTMLAttributes<HTMLDivElement> & {
  position?: FormActionBarPosition;
  printHidden?: boolean;
};

export function FormActionBar({
  className,
  position = "bottom",
  printHidden = true,
  children,
  ...props
}: FormActionBarProps) {
  return (
    <div
      className={cn(
        "z-10 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur",
        position === "bottom" && "sticky bottom-4",
        position === "top" && "sticky top-3",
        printHidden && "print:hidden",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
