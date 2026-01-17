"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAdminDashboardOverview, type AdminDashboardOverviewResponse } from "@/lib/services/adminDashboardService";
import { toNormalizedError, type NormalizedError } from "@/lib/errors";

export function useAdminDashboardData() {
  const [data, setData] = useState<AdminDashboardOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<NormalizedError | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchAdminDashboardOverview();
      setData(response);
    } catch (err) {
      const normalized = toNormalizedError(err);
      setError(normalized);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
