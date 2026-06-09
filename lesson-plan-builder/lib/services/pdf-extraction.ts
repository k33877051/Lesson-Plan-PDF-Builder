import { readFile, stat } from "fs/promises";
import { basename, join, normalize } from "path";

const MAX_PARSE_SIZE = 50 * 1024 * 1024;

async function parsePdf(buffer: Buffer) {
  // Lazy-load pdf-parse only during extraction. Importing it at module scope
  // triggers DOMMatrix/canvas requirements during Next.js page-data collection.
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });

  try {
    const [textResult, infoResult] = await Promise.all([
      parser.getText(),
      parser.getInfo(),
    ]);

    return {
      text: textResult.text,
      numpages: textResult.total,
      info: infoResult.info ?? {},
      version: undefined,
      metadata: infoResult.metadata as unknown as Record<string, unknown> | undefined,
    };
  } finally {
    await parser.destroy();
  }
}

function resolveUploadPath(filePath: string): string {
  const filename = basename(filePath);
  const fullPath = normalize(join(process.cwd(), "public", "uploads", filename));
  const uploadsRoot = normalize(join(process.cwd(), "public", "uploads"));

  if (!fullPath.startsWith(uploadsRoot)) {
    throw new Error("Invalid PDF file path");
  }

  return fullPath;
}

async function readPdfBuffer(filePath: string): Promise<Buffer> {
  const fullPath = resolveUploadPath(filePath);
  const fileStat = await stat(fullPath);

  if (fileStat.size > MAX_PARSE_SIZE) {
    throw new Error("PDF file is too large to parse safely");
  }

  return readFile(fullPath);
}

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
  info: {
    Title?: string;
    Author?: string;
    Subject?: string;
    Keywords?: string;
    Creator?: string;
    Producer?: string;
    CreationDate?: string;
    ModDate?: string;
  };
  version?: string;
  metadata?: Record<string, unknown>;
}

export interface PdfExtractionError {
  message: string;
  code: string;
}

/**
 * ดึงข้อความจากไฟล์ PDF
 * @param filePath พาธของไฟล์ PDF (relative จาก public)
 * @returns ข้อมูลที่ดึงได้จาก PDF
 */
export async function extractTextFromPdf(
  filePath: string
): Promise<PdfExtractionResult> {
  try {
    // อ่านไฟล์ PDF
    const pdfBuffer = await readPdfBuffer(filePath);

    // ดึงข้อความจาก PDF
    const result = await parsePdf(pdfBuffer);

    return {
      text: result.text,
      pageCount: result.numpages,
      info: result.info,
      version: result.version,
      metadata: result.metadata,
    };
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error(
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการดึงข้อความจาก PDF"
    );
  }
}

/**
 * ดึงข้อความจากบางหน้าของ PDF
 * @param filePath พาธของไฟล์ PDF
 * @param startPage หน้าเริ่มต้น
 * @param endPage หน้าสิ้นสุด
 * @returns ข้อความจากหน้าที่ระบุ
 */
export async function extractTextFromPages(
  filePath: string,
  _startPage: number = 1,
  _endPage?: number
): Promise<string> {
  try {
    void _startPage;
    void _endPage;
    const pdfBuffer = await readPdfBuffer(filePath);

    const result = await parsePdf(pdfBuffer);

    // แยกข้อความตามหน้า (pdf-parse ไม่รองรับการดึงเฉพาะหน้าโดยตรง)
    // ดังนั้นเราจะส่งคืนข้อความทั้งหมด
    // สำหรับการดึงเฉพาะหน้า อาจต้องใช้ไลบรารีอื่นเช่น pdf-lib หรือ pdf2pic

    return result.text;
  } catch (error) {
    console.error("PDF page extraction error:", error);
    throw new Error(
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการดึงข้อความ"
    );
  }
}

/**
 * ตรวจสอบว่า PDF มีข้อความที่สามารถเลือกได้หรือไม่
 * @param filePath พาธของไฟล์ PDF
 * @returns true ถ้ามีข้อความ false ถ้าเป็น PDF สแกน
 */
export async function hasExtractableText(filePath: string): Promise<boolean> {
  try {
    const result = await extractTextFromPdf(filePath);
    // ถ้ามีข้อความมากกว่า 100 ตัวอักษร ถือว่ามีข้อความที่ดึงได้
    return result.text.trim().length > 100;
  } catch {
    return false;
  }
}

/**
 * สรุปข้อความ (ตัดให้เหลือตามจำนวนตัวอักษรที่กำหนด)
 * @param text ข้อความต้นฉบับ
 * @param maxLength จำนวนตัวอักษรสูงสุด
 * @returns ข้อความที่ตัดแล้ว
 */
export function summarizeText(text: string, maxLength: number = 500): string {
  if (text.length <= maxLength) return text;

  // หาตำแหน่งที่เหมาะสมในการตัด (ตัดที่จุดหรือเว้นบรรทัด)
  let cutIndex = text.lastIndexOf(".", maxLength);
  if (cutIndex === -1 || cutIndex < maxLength * 0.8) {
    cutIndex = text.lastIndexOf("\n", maxLength);
  }
  if (cutIndex === -1 || cutIndex < maxLength * 0.8) {
    cutIndex = text.lastIndexOf(" ", maxLength);
  }
  if (cutIndex === -1) {
    cutIndex = maxLength;
  }

  return text.substring(0, cutIndex).trim() + "...";
}
