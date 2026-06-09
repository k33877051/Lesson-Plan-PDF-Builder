import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTextFromPdf, summarizeText } from "@/lib/services/pdf-extraction";
import { ExtractionStatus } from "@/lib/generated/prisma/client";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/extract-pdf
 * ดึงข้อความจาก PDF และบันทึกลงฐานข้อมูล
 *
 * Body: { pdfSourceId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, "extract-pdf", {
      windowMs: 60_000,
      maxRequests: 10,
    });
    if (limited) return limited;

    const body = await request.json();
    const { pdfSourceId } = body;

    if (!pdfSourceId) {
      return NextResponse.json(
        { error: "กรุณาระบุ pdfSourceId" },
        { status: 400 }
      );
    }

    // ดึงข้อมูล PDF จากฐานข้อมูล
    const pdfSource = await prisma.pdfSource.findUnique({
      where: { id: pdfSourceId },
      include: { project: true },
    });

    if (!pdfSource) {
      return NextResponse.json(
        { error: "ไม่พบไฟล์ PDF ที่ระบุ" },
        { status: 404 }
      );
    }

    if (pdfSource.extractionStatus === ExtractionStatus.PROCESSING) {
      return NextResponse.json(
        { error: "ไฟล์นี้กำลังประมวลผลอยู่ กรุณารอสักครู่" },
        { status: 409 }
      );
    }

    // อัปเดตสถานะเป็นกำลังประมวลผล
    await prisma.pdfSource.update({
      where: { id: pdfSourceId },
      data: {
        extractionStatus: ExtractionStatus.PROCESSING,
      },
    });

    try {
      // ดึงข้อความจาก PDF
      const extractionResult = await extractTextFromPdf(pdfSource.filePath);

      // อัปเดตข้อมูลในฐานข้อมูล
      const updatedPdfSource = await prisma.pdfSource.update({
        where: { id: pdfSourceId },
        data: {
          extractedText: extractionResult.text,
          pageCount: extractionResult.pageCount,
          extractionStatus: ExtractionStatus.COMPLETED,
          extractionError: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "ดึงข้อความจาก PDF สำเร็จ",
        data: {
          id: updatedPdfSource.id,
          originalName: updatedPdfSource.originalName,
          pageCount: extractionResult.pageCount,
          textLength: extractionResult.text.length,
          textPreview: summarizeText(extractionResult.text, 500),
          extractionStatus: updatedPdfSource.extractionStatus,
          project: {
            id: pdfSource.project.id,
            name: pdfSource.project.name,
          },
          metadata: {
            title: extractionResult.info.Title,
            author: extractionResult.info.Author,
            subject: extractionResult.info.Subject,
            creator: extractionResult.info.Creator,
            version: extractionResult.version,
          },
        },
      });
    } catch (extractError) {
      // อัปเดตสถานะเป็นผิดพลาด
      await prisma.pdfSource.update({
        where: { id: pdfSourceId },
        data: {
          extractionStatus: ExtractionStatus.FAILED,
          extractionError:
            extractError instanceof Error
              ? extractError.message
              : "เกิดข้อผิดพลาดที่ไม่คาดคิด",
        },
      });

      throw extractError;
    }
  } catch (error) {
    console.error("PDF extraction API error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อความจาก PDF" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/extract-pdf?pdfSourceId={id}
 * ดึงข้อมูลข้อความที่แยกออกมาแล้ว
 */
export async function GET(request: NextRequest) {
  try {
    const limited = rateLimit(request, "extract-pdf-read", {
      windowMs: 60_000,
      maxRequests: 60,
    });
    if (limited) return limited;

    const { searchParams } = new URL(request.url);
    const pdfSourceId = searchParams.get("pdfSourceId");

    if (!pdfSourceId) {
      return NextResponse.json(
        { error: "กรุณาระบุ pdfSourceId" },
        { status: 400 }
      );
    }

    const pdfSource = await prisma.pdfSource.findUnique({
      where: { id: pdfSourceId },
      include: { project: true },
    });

    if (!pdfSource) {
      return NextResponse.json(
        { error: "ไม่พบไฟล์ PDF ที่ระบุ" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: pdfSource.id,
        originalName: pdfSource.originalName,
        pageCount: pdfSource.pageCount,
        textLength: pdfSource.extractedText?.length || 0,
        textPreview: pdfSource.extractedText
          ? summarizeText(pdfSource.extractedText, 2000)
          : null,
        extractionStatus: pdfSource.extractionStatus,
        extractionError: pdfSource.extractionError,
        project: {
          id: pdfSource.project.id,
          name: pdfSource.project.name,
        },
        createdAt: pdfSource.createdAt,
        updatedAt: pdfSource.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get extraction data error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}
