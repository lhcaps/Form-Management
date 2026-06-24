"use client";

/**
 * Field — Label + control wrapper for consistent form layout.
 *
 * Wraps shadcn Label + any control (input, select, textarea).
 * Shows description and error message below the control.
 *
 * Usage:
 *   <Field label="Tên hồ sơ" error={errors.name} description="Tên ngắn gọn, dễ nhớ">
 *     <Input {...register("name")} />
 *   </Field>
 */

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  description?: string;
  error?: string;
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({
  label,
  description,
  error,
  htmlFor,
  required,
  children,
  className,
  ...props
}: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)} {...props}>
      {label && (
        <Label htmlFor={htmlFor} className={cn(error && "text-destructive")}>
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </Label>
      )}
      {children}
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-xs font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}

export { Field };
