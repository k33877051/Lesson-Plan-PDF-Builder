"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileSearch, CheckCircle, AlertCircle, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type ExtractionStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

interface PdfExtractionButtonProps {
  pdfSourceId: string;
  originalName: string;
  extractionStatus: ExtractionStatus;
  extractedText: string | null;
  pageCount: number | null;
  extractionError: string | null;
}

interface ExtractionResult {
  success: boolean;
  message: string;
  data?: {
    pageCount: number;
    textLength: number;
    textPreview: string;
    metadata?: {
      title?: string;
      author?: string;
      subject?: string;
      method?: "text-layer" | "ocr";
      processedPages?: number;
      totalPages?: number;
    };
  };
  error?: string;
}

function isReadableText(text: string) {
  const sample = text.trim().slice(0, 4000);
  if (sample.length < 30) return false;

  const replacementChars = (sample.match(/\uFFFD/g) || []).length;
  const readableChars = (sample.match(/[\u0E00-\u0E7Fa-zA-Z0-9\s.,:;!?()[\]\-'"“”‘’/%]/g) || []).length;
  const longGarbageRuns = /[^\u0E00-\u0E7Fa-zA-Z0-9\s.,:;!?()[\]\-'"“”‘’/%]{8,}/.test(sample);

  return readableChars / sample.length >= 0.55 && replacementChars / sample.length <= 0.02 && !longGarbageRuns;
}

export function PdfExtractionButton({
  pdfSourceId,
  originalName,
  extractionStatus,
  extractedText,
  pageCount,
  extractionError,
}: PdfExtractionButtonProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const hasReadableText = Boolean(extractedText && isReadableText(extractedText));

  const handleExtract = async () => {
    setIsExtracting(true);
    setResult(null);

    try {
      const response = await fetch("/api/extract-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfSourceId }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        // รีเฟรชหน้าเพื่อแสดงข้อมูลใหม่
        window.location.reload();
      }
    } catch (error) {
      setResult({
        success: false,
        message: "เกิดข้อผิดพลาดในการเชื่อมต่อ",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const getStatusBadge = () => {
    switch (extractionStatus) {
      case "COMPLETED":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            ดึงข้อความแล้ว
          </Badge>
        );
      case "PROCESSING":
        return (
          <Badge variant="secondary">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            กำลังประมวลผล
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            ล้มเหลว
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <FileSearch className="h-3 w-3 mr-1" />
            ยังไม่ได้ดึงข้อความ
          </Badge>
        );
    }
  };

  return (
    <div className="flex items-center gap-2">
      {getStatusBadge()}

      {extractionStatus === "COMPLETED" && hasReadableText ? (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              ดูข้อความ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>ข้อความที่ดึงได้จาก PDF</DialogTitle>
              <DialogDescription>
                {originalName} • {pageCount || 0} หน้า • แสดงตัวอย่างข้อความ
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {extractedText}
              </pre>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleExtract}
          disabled={isExtracting || extractionStatus === "PROCESSING"}
        >
          {isExtracting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              กำลังดึง...
            </>
          ) : (
            <>
              <FileSearch className="h-4 w-4 mr-2" />
              {extractionStatus === "FAILED" || (extractionStatus === "COMPLETED" && !hasReadableText)
                ? "ดึงใหม่"
                : "ดึงข้อความ"}
            </>
          )}
        </Button>
      )}

      {result && !result.success && (
        <div className="text-sm text-red-500">
          {result.error || result.message}
        </div>
      )}
      {!result && extractionStatus === "FAILED" && extractionError && (
        <div className="text-sm text-red-500">{extractionError}</div>
      )}
    </div>
  );
}
