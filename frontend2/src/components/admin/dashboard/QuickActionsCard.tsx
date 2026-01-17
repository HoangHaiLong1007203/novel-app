"use client";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import type { QuickActionItem } from "@/types/adminDashboard";
import Link from "next/link";

interface QuickActionsCardProps {
  actions: QuickActionItem[];
}

export default function QuickActionsCard({ actions }: QuickActionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tác vụ nhanh</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {actions.map((action) => {
          const content = (
            <div className="flex flex-col items-start text-left">
              <span className="font-medium">{action.label}</span>
              <span className="text-xs text-muted-foreground">{action.description}</span>
            </div>
          );

          if (action.href) {
            return (
              <Button key={action.id} variant="outline" asChild className="justify-start">
                <Link href={action.href}>{content}</Link>
              </Button>
            );
          }

          return (
            <Button key={action.id} variant="outline" className="justify-start" onClick={action.onClick}>
              {content}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
