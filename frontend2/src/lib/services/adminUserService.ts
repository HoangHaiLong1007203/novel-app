import { API } from "@/lib/api";
import type {
  AdminUsersResponse,
  AdminUserRole,
  AdminUserStatus,
  UpdateAdminUserResponse,
} from "@/types/adminUsers";

export type AdminUserQueryParams = {
  search?: string;
  role?: AdminUserRole | "all";
  status?: AdminUserStatus | "all";
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "username" | "coins";
  sortDir?: "asc" | "desc";
};

export async function fetchAdminUsers(params: AdminUserQueryParams = {}) {
  const queryParams: Record<string, string | number> = {};

  if (params.search) queryParams.search = params.search;
  if (params.role && params.role !== "all") queryParams.role = params.role;
  if (params.status && params.status !== "all") queryParams.status = params.status;
  if (params.page) queryParams.page = params.page;
  if (params.limit) queryParams.limit = params.limit;
  if (params.sortBy) queryParams.sortBy = params.sortBy;
  if (params.sortDir) queryParams.sortDir = params.sortDir;

  const res = await API.get<AdminUsersResponse>("/api/admin/users", {
    params: queryParams,
  });

  return res.data;
}

export async function updateAdminUserRole(userId: string, role: AdminUserRole) {
  const res = await API.patch<UpdateAdminUserResponse>(`/api/admin/users/${userId}/role`, { role });
  return res.data;
}

export async function updateAdminUserStatus(userId: string, status: AdminUserStatus) {
  const res = await API.patch<UpdateAdminUserResponse>(`/api/admin/users/${userId}/status`, { status });
  return res.data;
}
