"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  FileText,
  Upload,
  Settings,
  HelpCircle,
  GraduationCap,
  FilePlus,
  FolderOpen,
} from "lucide-react";

const mainNavItems = [
  {
    title: "แดชบอร์ด",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "แผนการสอนของฉัน",
    href: "/dashboard/lesson-plans",
    icon: FileText,
  },
  {
    title: "โปรเจกต์",
    href: "/dashboard/projects",
    icon: FolderOpen,
  },
  {
    title: "นำเข้าไฟล์",
    href: "/dashboard/upload",
    icon: Upload,
  },
];

const secondaryNavItems = [
  {
    title: "ตั้งค่า",
    href: "/dashboard/settings",
    icon: Settings,
  },
  {
    title: "ช่วยเหลือ",
    href: "/dashboard/help",
    icon: HelpCircle,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <GraduationCap className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm leading-tight">Lesson Plan</span>
          <span className="text-xs text-muted-foreground">PDF Builder</span>
        </div>
      </div>

      <Separator />

      {/* Create New Button */}
      <div className="p-4">
        <Button className="w-full gap-2" asChild>
          <Link href="/dashboard/lesson-plans/new">
            <FilePlus className="h-4 w-4" />
            สร้างแผนการสอนใหม่
          </Link>
        </Button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <Separator className="mx-3 w-auto" />

      {/* Secondary Navigation */}
      <nav className="space-y-1 px-3 py-2">
        {secondaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground text-center">
          © 2026 Lesson Plan Builder
        </p>
      </div>
    </aside>
  );
}
