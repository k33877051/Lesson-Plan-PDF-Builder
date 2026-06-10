import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { join, normalize } from "path";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { ExtractionStatus } from "@/lib/generated/prisma/client";
import { isUsableExtractedText, summarizeText } from "@/lib/services/pdf-extraction";

interface ProjectRouteContext {
  params: Promise<{ id: string }>;
}

function resolveUploadPath(filePath: string) {
  const normalized = normalize(filePath).replace(/^[/\\]+/, "");
  return join(process.cwd(), "public", normalized);
}

/** GET /api/projects/[id] — ข้อมูลโปรเจกต์ + สรุป PDF สำหรับ Lesson Builder */
export async function GET(
  request: NextRequest,
  { params }: ProjectRouteContext
) {
  try {
    const limited = rateLimit(request, "project-read", {
      windowMs: 60_000,
      maxRequests: 60,
    });
    if (limited) return limited;

    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        pdfSources: {
          select: {
            id: true,
            originalName: true,
            pageCount: true,
            extractionStatus: true,
            extractedText: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "ไม่พบโปรเจกต์" },
        { status: 404 }
      );
    }

    const pdfSources = project.pdfSources.map((pdf) => {
      const hasUsableText = Boolean(
        pdf.extractedText && isUsableExtractedText(pdf.extractedText)
      );

      return {
        id: pdf.id,
        originalName: pdf.originalName,
        pageCount: pdf.pageCount,
        extractionStatus: pdf.extractionStatus,
        hasUsableText,
        textPreview: hasUsableText
          ? summarizeText(pdf.extractedText!, 500)
          : null,
      };
    });

    const extractedPdfCount = pdfSources.filter(
      (pdf) =>
        pdf.extractionStatus === ExtractionStatus.COMPLETED && pdf.hasUsableText
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        extractedPdfCount,
        pdfSources,
      },
    });
  } catch (error) {
    console.error("Get project error:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลโปรเจกต์" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: ProjectRouteContext
) {
  try {
    const limited = rateLimit(request, "project-delete", {
      windowMs: 60_000,
      maxRequests: 20,
    });
    if (limited) return limited;

    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        pdfSources: {
          select: {
            filePath: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "ไม่พบโปรเจกต์" },
        { status: 404 }
      );
    }

    await prisma.project.delete({
      where: { id },
    });

    await Promise.all(
      project.pdfSources.map((pdf) =>
        unlink(resolveUploadPath(pdf.filePath)).catch(() => undefined)
      )
    );

    return NextResponse.json({
      success: true,
      message: "ลบโปรเจกต์สำเร็จ",
    });
  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการลบโปรเจกต์" },
      { status: 500 }
    );
  }
}
