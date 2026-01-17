export type AdminReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";
export type AdminReportPriority = "low" | "medium" | "high";
export type AdminReportCategory = "spam" | "abuse" | "copyright" | "nsfw" | "other";
export type AdminReportTargetType = "novel" | "chapter" | "comment" | "review" | "user" | "system";

export interface AdminReportUser {
  _id?: string;
  username?: string;
  email?: string;
  role?: string;
}

export interface AdminReportNote {
  author?: AdminReportUser | null;
  message?: string | null;
  createdAt?: string;
}

export interface AdminReportItem {
  _id: string;
  reporter?: AdminReportUser | null;
  assignedTo?: AdminReportUser | null;
  targetType: AdminReportTargetType;
  targetId: string;
  targetTitle?: string | null;
  targetSnippet?: string | null;
  reason: string;
  category: AdminReportCategory;
  priority: AdminReportPriority;
  status: AdminReportStatus;
  tags?: string[] | null;
  notes?: AdminReportNote[] | null;
  metadata?: Record<string, unknown> | null;
  resolutionNote?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminReportSummary {
  totalReports: number;
  pendingCount: number;
  reviewingCount: number;
  resolvedToday: number;
}

export interface AdminReportStatusBreakdown {
  status: AdminReportStatus | "unknown";
  count: number;
}

export interface AdminReportPriorityBreakdown {
  priority: AdminReportPriority;
  count: number;
}

export interface AdminReportCategoryBreakdown {
  category: AdminReportCategory | "other";
  count: number;
}

export interface AdminReportPagination {
  currentPage: number;
  limit: number;
  totalPages: number;
  total: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AdminReportFiltersMeta {
  statuses: AdminReportStatus[];
  priorities: AdminReportPriority[];
  categories: AdminReportCategory[];
  targetTypes: AdminReportTargetType[];
}

export interface AdminReportsResponse {
  success: boolean;
  summary: AdminReportSummary;
  statusBreakdown: AdminReportStatusBreakdown[];
  priorityBreakdown: AdminReportPriorityBreakdown[];
  categoryBreakdown: AdminReportCategoryBreakdown[];
  filters: AdminReportFiltersMeta;
  reports: AdminReportItem[];
  pagination: AdminReportPagination;
}

export interface AdminReportQuery {
  page?: number;
  limit?: number;
  status?: AdminReportStatus | "all";
  priority?: AdminReportPriority | "all";
  category?: AdminReportCategory | "all";
  targetType?: AdminReportTargetType | "all";
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}
