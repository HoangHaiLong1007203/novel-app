export interface AdminUserStats {
  totalUsers: number;
  newUsersToday: number;
  adminCount: number;
  bannedCount: number;
}

export type AdminUserRole = "user" | "admin";
export type AdminUserStatus = "active" | "banned";

export interface AdminUserListItem {
  id: string;
  username: string;
  email: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  coins: number;
  avatarUrl: string;
  createdAt: string;
  updatedAt: string;
  providers: string[];
}

export interface AdminUserActivityItem {
  id: string;
  label: string;
  timestamp: string;
  role: AdminUserRole;
  status: AdminUserStatus;
}

export interface AdminUserPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AdminUsersResponse {
  success: boolean;
  stats: AdminUserStats;
  filters: { roles: AdminUserRole[]; statuses: AdminUserStatus[] };
  users: AdminUserListItem[];
  pagination: AdminUserPagination;
  recentActivity: AdminUserActivityItem[];
}

export interface UpdateAdminUserResponse {
  success: boolean;
  user: { username: string; role: AdminUserRole; status: AdminUserStatus };
}
