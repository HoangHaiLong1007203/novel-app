"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import StatsCard from "@/components/admin/dashboard/StatsCard";
import ActivityFeed from "@/components/admin/dashboard/ActivityFeed";
import PaymentSummaryCard from "@/components/admin/dashboard/PaymentSummaryCard";
import TopNovelsTable from "@/components/admin/dashboard/TopNovelsTable";
import SystemHealthCard from "@/components/admin/dashboard/SystemHealthCard";
import { Button, Skeleton } from "@/components/ui";
import { useAdminDashboardData } from "@/hook/useAdminDashboardData";
import { toast } from "@/lib/toast";

const StatsSkeletonGrid = () => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    {Array.from({ length: 4 }).map((_, idx) => (
      <div key={`stats-skeleton-${idx}`} className="rounded-xl border p-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-4 h-8 w-32" />
        <Skeleton className="mt-6 h-3 w-full" />
      </div>
    ))}
  </div>
);

const CardSkeleton = ({ lines = 4 }: { lines?: number }) => (
  <div className="rounded-xl border p-4 space-y-3">
    <Skeleton className="h-5 w-40" />
    {Array.from({ length: lines }).map((_, idx) => (
      <Skeleton key={`card-line-${idx}`} className="h-3 w-full" />
    ))}
  </div>
);

export default function AdminDashboardAdminPage() {
  const { data, loading, error, refresh } = useAdminDashboardData();

  useEffect(() => {
    if (error) {
      toast(error.message || "Không thể tải dữ liệu dashboard");
    }
  }, [error]);

  const hasData = Boolean(data);
  const showSkeleton = loading && !hasData;

  return (
    <section className="mx-auto w-full max-w-6xl space-y-8 px-4 pt-8 pb-32 lg:pb-40">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase text-primary/70">Admin / Dashboard</p>
          <h1 className="text-3xl font-semibold">Tổng quan hệ thống</h1>
          <p className="text-sm text-muted-foreground">Theo dõi hoạt động, báo cáo và sức khỏe hệ thống trong một nơi.</p>
        </div>
        <Button variant="outline" onClick={() => void refresh()} disabled={loading} className="gap-2">
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </header>

      {showSkeleton ? (
        <StatsSkeletonGrid />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(data?.stats ?? []).map((metric) => (
            <StatsCard key={metric.id} metric={metric} />
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {showSkeleton ? <CardSkeleton lines={6} /> : <ActivityFeed items={data?.activities ?? []} />}
          {showSkeleton ? <CardSkeleton lines={6} /> : <TopNovelsTable items={data?.topNovels ?? []} />}
        </div>
        <div className="space-y-6">
          {showSkeleton ? <CardSkeleton lines={5} /> : <SystemHealthCard items={data?.systemHealth ?? []} />}
          {showSkeleton ? (
            <CardSkeleton lines={4} />
          ) : data ? (
            <PaymentSummaryCard summary={data.paymentSummary} />
          ) : (
            <CardSkeleton lines={4} />
          )}
        </div>
      </div>
    </section>
  );
}
