import { readFile, stat } from "fs/promises";
import { basename, join, normalize } from "path";

const MAX_PARSE_SIZE = 50 * 1024 * 1024;
const DEFAULT_OCR_MAX_PAGES = 5;
const OCR_SCALE = 1.5;

type ExtractionMethod = "text-layer" | "ocr";

interface ParsedPdfResult {
  text: string;
  numpages: number;
  info: PdfExtractionResult["info"];
  version?: string;
  metadata?: Record<string, unknown>;
  method: ExtractionMethod;
}

class PdfNeedsOcrError extends Error {
  constructor(message = "PDF ต้องใช้ OCR เพื่ออ่านข้อความ") {
    super(message);
    this.name = "PdfNeedsOcrError";
  }
}

const runtimeImport = new Function(
  "specifier",
  "return import(specifier)"
) as <T>(specifier: string) => Promise<T>;

function sanitizePdfText(text: string): string {
  return text
    .replace(/\u0000/g, "")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .normalize("NFC");
}

export function isUsableExtractedText(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 30) return false;

  const sample = trimmed.slice(0, 4000);
  const replacementChars = (sample.match(/\uFFFD/g) || []).length;
  const readableChars = (sample.match(/[\u0E00-\u0E7Fa-zA-Z0-9\s.,:;!?()[\]\-'"“”‘’/%]/g) || []).length;
  const whitespaceChars = (sample.match(/\s/g) || []).length;
  const longGarbageRuns = /[^\u0E00-\u0E7Fa-zA-Z0-9\s.,:;!?()[\]\-'"“”‘’/%]{8,}/.test(sample);
  const readableRatio = readableChars / sample.length;
  const replacementRatio = replacementChars / sample.length;
  const whitespaceRatio = whitespaceChars / sample.length;

  return (
    readableRatio >= 0.55 &&
    replacementRatio <= 0.02 &&
    whitespaceRatio >= 0.03 &&
    !longGarbageRuns
  );
}

function mapPdfInfo(rawInfo: Record<string, unknown>): PdfExtractionResult["info"] {
  return {
    Title: typeof rawInfo.Title === "string" ? rawInfo.Title : undefined,
    Author: typeof rawInfo.Author === "string" ? rawInfo.Author : undefined,
    Subject: typeof rawInfo.Subject === "string" ? rawInfo.Subject : undefined,
    Keywords: typeof rawInfo.Keywords === "string" ? rawInfo.Keywords : undefined,
    Creator: typeof rawInfo.Creator === "string" ? rawInfo.Creator : undefined,
    Producer: typeof rawInfo.Producer === "string" ? rawInfo.Producer : undefined,
    CreationDate: typeof rawInfo.CreationDate === "string" ? rawInfo.CreationDate : undefined,
    ModDate: typeof rawInfo.ModDate === "string" ? rawInfo.ModDate : undefined,
  };
}

/** แปลง error ทางเทคนิคเป็นข้อความภาษาไทยที่ผู้ใช้เข้าใจได้ */
function toUserFacingPdfError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (
    (message.includes("String") && message.includes("Path")) ||
    message.includes("InvalidArg") ||
    message.includes("CanvasElement")
  ) {
    return "ระบบอ่าน PDF ไม่สำเร็จ (ปัญหา engine วาดหน้า PDF) — ลองอัปโหลดไฟล์ใหม่หรือใช้ PDF ที่มี text layer";
  }

  if (message.includes("too large") || message.includes("50MB")) {
    return "ไฟล์ PDF ใหญ่เกิน 50MB";
  }

  if (message.includes("Invalid PDF file path")) {
    return "พาธไฟล์ PDF ไม่ถูกต้อง";
  }

  if (
    message.includes("ไม่สามารถดึงข้อความ") ||
    message.includes("PDF ต้องใช้ OCR")
  ) {
    return message;
  }

  return message || "เกิดข้อผิดพลาดในการดึงข้อความจาก PDF";
}

async function createPdfParser(buffer: Buffer) {
  const { PDFParse } = await runtimeImport<typeof import("pdf-parse")>("pdf-parse");
  return new PDFParse({
    data: buffer,
    disableFontFace: true,
    useSystemFonts: true,
  });
}

/** ดึงข้อความจาก text layer ด้วย pdf-parse v2 */
async function parsePdf(buffer: Buffer): Promise<ParsedPdfResult> {
  let parser: Awaited<ReturnType<typeof createPdfParser>> | null = null;

  try {
    parser = await createPdfParser(buffer);
    const textResult = await parser.getText();
    const infoResult = await parser.getInfo();

    const text = sanitizePdfText(textResult.text || "");

    if (!isUsableExtractedText(text)) {
      throw new PdfNeedsOcrError();
    }

    const rawInfo = (infoResult.info ?? {}) as Record<string, unknown>;

    return {
      text,
      numpages: textResult.total || infoResult.total || 1,
      info: mapPdfInfo(rawInfo),
      version: undefined,
      metadata: infoResult.metadata ? { source: "pdf-parse-v2" } : undefined,
      method: "text-layer",
    };
  } catch (error) {
    if (error instanceof PdfNeedsOcrError) {
      throw error;
    }

    console.warn("Primary PDF parser failed, falling back to OCR:", error);
    throw new PdfNeedsOcrError();
  } finally {
    if (parser) {
      await parser.destroy().catch(() => undefined);
    }
  }
}

/** OCR fallback — render หน้า PDF เป็น PNG แล้วส่งให้ Tesseract */
async function ocrPdf(buffer: Buffer): Promise<ParsedPdfResult> {
  const { createWorker } = await runtimeImport<typeof import("tesseract.js")>(
    "tesseract.js"
  );

  const maxPages = Number(process.env.PDF_OCR_MAX_PAGES || DEFAULT_OCR_MAX_PAGES);
  const pageLimit = Number.isFinite(maxPages) ? maxPages : DEFAULT_OCR_MAX_PAGES;

  let parser: Awaited<ReturnType<typeof createPdfParser>> | null = null;
  const worker = await createWorker("tha+eng");
  const pageTexts: string[] = [];

  try {
    parser = await createPdfParser(buffer);
    const infoResult = await parser.getInfo();
    const totalPages = infoResult.total;

    const screenshotResult = await parser.getScreenshot({
      first: pageLimit,
      imageBuffer: true,
      scale: OCR_SCALE,
    });

    await worker.setParameters({
      preserve_interword_spaces: "1",
      user_defined_dpi: "180",
    });

    for (const page of screenshotResult.pages) {
      const imageBuffer = Buffer.from(page.data);
      const result = await worker.recognize(imageBuffer);
      const text = sanitizePdfText(result.data.text || "").trim();

      if (text) {
        pageTexts.push(`--- หน้า ${page.pageNumber} ---\n${text}`);
      }
    }

    const text = sanitizePdfText(pageTexts.join("\n\n"));
    const processedPages = screenshotResult.pages.length;

    if (!isUsableExtractedText(text)) {
      throw new Error(
        "ไม่สามารถดึงข้อความที่อ่านได้จาก PDF นี้ได้ อาจเป็นไฟล์สแกนคุณภาพต่ำหรือมีการเข้ารหัส"
      );
    }

    return {
      text,
      numpages: totalPages,
      info: mapPdfInfo((infoResult.info ?? {}) as Record<string, unknown>),
      version: undefined,
      metadata: {
        method: "ocr",
        processedPages,
        totalPages,
      },
      method: "ocr",
    };
  } finally {
    await worker.terminate().catch(() => undefined);
    if (parser) {
      await parser.destroy().catch(() => undefined);
    }
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
  method: ExtractionMethod;
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
    const pdfBuffer = await readPdfBuffer(filePath);

    let result: ParsedPdfResult;

    try {
      result = await parsePdf(pdfBuffer);
    } catch (error) {
      if (!(error instanceof PdfNeedsOcrError)) {
        throw error;
      }

      result = await ocrPdf(pdfBuffer);
    }

    return {
      text: sanitizePdfText(result.text),
      pageCount: result.numpages,
      info: result.info,
      version: result.version,
      metadata: result.metadata,
      method: result.method,
    };
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error(toUserFacingPdfError(error));
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
    return sanitizePdfText(result.text);
  } catch (error) {
    console.error("PDF page extraction error:", error);
    throw new Error(toUserFacingPdfError(error));
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
