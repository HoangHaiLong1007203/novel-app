"use client";

import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@/components/ui";
import type { AdminTransactionItem } from "@/types/adminTransactions";
import { TransactionStatusBadge } from "./TransactionStatusBadge";

const currencyFormatter = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

interface RecentFailedTransactionsProps {
  transactions?: AdminTransactionItem[];
  loading: boolean;
}

export function RecentFailedTransactions({ transactions, loading }: RecentFailedTransactionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Giao dịch lỗi gần đây</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={`recent-failed-skeleton-${idx}`} className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Không có giao dịch lỗi gần đây.</p>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div key={tx._id} className="rounded-xl border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{tx.user?.username ?? "--"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleString("vi-VN")}</p>
                  </div>
                  <TransactionStatusBadge status={tx.status} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {tx.type === "topup" ? "Nạp xu" : "Mua chương"} • {currencyFormatter.format(tx.amountVnd ?? tx.amount * 100)}
                </p>
                {tx.statusReason ? <p className="text-xs text-rose-600">{tx.statusReason}</p> : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
