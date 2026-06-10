"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FilePlus,
  Upload,
  FileEdit,
  ArrowRight,
} from "lucide-react";
import { useI18n } from "@/components/i18n/language-provider";

export function QuickActions() {
  const { t } = useI18n();

  const actions = [
    {
      title: t("dashboard.actions.createNew"),
      description: t("dashboard.actions.createNewDesc"),
      icon: FilePlus,
      href: "/dashboard/lesson-plans/new",
      variant: "default" as const,
    },
    {
      title: t("dashboard.actions.import"),
      description: t("dashboard.actions.importDesc"),
      icon: Upload,
      href: "/dashboard/projects/new",
      variant: "outline" as const,
    },
    {
      title: t("dashboard.actions.allPlans"),
      description: t("dashboard.actions.allPlansDesc"),
      icon: FileEdit,
      href: "/dashboard/lesson-plans",
      variant: "outline" as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("dashboard.quickActions")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant={action.variant}
                className="h-auto flex-col items-start gap-2 p-4 text-left"
                asChild
              >
                <Link href={action.href}>
                  <div className="flex w-full items-center justify-between">
                    <Icon className="h-5 w-5" />
                    <ArrowRight className="h-4 w-4 opacity-50" />
                  </div>
                  <div>
                    <div className="font-semibold">{action.title}</div>
                    <div className="text-xs opacity-80">{action.description}</div>
                  </div>
                </Link>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
