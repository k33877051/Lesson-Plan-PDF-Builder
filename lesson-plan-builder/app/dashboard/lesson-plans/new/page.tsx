"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { sampleLessonPlans } from "@/src/data/sample-lesson-plans";
import { AlertCircle, BookOpenText, ChevronLeft } from "lucide-react";

export default function NewLessonPlanPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSamplePicker, setShowSamplePicker] = useState(false);
  const [selectedSampleId, setSelectedSampleId] = useState("");
  const [lessonPlanData, setLessonPlanData] = useState({
    lessonTitle: "",
    subjectName: "",
    gradeLevel: "",
    semester: "1",
    academicYear: new Date().getFullYear() + 543 + "",
    durationMinutes: "",
    teacherName: "",
    schoolName: "",
    objectives: "",
    keyConcepts: "",
    learningActivities: "",
    mediaResources: "",
    assessment: "",
    notes: "",
  });

  const handleSelectSample = (sampleId: string) => {
    setSelectedSampleId(sampleId);

    const sample = sampleLessonPlans.find((item) => item.id === sampleId);
    if (!sample) return;

    setLessonPlanData({
      lessonTitle: sample.title,
      subjectName: sample.subject,
      gradeLevel: sample.gradeLevel,
      semester: sample.semester,
      academicYear: sample.academicYear,
      durationMinutes: sample.duration.toString(),
      teacherName: sample.teacherName,
      schoolName: sample.schoolName,
      objectives: sample.learningObjectives,
      keyConcepts: sample.keyConcepts,
      learningActivities: sample.learningActivities,
      mediaResources: sample.mediaResources,
      assessment: sample.assessment,
      notes: sample.notes,
    });
  };

  const handleCreate = async () => {
    setError(null);
    setIsCreating(true);

    try {
      const response = await fetch("/api/lesson-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...lessonPlanData,
          durationMinutes: lessonPlanData.durationMinutes
            ? Number(lessonPlanData.durationMinutes)
            : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success || !result.data?.id) {
        throw new Error(result.error || "ไม่สามารถสร้างแผนการสอนได้");
      }

      router.push(`/editor/${result.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการสร้างแผนการสอน");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/lesson-plans">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">สร้างแผนการสอนใหม่</h1>
          <p className="text-muted-foreground">
            สร้างข้อมูลเริ่มต้นและบันทึกลงฐานข้อมูลจริง
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Sample Lesson Plans */}
      <Card className="border-dashed">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpenText className="h-5 w-5" />
                ตัวอย่างแผนการสอน
              </CardTitle>
              <CardDescription>
                เลือกตัวอย่างหลายวิชาเพื่อเติมข้อมูลลงฟอร์มอัตโนมัติ
              </CardDescription>
            </div>
            <Button
              type="button"
              variant={showSamplePicker ? "secondary" : "outline"}
              onClick={() => setShowSamplePicker((value) => !value)}
            >
              ใช้ตัวอย่างแผนการสอน
            </Button>
          </div>
        </CardHeader>
        {showSamplePicker && (
          <CardContent className="space-y-2">
            <Label htmlFor="sampleLessonPlan">เลือกตัวอย่างตามวิชา</Label>
            <Select value={selectedSampleId} onValueChange={handleSelectSample}>
              <SelectTrigger id="sampleLessonPlan">
                <SelectValue placeholder="เลือกตัวอย่างแผนการสอน" />
              </SelectTrigger>
              <SelectContent>
                {sampleLessonPlans.map((sample) => (
                  <SelectItem key={sample.id} value={sample.id}>
                    {sample.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              เมื่อเลือกแล้ว ระบบจะเติมข้อมูลพื้นฐานและเนื้อหาแผนการสอนให้ทันที
            </p>
          </CardContent>
        )}
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลพื้นฐาน</CardTitle>
          <CardDescription>
            กรอกข้อมูลพื้นฐานของแผนการสอน สามารถแก้ไขได้ภายหลัง
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">
                ชื่อแผนการสอน <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={lessonPlanData.lessonTitle}
                onChange={(e) =>
                  setLessonPlanData((prev) => ({ ...prev, lessonTitle: e.target.value }))
                }
                placeholder="เช่น วิทยาศาสตร์ ม.1 - ระบบสุริยะ"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">วิชา</Label>
              <Select
                value={lessonPlanData.subjectName}
                onValueChange={(value) =>
                  setLessonPlanData((prev) => ({ ...prev, subjectName: value }))
                }
              >
                <SelectTrigger id="subject">
                  <SelectValue placeholder="เลือกวิชา" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="science">วิทยาศาสตร์</SelectItem>
                  <SelectItem value="mathematics">คณิตศาสตร์</SelectItem>
                  <SelectItem value="english">ภาษาอังกฤษ</SelectItem>
                  <SelectItem value="thai">ภาษาไทย</SelectItem>
                  <SelectItem value="social">สังคมศึกษา</SelectItem>
                  <SelectItem value="pe">พลศึกษา</SelectItem>
                  <SelectItem value="art">ศิลปะ</SelectItem>
                  <SelectItem value="music">ดนตรี</SelectItem>
                  <SelectItem value="computer">คอมพิวเตอร์</SelectItem>
                  <SelectItem value="career">การงานอาชีพ</SelectItem>
                  <SelectItem value="nutrition">อาหารและโภชนาการ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">ระดับชั้น</Label>
              <Select
                value={lessonPlanData.gradeLevel}
                onValueChange={(value) =>
                  setLessonPlanData((prev) => ({ ...prev, gradeLevel: value }))
                }
              >
                <SelectTrigger id="grade">
                  <SelectValue placeholder="เลือกระดับชั้น" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="p1">ประถมศึกษาปีที่ 1</SelectItem>
                  <SelectItem value="p2">ประถมศึกษาปีที่ 2</SelectItem>
                  <SelectItem value="p3">ประถมศึกษาปีที่ 3</SelectItem>
                  <SelectItem value="p4">ประถมศึกษาปีที่ 4</SelectItem>
                  <SelectItem value="p5">ประถมศึกษาปีที่ 5</SelectItem>
                  <SelectItem value="p6">ประถมศึกษาปีที่ 6</SelectItem>
                  <SelectItem value="m1">มัธยมศึกษาปีที่ 1</SelectItem>
                  <SelectItem value="m2">มัธยมศึกษาปีที่ 2</SelectItem>
                  <SelectItem value="m3">มัธยมศึกษาปีที่ 3</SelectItem>
                  <SelectItem value="m4">มัธยมศึกษาปีที่ 4</SelectItem>
                  <SelectItem value="m5">มัธยมศึกษาปีที่ 5</SelectItem>
                  <SelectItem value="m6">มัธยมศึกษาปีที่ 6</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester">ภาคเรียน</Label>
              <Select
                value={lessonPlanData.semester}
                onValueChange={(value) =>
                  setLessonPlanData((prev) => ({ ...prev, semester: value }))
                }
              >
                <SelectTrigger id="semester">
                  <SelectValue placeholder="เลือกภาคเรียน" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">ภาคเรียนที่ 1</SelectItem>
                  <SelectItem value="2">ภาคเรียนที่ 2</SelectItem>
                  <SelectItem value="summer">ภาคฤดูร้อน</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="academicYear">ปีการศึกษา</Label>
              <Input
                id="academicYear"
                value={lessonPlanData.academicYear}
                onChange={(e) =>
                  setLessonPlanData((prev) => ({ ...prev, academicYear: e.target.value }))
                }
                placeholder="เช่น 2568"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationMinutes">ระยะเวลา (นาที)</Label>
              <Input
                id="durationMinutes"
                value={lessonPlanData.durationMinutes}
                onChange={(e) =>
                  setLessonPlanData((prev) => ({
                    ...prev,
                    durationMinutes: e.target.value,
                  }))
                }
                placeholder="เช่น 60"
                type="number"
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacherName">ชื่อครูผู้สอน</Label>
              <Input
                id="teacherName"
                value={lessonPlanData.teacherName}
                onChange={(e) =>
                  setLessonPlanData((prev) => ({ ...prev, teacherName: e.target.value }))
                }
                placeholder="เช่น ครูสมชาย ใจดี"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="schoolName">ชื่อโรงเรียน</Label>
              <Input
                id="schoolName"
                value={lessonPlanData.schoolName}
                onChange={(e) =>
                  setLessonPlanData((prev) => ({ ...prev, schoolName: e.target.value }))
                }
                placeholder="เช่น โรงเรียนตัวอย่าง"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" asChild>
          <Link href="/dashboard/lesson-plans">ยกเลิก</Link>
        </Button>
        <Button
          onClick={handleCreate}
          disabled={
            !lessonPlanData.lessonTitle ||
            !lessonPlanData.subjectName ||
            !lessonPlanData.gradeLevel ||
            isCreating
          }
        >
          {isCreating ? "กำลังสร้าง..." : "สร้างแผนการสอน"}
        </Button>
      </div>
    </div>
  );
}
