"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2, FileText } from "lucide-react";

export interface LessonPlanFormData {
  topic: string;
  subject: string;
  gradeLevel: string;
  durationMinutes: number | "";
  teacherName: string;
  schoolName: string;
}

interface LessonPlanFormProps {
  onSubmit: (data: LessonPlanFormData) => void;
  isLoading?: boolean;
  initialData?: Partial<LessonPlanFormData>;
  showPdfGenerate?: boolean;
  isPdfGenerating?: boolean;
  onGenerateFromPdf?: (data: LessonPlanFormData) => void;
}

const subjects = [
  { value: "mathematics", label: "คณิตศาสตร์" },
  { value: "science", label: "วิทยาศาสตร์" },
  { value: "thai", label: "ภาษาไทย" },
  { value: "english", label: "ภาษาอังกฤษ" },
  { value: "social", label: "สังคมศึกษา" },
  { value: "history", label: "ประวัติศาสตร์" },
  { value: "geography", label: "ภูมิศาสตร์" },
  { value: "physics", label: "ฟิสิกส์" },
  { value: "chemistry", label: "เคมี" },
  { value: "biology", label: "ชีววิทยา" },
  { value: "computer", label: "คอมพิวเตอร์" },
  { value: "art", label: "ศิลปะ" },
  { value: "music", label: "ดนตรี" },
  { value: "pe", label: "พลศึกษา" },
  { value: "health", label: "สุขศึกษา" },
];

const gradeLevels = [
  { value: "p1", label: "ประถมศึกษาปีที่ 1" },
  { value: "p2", label: "ประถมศึกษาปีที่ 2" },
  { value: "p3", label: "ประถมศึกษาปีที่ 3" },
  { value: "p4", label: "ประถมศึกษาปีที่ 4" },
  { value: "p5", label: "ประถมศึกษาปีที่ 5" },
  { value: "p6", label: "ประถมศึกษาปีที่ 6" },
  { value: "m1", label: "มัธยมศึกษาปีที่ 1" },
  { value: "m2", label: "มัธยมศึกษาปีที่ 2" },
  { value: "m3", label: "มัธยมศึกษาปีที่ 3" },
  { value: "m4", label: "มัธยมศึกษาปีที่ 4" },
  { value: "m5", label: "มัธยมศึกษาปีที่ 5" },
  { value: "m6", label: "มัธยมศึกษาปีที่ 6" },
];

export function LessonPlanForm({
  onSubmit,
  isLoading = false,
  initialData,
  showPdfGenerate = false,
  isPdfGenerating = false,
  onGenerateFromPdf,
}: LessonPlanFormProps) {
  const [formData, setFormData] = useState<LessonPlanFormData>({
    topic: initialData?.topic || "",
    subject: initialData?.subject || "",
    gradeLevel: initialData?.gradeLevel || "",
    durationMinutes: initialData?.durationMinutes || "",
    teacherName: initialData?.teacherName || "",
    schoolName: initialData?.schoolName || "",
  });

  useEffect(() => {
    if (!initialData) return;
    setFormData((prev) => ({
      ...prev,
      ...initialData,
    }));
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.topic && formData.subject && formData.gradeLevel) {
      onSubmit(formData);
    }
  };

  const isValid = formData.topic && formData.subject && formData.gradeLevel;

  return (
    <Card>
      <CardHeader>
        <CardTitle>ข้อมูลแผนการสอน</CardTitle>
        <CardDescription>
          กรอกข้อมูลพื้นฐานเพื่อค้นหาแหล่งข้อมูลและสร้างแผนการสอน
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">
                วิชา <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.subject}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, subject: value }))
                }
              >
                <SelectTrigger id="subject">
                  <SelectValue placeholder="เลือกวิชา" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.value} value={subject.value}>
                      {subject.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Grade Level */}
            <div className="space-y-2">
              <Label htmlFor="gradeLevel">
                ระดับชั้น <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.gradeLevel}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, gradeLevel: value }))
                }
              >
                <SelectTrigger id="gradeLevel">
                  <SelectValue placeholder="เลือกระดับชั้น" />
                </SelectTrigger>
                <SelectContent>
                  {gradeLevels.map((grade) => (
                    <SelectItem key={grade.value} value={grade.value}>
                      {grade.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Topic */}
          <div className="space-y-2">
            <Label htmlFor="topic">
              หัวข้อ / หน่วยการเรียนรู้ <span className="text-red-500">*</span>
            </Label>
            <Input
              id="topic"
              value={formData.topic}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, topic: e.target.value }))
              }
              placeholder="เช่น ระบบสุริยะ, การบวกลบจำนวน, วรรณคดีไทย"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">ระยะเวลา (นาที)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={formData.durationMinutes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    durationMinutes: e.target.value === "" ? "" : parseInt(e.target.value),
                  }))
                }
                placeholder="เช่น 120"
              />
            </div>

            {/* Teacher Name */}
            <div className="space-y-2">
              <Label htmlFor="teacherName">ชื่อครูผู้สอน</Label>
              <Input
                id="teacherName"
                value={formData.teacherName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, teacherName: e.target.value }))
                }
                placeholder="เช่น นายสมชาย ใจดี"
              />
            </div>
          </div>

          {/* School Name */}
          <div className="space-y-2">
            <Label htmlFor="schoolName">ชื่อโรงเรียน</Label>
            <Input
              id="schoolName"
              value={formData.schoolName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, schoolName: e.target.value }))
              }
              placeholder="เช่น โรงเรียนอยุธยาวิทยาลัย"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!isValid || isLoading || isPdfGenerating}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังค้นหา...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                ค้นหาแหล่งข้อมูล
              </>
            )}
          </Button>

          {showPdfGenerate && onGenerateFromPdf && (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={!isValid || isLoading || isPdfGenerating}
              onClick={() => onGenerateFromPdf(formData)}
            >
              {isPdfGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังสร้างจาก PDF...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  สร้างจาก PDF โดยตรง (ข้ามการค้นคว้า)
                </>
              )}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
