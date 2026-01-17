"use client";

import { Badge } from "@/components/ui";
import type { AdminReportStatus } from "@/types/adminReports";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<AdminReportStatus | "unknown", string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  reviewing: "bg-sky-100 text-sky-800 border-sky-200",
  resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  dismissed: "bg-slate-100 text-slate-700 border-slate-200",
  unknown: "bg-muted text-muted-foreground",
};

export function ReportStatusBadge({ status }: { status?: string | null }) {
  const normalized = (status || "unknown").toLowerCase() as AdminReportStatus | "unknown";
  const className = STATUS_STYLES[normalized] ?? STATUS_STYLES.unknown;
  return (
    <Badge variant="outline" className={cn("rounded-full px-2 py-0.5 text-xs capitalize", className)}>
      {normalized === "unknown" ? "không rõ" : normalized}
    </Badge>
  );
}
