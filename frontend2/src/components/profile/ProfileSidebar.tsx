import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface ProfileSidebarItemConfig {
  key: string;
  label: string;
  description: string;
  href?: string;
  icon: LucideIcon;
  disabled?: boolean;
}

interface ProfileSidebarProps {
  items: ProfileSidebarItemConfig[];
  activeKey?: string;
  title?: string;
  subtitle?: string;
}

export function ProfileSidebar({
  items,
  activeKey,
  title = "Trung tâm tài khoản",
  subtitle = "Quản lý nhanh các mục",
}: ProfileSidebarProps) {
  return (
    <Card className="gap-0 p-0">
      <CardHeader className="border-b px-6 py-5">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground">
          {subtitle}
        </CardDescription>
      </CardHeader>
      <div className="flex flex-col">
        {items.map((item) => (
          <ProfileSidebarItem
            key={item.key}
            item={item}
            isActive={item.key === activeKey}
          />
        ))}
      </div>
    </Card>
  );
}

interface ProfileSidebarItemProps {
  item: ProfileSidebarItemConfig;
  isActive: boolean;
}

function ProfileSidebarItem({ item, isActive }: ProfileSidebarItemProps) {
  const { icon: Icon, label, description, href, disabled } = item;

  const content = (
    <div
      className={cn(
        "px-6 py-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        isActive
          ? "bg-primary/5 text-primary border-l-2 border-primary"
          : "hover:bg-muted/40"
      )}
    >
      <div className="flex items-center gap-3 text-sm font-medium">
        <Icon className="size-4" />
        <span>{label}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );

  if (disabled || !href) {
    return (
      <div aria-disabled className="border-b last:border-b-0">
        {content}
      </div>
    );
  }

  return (
    <Link href={href} className="block border-b last:border-b-0">
      {content}
    </Link>
  );
}

export default ProfileSidebar;
