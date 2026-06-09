import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { join, normalize } from "path";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

interface ProjectRouteContext {
  params: Promise<{ id: string }>;
}

function resolveUploadPath(filePath: string) {
  const normalized = normalize(filePath).replace(/^[/\\]+/, "");
  return join(process.cwd(), "public", normalized);
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
