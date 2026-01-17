"use client";

import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@/components/ui";
import type { AdminReportItem } from "@/types/adminReports";
import { ReportPriorityBadge } from "./ReportPriorityBadge";
import { ReportStatusBadge } from "./ReportStatusBadge";

interface RecentCriticalReportsProps {
  reports?: AdminReportItem[];
  loading: boolean;
}

export function RecentCriticalReports({ reports, loading }: RecentCriticalReportsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Báo cáo ưu tiên</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={`critical-report-skeleton-${idx}`} className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        ) : !reports || reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">Không có báo cáo cần chú ý.</p>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report._id} className="rounded-xl border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold line-clamp-1" title={report.targetTitle ?? undefined}>
                    {report.targetTitle ?? "Không có tiêu đề"}
                  </p>
                  <ReportPriorityBadge priority={report.priority} />
                </div>
                <p className="text-xs text-muted-foreground">{new Date(report.createdAt).toLocaleString("vi-VN")}</p>
                <p className="mt-2 line-clamp-2 text-muted-foreground">{report.reason}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{report.reporter?.username ?? "Ẩn danh"}</span>
                  <span>•</span>
                  <ReportStatusBadge status={report.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
