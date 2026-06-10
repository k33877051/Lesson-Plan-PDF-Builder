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
  title: string;
  href: string;
  icon: LucideIcon;
  /** แสดงใน bottom nav บนมือถือ */
  showInBottomNav?: boolean;
}

export const mainNavItems: NavItem[] = [
  { title: "แดชบอร์ด", href: "/dashboard", icon: LayoutDashboard, showInBottomNav: true },
  { title: "แผนการสอน", href: "/dashboard/lesson-plans", icon: FileText, showInBottomNav: true },
  {
    title: "สร้างด้วย AI",
    href: "/dashboard/lesson-builder",
    icon: Sparkles,
    showInBottomNav: false,
  },
  { title: "โปรเจกต์", href: "/dashboard/projects", icon: FolderOpen, showInBottomNav: false },
  { title: "นำเข้าไฟล์", href: "/dashboard/upload", icon: Upload, showInBottomNav: true },
];

export const secondaryNavItems: NavItem[] = [
  { title: "ตั้งค่า", href: "/dashboard/settings", icon: Settings, showInBottomNav: true },
  { title: "ช่วยเหลือ", href: "/dashboard/help", icon: HelpCircle, showInBottomNav: false },
];

export const createNavItem: NavItem = {
  title: "สร้างใหม่",
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
