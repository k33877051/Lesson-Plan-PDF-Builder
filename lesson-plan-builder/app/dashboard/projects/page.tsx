import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FolderOpen,
  Plus,
  Search,
  FileText,
  Calendar,
  MoreVertical,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { prisma, checkDatabaseConnection } from "@/lib/prisma";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { DeleteProjectButton } from "@/components/dashboard/DeleteProjectButton";
import { PageHeader } from "@/components/layout/page-header";
import { ResponsiveContainer } from "@/components/layout/responsive-container";

// Type for PDF source
interface PdfSource {
  id: string;
  filename: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  pageCount: number | null;
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

interface ProjectsResult {
  projects: ProjectWithPdfs[];
  error?: string;
  dbConnected: boolean;
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "โปรเจกต์ - Lesson Plan PDF Builder",
  description: "จัดการโปรเจกต์และไฟล์ PDF",
};

async function getProjects(): Promise<ProjectsResult> {
  try {
    // Check database connection first
    const isConnected = await checkDatabaseConnection();
    
    if (!isConnected) {
      return {
        projects: [],
        error: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาตรวจสอบว่า PostgreSQL กำลังทำงานอยู่",
        dbConnected: false,
      };
    }

    const projects = await prisma.project.findMany({
      include: {
        pdfSources: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return {
      projects,
      dbConnected: true,
    };
  } catch (error) {
    console.error("Error fetching projects:", error);
    
    // Provide more specific error message
    let errorMessage = "เกิดข้อผิดพลาดในการดึงข้อมูลโปรเจกต์";
    
    if (error instanceof Error) {
      if (error.message.includes("connect")) {
        errorMessage = "ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาตรวจสอบการตั้งค่า DATABASE_URL";
      } else if (error.message.includes("timeout")) {
        errorMessage = "การเชื่อมต่อฐานข้อมูลหมดเวลา กรุณาลองใหม่อีกครั้ง";
      }
    }
    
    return {
      projects: [],
      error: errorMessage,
      dbConnected: false,
    };
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
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

export default async function ProjectsPage() {
  const { projects, error, dbConnected } = await getProjects();

  return (
    <ResponsiveContainer className="space-y-6">
      {/* Database Connection Alert */}
      {!dbConnected && error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>ปัญหาการเชื่อมต่อฐานข้อมูล</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{error}</p>
            <p className="text-sm">
              โปรดตรวจสอบ PostgreSQL และค่า <code className="bg-red-100 px-1 py-0.5 rounded text-red-800">DATABASE_URL</code>
            </p>
          </AlertDescription>
        </Alert>
      )}

      <PageHeader
        title="โปรเจกต์"
        description="จัดการโปรเจกต์และไฟล์ PDF ของคุณ"
        actions={
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              สร้างโปรเจกต์ใหม่
            </Link>
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="ค้นหาโปรเจกต์..."
            className="pl-10"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="สถานะ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            <SelectItem value="active">ใช้งานอยู่</SelectItem>
            <SelectItem value="archived">จัดเก็บ</SelectItem>
            <SelectItem value="completed">เสร็จสิ้น</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">ยังไม่มีโปรเจกต์</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              เริ่มต้นด้วยการสร้างโปรเจกต์ใหม่และอัปโหลดไฟล์ PDF
            </p>
            <Button asChild>
              <Link href="/dashboard/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                สร้างโปรเจกต์ใหม่
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {projects.map((project: ProjectWithPdfs) => {
            const status = statusMap[project.status as keyof typeof statusMap] || statusMap.active;
            const pdfCount = project.pdfSources.length;
            const totalSize = project.pdfSources.reduce((sum: number, pdf: PdfSource) => sum + (pdf.fileSize || 0), 0);

            return (
              <Card key={project.id} className="group">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12">
                        <FolderOpen className="h-6 w-6 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold sm:text-lg">
                            <Link
                              href={`/dashboard/projects/${project.id}`}
                              className="hover:text-primary transition-colors"
                            >
                              {project.name}
                            </Link>
                          </h3>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        {project.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {project.description}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground sm:text-sm">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(project.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {pdfCount} ไฟล์
                          </span>
                          {totalSize > 0 && (
                            <span>{formatFileSize(totalSize)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/projects/${project.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            ดูรายละเอียด
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/projects/${project.id}/edit`}>
                            แก้ไข
                          </Link>
                        </DropdownMenuItem>
                        <DeleteProjectButton
                          projectId={project.id}
                          projectName={project.name}
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* PDF Files Preview */}
                  {project.pdfSources.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium mb-2">ไฟล์ PDF:</p>
                      <div className="flex flex-wrap gap-2">
                        {project.pdfSources.map((pdf: PdfSource) => (
                          <div
                            key={pdf.id}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted text-sm"
                          >
                            <FileText className="h-4 w-4 text-red-500" />
                            <span className="truncate max-w-[140px] sm:max-w-[200px]">
                              {pdf.originalName}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              ({formatFileSize(pdf.fileSize)})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </ResponsiveContainer>
  );
}
