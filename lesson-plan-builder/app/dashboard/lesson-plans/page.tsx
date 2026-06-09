import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Plus,
  Search,
  Grid3X3,
  List,
  MoreVertical,
  Edit,
  Eye,
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "แผนการสอนของฉัน - Lesson Plan PDF Builder",
  description: "จัดการแผนการสอนทั้งหมดของคุณ",
};

const subjectLabels: Record<string, string> = {
  mathematics: "คณิตศาสตร์",
  science: "วิทยาศาสตร์",
  thai: "ภาษาไทย",
  english: "ภาษาอังกฤษ",
  social: "สังคมศึกษา",
  history: "ประวัติศาสตร์",
  geography: "ภูมิศาสตร์",
  civics: "หน้าที่พลเมือง",
  physics: "ฟิสิกส์",
  chemistry: "เคมี",
  biology: "ชีววิทยา",
  computer: "คอมพิวเตอร์",
  art: "ศิลปะ",
  music: "ดนตรี",
  pe: "พลศึกษา",
  health: "สุขศึกษา",
  other: "อื่นๆ",
};

const gradeLabels: Record<string, string> = {
  p1: "ประถมศึกษาปีที่ 1",
  p2: "ประถมศึกษาปีที่ 2",
  p3: "ประถมศึกษาปีที่ 3",
  p4: "ประถมศึกษาปีที่ 4",
  p5: "ประถมศึกษาปีที่ 5",
  p6: "ประถมศึกษาปีที่ 6",
  m1: "มัธยมศึกษาปีที่ 1",
  m2: "มัธยมศึกษาปีที่ 2",
  m3: "มัธยมศึกษาปีที่ 3",
  m4: "มัธยมศึกษาปีที่ 4",
  m5: "มัธยมศึกษาปีที่ 5",
  m6: "มัธยมศึกษาปีที่ 6",
  vocational: "อาชีวศึกษา",
  university: "อุดมศึกษา",
};

const statusMap = {
  completed: { label: "เสร็จสมบูรณ์", variant: "default" as const },
  published: { label: "เผยแพร่แล้ว", variant: "default" as const },
  draft: { label: "ฉบับร่าง", variant: "secondary" as const },
  archived: { label: "จัดเก็บ", variant: "outline" as const },
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default async function LessonPlansPage() {
  const lessonPlans = await prisma.lessonPlan.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      lessonTitle: true,
      subjectName: true,
      gradeLevel: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">แผนการสอนของฉัน</h1>
          <p className="text-muted-foreground">
            จัดการแผนการสอนทั้งหมดของคุณ
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/lesson-plans/new">
            <Plus className="mr-2 h-4 w-4" />
            สร้างแผนการสอนใหม่
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="ค้นหาแผนการสอน..."
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="สถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="completed">เสร็จสมบูรณ์</SelectItem>
              <SelectItem value="draft">ฉบับร่าง</SelectItem>
              <SelectItem value="archived">จัดเก็บ</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="วิชา" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกวิชา</SelectItem>
              <SelectItem value="science">วิทยาศาสตร์</SelectItem>
              <SelectItem value="math">คณิตศาสตร์</SelectItem>
              <SelectItem value="english">ภาษาอังกฤษ</SelectItem>
              <SelectItem value="thai">ภาษาไทย</SelectItem>
              <SelectItem value="social">สังคมศึกษา</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Lesson Plans Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lessonPlans.map((plan) => {
          const status = statusMap[plan.status as keyof typeof statusMap] ?? statusMap.draft;
          return (
            <Card key={plan.id} className="group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base line-clamp-1">
                        {plan.lessonTitle}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {subjectLabels[plan.subjectName] ?? plan.subjectName} •{" "}
                        {gradeLabels[plan.gradeLevel] ?? plan.gradeLevel}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/editor/${plan.id}`}>
                          <Edit className="mr-2 h-4 w-4" />
                          แก้ไข
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/preview/${plan.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          ดูตัวอย่าง
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/preview/${plan.id}`}>
                          <Download className="mr-2 h-4 w-4" />
                          ส่งออก PDF
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        ลบ
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(plan.updatedAt)}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>สถานะ: {status.label}</span>
                  <span>•</span>
                  <span>สร้าง: {formatDate(plan.createdAt)}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/editor/${plan.id}`}>
                      แก้ไข
                    </Link>
                  </Button>
                  <Button size="sm" className="flex-1" asChild>
                    <Link href={`/preview/${plan.id}`}>
                      <Download className="mr-2 h-4 w-4" />
                      PDF
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
