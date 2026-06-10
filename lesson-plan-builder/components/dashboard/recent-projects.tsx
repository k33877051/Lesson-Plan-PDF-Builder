"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Edit, Eye, Download, MoreHorizontal, ArrowRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/components/i18n/language-provider";
import { formatDateByLocale } from "@/lib/i18n";

export interface RecentLessonPlan {
  id: string;
  title: string;
  subjectKey: string;
  gradeKey: string;
  status: string;
  updatedAt: string;
}

function ActionButtons({ projectId }: { projectId: string }) {
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/editor/${projectId}`} aria-label={t("common.edit")}>
          <Edit className="h-4 w-4" />
        </Link>
      </Button>
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/preview/${projectId}`} aria-label={t("common.preview")}>
          <Eye className="h-4 w-4" />
        </Link>
      </Button>
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/preview/${projectId}`} aria-label={t("common.exportPdf")}>
          <Download className="h-4 w-4" />
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t("common.moreMenu")}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/preview/${projectId}`}>{t("common.exportPdf")}</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function RecentProjects({ lessonPlans }: { lessonPlans: RecentLessonPlan[] }) {
  const { t, locale } = useI18n();

  const statusVariants = {
    completed: "default" as const,
    published: "default" as const,
    draft: "secondary" as const,
    archived: "outline" as const,
  };

  const getStatusLabel = (status: string) => {
    const key = `status.${status}` as const;
    const label = t(key);
    return label === key ? t("status.draft") : label;
  };

  const getSubjectLabel = (subjectKey: string) => {
    const label = t(`subjects.${subjectKey}`);
    return label === `subjects.${subjectKey}` ? subjectKey : label;
  };

  const getGradeLabel = (gradeKey: string) => {
    const label = t(`grades.${gradeKey}`);
    return label === `grades.${gradeKey}` ? gradeKey : label;
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg">{t("dashboard.recentPlans")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("dashboard.recentPlansDesc")}</p>
        </div>
        <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
          <Link href="/dashboard/lesson-plans">
            {t("common.viewAll")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {lessonPlans.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
            <FileText className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">{t("dashboard.emptyTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.emptyDesc")}</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {lessonPlans.map((project) => {
                const variant =
                  statusVariants[project.status as keyof typeof statusVariants] ??
                  statusVariants.draft;
                return (
                  <div
                    key={project.id}
                    className="rounded-lg border bg-card p-4 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium leading-snug">{project.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {getSubjectLabel(project.subjectKey)} • {getGradeLabel(project.gradeKey)}
                        </p>
                      </div>
                      <Badge variant={variant}>{getStatusLabel(project.status)}</Badge>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDateByLocale(project.updatedAt, locale)}
                      </span>
                      <ActionButtons projectId={project.id} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("dashboard.table.title")}</TableHead>
                    <TableHead>{t("dashboard.table.subject")}</TableHead>
                    <TableHead>{t("dashboard.table.grade")}</TableHead>
                    <TableHead>{t("dashboard.table.status")}</TableHead>
                    <TableHead>{t("dashboard.table.updated")}</TableHead>
                    <TableHead className="text-right">{t("dashboard.table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lessonPlans.map((project) => {
                    const variant =
                      statusVariants[project.status as keyof typeof statusVariants] ??
                      statusVariants.draft;
                    return (
                      <TableRow key={project.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <div className="font-medium">{project.title}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getSubjectLabel(project.subjectKey)}</TableCell>
                        <TableCell>{getGradeLabel(project.gradeKey)}</TableCell>
                        <TableCell>
                          <Badge variant={variant}>{getStatusLabel(project.status)}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDateByLocale(project.updatedAt, locale)}
                        </TableCell>
                        <TableCell className="text-right">
                          <ActionButtons projectId={project.id} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
