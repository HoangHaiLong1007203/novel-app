"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchAdminTransactions } from "@/lib/api";
import { toNormalizedError, type NormalizedError } from "@/lib/errors";
import type {
  AdminTransactionQuery,
  AdminTransactionsResponse,
  AdminTransactionStatus,
  AdminTransactionProvider,
  AdminTransactionType,
} from "@/types/adminTransactions";

const DEFAULT_QUERY: AdminTransactionQuery = {
  page: 1,
  limit: 20,
  type: "all",
};

type DatePreset = "all" | "7d" | "30d" | "90d";

const presetToRange = (preset: DatePreset): Pick<AdminTransactionQuery, "dateFrom" | "dateTo"> => {
  if (preset === "all") return { dateFrom: undefined, dateTo: undefined };
  const daysMap: Record<Exclude<DatePreset, "all">, number> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
  };
  const days = daysMap[preset] ?? 0;
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - days);
  return { dateFrom: from.toISOString(), dateTo: undefined };
};

const buildQueryParams = (raw: AdminTransactionQuery): AdminTransactionQuery => {
  const next: AdminTransactionQuery = {};
  if (typeof raw.page === "number") next.page = raw.page;
  if (typeof raw.limit === "number") next.limit = raw.limit;
  if (raw.type && raw.type !== "all") next.type = raw.type;
  if (raw.status && raw.status !== "all") next.status = raw.status;
  if (raw.provider && raw.provider !== "all") next.provider = raw.provider;
  if (raw.search) next.search = raw.search.trim();
  if (raw.dateFrom) next.dateFrom = raw.dateFrom;
  if (raw.dateTo) next.dateTo = raw.dateTo;
  return next;
};

export function useAdminTransactions(initial: Partial<AdminTransactionQuery> = {}, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const baseParamsRef = useRef<AdminTransactionQuery>({ ...DEFAULT_QUERY, ...initial });
  const [params, setParams] = useState<AdminTransactionQuery>(baseParamsRef.current);
  const [datePreset, setDatePresetState] = useState<DatePreset>("all");
  const [searchValue, setSearchValue] = useState(params.search ?? "");
  const [data, setData] = useState<AdminTransactionsResponse | null>(null);
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
        const response = await fetchAdminTransactions(query);
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

  const updateParams = useCallback((changes: Partial<AdminTransactionQuery>, opts?: { resetPage?: boolean }) => {
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
    (status: AdminTransactionStatus | "all") => {
      updateParams({ status });
    },
    [updateParams]
  );

  const changeProvider = useCallback(
    (provider: AdminTransactionProvider | "all") => {
      updateParams({ provider });
    },
    [updateParams]
  );

  const changeType = useCallback(
    (type: AdminTransactionType | "all") => {
      updateParams({ type });
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

  const derived = useMemo(() => {
    const successCount = data?.statusBreakdown.find((row) => row.status === "success")?.count ?? 0;
    const totalCount = data?.pagination.total ?? 0;
    const successRate = totalCount ? successCount / totalCount : 0;
    const pendingCount = data?.statusBreakdown.find((row) => row.status === "pending")?.count ?? 0;
    return { successRate, pendingCount };
  }, [data]);

  const resetFilters = useCallback(() => {
    setParams({ ...baseParamsRef.current });
    setSearchValue("");
    setDatePresetState("all");
  }, []);

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
    changeProvider,
    changeType,
    changePage,
    refresh,
    derived,
    resetFilters,
  };
}
