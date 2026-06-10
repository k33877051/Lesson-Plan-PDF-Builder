"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isNavActive, type NavItem } from "@/lib/nav-config";
import { useI18n } from "@/components/i18n/language-provider";

interface NavLinksProps {
  items: NavItem[];
  onNavigate?: () => void;
  variant?: "sidebar" | "drawer" | "compact";
}

export function NavLinks({ items, onNavigate, variant = "sidebar" }: NavLinksProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <>
      {items.map((item) => {
        const Icon = item.icon;
        const active = isNavActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors",
              variant === "compact" ? "flex-col gap-1 px-2 py-1.5 text-[11px]" : "px-3 py-2.5",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className={cn(variant === "compact" ? "h-5 w-5" : "h-5 w-5", active && "text-primary")} />
            <span className={cn(variant === "compact" && "leading-tight text-center")}>{t(item.titleKey)}</span>
          </Link>
        );
      })}
    </>
  );
}
