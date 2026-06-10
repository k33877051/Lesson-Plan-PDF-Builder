import { Metadata } from "next";
import { DashboardStats } from "@/components/dashboard/stats-cards";
import { RecentProjects } from "@/components/dashboard/recent-projects";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { ResponsiveContainer } from "@/components/layout/responsive-container";
import { prisma } from "@/lib/prisma";
import {
  getCachedDashboardStats,
  setCachedDashboardStats,
} from "@/lib/dashboard-stats-cache";
import { readdir } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "แดชบอร์ด - Lesson Plan PDF Builder",
  description: "ภาพรวมแผนการสอนของคุณ",
};

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

  const mapRecent = (plans: typeof recentLessonPlans) =>
    plans.map((plan) => ({
      id: plan.id,
      title: plan.lessonTitle,
      subjectKey: plan.subjectName,
      gradeKey: plan.gradeLevel,
      status: plan.status,
      updatedAt: plan.updatedAt.toISOString(),
    }));

  if (cachedStats) {
    return {
      stats: cachedStats,
      recentLessonPlans: mapRecent(recentLessonPlans),
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
    recentLessonPlans: mapRecent(recentLessonPlans),
  };
}

export default async function DashboardPage() {
  const { stats, recentLessonPlans } = await getDashboardData();

  return (
    <ResponsiveContainer className="space-y-6 md:space-y-8">
      <DashboardHome
        totalLessonPlans={stats.totalLessonPlans}
        exportedPdfCount={stats.exportedPdfCount}
      />
      <DashboardStats {...stats} />
      <QuickActions />
      <RecentProjects lessonPlans={recentLessonPlans} />
    </ResponsiveContainer>
  );
}
