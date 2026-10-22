import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  FileSearch,
  LayoutDashboard,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Overview of reviews and blockers",
  },
  {
    href: "/reviews",
    label: "Content Reviews",
    icon: FileSearch,
    description: "Drafts and findings workspace",
  },
  {
    href: "/knowledge",
    label: "Brand Knowledge",
    icon: BookOpen,
    description: "Approved facts, terms, and policies",
  },
  {
    href: "/approvals",
    label: "Approval Queue",
    icon: ClipboardCheck,
    description: "Items awaiting human decision",
  },
  {
    href: "/analytics",
    label: "Governance Analytics",
    icon: BarChart3,
    description: "Recurring issues from completed reviews",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    description: "Organisation and engine preferences",
  },
];
