import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit-log";
import { invalidateDashboardStatsCache } from "@/lib/dashboard-stats-cache";

export const runtime = "nodejs";
export const maxDuration = 60;

// Ensure exports directory exists
const EXPORTS_DIR = path.join(process.cwd(), "public", "exports");

interface ExportPdfRequest {
  lessonPlanId: string;
}

interface ExportPdfResponse {
  success: boolean;
  downloadUrl?: string;
  filename?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ExportPdfResponse>> {
  let browser = null;

  try {
    const limited = rateLimit(request, "export-pdf", {
      windowMs: 60_000,
      maxRequests: 3,
    });
    if (limited) return limited as NextResponse<ExportPdfResponse>;

    const body: ExportPdfRequest = await request.json();
    const { lessonPlanId } = body;

    if (!lessonPlanId) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุรหัสแผนการสอน" },
        { status: 400 }
      );
    }

    // Verify lesson plan exists
    const lessonPlan = await prisma.lessonPlan.findUnique({
      where: { id: lessonPlanId },
    });

    if (!lessonPlan) {
      return NextResponse.json(
        { success: false, error: "ไม่พบแผนการสอน" },
        { status: 404 }
      );
    }

    // Ensure exports directory exists
    if (!fs.existsSync(EXPORTS_DIR)) {
      fs.mkdirSync(EXPORTS_DIR, { recursive: true });
    }

    // Launch browser
    browser = await chromium.launch({
      headless: true,
    });

    const context = await browser.newContext({
      viewport: { width: 794, height: 1123 }, // A4 size at 96 DPI
    });

    const page = await context.newPage();

    // Construct preview URL (use absolute URL for Playwright)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const previewUrl = `${baseUrl}/preview/${lessonPlanId}`;

    // Navigate to preview page
    await page.goto(previewUrl, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Wait for fonts to load
    await page.waitForTimeout(2000);

    // Generate filename
    const sanitizedTitle = lessonPlan.lessonTitle
      .replace(/[^a-zA-Z0-9\u0E00-\u0E7F\s]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 50);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `lesson-plan_${sanitizedTitle}_${timestamp}.pdf`;
    const filePath = path.join(EXPORTS_DIR, filename);

    // Generate PDF with Thai font support
    await page.pdf({
      path: filePath,
      format: "A4",
      printBackground: true,
      margin: {
        top: "0mm",
        right: "0mm",
        bottom: "0mm",
        left: "0mm",
      },
      preferCSSPageSize: true,
    });

    // Close browser
    await browser.close();
    browser = null;

    // Clean up old exports (keep only last 50 files)
    try {
      const files = fs
        .readdirSync(EXPORTS_DIR)
        .filter((f) => f.endsWith(".pdf"))
        .map((f) => ({
          name: f,
          path: path.join(EXPORTS_DIR, f),
          stat: fs.statSync(path.join(EXPORTS_DIR, f)),
        }))
        .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime());

      // Remove files older than the 50th most recent
      if (files.length > 50) {
        const filesToDelete = files.slice(50);
        for (const file of filesToDelete) {
          try {
            fs.unlinkSync(file.path);
            console.log(`Deleted old export: ${file.name}`);
          } catch (err) {
            console.error(`Failed to delete old export: ${file.name}`, err);
          }
        }
      }
    } catch (cleanupError) {
      // Non-critical error, just log it
      console.error("Error during cleanup:", cleanupError);
    }

    // Return download URL
    const downloadUrl = `/exports/${filename}`;

    await writeAuditLog(request, {
      action: "export",
      resourceType: "lesson_plan",
      resourceId: lessonPlanId,
      metadata: { filename, downloadUrl },
    });

    invalidateDashboardStatsCache();

    return NextResponse.json({
      success: true,
      downloadUrl,
      filename,
    });
  } catch (error) {
    console.error("PDF Export Error:", error);

    // Ensure browser is closed
    if (browser) {
      await browser.close().catch(() => {});
    }

    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการสร้าง PDF" },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse<ExportPdfResponse>> {
  return NextResponse.json(
    { success: false, error: "Method not allowed. Use POST to export PDF." },
    { status: 405 }
  );
}
