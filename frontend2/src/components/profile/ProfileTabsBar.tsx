"use client";

import { Fragment } from "react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ProfileSidebarItemConfig } from "./ProfileSidebar";

interface ProfileTabsBarProps {
  items: ProfileSidebarItemConfig[];
  activeKey?: string;
  onNavigate?: (href: string) => void;
  className?: string;
}

export function ProfileTabsBar({ items, activeKey, onNavigate, className }: ProfileTabsBarProps) {
  return (
    <Tabs value={activeKey} className={cn("w-full", className)}>
      <TabsList className="grid w-full grid-cols-2 gap-2 rounded-2xl border bg-card/90 p-1 text-xs shadow-sm sm:grid-cols-4">
        {items.map((item) => (
          <Fragment key={item.key}>
            <TabsTrigger
              value={item.key}
              disabled={item.disabled}
              onClick={() => {
                if (!item.disabled && item.href && onNavigate) {
                  onNavigate(item.href);
                }
              }}
              className="flex h-10 flex-col items-center justify-center gap-1 rounded-xl text-[0.8rem] font-semibold uppercase tracking-wide"
            >
              <item.icon className="size-4" />
              <span>{item.label}</span>
            </TabsTrigger>
          </Fragment>
        ))}
      </TabsList>
    </Tabs>
  );
}

export default ProfileTabsBar;
