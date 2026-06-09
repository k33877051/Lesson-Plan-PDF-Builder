import { NextRequest, NextResponse } from "next/server";
import { unlink, writeFile } from "fs/promises";
import { mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

// Maximum file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = ["application/pdf", "application/x-pdf"];

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "upload-pdf", {
    windowMs: 60_000,
    maxRequests: 10,
  });
  if (limited) return limited;

  let savedFilePath: string | null = null;

  try {
    const formData = await request.formData();

    // Get project information
    const projectName = formData.get("projectName") as string;
    const projectDescription = formData.get("projectDescription") as string;
    const file = formData.get("file") as File;

    // Validate required fields
    if (!projectName || !file) {
      return NextResponse.json(
        { error: "กรุณากรอกชื่อโปรเจกต์และเลือกไฟล์ PDF" },
        { status: 400 }
      );
    }

    if (projectName.length > 160 || (projectDescription && projectDescription.length > 1000)) {
      return NextResponse.json(
        { error: "ชื่อโปรเจกต์หรือคำอธิบายยาวเกินกำหนด" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "รองรับเฉพาะไฟล์ PDF เท่านั้น" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "ไฟล์ต้องมีขนาดไม่เกิน 50MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate PDF magic bytes. Do not trust client-provided MIME type alone.
    if (buffer.subarray(0, 5).toString("utf8") !== "%PDF-") {
      return NextResponse.json(
        { error: "ไฟล์ที่อัปโหลดไม่ใช่ PDF ที่ถูกต้อง" },
        { status: 400 }
      );
    }

    // Generate unique filename. Always force .pdf extension.
    const uniqueFilename = `${Date.now()}-${randomUUID()}.pdf`;

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    // Save file to public/uploads
    const filePath = join(uploadsDir, uniqueFilename);
    await writeFile(filePath, buffer);
    savedFilePath = filePath;

    // Create Project record in database
    const project = await prisma.project.create({
      data: {
        name: projectName,
        description: projectDescription || null,
        status: "active",
      },
    });

    // Create PdfSource record in database
    const pdfSource = await prisma.pdfSource.create({
      data: {
        filename: uniqueFilename,
        originalName: file.name,
        filePath: `/uploads/${uniqueFilename}`,
        fileSize: file.size,
        fileType: "application/pdf",
        pageCount: null, // Can be extracted later with PDF parsing library
        projectId: project.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "อัปโหลดไฟล์สำเร็จ",
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
      },
      pdfSource: {
        id: pdfSource.id,
        filename: pdfSource.filename,
        originalName: pdfSource.originalName,
        filePath: pdfSource.filePath,
        fileSize: pdfSource.fileSize,
        fileType: pdfSource.fileType,
        createdAt: pdfSource.createdAt,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    if (savedFilePath) {
      await unlink(savedFilePath).catch(() => undefined);
    }
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปโหลดไฟล์" },
      { status: 500 }
    );
  }
}

// GET endpoint to list uploaded files
export async function GET() {
  try {
    const pdfSources = await prisma.pdfSource.findMany({
      select: {
        id: true,
        originalName: true,
        fileSize: true,
        fileType: true,
        pageCount: true,
        extractionStatus: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: pdfSources,
    });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}
