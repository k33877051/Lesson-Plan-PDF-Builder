"use client";

import Link from "next/link";
import { GraduationCap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NavLinks } from "@/components/layout/nav-links";
import {
  createNavItem,
  mainNavItems,
  secondaryNavItems,
} from "@/lib/nav-config";
import { cn } from "@/lib/utils";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const CreateIcon = createNavItem.icon;

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(100vw-3rem,18rem)] flex-col border-r bg-card shadow-xl transition-transform duration-200 md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!open}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Lesson Plan</p>
              <p className="text-xs text-muted-foreground">PDF Builder</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="ปิดเมนู">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Separator />

        <div className="p-4">
          <Button className="w-full gap-2" asChild onClick={onClose}>
            <Link href={createNavItem.href}>
              <CreateIcon className="h-4 w-4" />
              สร้างแผนการสอนใหม่
            </Link>
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          <NavLinks items={mainNavItems} onNavigate={onClose} variant="sidebar" />
        </nav>

        <Separator className="mx-3 w-auto" />

        <nav className="space-y-1 px-3 py-3">
          <NavLinks items={secondaryNavItems} onNavigate={onClose} variant="sidebar" />
        </nav>
      </aside>
    </>
  );
}
