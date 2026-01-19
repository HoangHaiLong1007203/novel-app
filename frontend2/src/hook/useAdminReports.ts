"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchAdminReports } from "@/lib/api";
import { toNormalizedError, type NormalizedError } from "@/lib/errors";
import type {
  AdminReportQuery,
  AdminReportsResponse,
  AdminReportStatus,
  AdminReportPriority,
  AdminReportCategory,
  AdminReportTargetType,
} from "@/types/adminReports";

const DEFAULT_QUERY: AdminReportQuery = {
  page: 1,
  limit: 20,
  status: "all",
};

type DatePreset = "all" | "7d" | "30d" | "90d";

const presetToRange = (preset: DatePreset): Pick<AdminReportQuery, "dateFrom" | "dateTo"> => {
  if (preset === "all") {
    return { dateFrom: undefined, dateTo: undefined };
  }
  const daysMap: Record<Exclude<DatePreset, "all">, number> = { "7d": 7, "30d": 30, "90d": 90 };
  const days = daysMap[preset] ?? 0;
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - days);
  return { dateFrom: from.toISOString(), dateTo: undefined };
};

const buildQueryParams = (raw: AdminReportQuery): AdminReportQuery => {
  const next: AdminReportQuery = {};
  if (typeof raw.page === "number") next.page = raw.page;
  if (typeof raw.limit === "number") next.limit = raw.limit;
  if (raw.status && raw.status !== "all") next.status = raw.status;
  if (raw.priority && raw.priority !== "all") next.priority = raw.priority;
  if (raw.category && raw.category !== "all") next.category = raw.category;
  if (raw.targetType && raw.targetType !== "all") next.targetType = raw.targetType;
  if (raw.search) next.search = raw.search.trim();
  if (raw.dateFrom) next.dateFrom = raw.dateFrom;
  if (raw.dateTo) next.dateTo = raw.dateTo;
  return next;
};

export function useAdminReports(initial: Partial<AdminReportQuery> = {}, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const baseParamsRef = useRef<AdminReportQuery>({ ...DEFAULT_QUERY, ...initial });
  const [params, setParams] = useState<AdminReportQuery>(baseParamsRef.current);
  const [datePreset, setDatePresetState] = useState<DatePreset>("all");
  const [searchValue, setSearchValue] = useState(params.search ?? "");
  const [data, setData] = useState<AdminReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<NormalizedError | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setSearchValue(params.search ?? "");
  }, [params.search]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let ignore = false;
    setLoading(true);
    setError(null);
    const run = async () => {
      try {
        const query = buildQueryParams(params);
        const response = await fetchAdminReports(query);
        if (!ignore) {
          setData(response);
        }
      } catch (err) {
        if (!ignore) {
          setError(toNormalizedError(err));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    void run();
    return () => {
      ignore = true;
    };
  }, [params, refreshKey, enabled]);

  const updateParams = useCallback((changes: Partial<AdminReportQuery>, opts?: { resetPage?: boolean }) => {
    setParams((prev) => {
      const next = { ...prev, ...changes };
      const shouldReset = opts?.resetPage ?? true;
      if (shouldReset) {
        next.page = 1;
      }
      return next;
    });
  }, []);

  const refresh = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  const applySearch = useCallback(() => {
    updateParams({ search: searchValue || undefined });
  }, [searchValue, updateParams]);

  const changeStatus = useCallback(
    (status: AdminReportStatus | "all") => {
      updateParams({ status });
    },
    [updateParams]
  );

  const changePriority = useCallback(
    (priority: AdminReportPriority | "all") => {
      updateParams({ priority });
    },
    [updateParams]
  );

  const changeCategory = useCallback(
    (category: AdminReportCategory | "all") => {
      updateParams({ category });
    },
    [updateParams]
  );

  const changeTargetType = useCallback(
    (targetType: AdminReportTargetType | "all") => {
      updateParams({ targetType });
    },
    [updateParams]
  );

  const changeDatePreset = useCallback(
    (preset: DatePreset) => {
      setDatePresetState(preset);
      const range = presetToRange(preset);
      updateParams(range);
    },
    [updateParams]
  );

  const changePage = useCallback(
    (page: number) => {
      updateParams({ page }, { resetPage: false });
    },
    [updateParams]
  );

  const resetFilters = useCallback(() => {
    setParams({ ...baseParamsRef.current });
    setSearchValue("");
    setDatePresetState("all");
  }, []);

  const derived = useMemo(() => {
    const total = data?.summary.totalReports ?? 0;
    const pending = data?.summary.pendingCount ?? 0;
    const reviewing = data?.summary.reviewingCount ?? 0;
    return { total, pending, reviewing };
  }, [data]);

  return {
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
    derived,
    resetFilters,
  };
}
