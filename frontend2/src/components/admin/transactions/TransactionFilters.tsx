"use client";

import { FormEvent, type ReactNode } from "react";
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import type { AdminTransactionProvider, AdminTransactionStatus, AdminTransactionType } from "@/types/adminTransactions";

export type StatusFilterValue = AdminTransactionStatus | "all";
export type ProviderFilterValue = AdminTransactionProvider | "all";
export type TypeFilterValue = AdminTransactionType | "all";
export type DatePresetValue = "all" | "7d" | "30d" | "90d";

interface TransactionFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSubmit: () => void;
  statusValue: StatusFilterValue;
  providerValue: ProviderFilterValue;
  typeValue: TypeFilterValue;
  datePreset: DatePresetValue;
  statusOptions?: StatusFilterValue[];
  providerOptions?: ProviderFilterValue[];
  typeOptions?: TypeFilterValue[];
  loading: boolean;
  onStatusChange: (value: StatusFilterValue) => void;
  onProviderChange: (value: ProviderFilterValue) => void;
  onTypeChange: (value: TypeFilterValue) => void;
  onDatePresetChange: (value: DatePresetValue) => void;
  onReset: () => void;
}

const DATE_PRESETS: Array<{ value: DatePresetValue; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
  { value: "90d", label: "90 ngày" },
];

export function TransactionFilters(props: TransactionFiltersProps) {
  const {
    searchValue,
    onSearchChange,
    onSubmit,
    statusValue,
    providerValue,
    typeValue,
    datePreset,
    statusOptions,
    providerOptions,
    typeOptions,
    loading,
    onStatusChange,
    onProviderChange,
    onTypeChange,
    onDatePresetChange,
    onReset,
  } = props;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const resolvedStatuses: StatusFilterValue[] = ["all", ...((statusOptions ?? []) as AdminTransactionStatus[])];
  const resolvedProviders: ProviderFilterValue[] = ["all", ...((providerOptions ?? []) as AdminTransactionProvider[])];
  const resolvedTypes: TypeFilterValue[] = [
    "all",
    ...((typeOptions ?? ["topup", "purchase", "withdraw"]) as AdminTransactionType[]),
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border p-4 shadow-sm">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-muted-foreground">Tìm kiếm</label>
        <div className="flex flex-col gap-2 md:flex-row">
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Username, email hoặc mã đơn"
            className="flex-1"
          />
          <Button type="submit" disabled={loading} className="md:w-32">
            Lọc
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <FilterField label="Loại giao dịch">
          <Select value={typeValue} onValueChange={onTypeChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn" />
            </SelectTrigger>
            <SelectContent>
              {resolvedTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type === "all"
                    ? "Tất cả"
                    : type === "topup"
                    ? "Nạp xu"
                    : type === "purchase"
                    ? "Mua chương"
                    : type === "withdraw"
                    ? "Rút xu"
                    : "Tặng quà"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="Trạng thái">
          <Select value={statusValue} onValueChange={onStatusChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              {resolvedStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === "all" ? "Tất cả" : status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="Cổng thanh toán">
          <Select value={providerValue} onValueChange={onProviderChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              {resolvedProviders.map((provider) => (
                <SelectItem key={provider} value={provider}>
                  {provider === "all" ? "Tất cả" : provider.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="Khoảng thời gian">
          <Select value={datePreset} onValueChange={onDatePresetChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn" />
            </SelectTrigger>
            <SelectContent>
              {DATE_PRESETS.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="ghost" onClick={onReset} disabled={loading}>
          Xóa bộ lọc
        </Button>
      </div>
    </form>
  );
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
