"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui";
import { RecentCriticalReports } from "@/components/admin/reports/RecentCriticalReports";
import { ReportDetailSheet } from "@/components/admin/reports/ReportDetailSheet";
import {
  ReportFilters,
  type CategoryFilterValue,
  type PriorityFilterValue,
  type StatusFilterValue,
  type TargetTypeFilterValue,
} from "@/components/admin/reports/ReportFilters";
import { ReportStats } from "@/components/admin/reports/ReportStats";
import { ReportTable } from "@/components/admin/reports/ReportTable";
import { useAdminReports } from "@/hook/useAdminReports";
import { useAuth } from "@/hook/useAuth";
import type { AdminReportItem } from "@/types/adminReports";
import { toast } from "@/lib/toast";

const STATUS_FILTER_VALUES: StatusFilterValue[] = ["pending", "reviewing", "resolved", "dismissed"];
const PRIORITY_FILTER_VALUES: PriorityFilterValue[] = ["high", "medium", "low"];
const CATEGORY_FILTER_VALUES: CategoryFilterValue[] = ["spam", "abuse", "copyright", "nsfw", "other"];
const TARGET_FILTER_VALUES: TargetTypeFilterValue[] = ["novel", "chapter", "comment", "review", "user", "system"];

const normalizeStatusOptions = (values?: string[]): StatusFilterValue[] | undefined =>
  values?.filter((value): value is StatusFilterValue => STATUS_FILTER_VALUES.includes(value as StatusFilterValue));
const normalizePriorityOptions = (values?: string[]): PriorityFilterValue[] | undefined =>
  values?.filter((value): value is PriorityFilterValue => PRIORITY_FILTER_VALUES.includes(value as PriorityFilterValue));
const normalizeCategoryOptions = (values?: string[]): CategoryFilterValue[] | undefined =>
  values?.filter((value): value is CategoryFilterValue => CATEGORY_FILTER_VALUES.includes(value as CategoryFilterValue));
const normalizeTargetOptions = (values?: string[]): TargetTypeFilterValue[] | undefined =>
  values?.filter((value): value is TargetTypeFilterValue => TARGET_FILTER_VALUES.includes(value as TargetTypeFilterValue));

export default function AdminReportsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const router = useRouter();
  const [selected, setSelected] = useState<AdminReportItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const {
    data,
    loading,
    error,
    params,
    searchValue,
    setSearchValue,
    datePreset,
    changeDatePreset,
    applySearch,
    changeStatus,
    changePriority,
    changeCategory,
    changeTargetType,
    changePage,
    refresh,
    resetFilters,
  } = useAdminReports({}, { enabled: isAdmin });

  const criticalReports = useMemo(() => {
    if (!data?.reports) return [];
    return data.reports.filter((report) => report.priority === "high" && report.status !== "resolved").slice(0, 3);
  }, [data?.reports]);

  const handleSelect = (report: AdminReportItem) => {
    setSelected(report);
    setDetailOpen(true);
  };

  const handleSheetChange = (open: boolean) => {
    setDetailOpen(open);
    if (!open) {
      setSelected(null);
    }
  };

  const handleReportUpdate = (updated: AdminReportItem) => {
    setSelected(updated);
  };

  const resolveTargetUrl = (report: AdminReportItem) => {
    const meta = report.metadata as Record<string, unknown> | null | undefined;
    const novelId = meta?.novelId as string | undefined;
    if (report.targetType === "chapter") {
      if (novelId) return `/novels/${encodeURIComponent(novelId)}/chapters/${encodeURIComponent(report.targetId)}`;
      return `/chapters/${encodeURIComponent(report.targetId)}`;
    }
    if (report.targetType === "comment") {
      if (!novelId) return null;
      return `/novels/${encodeURIComponent(novelId)}?tab=comment&targetType=comment&targetId=${encodeURIComponent(report.targetId)}`;
    }
    if (report.targetType === "review") {
      if (!novelId) return null;
      return `/novels/${encodeURIComponent(novelId)}?tab=danhgia&targetType=review&targetId=${encodeURIComponent(report.targetId)}`;
    }
    if (report.targetType === "novel") {
      return `/novels/${encodeURIComponent(report.targetId)}`;
    }
    return null;
  };

  const handleNavigate = (report: AdminReportItem) => {
    const url = resolveTargetUrl(report);
    if (!url) {
      toast.error("Không tìm thấy đường dẫn đến đối tượng báo cáo");
      return;
    }
    router.push(url);
  };

  if (!isAdmin) {
    return (
      <section className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-4 px-4 text-center">
        <Shield className="size-10 text-primary" />
        <p className="text-lg font-semibold">Chức năng chỉ dành cho admin.</p>
        <p className="text-sm text-muted-foreground">Liên hệ quản trị viên để được cấp quyền.</p>
      </section>
    );
  }

  const pagination = data?.pagination;
  const currentPage = pagination?.currentPage ?? params.page ?? 1;
  const totalPages = pagination?.totalPages ?? 1;
  const totalItems = pagination?.total ?? 0;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Báo cáo vi phạm</h1>
          <p className="text-sm text-muted-foreground">Theo dõi và xử lý các báo cáo từ cộng đồng.</p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={loading} className="gap-2">
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Tải lại
        </Button>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error.message ?? "Không tải được dữ liệu. Thử lại sau."}
        </div>
      ) : null}

      <div className="mt-6 space-y-6">
        <ReportFilters
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onSubmit={applySearch}
          statusValue={params.status ?? "all"}
          priorityValue={params.priority ?? "all"}
          categoryValue={params.category ?? "all"}
          targetTypeValue={params.targetType ?? "all"}
          datePreset={datePreset}
          statusOptions={normalizeStatusOptions(data?.filters.statuses)}
          priorityOptions={normalizePriorityOptions(data?.filters.priorities)}
          categoryOptions={normalizeCategoryOptions(data?.filters.categories)}
          targetTypeOptions={normalizeTargetOptions(data?.filters.targetTypes)}
          loading={loading}
          onStatusChange={changeStatus}
          onPriorityChange={changePriority}
          onCategoryChange={changeCategory}
          onTargetTypeChange={changeTargetType}
          onDatePresetChange={changeDatePreset}
          onReset={resetFilters}
        />

        <ReportStats
          summary={data?.summary}
          statusBreakdown={data?.statusBreakdown}
          priorityBreakdown={data?.priorityBreakdown}
          categoryBreakdown={data?.categoryBreakdown}
          loading={loading}
        />

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <ReportTable reports={data?.reports} loading={loading} onSelect={handleSelect} onNavigate={handleNavigate} />
          <RecentCriticalReports reports={criticalReports} loading={loading} />
        </div>

        <PaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          disabled={loading}
          onPageChange={changePage}
        />
      </div>

      <ReportDetailSheet
        report={selected}
        open={detailOpen}
        onOpenChange={handleSheetChange}
        statusOptions={data?.filters.statuses}
        priorityOptions={data?.filters.priorities}
        onReportUpdate={handleReportUpdate}
        onActionCompleted={refresh}
        onNavigate={handleNavigate}
      />
    </section>
  );
}

function PaginationFooter({
  currentPage,
  totalPages,
  totalItems,
  disabled,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  disabled: boolean;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm">
      <p className="text-muted-foreground">
        Trang {currentPage}/{totalPages} • {totalItems.toLocaleString("vi-VN")} báo cáo
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={disabled || !canPrev} onClick={() => onPageChange(currentPage - 1)}>
          Trang trước
        </Button>
        <Button variant="outline" size="sm" disabled={disabled || !canNext} onClick={() => onPageChange(currentPage + 1)}>
          Trang sau
        </Button>
      </div>
    </div>
  );
}
