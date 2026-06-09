import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  FileText,
  Calendar,
  FolderOpen,
  Download,
  Trash2,
  Edit,
  ExternalLink,
  FileSearch,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PdfExtractionButton } from "../components/PdfExtractionButton";
import { ExtractionStatus } from "@/lib/generated/prisma/client";
import { summarizeText } from "@/lib/services/pdf-extraction";

// Type for PDF source
interface PdfSource {
  id: string;
  filename: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  pageCount: number | null;
  extractedText: string | null;
  extractionStatus: ExtractionStatus;
  extractionError: string | null;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectWithPdfs {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  pdfSources: PdfSource[];
}

interface ProjectDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getProject(id: string): Promise<ProjectWithPdfs | null> {
  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        pdfSources: true,
      },
    });
    if (!project) return null;

    return {
      ...project,
      pdfSources: project.pdfSources.map((pdf) => ({
        ...pdf,
        extractedText: pdf.extractedText ? summarizeText(pdf.extractedText, 2000) : null,
      })),
    } as ProjectWithPdfs;
  } catch (error) {
    console.error("Error fetching project:", error);
    return null;
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

const statusMap = {
  active: { label: "ใช้งานอยู่", variant: "default" as const },
  archived: { label: "จัดเก็บ", variant: "secondary" as const },
  completed: { label: "เสร็จสิ้น", variant: "outline" as const },
};

const extractionStatusMap: Record<ExtractionStatus, { label: string; color: string }> = {
  [ExtractionStatus.PENDING]: { label: "รอดำเนินการ", color: "text-gray-500" },
  [ExtractionStatus.PROCESSING]: { label: "กำลังประมวลผล", color: "text-blue-500" },
  [ExtractionStatus.COMPLETED]: { label: "เสร็จสิ้น", color: "text-green-500" },
  [ExtractionStatus.FAILED]: { label: "ล้มเหลว", color: "text-red-500" },
};

export async function generateMetadata({ params }: ProjectDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    return {
      title: "ไม่พบโปรเจกต์ - Lesson Plan PDF Builder",
    };
  }

  return {
    title: `${project.name} - Lesson Plan PDF Builder`,
    description: project.description || "รายละเอียดโปรเจกต์",
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  const status = statusMap[project.status as keyof typeof statusMap] || statusMap.active;
  const totalSize = project.pdfSources.reduce((sum: number, pdf: PdfSource) => sum + (pdf.fileSize || 0), 0);
  
  // คำนวณสถิติการดึงข้อความ
  const totalPdfs = project.pdfSources.length;
  const extractedPdfs = project.pdfSources.filter(
    (pdf) => pdf.extractionStatus === ExtractionStatus.COMPLETED
  ).length;
  const pendingPdfs = project.pdfSources.filter(
    (pdf) => pdf.extractionStatus === ExtractionStatus.PENDING
  ).length;
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/projects">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            {project.description && (
              <p className="text-muted-foreground">{project.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/projects/${project.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              แก้ไข
            </Link>
          </Button>
          <Button variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            ลบ
          </Button>
        </div>
      </div>

      {/* Project Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            ข้อมูลโปรเจกต์
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">รหัสโปรเจกต์</p>
              <p className="font-medium">{project.id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">สถานะ</p>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">สร้างเมื่อ</p>
              <p className="font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(project.createdAt)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">อัปเดตล่าสุด</p>
              <p className="font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(project.updatedAt)}
              </p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{totalPdfs}</p>
              <p className="text-sm text-muted-foreground">ไฟล์ PDF</p>
            </div>
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{extractedPdfs}</p>
              <p className="text-sm text-muted-foreground">ดึงข้อความแล้ว</p>
            </div>
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{pendingPdfs}</p>
              <p className="text-sm text-muted-foreground">รอดำเนินการ</p>
            </div>
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{formatFileSize(totalSize)}</p>
              <p className="text-sm text-muted-foreground">พื้นที่ใช้งาน</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PDF Files with Extraction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            ไฟล์ PDF
          </CardTitle>
          <CardDescription>
            รายการไฟล์ PDF และสถานะการดึงข้อความ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {project.pdfSources.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">ยังไม่มีไฟล์ PDF</p>
            </div>
          ) : (
            <div className="space-y-4">
              {project.pdfSources.map((pdf: PdfSource) => (
                <div
                  key={pdf.id}
                  className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  {/* ส่วนบน: ข้อมูลไฟล์ */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="font-medium">{pdf.originalName}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{formatFileSize(pdf.fileSize)}</span>
                          <span>•</span>
                          <span>{formatDate(pdf.createdAt)}</span>
                          {pdf.pageCount && (
                            <>
                              <span>•</span>
                              <span>{pdf.pageCount} หน้า</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={pdf.filePath}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          เปิด
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={pdf.filePath} download>
                          <Download className="mr-2 h-4 w-4" />
                          ดาวน์โหลด
                        </a>
                      </Button>
                    </div>
                  </div>

                  {/* ส่วนล่าง: สถานะการดึงข้อความ */}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <FileSearch className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">สถานะการดึงข้อความ:</span>
                        <span className={extractionStatusMap[pdf.extractionStatus].color}>
                          {extractionStatusMap[pdf.extractionStatus].label}
                        </span>
                        {pdf.extractedText && (
                          <span className="text-muted-foreground">
                            (มีข้อความที่ดึงแล้ว)
                          </span>
                        )}
                      </div>
                      <PdfExtractionButton
                        pdfSourceId={pdf.id}
                        originalName={pdf.originalName}
                        extractionStatus={pdf.extractionStatus}
                        extractedText={pdf.extractedText}
                        pageCount={pdf.pageCount}
                        extractionError={pdf.extractionError}
                      />
                    </div>
                    {pdf.extractionError && (
                      <p className="text-sm text-red-500 mt-2">
                        ข้อผิดพลาด: {pdf.extractionError}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href="/dashboard/projects">
            <ChevronLeft className="mr-2 h-4 w-4" />
            กลับไปหน้าโปรเจกต์
          </Link>
        </Button>
      </div>
    </div>
  );
}
