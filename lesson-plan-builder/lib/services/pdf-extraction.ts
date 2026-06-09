import { mkdtemp, readFile, rm, stat, writeFile } from "fs/promises";
import { tmpdir } from "os";
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

// Use pdf-parse-fork which works better in server environments
// Or use a pure JS alternative
async function parsePdf(buffer: Buffer): Promise<ParsedPdfResult> {
  try {
    // Try using pdf-parse library
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");

    // Parse with options
    const result = await pdfParse(buffer, {
      max: 0, // No page limit
    });

    const text = sanitizePdfText(result.text || "");

    if (!isUsableExtractedText(text)) {
      throw new PdfNeedsOcrError();
    }

    return {
      text,
      numpages: result.numpages || 1,
      info: result.info || {},
      version: result.version,
      metadata: result.metadata,
      method: "text-layer" as ExtractionMethod,
    };
  } catch (error) {
    if (error instanceof PdfNeedsOcrError) {
      throw error;
    }

    console.warn("Primary PDF parser failed, falling back to OCR:", error);
    throw new PdfNeedsOcrError();
  }
}

async function ocrPdf(buffer: Buffer): Promise<ParsedPdfResult> {
  const pdfjs = await runtimeImport<typeof import("pdfjs-dist/legacy/build/pdf.mjs")>(
    "pdfjs-dist/legacy/build/pdf.mjs"
  );
  const { createCanvas } = await runtimeImport<typeof import("@napi-rs/canvas")>(
    "@napi-rs/canvas"
  );
  const { createWorker } = await runtimeImport<typeof import("tesseract.js")>(
    "tesseract.js"
  );

  const maxPages = Number(process.env.PDF_OCR_MAX_PAGES || DEFAULT_OCR_MAX_PAGES);
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    disableFontFace: true,
    useSystemFonts: true,
  });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const pageLimit = Math.min(totalPages, Number.isFinite(maxPages) ? maxPages : DEFAULT_OCR_MAX_PAGES);
  const worker = await createWorker("tha+eng");
  const pageTexts: string[] = [];

  try {
    await worker.setParameters({
      preserve_interword_spaces: "1",
      user_defined_dpi: "180",
    });

    for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: OCR_SCALE });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const context = canvas.getContext("2d");

      const renderParams = {
        canvas,
        canvasContext: context,
        viewport,
      } as unknown as Parameters<typeof page.render>[0];

      await page.render(renderParams).promise;

      const image = canvas.toBuffer("image/png");
      const result = await worker.recognize(image);
      const text = sanitizePdfText(result.data.text || "").trim();

      if (text) {
        pageTexts.push(`--- หน้า ${pageNumber} ---\n${text}`);
      }

      page.cleanup();
    }
  } finally {
    await worker.terminate();
    await pdf.destroy();
  }

  const text = sanitizePdfText(pageTexts.join("\n\n"));

  if (!isUsableExtractedText(text)) {
    throw new Error(
      "ไม่สามารถดึงข้อความที่อ่านได้จาก PDF นี้ได้ อาจเป็นไฟล์สแกนคุณภาพต่ำหรือมีการเข้ารหัส"
    );
  }

  return {
    text,
    numpages: totalPages,
    info: {},
    version: undefined,
    metadata: {
      method: "ocr",
      processedPages: pageLimit,
      totalPages,
    },
    method: "ocr" as ExtractionMethod,
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
    // อ่านไฟล์ PDF
    const pdfBuffer = await readPdfBuffer(filePath);

    let result: ParsedPdfResult;

    try {
      // ดึงข้อความจาก text layer ก่อน ถ้าใช้ไม่ได้ค่อย OCR
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
