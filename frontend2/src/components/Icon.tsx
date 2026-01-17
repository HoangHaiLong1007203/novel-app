"use client";
import {
  Home,
  Search,
  User,
  Heart,
  BookOpen,
  Bell,
  BellOff,
  Settings,
  Bookmark,
  Star,
  MessageCircle,
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Loader2,
  X,
} from "lucide-react";

const icons = {
  home: Home,
  search: Search,
  user: User,
  heart: Heart,
  book: BookOpen,
  bell: Bell,
  bellOff: BellOff,
  settings: Settings,
  bookmark: Bookmark,
  star: Star,
  message: MessageCircle,
  login: LogIn,
  logout: LogOut,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  loader: Loader2,
  x: X,
};

export type IconName = keyof typeof icons;
export type IconColor =
  | "default"
  | "foreground"
  | "muted"
  | "primary"
  | "accent"
  | "destructive";

interface IconProps {
  name: IconName | string;
  size?: number;
  className?: string;
  hover?: boolean;
  color?: IconColor;
}

/**
 * Dynamic Icon component (theme-aware + shadcn synced)
 */
export default function Icon({
  name,
  size = 20,
  className = "",
  hover = false,
  color = "default",
}: IconProps) {
  const LucideIcon = icons[name as IconName] || X;

  const colorMap: Record<IconColor, string> = {
    default: "text-slate-600 dark:text-slate-300",
    foreground: "text-foreground",
    muted: "text-muted-foreground",
    primary: "text-primary",
    accent: "text-accent-foreground",
    destructive: "text-destructive",
  };

  const hoverEffect = hover
    ? "transition-colors hover:text-primary dark:hover:text-primary-foreground"
    : "";

  return (
    <LucideIcon
      size={size}
      className={`${colorMap[color]} ${hoverEffect} ${className}`}
    />
  );
}
