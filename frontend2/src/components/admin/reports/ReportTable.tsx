"use client";

import { Button, Skeleton } from "@/components/ui";
import type { AdminReportItem } from "@/types/adminReports";
import { ReportPriorityBadge } from "./ReportPriorityBadge";
import { ReportStatusBadge } from "./ReportStatusBadge";

interface ReportTableProps {
  reports?: AdminReportItem[];
  loading: boolean;
  onSelect: (report: AdminReportItem) => void;
  onNavigate?: (report: AdminReportItem) => void;
}

const TARGET_LABELS: Record<AdminReportItem["targetType"], string> = {
  novel: "Truyện",
  chapter: "Chương",
  comment: "Bình luận",
  review: "Đánh giá",
  user: "Người dùng",
  system: "Hệ thống",
};

export function ReportTable({ reports, loading, onSelect, onNavigate }: ReportTableProps) {
  return (
    <div className="rounded-2xl border">
      <table className="w-full table-fixed text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase text-muted-foreground">
            <th className="w-[13%] border-r border-border/50 px-4 py-3">Thời gian</th>
            <th className="w-[37%] border-r border-border/50 px-4 py-3">Đối tượng</th>
            <th className="w-[20%] border-r border-border/50 px-4 py-3">Người báo cáo</th>
            <th className="w-[15%] border-r border-border/50 px-4 py-3">Trạng thái</th>
            <th className="w-[15%] px-4 py-3" aria-label="Hành động" />
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 6 }).map((_, idx) => (
                <tr key={`report-skeleton-${idx}`}>
                  <td colSpan={5} className="px-4 py-4">
                    <Skeleton className="h-6 w-full" />
                  </td>
                </tr>
              ))
            : reports && reports.length > 0
            ? reports.map((report) => {
                const createdAt = new Date(report.createdAt);
                const timeLabel = createdAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
                const dateLabel = createdAt.toLocaleDateString("vi-VN");
                return (
                  <tr key={report._id} className="border-b last:border-0">
                    <td className="border-r border-border/40 px-4 py-3 align-top">
                      <p className="font-semibold leading-tight">{timeLabel}</p>
                      <p className="text-xs text-muted-foreground">{dateLabel}</p>
                    </td>
                    <td className="border-r border-border/40 px-4 py-3 align-top">
                      <p className="text-sm font-semibold capitalize">{TARGET_LABELS[report.targetType]}</p>
                      <p className="text-xs text-muted-foreground" title={report.targetTitle ?? undefined}>
                        {report.targetTitle ?? "--"}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                        {report.reason}
                      </p>
                    </td>
                    <td className="border-r border-border/40 px-4 py-3 align-top">
                      <p className="font-medium" title={report.reporter?.username ?? undefined}>
                        {report.reporter?.username ?? "Ẩn danh"}
                      </p>
                      <p className="text-xs text-muted-foreground" title={report.reporter?.email ?? undefined}>
                        {report.reporter?.email ?? "Không có email"}
                      </p>
                    </td>
                    <td className="border-r border-border/40 px-4 py-3 align-top space-y-2">
                      <ReportStatusBadge status={report.status} />
                      <ReportPriorityBadge priority={report.priority} />
                    </td>
                    <td className="px-4 py-3 text-center align-middle">
                      <div className="flex flex-col items-center justify-center gap-2">
                        {onNavigate ? (
                          <Button variant="ghost" size="sm" onClick={() => onNavigate(report)}>
                            Xem
                          </Button>
                        ) : null}
                        <Button variant="outline" size="sm" onClick={() => onSelect(report)}>
                          Chi tiết
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            : (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">
                    Không có báo cáo nào phù hợp.
                  </td>
                </tr>
              )}
        </tbody>
      </table>
    </div>
  );
}
