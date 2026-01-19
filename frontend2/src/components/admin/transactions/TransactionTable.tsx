"use client";

import { Button, Skeleton } from "@/components/ui";
import type { AdminTransactionItem } from "@/types/adminTransactions";
import { TransactionStatusBadge } from "./TransactionStatusBadge";

const currencyFormatter = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

interface TransactionTableProps {
  transactions?: AdminTransactionItem[];
  loading: boolean;
  onSelect: (transaction: AdminTransactionItem) => void;
}

export function TransactionTable({ transactions, loading, onSelect }: TransactionTableProps) {
  return (
    <div className="rounded-2xl border">
      <table className="table-fixed w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase text-muted-foreground">
            <th className="w-[25%] px-4 py-3 border-r border-border/50">Thời gian</th>
            <th className="w-[25%] px-4 py-3 border-r border-border/50">Người dùng</th>
            <th className="w-[15%] px-4 py-3 border-r border-border/50">Chi tiết</th>
            <th className="w-[15%] px-4 py-3 border-r border-border/50">Trạng thái</th>
            <th className="w-[20%] px-4 py-3" aria-label="Hành động" />
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 6 }).map((_, idx) => (
                <tr key={`tx-skeleton-${idx}`}>
                  <td colSpan={5} className="px-4 py-4">
                    <Skeleton className="h-6 w-full" />
                  </td>
                </tr>
              ))
            : transactions && transactions.length > 0
            ? transactions.map((tx) => {
                const createdAt = new Date(tx.createdAt);
                const timeLabel = createdAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
                const dateLabel = createdAt.toLocaleDateString("vi-VN");
                return (
                  <tr key={tx._id} className="border-b last:border-0">
                    <td className="px-4 py-3 align-top border-r border-border/40">
                      <p className="font-semibold leading-tight">{timeLabel}</p>
                      <p className="text-xs text-muted-foreground">{dateLabel}</p>
                      <p className="text-xs text-muted-foreground">#{tx.orderCode ?? "--"}</p>
                    </td>
                    <td className="px-4 py-3 align-top border-r border-border/40">
                      <div className="font-medium truncate" title={tx.user?.username ?? "--"}>
                        {tx.user?.username ?? "--"}
                      </div>
                      <p className="text-xs text-muted-foreground truncate" title={tx.user?.email ?? ""}>
                        {tx.user?.email ?? ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top border-r border-border/40">
                      <p className="capitalize">
                        {tx.type === "topup"
                          ? "Nạp xu"
                          : tx.type === "purchase"
                          ? "Mua chương"
                          : tx.type === "withdraw"
                          ? "Rút xu"
                          : "Tặng quà"}
                      </p>
                      <p className="text-xs text-muted-foreground">Cổng: {(tx.provider || "--").toUpperCase()}</p>
                      <p className="mt-2 text-xs font-semibold text-primary">{tx.amount.toLocaleString("vi-VN")} xu</p>
                      <p className="text-xs text-muted-foreground">
                        {currencyFormatter.format(tx.amountVnd ?? tx.amount * (tx.type === "withdraw" ? 80 : 100))}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top border-r border-border/40">
                      <TransactionStatusBadge status={tx.status} />
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      <Button variant="outline" size="sm" onClick={() => onSelect(tx)}>
                        Chi tiết
                      </Button>
                    </td>
                  </tr>
                );
              })
            : (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">
                    Không có giao dịch nào phù hợp.
                  </td>
                </tr>
              )}
        </tbody>
      </table>
    </div>
  );
}
