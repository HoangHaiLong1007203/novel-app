import { API } from "@/lib/api";
import type {
  ActivityItem,
  ModerationQueueItem,
  PaymentSummaryData,
  StatsMetric,
  SystemHealthItem,
  TopNovelItem,
} from "@/types/adminDashboard";

export interface AdminDashboardOverviewResponse {
  success: boolean;
  stats: StatsMetric[];
  activities: ActivityItem[];
  moderationQueue: ModerationQueueItem[];
  paymentSummary: PaymentSummaryData;
  topNovels: TopNovelItem[];
  systemHealth: SystemHealthItem[];
}

export async function fetchAdminDashboardOverview() {
  const res = await API.get<AdminDashboardOverviewResponse>("/api/admin/dashboard");
  return res.data;
}
