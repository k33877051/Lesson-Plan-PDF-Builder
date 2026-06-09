import { Metadata } from "next";
import { DashboardStats } from "@/components/dashboard/stats-cards";
import { RecentProjects } from "@/components/dashboard/recent-projects";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { prisma } from "@/lib/prisma";
import { readdir } from "fs/promises";
import { join } from "path";

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
  const [totalLessonPlans, completedLessonPlans, draftLessonPlans, recentLessonPlans] =
    await Promise.all([
      prisma.lessonPlan.count(),
      prisma.lessonPlan.count({ where: { status: { in: ["completed", "published"] } } }),
      prisma.lessonPlan.count({ where: { status: "draft" } }),
      prisma.lessonPlan.findMany({
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
      }),
    ]);

  let exportedPdfCount = 0;
  try {
    const exportFiles = await readdir(join(process.cwd(), "public", "exports"));
    exportedPdfCount = exportFiles.filter((file) => file.toLowerCase().endsWith(".pdf")).length;
  } catch {
    exportedPdfCount = 0;
  }

  return {
    stats: {
      totalLessonPlans,
      completedLessonPlans,
      draftLessonPlans,
      exportedPdfCount,
    },
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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">แดชบอร์ด</h1>
          <p className="text-muted-foreground">
            ยินดีต้อนรับกลับมา! นี่คือภาพรวมแผนการสอนของคุณ
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <DashboardStats {...stats} />

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent Projects */}
      <RecentProjects lessonPlans={recentLessonPlans} />
    </div>
  );
}
