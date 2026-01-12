import type { ReactNode } from "react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
} from "@/components/ui";
import { cn } from "@/lib/utils";

export interface ProfileSectionCardProps {
  title: string;
  description?: string;
  actionSlot?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function ProfileSectionCard({
  title,
  description,
  actionSlot,
  children,
  className,
  contentClassName,
}: ProfileSectionCardProps) {
  return (
    <Card className={cn("gap-0", className)}>
      <CardHeader className="border-b">
        <div>
          <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
          {description ? (
            <CardDescription className="text-sm">{description}</CardDescription>
          ) : null}
        </div>
        {actionSlot ? <CardAction>{actionSlot}</CardAction> : null}
      </CardHeader>
      <CardContent className={cn("py-6", contentClassName)}>{children}</CardContent>
    </Card>
  );
}

export default ProfileSectionCard;
