"use client";

import { useState } from "react";
import { RefreshCw, Shield } from "lucide-react";

import { Button } from "@/components/ui";
import { TransactionDetailSheet } from "@/components/admin/transactions/TransactionDetailSheet";
import {
  TransactionFilters,
  type ProviderFilterValue,
  type StatusFilterValue,
  type TypeFilterValue,
} from "@/components/admin/transactions/TransactionFilters";
import { RecentFailedTransactions } from "@/components/admin/transactions/RecentFailedTransactions";
import { TransactionStats } from "@/components/admin/transactions/TransactionStats";
import { TransactionTable } from "@/components/admin/transactions/TransactionTable";
import { useAdminTransactions } from "@/hook/useAdminTransactions";
import { useAuth } from "@/hook/useAuth";
import type { AdminTransactionItem } from "@/types/adminTransactions";

const STATUS_FILTER_VALUES: StatusFilterValue[] = ["success", "failed", "pending", "canceled", "unknown"];
const PROVIDER_FILTER_VALUES: ProviderFilterValue[] = ["stripe", "vnpay", "system", "unknown"];
const TYPE_FILTER_VALUES: TypeFilterValue[] = ["topup", "purchase"];

const normalizeStatusOptions = (values?: string[]): StatusFilterValue[] | undefined =>
  values?.filter((value): value is StatusFilterValue => STATUS_FILTER_VALUES.includes(value as StatusFilterValue));

const normalizeProviderOptions = (values?: string[]): ProviderFilterValue[] | undefined =>
  values?.filter((value): value is ProviderFilterValue => PROVIDER_FILTER_VALUES.includes(value as ProviderFilterValue));

const normalizeTypeOptions = (values?: string[]): TypeFilterValue[] | undefined =>
  values?.filter((value): value is TypeFilterValue => TYPE_FILTER_VALUES.includes(value as TypeFilterValue));

export default function AdminTransactionsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [selected, setSelected] = useState<AdminTransactionItem | null>(null);
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
    changeProvider,
    changeType,
    changePage,
    refresh,
    resetFilters,
  } = useAdminTransactions({}, { enabled: isAdmin });

  const handleSelect = (transaction: AdminTransactionItem) => {
    setSelected(transaction);
    setDetailOpen(true);
  };

  const handleSheetChange = (open: boolean) => {
    setDetailOpen(open);
    if (!open) {
      setSelected(null);
    }
  };

  const handleTransactionUpdate = (updated: AdminTransactionItem) => {
    setSelected(updated);
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
          <h1 className="text-2xl font-semibold">Giao dịch nạp xu</h1>
          <p className="text-sm text-muted-foreground">Theo dõi doanh thu, tỷ lệ thành công và chi tiết từng giao dịch.</p>
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
        <TransactionFilters
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onSubmit={applySearch}
          statusValue={params.status ?? "all"}
          providerValue={params.provider ?? "all"}
          typeValue={params.type ?? "topup"}
          datePreset={datePreset}
          statusOptions={normalizeStatusOptions(data?.filters.statuses)}
          providerOptions={normalizeProviderOptions(data?.filters.providers)}
          typeOptions={normalizeTypeOptions(data?.filters.types)}
          loading={loading}
          onStatusChange={changeStatus}
          onProviderChange={changeProvider}
          onTypeChange={changeType}
          onDatePresetChange={changeDatePreset}
          onReset={resetFilters}
        />

        <TransactionStats
          summary={data?.summary}
          statusBreakdown={data?.statusBreakdown}
          providerBreakdown={data?.providerBreakdown}
          loading={loading}
        />

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <TransactionTable transactions={data?.transactions} loading={loading} onSelect={handleSelect} />
          <RecentFailedTransactions transactions={data?.recentFailed} loading={loading} />
        </div>

        <PaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          disabled={loading}
          onPageChange={changePage}
        />
      </div>

      <TransactionDetailSheet
        transaction={selected}
        open={detailOpen}
        onOpenChange={handleSheetChange}
        onTransactionUpdate={handleTransactionUpdate}
        onActionCompleted={refresh}
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
        Trang {currentPage}/{totalPages} • {totalItems.toLocaleString("vi-VN")} giao dịch
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
