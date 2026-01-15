"use client";

import { useEffect, useState } from "react";
import { Shield, RefreshCw } from "lucide-react";

import { fetchAdminTransactions } from "@/lib/api";
import { toastApiError } from "@/lib/errors";
import { Button, Separator, Skeleton } from "@/components/ui";
import { useAuth } from "@/hook/useAuth";

const currencyFormatter = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

interface AdminData {
  summary: { totalVnd: number; totalCoins: number; count: number };
  transactions: Array<{
    _id: string;
    amount: number;
    amountVnd?: number;
    provider: string;
    status: string;
    createdAt: string;
    user?: { username: string; email?: string };
  }>;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AdminData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = user?.role === "admin";

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await fetchAdminTransactions();
      setData(response);
    } catch (error) {
      toastApiError(error, "Không tải được danh sách giao dịch");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const summary = data?.summary;

  if (!isAdmin) {
    return (
      <section className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-4 px-4 text-center">
        <Shield className="size-10 text-primary" />
        <p className="text-lg font-semibold">Chức năng chỉ dành cho admin.</p>
        <p className="text-sm text-muted-foreground">Liên hệ quản trị viên để được cấp quyền.</p>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Theo dõi dòng tiền từ các giao dịch nạp xu.</p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={isLoading} className="gap-2">
          <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} /> Tải lại
        </Button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {isLoading ? (
          <Skeleton className="h-24 rounded-2xl" />
        ) : (
          <StatCard title="Tổng thu" value={currencyFormatter.format(summary?.totalVnd || 0)} subtitle={`${summary?.count ?? 0} giao dịch thành công`} />
        )}
        {isLoading ? (
          <Skeleton className="h-24 rounded-2xl" />
        ) : (
          <StatCard title="Tổng xu đã nạp" value={`${(summary?.totalCoins ?? 0).toLocaleString("vi-VN")} xu`} />
        )}
        {isLoading ? (
          <Skeleton className="h-24 rounded-2xl" />
        ) : (
          <StatCard title="Còn chờ xử lý" value={`${data?.transactions.filter((tx) => tx.status !== "success").length ?? 0} giao dịch`} />
        )}
      </div>

      <Separator className="my-6" />

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase text-muted-foreground">
              <th className="py-3">Thời gian</th>
              <th className="py-3">Người dùng</th>
              <th className="py-3">Số xu</th>
              <th className="py-3">Số tiền</th>
              <th className="py-3">Cổng</th>
              <th className="py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={6} className="py-4">
                      <Skeleton className="h-6 w-full" />
                    </td>
                  </tr>
                ))
              : data?.transactions.map((tx) => (
                  <tr key={tx._id} className="border-b last:border-0">
                    <td className="py-3">{new Date(tx.createdAt).toLocaleString("vi-VN")}</td>
                    <td className="py-3 font-medium">{tx.user?.username ?? "--"}</td>
                    <td className="py-3">{tx.amount.toLocaleString("vi-VN")} xu</td>
                    <td className="py-3">{currencyFormatter.format(tx.amountVnd ?? tx.amount * 100)}</td>
                    <td className="py-3 uppercase">{tx.provider}</td>
                    <td className="py-3">
                      <StatusBadge status={tx.status} />
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatCard({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <div className="rounded-2xl border bg-card/70 p-4 shadow-sm">
      <p className="text-xs uppercase text-muted-foreground">{title}</p>
      <p className="text-xl font-semibold">{value}</p>
      {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const map = {
    success: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-800",
    failed: "bg-rose-100 text-rose-700",
    canceled: "bg-slate-100 text-slate-700",
  } as Record<string, string>;
  const cls = map[normalized] || map.pending;
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{normalized}</span>;
}
