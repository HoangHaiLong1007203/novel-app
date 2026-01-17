"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchAdminUsers,
  updateAdminUserRole,
  updateAdminUserStatus,
  type AdminUserQueryParams,
} from "@/lib/services/adminUserService";
import { toNormalizedError, type NormalizedError } from "@/lib/errors";
import type { AdminUsersResponse, AdminUserRole, AdminUserStatus } from "@/types/adminUsers";
import { toast } from "@/lib/toast";

const DEFAULT_PARAMS: Required<Pick<AdminUserQueryParams, "page" | "limit" | "sortBy" | "sortDir">> = {
  page: 1,
  limit: 20,
  sortBy: "createdAt",
  sortDir: "desc",
};

type QueryState = AdminUserQueryParams & typeof DEFAULT_PARAMS;

export function useAdminUsers(initialParams: Partial<AdminUserQueryParams> = {}) {
  const [params, setParams] = useState<QueryState>({
    ...DEFAULT_PARAMS,
    ...initialParams,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [data, setData] = useState<AdminUsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<NormalizedError | null>(null);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchAdminUsers(params);
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
  }, [params, refreshKey]);

  const updateParams = useCallback((changes: Partial<QueryState>) => {
    setParams((prev) => {
      const next = { ...prev, ...changes };
      const shouldResetPage =
        Object.prototype.hasOwnProperty.call(changes, "search") ||
        Object.prototype.hasOwnProperty.call(changes, "role") ||
        Object.prototype.hasOwnProperty.call(changes, "status") ||
        Object.prototype.hasOwnProperty.call(changes, "limit");

      if (shouldResetPage && typeof changes.page === "undefined") {
        next.page = 1;
      }

      return next;
    });
  }, []);

  const refresh = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  const changeUserRole = useCallback(
    async (userId: string, role: AdminUserRole) => {
      try {
        await updateAdminUserRole(userId, role);
        toast.success("Đã cập nhật vai trò người dùng");
        refresh();
      } catch (err) {
        toast.error(toNormalizedError(err).message || "Không thể cập nhật vai trò");
      }
    },
    [refresh]
  );

  const changeUserStatus = useCallback(
    async (userId: string, status: AdminUserStatus) => {
      try {
        await updateAdminUserStatus(userId, status);
        toast.success("Đã cập nhật trạng thái người dùng");
        refresh();
      } catch (err) {
        toast.error(toNormalizedError(err).message || "Không thể cập nhật trạng thái");
      }
    },
    [refresh]
  );

  const derived = useMemo(
    () => ({
      totalUsers: data?.stats.totalUsers ?? 0,
      currentPage: data?.pagination.page ?? params.page,
    }),
    [data, params.page]
  );

  return {
    params,
    data,
    loading,
    error,
    refresh,
    setParams: updateParams,
    changeUserRole,
    changeUserStatus,
    derived,
  };
}
