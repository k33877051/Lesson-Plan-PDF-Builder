"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { ResponsiveContainer } from "@/components/layout/responsive-container";
import { useI18n } from "@/components/i18n/language-provider";
import { FileText, FolderOpen, Sparkles, Printer, ArrowRight } from "lucide-react";

const helpLinks = [
  { key: "create" as const, href: "/dashboard/lesson-plans/new", icon: FileText },
  { key: "upload" as const, href: "/dashboard/upload", icon: FolderOpen },
  { key: "ai" as const, href: "/editor/new", icon: Sparkles },
  { key: "export" as const, href: "/dashboard/lesson-plans", icon: Printer },
];

export function HelpPageContent() {
  const { t } = useI18n();

  return (
    <ResponsiveContainer className="space-y-6">
      <PageHeader title={t("help.title")} description={t("help.description")} />

      <div className="grid gap-4 sm:grid-cols-2">
        {helpLinks.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.href} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Icon className="h-5 w-5 shrink-0" />
                  {t(`help.sections.${section.key}.title`)}
                </CardTitle>
                <CardDescription>
                  {t(`help.sections.${section.key}.description`)}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href={section.href}>
                    {t("common.openPage")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ResponsiveContainer>
  );
}
