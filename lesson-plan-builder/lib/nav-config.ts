import {
  LayoutDashboard,
  FileText,
  Upload,
  Settings,
  HelpCircle,
  FolderOpen,
  FilePlus,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  titleKey: string;
  href: string;
  icon: LucideIcon;
  /** แสดงใน bottom nav บนมือถือ */
  showInBottomNav?: boolean;
}

export const mainNavItems: NavItem[] = [
  { titleKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard, showInBottomNav: true },
  { titleKey: "nav.lessonPlans", href: "/dashboard/lesson-plans", icon: FileText, showInBottomNav: true },
  {
    titleKey: "nav.aiBuilder",
    href: "/dashboard/lesson-builder",
    icon: Sparkles,
    showInBottomNav: false,
  },
  { titleKey: "nav.projects", href: "/dashboard/projects", icon: FolderOpen, showInBottomNav: false },
  { titleKey: "nav.upload", href: "/dashboard/upload", icon: Upload, showInBottomNav: true },
];

export const secondaryNavItems: NavItem[] = [
  { titleKey: "nav.settings", href: "/dashboard/settings", icon: Settings, showInBottomNav: true },
  { titleKey: "nav.help", href: "/dashboard/help", icon: HelpCircle, showInBottomNav: false },
];

export const createNavItem: NavItem = {
  titleKey: "nav.createLessonPlan",
  href: "/dashboard/lesson-plans/new",
  icon: FilePlus,
  showInBottomNav: false,
};

export const bottomNavItems: NavItem[] = [
  ...mainNavItems.filter((item) => item.showInBottomNav),
  secondaryNavItems[0],
];

export function isNavActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (pathname === href) return true;
  if (href !== "/dashboard" && pathname.startsWith(`${href}/`)) return true;
  return false;
}
