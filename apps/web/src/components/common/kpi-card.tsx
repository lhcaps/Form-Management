import React, { type ReactNode } from "react";

import { cn } from "../../lib/utils";
import { Badge, type BadgeProps } from "../ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

type KpiTone = "info" | "process" | "warning" | "success" | "neutral";
type BadgeVariant = NonNullable<BadgeProps["variant"]>;

const toneBadgeVariant: Record<KpiTone, BadgeVariant> = {
  info: "blue",
  process: "secondary",
  warning: "warning",
  success: "success",
  neutral: "muted",
};

const toneLabel: Record<KpiTone, string> = {
  info: "Thông tin",
  process: "Đang xử lý",
  warning: "Cần xử lý",
  success: "Hoàn tất",
  neutral: "Theo dõi",
};

type KpiCardProps = {
  label: string;
  value: number | string;
  tone?: KpiTone;
  description?: string;
  icon?: ReactNode;
  className?: string;
};

function KpiCard({
  label,
  value,
  tone = "neutral",
  description,
  icon,
  className,
}: KpiCardProps) {
  return (
    <Card
      className={cn("h-full border-slate-200 shadow-sm", className)}
      data-kpi-tone={tone}
    >
      <CardHeader className="space-y-0 p-5 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardDescription className="font-semibold">{label}</CardDescription>
            {description ? (
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <Badge variant={toneBadgeVariant[tone]} className="shrink-0 px-2 py-0.5 text-[11px]">
            {toneLabel[tone]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-1">
        <div className="flex items-end justify-between gap-3">
          <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
          {icon ? (
            <div className="text-muted-foreground" aria-hidden="true">
              {icon}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export { KpiCard };
export type { KpiCardProps, KpiTone };
