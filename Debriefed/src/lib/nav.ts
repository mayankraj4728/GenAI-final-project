import {
  LayoutDashboard,
  Upload,
  ListVideo,
  Search,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Match nested routes (e.g. /meetings/[id]) as active */
  matchPrefix?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Upload", href: "/upload", icon: Upload },
  { title: "Meetings", href: "/meetings", icon: ListVideo, matchPrefix: true },
  { title: "Search", href: "/search", icon: Search },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
];
