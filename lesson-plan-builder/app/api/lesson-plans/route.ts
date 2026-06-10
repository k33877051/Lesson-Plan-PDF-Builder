import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sanitizeRichText } from "@/lib/sanitize-html";
import { rateLimit } from "@/lib/rate-limit";
import { buildPaginationMeta } from "@/lib/api-response";
import { invalidateDashboardStatsCache } from "@/lib/dashboard-stats-cache";

const lessonPlanCreateSchema = z.object({
  teacherName: z.string().max(120).optional().nullable(),
  schoolName: z.string().max(160).optional().nullable(),
  subjectName: z.string().min(1).max(80),
  gradeLevel: z.string().min(1).max(80),
  semester: z.string().max(40).optional().default(""),
  academicYear: z.string().max(20).optional().default(""),
  lessonTitle: z.string().min(1).max(200),
  durationMinutes: z.number().int().positive().optional(),
  objectives: z.string().max(50000).optional().default(""),
  objectivesJson: z.unknown().optional().nullable(),
  keyConcepts: z.string().max(50000).optional().default(""),
  keyConceptsJson: z.unknown().optional().nullable(),
  learningActivities: z.string().max(100000).optional().default(""),
  learningActivitiesJson: z.unknown().optional().nullable(),
  mediaResources: z.string().max(50000).optional().default(""),
  mediaResourcesJson: z.unknown().optional().nullable(),
  assessment: z.string().max(50000).optional().default(""),
  assessmentJson: z.unknown().optional().nullable(),
  notes: z.string().max(50000).optional().nullable(),
  notesJson: z.unknown().optional().nullable(),
  projectId: z.string().optional().nullable(),
});

/**
 * GET /api/lesson-plans
 * ดึงรายการแผนการสอนทั้งหมด
 */
export async function GET(request: NextRequest) {
  try {
    const limited = rateLimit(request, "lesson-plans-read", {
      windowMs: 60_000,
      maxRequests: 120,
    });
    if (limited) return limited;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const usePagination = pageParam !== null || limitParam !== null || search !== null;
    const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitParam || "50", 10) || 50));

    const where: {
      projectId?: string;
      status?: string;
      OR?: Array<Record<string, unknown>>;
    } = {};

    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { lessonTitle: { contains: search, mode: "insensitive" } },
        { subjectName: { contains: search, mode: "insensitive" } },
        { teacherName: { contains: search, mode: "insensitive" } },
      ];
    }

    const select = {
      id: true,
      teacherName: true,
      schoolName: true,
      subjectName: true,
      gradeLevel: true,
      semester: true,
      academicYear: true,
      lessonTitle: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    } as const;

    if (usePagination) {
      const skip = (page - 1) * limit;
      const [lessonPlans, total] = await Promise.all([
        prisma.lessonPlan.findMany({
          where,
          select,
          orderBy: { updatedAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.lessonPlan.count({ where }),
      ]);

      return NextResponse.json({
        success: true,
        data: lessonPlans,
        meta: { pagination: buildPaginationMeta(page, limit, total) },
      });
    }

    const lessonPlans = await prisma.lessonPlan.findMany({
      where,
      select,
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: lessonPlans,
    });
  } catch (error) {
    console.error("Get lesson plans error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lesson-plans
 * สร้างแผนการสอนใหม่
 */
export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, "lesson-plans-write", {
      windowMs: 60_000,
      maxRequests: 30,
    });
    if (limited) return limited;

    const body = await request.json();
    const validation = lessonPlanCreateSchema.safeParse(body);

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

    const {
      teacherName,
      schoolName,
      subjectName,
      gradeLevel,
      semester,
      academicYear,
      lessonTitle,
      durationMinutes,
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
      projectId,
    } = validation.data;

    const lessonPlan = await prisma.lessonPlan.create({
      data: {
        teacherName: teacherName || null,
        schoolName: schoolName || null,
        subjectName,
        gradeLevel,
        semester: semester || "",
        academicYear: academicYear || "",
        lessonTitle,
        durationMinutes,
        objectives: sanitizeRichText(objectives),
        objectivesJson: objectivesJson ?? undefined,
        keyConcepts: sanitizeRichText(keyConcepts),
        keyConceptsJson: keyConceptsJson ?? undefined,
        learningActivities: sanitizeRichText(learningActivities),
        learningActivitiesJson: learningActivitiesJson ?? undefined,
        mediaResources: sanitizeRichText(mediaResources),
        mediaResourcesJson: mediaResourcesJson ?? undefined,
        assessment: sanitizeRichText(assessment),
        assessmentJson: assessmentJson ?? undefined,
        notes: notes ? sanitizeRichText(notes) : null,
        notesJson: notesJson ?? undefined,
        projectId: projectId || null,
        status: "draft",
      },
    });

    invalidateDashboardStatsCache();

    return NextResponse.json({
      success: true,
      message: "สร้างแผนการสอนสำเร็จ",
      data: lessonPlan,
    });
  } catch (error) {
    console.error("Create lesson plan error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างแผนการสอน" },
      { status: 500 }
    );
  }
}
