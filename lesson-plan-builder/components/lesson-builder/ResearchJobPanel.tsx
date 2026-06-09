"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Search,
  AlertTriangle,
} from "lucide-react";

export interface ResearchJobStatus {
  jobId: string;
  status: "pending" | "running" | "completed" | "failed";
  topic: string;
  subject: string;
  gradeLevel: string;
  progress?: number;
  totalQueries?: number;
  completedQueries?: number;
  error?: string;
}

interface ResearchJobPanelProps {
  job: ResearchJobStatus | null;
  onRetry?: () => void;
}

export function ResearchJobPanel({ job, onRetry }: ResearchJobPanelProps) {
  if (!job) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="py-8 text-center text-muted-foreground">
          <Search className="mx-auto h-8 w-8 mb-3 opacity-50" />
          <p>กรอกข้อมูลแผนการสอนและคลิก "ค้นหาแหล่งข้อมูล"</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    switch (job.status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "running":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    switch (job.status) {
      case "completed":
        return <Badge className="bg-green-500">เสร็จสิ้น</Badge>;
      case "failed":
        return <Badge variant="destructive">ล้มเหลว</Badge>;
      case "running":
        return <Badge className="bg-blue-500">กำลังค้นหา...</Badge>;
      case "pending":
        return <Badge variant="outline">รอดำเนินการ</Badge>;
      default:
        return null;
    }
  };

  const getProgress = () => {
    if (job.status === "completed") return 100;
    if (job.status === "failed") return 100;
    if (job.totalQueries && job.completedQueries !== undefined) {
      return Math.round((job.completedQueries / job.totalQueries) * 100);
    }
    return job.progress || 0;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle className="text-lg">สถานะการค้นคว้า</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>
          หัวข้อ: {job.topic} | {getSubjectLabel(job.subject)} | {getGradeLabel(job.gradeLevel)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        {(job.status === "running" || job.status === "pending") && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ความคืบหน้า</span>
              <span>{getProgress()}%</span>
            </div>
            <Progress value={getProgress()} className="h-2" />
          </div>
        )}

        {/* Query Progress */}
        {job.totalQueries && job.totalQueries > 0 && (
          <div className="text-sm text-muted-foreground">
            คำค้นหาที่ดำเนินการ: {job.completedQueries || 0} / {job.totalQueries}
          </div>
        )}

        {/* Error */}
        {job.status === "failed" && job.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{job.error}</AlertDescription>
          </Alert>
        )}

        {/* Retry Button */}
        {job.status === "failed" && onRetry && (
          <Button onClick={onRetry} variant="outline" className="w-full">
            <Search className="mr-2 h-4 w-4" />
            ลองค้นหาใหม่
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function getSubjectLabel(subject: string): string {
  const labels: Record<string, string> = {
    mathematics: "คณิตศาสตร์",
    science: "วิทยาศาสตร์",
    thai: "ภาษาไทย",
    english: "ภาษาอังกฤษ",
    social: "สังคมศึกษา",
    history: "ประวัติศาสตร์",
    geography: "ภูมิศาสตร์",
    physics: "ฟิสิกส์",
    chemistry: "เคมี",
    biology: "ชีววิทยา",
    computer: "คอมพิวเตอร์",
    art: "ศิลปะ",
    music: "ดนตรี",
    pe: "พลศึกษา",
    health: "สุขศึกษา",
  };
  return labels[subject] || subject;
}

function getGradeLabel(grade: string): string {
  const labels: Record<string, string> = {
    p1: "ป.1",
    p2: "ป.2",
    p3: "ป.3",
    p4: "ป.4",
    p5: "ป.5",
    p6: "ป.6",
    m1: "ม.1",
    m2: "ม.2",
    m3: "ม.3",
    m4: "ม.4",
    m5: "ม.5",
    m6: "ม.6",
  };
  return labels[grade] || grade;
}
