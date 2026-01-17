"use client";

import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@/components/ui";
import type {
  AdminReportCategory,
  AdminReportCategoryBreakdown,
  AdminReportPriority,
  AdminReportPriorityBreakdown,
  AdminReportStatus,
  AdminReportStatusBreakdown,
  AdminReportSummary,
} from "@/types/adminReports";

interface ReportStatsProps {
  summary?: AdminReportSummary;
  statusBreakdown?: AdminReportStatusBreakdown[];
  priorityBreakdown?: AdminReportPriorityBreakdown[];
  categoryBreakdown?: AdminReportCategoryBreakdown[];
  loading: boolean;
}

const STATUS_LABELS: Record<AdminReportStatus | "unknown", string> = {
  pending: "Chờ duyệt",
  reviewing: "Đang xử lý",
  resolved: "Đã giải quyết",
  dismissed: "Đã bỏ qua",
  unknown: "Khác",
};

const PRIORITY_LABELS: Record<AdminReportPriority, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
};

const CATEGORY_LABELS: Record<AdminReportCategory | "other", string> = {
  spam: "Spam",
  abuse: "Quấy rối",
  copyright: "Bản quyền",
  nsfw: "Nhạy cảm",
  other: "Khác",
};

export function ReportStats({ summary, statusBreakdown, priorityBreakdown, categoryBreakdown, loading }: ReportStatsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={`report-stat-skeleton-${idx}`} className="p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-8 w-32" />
            <Skeleton className="mt-2 h-3 w-20" />
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      id: "total",
      title: "Tổng báo cáo",
      value: summary ? summary.totalReports.toLocaleString("vi-VN") : "0",
      hint: "Tính từ trước tới nay",
    },
    {
      id: "pending",
      title: "Đang chờ",
      value: summary ? summary.pendingCount.toLocaleString("vi-VN") : "0",
      hint: "Cần phản hồi sớm",
    },
    {
      id: "reviewing",
      title: "Đang xử lý",
      value: summary ? summary.reviewingCount.toLocaleString("vi-VN") : "0",
      hint: "Đã được gán admin",
    },
    {
      id: "resolved",
      title: "Đã giải quyết (24h)",
      value: summary ? summary.resolvedToday.toLocaleString("vi-VN") : "0",
      hint: "Trong 24 giờ qua",
    },
  ];

  const normalizedStatus = statusBreakdown?.map((row) => ({ key: row.status ?? "unknown", count: row.count })) ?? [];
  const normalizedPriority = priorityBreakdown?.map((row) => ({ key: row.priority ?? "medium", count: row.count })) ?? [];
  const normalizedCategory = categoryBreakdown?.map((row) => ({ key: row.category ?? "other", count: row.count })) ?? [];

  return (
    <div className="grid gap-4 xl:grid-cols-[3fr_2fr]">
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <Card key={card.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4">
        <BreakdownCard title="Theo trạng thái" items={normalizedStatus} total={summary?.totalReports ?? 0} labels={STATUS_LABELS} />
        <BreakdownCard title="Theo độ ưu tiên" items={normalizedPriority} total={summary?.totalReports ?? 0} labels={PRIORITY_LABELS} />
        <BreakdownCard title="Theo danh mục" items={normalizedCategory} total={summary?.totalReports ?? 0} labels={CATEGORY_LABELS} />
      </div>
    </div>
  );
}

type BreakdownEntry = { key: string; count: number };

function BreakdownCard({
  title,
  items,
  total,
  labels,
}: {
  title: string;
  items?: BreakdownEntry[];
  total: number;
  labels: Record<string, string>;
}) {
  if (!items || items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((row) => {
          const rawValue = row.key || "other";
          const label = labels[rawValue] ?? rawValue ?? "Khác";
          const count = row.count ?? 0;
          const percent = total ? Math.round((count / total) * 100) : 0;
          return (
            <div key={`${title}-${rawValue}`} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{label}</span>
                <span className="font-semibold">{count.toLocaleString("vi-VN")} ({percent}%)</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(percent, 100)}%` }} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
