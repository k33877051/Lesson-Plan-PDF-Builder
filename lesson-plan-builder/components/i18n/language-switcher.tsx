"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";
import { setAppLanguage, useI18n } from "@/components/i18n/language-provider";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale } = useI18n();

  const selectLocale = (next: Locale) => {
    if (next !== locale) {
      setAppLanguage(next);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center rounded-md border bg-muted/50 p-0.5 text-xs font-medium",
        className
      )}
      role="group"
      aria-label="Language"
    >
      <Button
        type="button"
        variant={locale === "th" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 px-2.5"
        onClick={() => selectLocale("th")}
        aria-pressed={locale === "th"}
      >
        TH
      </Button>
      <Button
        type="button"
        variant={locale === "en" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 px-2.5"
        onClick={() => selectLocale("en")}
        aria-pressed={locale === "en"}
      >
        EN
      </Button>
    </div>
  );
}
