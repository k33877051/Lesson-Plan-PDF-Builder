import { Metadata } from "next";
import { LessonPlansList } from "@/components/dashboard/lesson-plans-list";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "แผนการสอนของฉัน - Lesson Plan PDF Builder",
  description: "จัดการแผนการสอนทั้งหมดของคุณ",
};

export default async function LessonPlansPage() {
  const lessonPlans = await prisma.lessonPlan.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      lessonTitle: true,
      subjectName: true,
      gradeLevel: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <LessonPlansList
      lessonPlans={lessonPlans.map((plan) => ({
        id: plan.id,
        lessonTitle: plan.lessonTitle,
        subjectName: plan.subjectName,
        gradeLevel: plan.gradeLevel,
        status: plan.status,
        createdAt: plan.createdAt.toISOString(),
        updatedAt: plan.updatedAt.toISOString(),
      }))}
    />
  );
}
