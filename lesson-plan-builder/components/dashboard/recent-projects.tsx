"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Edit, Eye, Download, MoreHorizontal, ArrowRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface RecentLessonPlan {
  id: string;
  title: string;
  subject: string;
  grade: string;
  status: string;
  updatedAt: string;
}

const statusMap = {
  completed: { label: "เสร็จสมบูรณ์", variant: "default" as const },
  published: { label: "เผยแพร่แล้ว", variant: "default" as const },
  draft: { label: "ฉบับร่าง", variant: "secondary" as const },
  archived: { label: "จัดเก็บ", variant: "outline" as const },
};

export function RecentProjects({ lessonPlans }: { lessonPlans: RecentLessonPlan[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">แผนการสอนล่าสุด</CardTitle>
          <p className="text-sm text-muted-foreground">
            แผนการสอนที่คุณทำงานด้วยล่าสุด
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/lesson-plans">
            ดูทั้งหมด
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {lessonPlans.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
            <FileText className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">ยังไม่มีแผนการสอนในฐานข้อมูล</p>
            <p className="mt-1 text-sm text-muted-foreground">
              สร้างแผนการสอนใหม่เพื่อให้แสดงในรายการล่าสุด
            </p>
          </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อแผนการสอน</TableHead>
              <TableHead>วิชา</TableHead>
              <TableHead>ระดับชั้น</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead>อัปเดตล่าสุด</TableHead>
              <TableHead className="text-right">การดำเนินการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lessonPlans.map((project) => {
              const status =
                statusMap[project.status as keyof typeof statusMap] ?? statusMap.draft;
              return (
                <TableRow key={project.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="font-medium">{project.title}</div>
                    </div>
                  </TableCell>
                  <TableCell>{project.subject}</TableCell>
                  <TableCell>{project.grade}</TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {project.updatedAt}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/editor/${project.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/preview/${project.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Link href={`/preview/${project.id}`}>
                          <Download className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/preview/${project.id}`}>ส่งออก PDF</Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        )}
      </CardContent>
    </Card>
  );
}
