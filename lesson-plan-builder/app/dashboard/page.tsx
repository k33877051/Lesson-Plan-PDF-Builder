import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashboardStats } from "@/components/dashboard/stats-cards";
import { RecentProjects } from "@/components/dashboard/recent-projects";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { PageHeader } from "@/components/layout/page-header";
import { ResponsiveContainer } from "@/components/layout/responsive-container";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import {
  getCachedDashboardStats,
  setCachedDashboardStats,
} from "@/lib/dashboard-stats-cache";
import { readdir } from "fs/promises";
import { join } from "path";
import { FilePlus, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "แดชบอร์ด - Lesson Plan PDF Builder",
  description: "ภาพรวมแผนการสอนของคุณ",
};

const subjectLabels: Record<string, string> = {
  mathematics: "คณิตศาสตร์",
  science: "วิทยาศาสตร์",
  thai: "ภาษาไทย",
  english: "ภาษาอังกฤษ",
  social: "สังคมศึกษา",
  history: "ประวัติศาสตร์",
  geography: "ภูมิศาสตร์",
  civics: "หน้าที่พลเมือง",
  physics: "ฟิสิกส์",
  chemistry: "เคมี",
  biology: "ชีววิทยา",
  computer: "คอมพิวเตอร์",
  art: "ศิลปะ",
  music: "ดนตรี",
  pe: "พลศึกษา",
  health: "สุขศึกษา",
  other: "อื่นๆ",
};

const gradeLabels: Record<string, string> = {
  p1: "ประถมศึกษาปีที่ 1",
  p2: "ประถมศึกษาปีที่ 2",
  p3: "ประถมศึกษาปีที่ 3",
  p4: "ประถมศึกษาปีที่ 4",
  p5: "ประถมศึกษาปีที่ 5",
  p6: "ประถมศึกษาปีที่ 6",
  m1: "มัธยมศึกษาปีที่ 1",
  m2: "มัธยมศึกษาปีที่ 2",
  m3: "มัธยมศึกษาปีที่ 3",
  m4: "มัธยมศึกษาปีที่ 4",
  m5: "มัธยมศึกษาปีที่ 5",
  m6: "มัธยมศึกษาปีที่ 6",
  vocational: "อาชีวศึกษา",
  university: "อุดมศึกษา",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

async function getDashboardData() {
  const cachedStats = getCachedDashboardStats();

  const recentLessonPlans = await prisma.lessonPlan.findMany({
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: {
      id: true,
      lessonTitle: true,
      subjectName: true,
      gradeLevel: true,
      status: true,
      updatedAt: true,
    },
  });

  if (cachedStats) {
    return {
      stats: cachedStats,
      recentLessonPlans: recentLessonPlans.map((plan) => ({
        id: plan.id,
        title: plan.lessonTitle,
        subject: subjectLabels[plan.subjectName] ?? plan.subjectName,
        grade: gradeLabels[plan.gradeLevel] ?? plan.gradeLevel,
        status: plan.status,
        updatedAt: formatDate(plan.updatedAt),
      })),
    };
  }

  const [totalLessonPlans, completedLessonPlans, draftLessonPlans] = await Promise.all([
    prisma.lessonPlan.count(),
    prisma.lessonPlan.count({ where: { status: { in: ["completed", "published"] } } }),
    prisma.lessonPlan.count({ where: { status: "draft" } }),
  ]);

  let exportedPdfCount = 0;
  try {
    const exportFiles = await readdir(join(process.cwd(), "public", "exports"));
    exportedPdfCount = exportFiles.filter((file) => file.toLowerCase().endsWith(".pdf")).length;
  } catch {
    exportedPdfCount = 0;
  }

  const stats = {
    totalLessonPlans,
    completedLessonPlans,
    draftLessonPlans,
    exportedPdfCount,
  };

  setCachedDashboardStats(stats);

  return {
    stats,
    recentLessonPlans: recentLessonPlans.map((plan) => ({
      id: plan.id,
      title: plan.lessonTitle,
      subject: subjectLabels[plan.subjectName] ?? plan.subjectName,
      grade: gradeLabels[plan.gradeLevel] ?? plan.gradeLevel,
      status: plan.status,
      updatedAt: formatDate(plan.updatedAt),
    })),
  };
}

export default async function DashboardPage() {
  const { stats, recentLessonPlans } = await getDashboardData();

  return (
    <ResponsiveContainer className="space-y-6 md:space-y-8">
      <PageHeader
        title="แดชบอร์ด"
        description="ยินดีต้อนรับกลับมา! นี่คือภาพรวมแผนการสอนของคุณ"
        actions={
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/lesson-plans/new">
              <FilePlus className="mr-2 h-4 w-4" />
              สร้างแผนใหม่
            </Link>
          </Button>
        }
      />

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Lesson Plan PDF Builder</span>
            </div>
            <p className="text-base font-semibold md:text-lg">
              สร้าง แก้ไข และส่งออกแผนการสอนได้จากทุกอุปกรณ์
            </p>
            <p className="text-sm text-muted-foreground">
              มีแผน {stats.totalLessonPlans.toLocaleString("th-TH")} รายการ • PDF ส่งออกแล้ว {stats.exportedPdfCount.toLocaleString("th-TH")} ไฟล์
            </p>
          </div>
        </CardContent>
      </Card>

      <DashboardStats {...stats} />
      <QuickActions />
      <RecentProjects lessonPlans={recentLessonPlans} />
    </ResponsiveContainer>
  );
}
