"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Edit, Printer } from "lucide-react";
import { PDFExportButton } from "@/components/pdf/PDFExportButton";

interface PreviewToolbarProps {
  lessonPlanId: string;
  lessonTitle: string;
  backHref: string;
  onPrint: () => void;
}

export function PreviewToolbar({
  lessonPlanId,
  lessonTitle,
  backHref,
  onPrint,
}: PreviewToolbarProps) {
  return (
    <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 print:hidden">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="shrink-0">
            <Link href={backHref}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">กลับ</span>
            </Link>
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{lessonTitle}</p>
            <p className="text-xs text-muted-foreground">ตัวอย่างแผนการสอน</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
            <Link href={`/editor/${lessonPlanId}`}>
              <Edit className="mr-2 h-4 w-4" />
              แก้ไข
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={onPrint} className="flex-1 sm:flex-none">
            <Printer className="mr-2 h-4 w-4" />
            พิมพ์
          </Button>
          <PDFExportButton lessonPlanId={lessonPlanId} className="flex-1 sm:flex-none" />
        </div>
      </div>
    </div>
  );
}
