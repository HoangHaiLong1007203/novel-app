"use client";

import { FormEvent, type ReactNode } from "react";
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import type {
  AdminReportCategory,
  AdminReportPriority,
  AdminReportStatus,
  AdminReportTargetType,
} from "@/types/adminReports";

export type StatusFilterValue = AdminReportStatus | "all";
export type PriorityFilterValue = AdminReportPriority | "all";
export type CategoryFilterValue = AdminReportCategory | "all";
export type TargetTypeFilterValue = AdminReportTargetType | "all";
export type DatePresetValue = "all" | "7d" | "30d" | "90d";

interface ReportFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSubmit: () => void;
  statusValue: StatusFilterValue;
  priorityValue: PriorityFilterValue;
  categoryValue: CategoryFilterValue;
  targetTypeValue: TargetTypeFilterValue;
  datePreset: DatePresetValue;
  statusOptions?: StatusFilterValue[];
  priorityOptions?: PriorityFilterValue[];
  categoryOptions?: CategoryFilterValue[];
  targetTypeOptions?: TargetTypeFilterValue[];
  loading: boolean;
  onStatusChange: (value: StatusFilterValue) => void;
  onPriorityChange: (value: PriorityFilterValue) => void;
  onCategoryChange: (value: CategoryFilterValue) => void;
  onTargetTypeChange: (value: TargetTypeFilterValue) => void;
  onDatePresetChange: (value: DatePresetValue) => void;
  onReset: () => void;
}

const DATE_PRESETS: Array<{ value: DatePresetValue; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
  { value: "90d", label: "90 ngày" },
];

const TARGET_LABELS: Record<AdminReportTargetType, string> = {
  novel: "Truyện",
  chapter: "Chương",
  comment: "Bình luận",
  review: "Đánh giá",
  user: "Người dùng",
  system: "Hệ thống",
};

export function ReportFilters(props: ReportFiltersProps) {
  const {
    searchValue,
    onSearchChange,
    onSubmit,
    statusValue,
    priorityValue,
    categoryValue,
    targetTypeValue,
    datePreset,
    statusOptions,
    priorityOptions,
    categoryOptions,
    targetTypeOptions,
    loading,
    onStatusChange,
    onPriorityChange,
    onCategoryChange,
    onTargetTypeChange,
    onDatePresetChange,
    onReset,
  } = props;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const resolvedStatuses: StatusFilterValue[] = ["all", ...((statusOptions ?? []) as AdminReportStatus[])];
  const resolvedPriorities: PriorityFilterValue[] = ["all", ...((priorityOptions ?? []) as AdminReportPriority[])];
  const resolvedCategories: CategoryFilterValue[] = ["all", ...((categoryOptions ?? []) as AdminReportCategory[])];
  const resolvedTargetTypes: TargetTypeFilterValue[] = ["all", ...((targetTypeOptions ?? []) as AdminReportTargetType[])];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border p-4 shadow-sm">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-muted-foreground">Tìm kiếm</label>
        <div className="flex flex-col gap-2 md:flex-row">
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Username, email hoặc tiêu đề"
            className="flex-1"
          />
          <Button type="submit" disabled={loading} className="md:w-32">
            Lọc
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
        <FilterField label="Độ ưu tiên">
          <Select value={priorityValue} onValueChange={onPriorityChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              {resolvedPriorities.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority === "all" ? "Tất cả" : priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="Danh mục">
          <Select value={categoryValue} onValueChange={onCategoryChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              {resolvedCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === "all" ? "Tất cả" : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="Đối tượng">
          <Select value={targetTypeValue} onValueChange={onTargetTypeChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              {resolvedTargetTypes.map((target) => (
                <SelectItem key={target} value={target}>
                  {target === "all" ? "Tất cả" : TARGET_LABELS[target as AdminReportTargetType]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-muted-foreground">Khoảng thời gian</label>
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
