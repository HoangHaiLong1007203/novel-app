export interface StatsMetric {
  id: string;
  title: string;
  value: string;
  subLabel: string;
  trendPercent: number;
  dataset: number[];
}

export type ActivityType = "novel" | "user" | "payment" | "report";

export interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  target?: string;
  timeAgo: string;
  type: ActivityType;
  highlight?: boolean;
}

export type ModerationStatus = "pending" | "escalated" | "snoozed";

export interface ModerationQueueItem {
  id: string;
  title: string;
  author: string;
  reason: string;
  status: ModerationStatus;
  reportedAt: string;
}

export interface PaymentProviderSummary {
  provider: string;
  amount: number;
  percentage: number;
}

export interface PaymentSummaryData {
  totalVnd: number;
  totalTransactions: number;
  providerBreakdown: PaymentProviderSummary[];
}

export interface TopNovelItem {
  id: string;
  title: string;
  poster: string;
  revenue: number;
  reviews: number;
  status: string;
}

export interface SystemHealthItem {
  id: string;
  label: string;
  status: "ok" | "warn" | "error";
  message: string;
}

export interface QuickActionItem {
  id: string;
  label: string;
  description: string;
  href?: string;
  onClick?: () => void;
}
