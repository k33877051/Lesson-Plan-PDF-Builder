"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NavLinks } from "@/components/layout/nav-links";
import {
  createNavItem,
  mainNavItems,
  secondaryNavItems,
} from "@/lib/nav-config";
import { useI18n } from "@/components/i18n/language-provider";
import { GraduationCap, FilePlus } from "lucide-react";

export function Sidebar() {
  const { t } = useI18n();
  const CreateIcon = createNavItem.icon;

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-3 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <GraduationCap className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-tight">{t("app.name")}</span>
          <span className="text-xs text-muted-foreground">{t("app.tagline")}</span>
        </div>
      </div>

      <Separator />

      <div className="p-4">
        <Button className="w-full gap-2" asChild>
          <Link href={createNavItem.href}>
            <FilePlus className="h-4 w-4" />
            {t("nav.createLessonPlan")}
          </Link>
        </Button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        <NavLinks items={mainNavItems} variant="sidebar" />
      </nav>

      <Separator className="mx-3 w-auto" />

      <nav className="space-y-1 px-3 py-2">
        <NavLinks items={secondaryNavItems} variant="sidebar" />
      </nav>

      <div className="border-t p-4">
        <p className="text-center text-xs text-muted-foreground">{t("app.copyright")}</p>
      </div>
    </aside>
  );
}
