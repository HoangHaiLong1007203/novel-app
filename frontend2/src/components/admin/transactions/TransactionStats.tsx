"use client";

import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@/components/ui";
import type {
  AdminTransactionProviderBreakdown,
  AdminTransactionStatusBreakdown,
  AdminTransactionSummary,
} from "@/types/adminTransactions";

const currencyFormatter = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

interface TransactionStatsProps {
  summary?: AdminTransactionSummary;
  statusBreakdown?: AdminTransactionStatusBreakdown[];
  providerBreakdown?: AdminTransactionProviderBreakdown[];
  loading: boolean;
}

export function TransactionStats({ summary, statusBreakdown, providerBreakdown, loading }: TransactionStatsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={`stat-skeleton-${idx}`} className="p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-8 w-32" />
            <Skeleton className="mt-2 h-3 w-20" />
          </Card>
        ))}
      </div>
    );
  }

  const totalCount = summary?.count ?? 0;
  const successCount = statusBreakdown?.find((row) => row.status === "success")?.count ?? 0;
  const pendingCount = statusBreakdown?.find((row) => row.status === "pending")?.count ?? 0;
  const successRate = totalCount ? (successCount / totalCount) * 100 : 0;

  const cards = [
    {
      id: "revenue",
      title: "Tổng doanh thu",
      value: currencyFormatter.format(summary?.totalVnd ?? 0),
      hint: `${(summary?.count ?? 0).toLocaleString("vi-VN")} giao dịch thành công`,
    },
    {
      id: "coins",
      title: "Tổng xu phát hành",
      value: `${(summary?.totalCoins ?? 0).toLocaleString("vi-VN")} xu`,
      hint: "Đã cộng vào ví người dùng",
    },
    {
      id: "success",
      title: "Tỷ lệ thành công",
      value: `${successRate.toFixed(1)}%`,
      hint: `${successCount.toLocaleString("vi-VN")} / ${totalCount.toLocaleString("vi-VN")}`,
    },
    {
      id: "pending",
      title: "Chờ xử lý",
      value: `${pendingCount.toLocaleString("vi-VN")} giao dịch`,
      hint: "Cần kiểm tra thêm",
    },
  ];

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
      <ProviderBreakdownCard providerBreakdown={providerBreakdown} />
    </div>
  );
}

function ProviderBreakdownCard({
  providerBreakdown,
}: {
  providerBreakdown?: AdminTransactionProviderBreakdown[];
}) {
  if (!providerBreakdown || providerBreakdown.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Phân bố cổng thanh toán</CardTitle>
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
        <CardTitle>Phân bố cổng thanh toán</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {providerBreakdown.map((row) => {
          const providerLabel = (row.provider || "unknown").toUpperCase();
          return (
            <div key={providerLabel} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{providerLabel}</span>
                <span className="font-semibold">{currencyFormatter.format(row.totalVnd)}</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, row.count * 5)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{row.count.toLocaleString("vi-VN")} giao dịch</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
