"use client";

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import type { PaymentSummaryData } from "@/types/adminDashboard";

interface PaymentSummaryCardProps {
  summary: PaymentSummaryData;
}

export default function PaymentSummaryCard({ summary }: PaymentSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Thanh toán & doanh thu</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Doanh thu hôm nay</p>
            <p className="text-2xl font-semibold">{summary.totalVnd.toLocaleString("vi-VN")} ₫</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Giao dịch</p>
            <p className="text-2xl font-semibold">{summary.totalTransactions}</p>
          </div>
        </div>
        <div className="space-y-3">
          {summary.providerBreakdown.map((provider) => (
            <div key={provider.provider}>
              <div className="flex items-center justify-between text-sm">
                <span>{provider.provider}</span>
                <Badge variant="outline">{provider.percentage}%</Badge>
              </div>
              <div className="mt-1 h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${provider.percentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {provider.amount.toLocaleString("vi-VN")} ₫
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
