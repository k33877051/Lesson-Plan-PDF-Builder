"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { useI18n } from "@/components/i18n/language-provider";
import { formatNumberByLocale } from "@/lib/i18n";

interface DashboardStatsProps {
  totalLessonPlans: number;
  completedLessonPlans: number;
  draftLessonPlans: number;
  exportedPdfCount: number;
}

export function DashboardStats({
  totalLessonPlans,
  completedLessonPlans,
  draftLessonPlans,
  exportedPdfCount,
}: DashboardStatsProps) {
  const { t, locale } = useI18n();

  const stats = [
    {
      title: t("dashboard.stats.total"),
      value: formatNumberByLocale(totalLessonPlans, locale),
      description: t("dashboard.stats.totalDesc"),
      icon: FileText,
    },
    {
      title: t("dashboard.stats.completed"),
      value: formatNumberByLocale(completedLessonPlans, locale),
      description: t("dashboard.stats.completedDesc"),
      icon: CheckCircle,
    },
    {
      title: t("dashboard.stats.draft"),
      value: formatNumberByLocale(draftLessonPlans, locale),
      description: t("dashboard.stats.draftDesc"),
      icon: Clock,
    },
    {
      title: t("dashboard.stats.exported"),
      value: formatNumberByLocale(exportedPdfCount, locale),
      description: t("dashboard.stats.exportedDesc"),
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className="rounded-md bg-primary/10 p-2">
                <Icon className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
