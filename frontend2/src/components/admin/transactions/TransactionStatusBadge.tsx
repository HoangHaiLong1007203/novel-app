"use client";

import { Badge } from "@/components/ui";
import type { AdminTransactionStatus } from "@/types/adminTransactions";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<AdminTransactionStatus | "unknown", string> = {
  success: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  failed: "bg-rose-100 text-rose-700 border-rose-200",
  canceled: "bg-slate-100 text-slate-700 border-slate-200",
  unknown: "bg-muted text-muted-foreground",
};

export function TransactionStatusBadge({ status }: { status?: string | null }) {
  const normalized = (status || "unknown").toLowerCase() as AdminTransactionStatus | "unknown";
  const className = STATUS_STYLES[normalized] ?? STATUS_STYLES.unknown;
  const label = normalized === "unknown" ? "không rõ" : normalized;
  return (
    <Badge variant="outline" className={cn("rounded-full px-2 py-0.5 text-xs capitalize", className)}>
      {label}
    </Badge>
  );
}
