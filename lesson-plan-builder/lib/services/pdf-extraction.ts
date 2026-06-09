import { readFile, stat } from "fs/promises";
import { basename, join, normalize } from "path";

const MAX_PARSE_SIZE = 50 * 1024 * 1024;

function sanitizePdfText(text: string): string {
  return text
    .replace(/\u0000/g, "")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .normalize("NFC");
}

// Use pdf-parse-fork which works better in server environments
// Or use a pure JS alternative
async function parsePdf(buffer: Buffer) {
  try {
    // Try using pdf-parse library
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");

    // Parse with options
    const result = await pdfParse(buffer, {
      max: 0, // No page limit
    });

    return {
      text: result.text || '',
      numpages: result.numpages || 1,
      info: result.info || {},
      version: result.version,
      metadata: result.metadata,
    };
  } catch (error) {
    // If pdf-parse fails, try alternative approach
    console.warn("Primary PDF parser failed, trying alternative:", error);

    // Fallback: Try to extract text using basic PDF structure parsing
    return fallbackPdfParse(buffer);
  }
}

// Basic fallback parser for simple PDFs
function fallbackPdfParse(buffer: Buffer): {
  text: string;
  numpages: number;
  info: Record<string, string>;
  version?: string;
  metadata?: Record<string, unknown>;
} {
  const content = buffer.toString('utf-8', 0, Math.min(buffer.length, 100000));

  // Extract text from PDF content streams (basic regex approach)
  // This is a simplified approach that works for text-based PDFs
  let text = '';

  // Look for text objects in PDF
  const textRegex = /\(([^)]+)\)/g;
  const matches = content.match(textRegex);

  if (matches) {
    text = matches
      .map(m => m.slice(1, -1)) // Remove parentheses
      .filter(m => m.length > 2 && !/^\d+$/.test(m)) // Filter out short strings and numbers
      .join(' ');
  }

  // If no text found, return empty but valid result
  if (!text || text.length < 10) {
    text = '[PDF นี้อาจเป็นไฟล์สแกนหรือมีการเข้ารหัส ไม่สามารถดึงข้อความโดยอัตโนมัติได้]';
  }

  // Extract PDF version
  const versionMatch = content.match(/%PDF-(\d+\.\d+)/);
  const version = versionMatch ? versionMatch[1] : undefined;

  // Estimate page count from /Type /Page references
  const pageMatches = content.match(/\/Type\s*\/Page/g);
  const numpages = pageMatches ? pageMatches.length : 1;

  return {
    text: sanitizePdfText(text).slice(0, 50000), // Limit text length
    numpages,
    info: {},
    version,
    metadata: {},
  };
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
      text: sanitizePdfText(result.text),
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

    // pdf-parse doesn't support per-page extraction directly
    // For page-specific extraction, we'd need pdf-lib or similar
    // For now, return all text

    return sanitizePdfText(result.text);
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
