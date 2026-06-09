"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  File,
  FolderPlus,
} from "lucide-react";

// Maximum file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

interface UploadResponse {
  success: boolean;
  message: string;
  project?: {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
  };
  pdfSource?: {
    id: string;
    filename: string;
    originalName: string;
    filePath: string;
    fileSize: number;
    fileType: string;
    createdAt: Date;
  };
  error?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function NewProjectPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<UploadResponse | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return "รองรับเฉพาะไฟล์ PDF เท่านั้น";
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return "ไฟล์ต้องมีขนาดไม่เกิน 50MB";
    }

    return null;
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
  }, [validateFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim()) {
      setError("กรุณากรอกชื่อโปรเจกต์");
      return;
    }

    if (!selectedFile) {
      setError("กรุณาเลือกไฟล์ PDF");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("projectName", projectName);
      formData.append("projectDescription", projectDescription);
      formData.append("file", selectedFile);

      setUploadProgress(25);

      // Upload file
      const response = await fetch("/api/upload-pdf", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(100);

      const result: UploadResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "เกิดข้อผิดพลาดในการอัปโหลด");
      }

      setSuccess(result);

      // Redirect to project detail page after 2 seconds
      setTimeout(() => {
        if (result.project?.id) {
          router.push(`/dashboard/projects/${result.project.id}`);
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดที่ไม่คาดคิด");
    } finally {
      setIsUploading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/projects">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">สร้างโปรเจกต์ใหม่</h1>
          </div>
        </div>

        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-green-800 dark:text-green-200">
                  สร้างโปรเจกต์สำเร็จ!
                </h2>
                <p className="text-green-700 dark:text-green-300 mt-1">
                  โปรเจกต์และไฟล์ PDF ถูกบันทึกเรียบร้อยแล้ว
                </p>
              </div>

              <div className="w-full bg-white dark:bg-gray-900 rounded-lg p-4 text-left space-y-2">
                <p className="text-sm">
                  <span className="text-muted-foreground">ชื่อโปรเจกต์:</span>{" "}
                  <span className="font-medium">{success.project?.name}</span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">ไฟล์:</span>{" "}
                  <span className="font-medium">{success.pdfSource?.originalName}</span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">ขนาด:</span>{" "}
                  <span className="font-medium">
                    {formatFileSize(success.pdfSource?.fileSize || 0)}
                  </span>
                </p>
              </div>

              <p className="text-sm text-muted-foreground">
                กำลังนำทางไปยังหน้าโปรเจกต์...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/projects">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">สร้างโปรเจกต์ใหม่</h1>
          <p className="text-muted-foreground">
            อัปโหลดไฟล์ PDF และสร้างโปรเจกต์ใหม่
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5" />
              ข้อมูลโปรเจกต์
            </CardTitle>
            <CardDescription>
              กรอกข้อมูลพื้นฐานสำหรับโปรเจกต์ของคุณ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">
                ชื่อโปรเจกต์ <span className="text-destructive">*</span>
              </Label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="เช่น แผนการสอนวิทยาศาสตร์ ม.1"
                disabled={isUploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectDescription">รายละเอียดโปรเจกต์</Label>
              <Textarea
                id="projectDescription"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับโปรเจกต์ (ไม่บังคับ)"
                rows={3}
                disabled={isUploading}
              />
            </div>
          </CardContent>
        </Card>

        {/* PDF Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              อัปโหลดไฟล์ PDF
            </CardTitle>
            <CardDescription>
              ไฟล์ PDF จะถูกใช้เป็นแหล่งข้อมูลสำหรับสร้างแผนการสอน
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Upload Area */}
            {!selectedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative rounded-lg border-2 border-dashed p-12 text-center transition-colors cursor-pointer ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={handleInputChange}
                  disabled={isUploading}
                />
                <div className="flex flex-col items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      ลากไฟล์มาวางที่นี่ หรือ{" "}
                      <span className="text-primary hover:underline">คลิกเลือกไฟล์</span>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      รองรับเฉพาะไฟล์ PDF ขนาดไม่เกิน 50MB
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900">
                    <File className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>

                    {/* Upload Progress */}
                    {isUploading && (
                      <div className="mt-3 space-y-2">
                        <Progress value={uploadProgress} />
                        <p className="text-xs text-muted-foreground">
                          กำลังอัปโหลด... {uploadProgress}%
                        </p>
                      </div>
                    )}
                  </div>
                  {!isUploading && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={removeFile}
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* File Requirements */}
            <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
              <p className="font-medium">ข้อกำหนดไฟล์:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>รองรับเฉพาะไฟล์ PDF (.pdf)</li>
                <li>ขนาดไฟล์ไม่เกิน 50MB</li>
                <li>แนะนำให้ใช้ไฟล์ PDF ที่มีข้อความสามารถเลือกได้ (ไม่ใช่สแกน)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            asChild
            disabled={isUploading}
          >
            <Link href="/dashboard/projects">ยกเลิก</Link>
          </Button>
          <Button
            type="submit"
            disabled={!projectName || !selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังอัปโหลด...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                สร้างโปรเจกต์
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
