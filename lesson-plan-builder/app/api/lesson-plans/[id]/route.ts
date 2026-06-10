import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sanitizeRichText } from "@/lib/sanitize-html";
import { rateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit-log";
import { invalidateDashboardStatsCache } from "@/lib/dashboard-stats-cache";

const allowedStatuses = ["draft", "published", "archived", "completed"] as const;

const lessonPlanUpdateSchema = z.object({
  teacherName: z.string().max(120).optional().nullable(),
  schoolName: z.string().max(160).optional().nullable(),
  subjectName: z.string().min(1).max(80).optional(),
  gradeLevel: z.string().min(1).max(80).optional(),
  semester: z.string().max(40).optional(),
  academicYear: z.string().max(20).optional(),
  lessonTitle: z.string().min(1).max(200).optional(),
  objectives: z.string().max(50000).optional(),
  objectivesJson: z.unknown().optional().nullable(),
  keyConcepts: z.string().max(50000).optional(),
  keyConceptsJson: z.unknown().optional().nullable(),
  learningActivities: z.string().max(100000).optional(),
  learningActivitiesJson: z.unknown().optional().nullable(),
  mediaResources: z.string().max(50000).optional(),
  mediaResourcesJson: z.unknown().optional().nullable(),
  assessment: z.string().max(50000).optional(),
  assessmentJson: z.unknown().optional().nullable(),
  notes: z.string().max(50000).optional().nullable(),
  notesJson: z.unknown().optional().nullable(),
  status: z.enum(allowedStatuses).optional(),
});

/**
 * GET /api/lesson-plans/[id]
 * ดึงข้อมูลแผนการสอนตาม ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const limited = rateLimit(request, "lesson-plan-read", {
      windowMs: 60_000,
      maxRequests: 120,
    });
    if (limited) return limited;

    const { id } = await params;

    const lessonPlan = await prisma.lessonPlan.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!lessonPlan) {
      return NextResponse.json(
        { error: "ไม่พบแผนการสอน" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: lessonPlan,
    });
  } catch (error) {
    console.error("Get lesson plan error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/lesson-plans/[id]
 * อัปเดตข้อมูลแผนการสอน
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const limited = rateLimit(request, "lesson-plan-write", {
      windowMs: 60_000,
      maxRequests: 60,
    });
    if (limited) return limited;

    const { id } = await params;
    const body = await request.json();
    const validation = lessonPlanUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "ข้อมูลแผนการสอนไม่ถูกต้อง",
          details: validation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีแผนการสอนอยู่หรือไม่
    const existing = await prisma.lessonPlan.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "ไม่พบแผนการสอน" },
        { status: 404 }
      );
    }

    const {
      teacherName,
      schoolName,
      subjectName,
      gradeLevel,
      semester,
      academicYear,
      lessonTitle,
      objectives,
      objectivesJson,
      keyConcepts,
      keyConceptsJson,
      learningActivities,
      learningActivitiesJson,
      mediaResources,
      mediaResourcesJson,
      assessment,
      assessmentJson,
      notes,
      notesJson,
      status,
    } = validation.data;

    const updated = await prisma.lessonPlan.update({
      where: { id },
      data: {
        teacherName: teacherName !== undefined ? teacherName : undefined,
        schoolName: schoolName !== undefined ? schoolName : undefined,
        subjectName: subjectName !== undefined ? subjectName : undefined,
        gradeLevel: gradeLevel !== undefined ? gradeLevel : undefined,
        semester: semester !== undefined ? semester : undefined,
        academicYear: academicYear !== undefined ? academicYear : undefined,
        lessonTitle: lessonTitle !== undefined ? lessonTitle : undefined,
        objectives: objectives !== undefined ? sanitizeRichText(objectives) : undefined,
        objectivesJson: objectivesJson ?? undefined,
        keyConcepts: keyConcepts !== undefined ? sanitizeRichText(keyConcepts) : undefined,
        keyConceptsJson: keyConceptsJson ?? undefined,
        learningActivities: learningActivities !== undefined ? sanitizeRichText(learningActivities) : undefined,
        learningActivitiesJson: learningActivitiesJson ?? undefined,
        mediaResources: mediaResources !== undefined ? sanitizeRichText(mediaResources) : undefined,
        mediaResourcesJson: mediaResourcesJson ?? undefined,
        assessment: assessment !== undefined ? sanitizeRichText(assessment) : undefined,
        assessmentJson: assessmentJson ?? undefined,
        notes: notes !== undefined ? (notes ? sanitizeRichText(notes) : null) : undefined,
        notesJson: notesJson ?? undefined,
        status: status !== undefined ? status : undefined,
      },
    });

    if (status !== undefined) {
      invalidateDashboardStatsCache();
    }

    return NextResponse.json({
      success: true,
      message: "อัปเดตแผนการสอนสำเร็จ",
      data: updated,
    });
  } catch (error) {
    console.error("Update lesson plan error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปเดต" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/lesson-plans/[id]
 * ลบแผนการสอน
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const limited = rateLimit(request, "lesson-plan-delete", {
      windowMs: 60_000,
      maxRequests: 20,
    });
    if (limited) return limited;

    const { id } = await params;

    // ตรวจสอบว่ามีแผนการสอนอยู่หรือไม่
    const existing = await prisma.lessonPlan.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "ไม่พบแผนการสอน" },
        { status: 404 }
      );
    }

    await prisma.lessonPlan.delete({
      where: { id },
    });

    await writeAuditLog(request, {
      action: "delete",
      resourceType: "lesson_plan",
      resourceId: id,
      metadata: { lessonTitle: existing.lessonTitle },
    });

    invalidateDashboardStatsCache();

    return NextResponse.json({
      success: true,
      message: "ลบแผนการสอนสำเร็จ",
    });
  } catch (error) {
    console.error("Delete lesson plan error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบ" },
      { status: 500 }
    );
  }
}
