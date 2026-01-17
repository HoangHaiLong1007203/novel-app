"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import TrendSparkline from "./TrendSparkline";
import type { StatsMetric } from "@/types/adminDashboard";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface StatsCardProps {
  metric: StatsMetric;
}

export default function StatsCard({ metric }: StatsCardProps) {
  const isPositive = metric.trendPercent >= 0;
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{metric.title}</CardDescription>
        <div className="flex items-baseline justify-between gap-3">
          <CardTitle className="text-3xl font-bold">{metric.value}</CardTitle>
          <TrendSparkline data={metric.dataset} className="hidden sm:block" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2 text-sm">
          <span className={cn("inline-flex items-center gap-1 font-medium", isPositive ? "text-emerald-600" : "text-red-600")}
          >
            <TrendIcon className="size-4" />
            {Math.abs(metric.trendPercent)}%
          </span>
          <span className="text-muted-foreground">{metric.subLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}
