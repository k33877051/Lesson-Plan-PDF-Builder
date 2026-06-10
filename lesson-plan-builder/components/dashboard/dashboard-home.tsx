"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/language-provider";
import { formatNumberByLocale } from "@/lib/i18n";
import { FilePlus, Sparkles } from "lucide-react";

interface DashboardHomeProps {
  totalLessonPlans: number;
  exportedPdfCount: number;
}

export function DashboardHome({ totalLessonPlans, exportedPdfCount }: DashboardHomeProps) {
  const { t, locale } = useI18n();

  return (
    <>
      <PageHeader
        title={t("dashboard.title")}
        description={t("dashboard.description")}
        actions={
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/lesson-plans/new">
              <FilePlus className="mr-2 h-4 w-4" />
              {t("dashboard.createNew")}
            </Link>
          </Button>
        }
      />

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">{t("dashboard.heroSubtitle")}</span>
            </div>
            <p className="text-base font-semibold md:text-lg">{t("dashboard.heroTitle")}</p>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.heroStats", {
                total: formatNumberByLocale(totalLessonPlans, locale),
                exported: formatNumberByLocale(exportedPdfCount, locale),
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
