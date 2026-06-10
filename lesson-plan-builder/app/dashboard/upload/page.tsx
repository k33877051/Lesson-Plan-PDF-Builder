import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { ResponsiveContainer } from "@/components/layout/responsive-container";
import { FolderOpen, Upload, FileText, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "นำเข้าไฟล์ - Lesson Plan PDF Builder",
  description: "อัปโหลด PDF และสร้างโปรเจกต์",
};

const steps = [
  {
    step: 1,
    title: "สร้างโปรเจกต์",
    description: "ตั้งชื่อโปรเจกต์และคำอธิบายสั้นๆ",
  },
  {
    step: 2,
    title: "อัปโหลด PDF",
    description: "เลือกไฟล์ PDF (สูงสุด 50MB) ระบบตรวจสอบ magic bytes",
  },
  {
    step: 3,
    title: "ใช้งานต่อ",
    description: "Extract ข้อความ หรือสร้างแผนการสอนจากเนื้อหา",
  },
];

export default function UploadPage() {
  return (
    <ResponsiveContainer className="space-y-6">
      <PageHeader
        title="นำเข้าไฟล์"
        description="อัปโหลด PDF และจัดเก็บในโปรเจกต์"
        actions={
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/projects/new">
              <Upload className="mr-2 h-4 w-4" />
              เริ่มอัปโหลด
            </Link>
          </Button>
        }
      />

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div className="max-w-md space-y-2">
            <h2 className="text-lg font-semibold">อัปโหลด PDF ไปยังโปรเจกต์</h2>
            <p className="text-sm text-muted-foreground">
              ระบบจะสร้างโปรเจกต์และบันทึก metadata ลงฐานข้อมูล พร้อมเก็บไฟล์ใน public/uploads
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/dashboard/projects/new">
              ไปหน้าสร้างโปรเจกต์
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {steps.map((item) => (
          <Card key={item.step}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {item.step}
                </span>
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{item.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderOpen className="h-5 w-5" />
            โปรเจกต์ที่มีอยู่
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" asChild className="flex-1">
            <Link href="/dashboard/projects">
              <FileText className="mr-2 h-4 w-4" />
              ดูโปรเจกต์ทั้งหมด
            </Link>
          </Button>
        </CardContent>
      </Card>
    </ResponsiveContainer>
  );
}
