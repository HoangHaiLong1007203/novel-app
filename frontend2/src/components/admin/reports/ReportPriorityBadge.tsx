"use client";

import { Badge } from "@/components/ui";
import type { AdminReportPriority } from "@/types/adminReports";
import { cn } from "@/lib/utils";

const PRIORITY_STYLES: Record<AdminReportPriority, string> = {
  high: "bg-rose-100 text-rose-700 border-rose-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-slate-100 text-slate-700 border-slate-200",
};

const PRIORITY_LABELS: Record<AdminReportPriority, string> = {
  high: "Ưu tiên cao",
  medium: "Trung bình",
  low: "Thấp",
};

export function ReportPriorityBadge({ priority }: { priority?: AdminReportPriority | null }) {
  if (!priority) {
    return null;
  }
  return (
    <Badge variant="outline" className={cn("rounded-full px-2 py-0.5 text-xs", PRIORITY_STYLES[priority])}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}
