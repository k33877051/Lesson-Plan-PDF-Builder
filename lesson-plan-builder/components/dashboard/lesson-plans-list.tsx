"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { ResponsiveContainer } from "@/components/layout/responsive-container";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Plus,
  Search,
  Grid3X3,
  List,
  MoreVertical,
  Edit,
  Eye,
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteLessonPlanButton } from "@/components/dashboard/DeleteLessonPlanButton";
import { useI18n } from "@/components/i18n/language-provider";
import { formatDateByLocale } from "@/lib/i18n";
import { translateGrade, translateStatus, translateSubject } from "@/lib/i18n/hooks";

export interface LessonPlanListItem {
  id: string;
  lessonTitle: string;
  subjectName: string;
  gradeLevel: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const statusVariants = {
  completed: "default" as const,
  published: "default" as const,
  draft: "secondary" as const,
  archived: "outline" as const,
};

export function LessonPlansList({ lessonPlans }: { lessonPlans: LessonPlanListItem[] }) {
  const { t, locale } = useI18n();

  return (
    <ResponsiveContainer className="space-y-6">
      <PageHeader
        title={t("lessonPlans.title")}
        description={t("lessonPlans.description")}
        actions={
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/lesson-plans/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("lessonPlans.createNew")}
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" placeholder={t("common.searchPlaceholder")} className="pl-10" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t("lessonPlans.filters.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              <SelectItem value="completed">{t("status.completed")}</SelectItem>
              <SelectItem value="draft">{t("status.draft")}</SelectItem>
              <SelectItem value="archived">{t("status.archived")}</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t("lessonPlans.filters.subject")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.allSubjects")}</SelectItem>
              <SelectItem value="science">{t("subjects.science")}</SelectItem>
              <SelectItem value="mathematics">{t("subjects.mathematics")}</SelectItem>
              <SelectItem value="english">{t("subjects.english")}</SelectItem>
              <SelectItem value="thai">{t("subjects.thai")}</SelectItem>
              <SelectItem value="social">{t("subjects.social")}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lessonPlans.map((plan) => {
          const variant =
            statusVariants[plan.status as keyof typeof statusVariants] ?? statusVariants.draft;
          const statusLabel = translateStatus(t, plan.status);

          return (
            <Card key={plan.id} className="group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base line-clamp-1">{plan.lessonTitle}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {translateSubject(t, plan.subjectName)} •{" "}
                        {translateGrade(t, plan.gradeLevel)}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/editor/${plan.id}`}>
                          <Edit className="mr-2 h-4 w-4" />
                          {t("common.edit")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/preview/${plan.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          {t("common.preview")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/preview/${plan.id}`}>
                          <Download className="mr-2 h-4 w-4" />
                          {t("common.exportPdf")}
                        </Link>
                      </DropdownMenuItem>
                      <DeleteLessonPlanButton
                        lessonPlanId={plan.id}
                        lessonTitle={plan.lessonTitle}
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <Badge variant={variant}>{statusLabel}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDateByLocale(plan.updatedAt, locale)}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    {t("common.statusLabel")}: {statusLabel}
                  </span>
                  <span>•</span>
                  <span>
                    {t("common.createdLabel")}: {formatDateByLocale(plan.createdAt, locale)}
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/editor/${plan.id}`}>{t("common.edit")}</Link>
                  </Button>
                  <Button size="sm" className="flex-1" asChild>
                    <Link href={`/preview/${plan.id}`}>
                      <Download className="mr-2 h-4 w-4" />
                      PDF
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ResponsiveContainer>
  );
}
