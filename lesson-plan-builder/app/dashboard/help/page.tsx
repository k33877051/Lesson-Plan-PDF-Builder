import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FolderOpen, Sparkles, Printer } from "lucide-react";

export const metadata: Metadata = {
  title: "ช่วยเหลือ - Lesson Plan PDF Builder",
  description: "คู่มือการใช้งานระบบ Lesson Plan PDF Builder",
};

const helpSections = [
  {
    title: "สร้างแผนการสอน",
    description: "เริ่มสร้างข้อมูลในฐานข้อมูลจริง แล้วแก้ไขรายละเอียดด้วย Tiptap editor",
    href: "/dashboard/lesson-plans/new",
    icon: FileText,
  },
  {
    title: "อัปโหลด PDF",
    description: "สร้างโปรเจกต์พร้อมไฟล์ PDF และบันทึก metadata ลงฐานข้อมูล",
    href: "/dashboard/projects/new",
    icon: FolderOpen,
  },
  {
    title: "ใช้ AI ช่วยร่าง",
    description: "เปิดหน้า editor แล้วใช้ปุ่ม AI เพื่อสร้างวัตถุประสงค์ กิจกรรม และการประเมิน",
    href: "/editor/new",
    icon: Sparkles,
  },
  {
    title: "Preview และ Export PDF",
    description: "เปิดหน้า preview ของแผนการสอนเพื่อพิมพ์หรือส่งออกเป็น PDF",
    href: "/dashboard/lesson-plans",
    icon: Printer,
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ช่วยเหลือ</h1>
        <p className="text-muted-foreground">
          คู่มือเส้นทางการใช้งานที่เชื่อมกับข้อมูลจริงของระบบ
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {helpSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.href}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {section.title}
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link href={section.href}>เปิดหน้านี้</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
