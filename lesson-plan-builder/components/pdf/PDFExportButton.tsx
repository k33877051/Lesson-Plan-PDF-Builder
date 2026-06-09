"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileDown, Loader2, CheckCircle, AlertCircle, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PDFExportButtonProps {
  lessonPlanId: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onExportStart?: () => void;
  onExportComplete?: (downloadUrl: string) => void;
  onExportError?: (error: string) => void;
}

interface ExportResponse {
  success: boolean;
  downloadUrl?: string;
  filename?: string;
  error?: string;
}

type ExportStatus = "idle" | "loading" | "success" | "error";

export function PDFExportButton({
  lessonPlanId,
  variant = "default",
  size = "default",
  className,
  onExportStart,
  onExportComplete,
  onExportError,
}: PDFExportButtonProps) {
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showDialog, setShowDialog] = useState(false);

  const handleExport = useCallback(async () => {
    setStatus("loading");
    setErrorMessage("");
    setShowDialog(true);
    onExportStart?.();

    try {
      const response = await fetch("/api/export-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lessonPlanId }),
      });

      const data: ExportResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการสร้าง PDF");
      }

      setDownloadUrl(data.downloadUrl || null);
      setFilename(data.filename || "");
      setStatus("success");
      onExportComplete?.(data.downloadUrl || "");
    } catch (error) {
      const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่คาดคิด";
      setErrorMessage(message);
      setStatus("error");
      onExportError?.(message);
    }
  }, [lessonPlanId, onExportStart, onExportComplete, onExportError]);

  const handleDownload = useCallback(() => {
    if (downloadUrl) {
      // Create a temporary link to trigger download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename || "lesson-plan.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [downloadUrl, filename]);

  const handleClose = useCallback(() => {
    setShowDialog(false);
    // Reset status after a delay
    setTimeout(() => {
      if (status !== "loading") {
        setStatus("idle");
        setDownloadUrl(null);
        setErrorMessage("");
      }
    }, 300);
  }, [status]);

  const getStatusIcon = () => {
    switch (status) {
      case "loading":
        return <Loader2 className="h-5 w-5 animate-spin" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FileDown className="h-4 w-4" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case "loading":
        return "กำลังสร้าง PDF...";
      case "success":
        return "สร้าง PDF สำเร็จ";
      case "error":
        return "เกิดข้อผิดพลาด";
      default:
        return "";
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case "loading":
        return "กรุณารอสักครู่ ระบบกำลังสร้างไฟล์ PDF จากแผนการสอนของคุณ";
      case "success":
        return `ไฟล์ ${filename} พร้อมให้ดาวน์โหลดแล้ว`;
      case "error":
        return errorMessage;
      default:
        return "";
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleExport}
        disabled={status === "loading"}
      >
        {status === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <FileDown className="h-4 w-4 mr-2" />
        )}
        ส่งออก PDF
      </Button>

      <Dialog open={showDialog} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <DialogTitle>{getStatusTitle()}</DialogTitle>
            </div>
            <DialogDescription>{getStatusDescription()}</DialogDescription>
          </DialogHeader>

          {status === "loading" && (
            <div className="py-6">
              <div className="space-y-3">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary animate-pulse rounded-full" style={{ width: "60%" }} />
                </div>
                <p className="text-sm text-gray-500 text-center">
                  กำลัง render หน้า A4 และสร้างไฟล์ PDF...
                </p>
              </div>
            </div>
          )}

          {status === "success" && downloadUrl && (
            <div className="py-4 space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700">
                  ไฟล์ PDF ถูกสร้างและบันทึกเรียบร้อยแล้ว
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button onClick={handleDownload} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  ดาวน์โหลด PDF
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  ปิด
                </Button>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="py-4 space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  ปิด
                </Button>
                <Button onClick={handleExport} variant="default">
                  ลองอีกครั้ง
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default PDFExportButton;
