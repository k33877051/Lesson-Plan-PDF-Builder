"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { JSONContent } from "@tiptap/react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Loader2, FileDown, Eye, BookOpen } from "lucide-react";
import { AIHelperButton } from "@/components/ai/AIHelperButton";
import { ResearchPanel } from "@/components/research/ResearchPanel";

// Dynamic import for TiptapEditor to avoid SSR issues
const TiptapEditor = dynamic(() => import("./TiptapEditor").then((mod) => mod.TiptapEditor), {
  ssr: false,
  loading: () => (
    <div className="border rounded-md p-4 bg-muted/50 animate-pulse h-[200px]">
      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
      <div className="h-4 bg-muted rounded w-1/2" />
    </div>
  ),
});

// Types for Lesson Plan
export interface LessonPlanData {
  id?: string;
  teacherName: string;
  schoolName: string;
  subjectName: string;
  gradeLevel: string;
  semester: string;
  academicYear: string;
  lessonTitle: string;
  topic?: string; // For AI research
  objectives: string;
  objectivesJson: JSONContent | null;
  keyConcepts: string;
  keyConceptsJson: JSONContent | null;
  learningActivities: string;
  learningActivitiesJson: JSONContent | null;
  mediaResources: string;
  mediaResourcesJson: JSONContent | null;
  assessment: string;
  assessmentJson: JSONContent | null;
  notes: string;
  notesJson: JSONContent | null;
  status: string;
}

interface LessonPlanFormProps {
  initialData?: Partial<LessonPlanData>;
  onSave: (data: LessonPlanData) => Promise<void>;
  onPreview?: () => void;
  onExport?: () => void;
  isSaving?: boolean;
  isNew?: boolean;
  lessonPlanId?: string; // For research functionality
}

const defaultData: LessonPlanData = {
  teacherName: "",
  schoolName: "",
  subjectName: "",
  gradeLevel: "",
  semester: "",
  academicYear: "",
  lessonTitle: "",
  topic: "",
  objectives: "",
  objectivesJson: null,
  keyConcepts: "",
  keyConceptsJson: null,
  learningActivities: "",
  learningActivitiesJson: null,
  mediaResources: "",
  mediaResourcesJson: null,
  assessment: "",
  assessmentJson: null,
  notes: "",
  notesJson: null,
  status: "draft",
};

const subjects = [
  { value: "mathematics", label: "คณิตศาสตร์" },
  { value: "science", label: "วิทยาศาสตร์" },
  { value: "thai", label: "ภาษาไทย" },
  { value: "english", label: "ภาษาอังกฤษ" },
  { value: "social", label: "สังคมศึกษา" },
  { value: "history", label: "ประวัติศาสตร์" },
  { value: "geography", label: "ภูมิศาสตร์" },
  { value: "civics", label: "หน้าที่พลเมือง" },
  { value: "physics", label: "ฟิสิกส์" },
  { value: "chemistry", label: "เคมี" },
  { value: "biology", label: "ชีววิทยา" },
  { value: "computer", label: "คอมพิวเตอร์" },
  { value: "art", label: "ศิลปะ" },
  { value: "music", label: "ดนตรี" },
  { value: "pe", label: "พลศึกษา" },
  { value: "health", label: "สุขศึกษา" },
  { value: "other", label: "อื่นๆ" },
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
  { value: "vocational", label: "อาชีวศึกษา" },
  { value: "university", label: "อุดมศึกษา" },
];

const semesters = [
  { value: "1", label: "ภาคเรียนที่ 1" },
  { value: "2", label: "ภาคเรียนที่ 2" },
  { value: "summer", label: "ภาคฤดูร้อน" },
];

const academicYears = Array.from({ length: 10 }, (_, i) => {
  const year = 2565 + i;
  return { value: year.toString(), label: `ปีการศึกษา ${year}` };
});

export function LessonPlanForm({
  initialData,
  onSave,
  onPreview,
  onExport,
  isSaving = false,
  isNew = false,
  lessonPlanId,
}: LessonPlanFormProps) {
  const [formData, setFormData] = useState<LessonPlanData>({
    ...defaultData,
    ...initialData,
  });

  const [activeTab, setActiveTab] = useState("basic");
  const [hasChanges, setHasChanges] = useState(false);
  const [researchJobId, setResearchJobId] = useState<string | null>(null);
  const [useResearch, setUseResearch] = useState(false);

  const updateField = useCallback(
    (field: keyof LessonPlanData, value: string | JSONContent | null) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
      setHasChanges(true);
    },
    []
  );

  const handleRichTextChange = useCallback(
    (field: keyof LessonPlanData, jsonField: keyof LessonPlanData) =>
      (html: string, json: JSONContent) => {
        setFormData((prev) => ({
          ...prev,
          [field]: html,
          [jsonField]: json,
        }));
        setHasChanges(true);
      },
    []
  );

  // Handle AI-generated content
  const handleAIGenerated = useCallback((content: {
    objectives: string;
    keyConcepts: string;
    learningActivities: string;
    assessment: string;
    mediaResources: string;
  }) => {
    setFormData((prev) => ({
      ...prev,
      objectives: content.objectives,
      objectivesJson: null, // AI returns HTML, JSON will be regenerated on next edit
      keyConcepts: content.keyConcepts,
      keyConceptsJson: null,
      learningActivities: content.learningActivities,
      learningActivitiesJson: null,
      assessment: content.assessment,
      assessmentJson: null,
      mediaResources: content.mediaResources,
      mediaResourcesJson: null,
    }));
    setHasChanges(true);
  }, []);

  const handleSave = async () => {
    await onSave(formData);
    setHasChanges(false);
  };

  const isValid = formData.subjectName && formData.gradeLevel && formData.lessonTitle;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isNew ? "สร้างแผนการสอนใหม่" : "แก้ไขแผนการสอน"}
          </h1>
          <p className="text-muted-foreground">
            {hasChanges ? "มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก" : "บันทึกแล้ว"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onPreview && (
            <Button variant="outline" onClick={onPreview}>
              <Eye className="mr-2 h-4 w-4" />
              ดูตัวอย่าง
            </Button>
          )}
          {onExport && (
            <Button variant="outline" onClick={onExport}>
              <FileDown className="mr-2 h-4 w-4" />
              ส่งออก
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving || !isValid}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                บันทึก
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">ข้อมูลพื้นฐาน</TabsTrigger>
          <TabsTrigger value="content">เนื้อหาแผนการสอน</TabsTrigger>
          <TabsTrigger value="research">
            <BookOpen className="h-4 w-4 mr-1" />
            ค้นคว้า AI
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลทั่วไป</CardTitle>
              <CardDescription>ข้อมูลพื้นฐานของแผนการสอน</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Teacher Name */}
                <div className="space-y-2">
                  <Label htmlFor="teacherName">ชื่อครูผู้สอน</Label>
                  <Input
                    id="teacherName"
                    value={formData.teacherName}
                    onChange={(e) => updateField("teacherName", e.target.value)}
                    placeholder="เช่น นายสมชาย ใจดี"
                  />
                </div>

                {/* School Name */}
                <div className="space-y-2">
                  <Label htmlFor="schoolName">ชื่อโรงเรียน</Label>
                  <Input
                    id="schoolName"
                    value={formData.schoolName}
                    onChange={(e) => updateField("schoolName", e.target.value)}
                    placeholder="เช่น โรงเรียนอยุธยาวิทยาลัย"
                  />
                </div>

                {/* Academic Year */}
                <div className="space-y-2">
                  <Label htmlFor="academicYear">ปีการศึกษา</Label>
                  <Select
                    value={formData.academicYear}
                    onValueChange={(value) => updateField("academicYear", value)}
                  >
                    <SelectTrigger id="academicYear">
                      <SelectValue placeholder="เลือกปีการศึกษา" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((year) => (
                        <SelectItem key={year.value} value={year.value}>
                          {year.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Semester */}
                <div className="space-y-2">
                  <Label htmlFor="semester">ภาคเรียน</Label>
                  <Select
                    value={formData.semester}
                    onValueChange={(value) => updateField("semester", value)}
                  >
                    <SelectTrigger id="semester">
                      <SelectValue placeholder="เลือกภาคเรียน" />
                    </SelectTrigger>
                    <SelectContent>
                      {semesters.map((sem) => (
                        <SelectItem key={sem.value} value={sem.value}>
                          {sem.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลวิชา</CardTitle>
              <CardDescription>รายละเอียดวิชาและหน่วยการเรียนรู้</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Subject Name */}
                <div className="space-y-2">
                  <Label htmlFor="subjectName">
                    ชื่อวิชา <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.subjectName}
                    onValueChange={(value) => updateField("subjectName", value)}
                  >
                    <SelectTrigger id="subjectName">
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
                    onValueChange={(value) => updateField("gradeLevel", value)}
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

              {/* Lesson Title */}
              <div className="space-y-2">
                <Label htmlFor="lessonTitle">
                  ชื่อหน่วยการเรียนรู้ / หัวข้อ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lessonTitle"
                  value={formData.lessonTitle}
                  onChange={(e) => updateField("lessonTitle", e.target.value)}
                  placeholder="เช่น ระบบสุริยะของเรา"
                />
              </div>

              {/* Topic for AI Research */}
              <div className="space-y-2">
                <Label htmlFor="topic">
                  หัวข้อสำหรับค้นคว้า (AI)
                  <span className="text-muted-foreground text-xs ml-2">(ใช้สำหรับค้นหาข้อมูลอัตโนมัติ)</span>
                </Label>
                <Input
                  id="topic"
                  value={formData.topic || formData.lessonTitle}
                  onChange={(e) => updateField("topic", e.target.value)}
                  placeholder="เช่น ดวงอาทิตย์ ดาวเคราะห์ ระบบสุริยะ"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          {/* AI Helper Button with Research Option */}
          <div className="flex justify-between items-center">
            {researchJobId && (
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={useResearch}
                    onChange={(e) => setUseResearch(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  ใช้ข้อมูลจากการค้นคว้า
                </label>
              </div>
            )}
            <AIHelperButton
              currentSubject={formData.subjectName}
              currentGrade={formData.gradeLevel}
              currentLessonTitle={formData.lessonTitle}
              researchJobId={useResearch ? researchJobId || undefined : undefined}
              useResearchSources={useResearch}
              onGenerated={handleAIGenerated}
              disabled={!formData.subjectName || !formData.gradeLevel || !formData.lessonTitle}
            />
          </div>

          {/* Objectives */}
          <Card>
            <CardHeader>
              <CardTitle>วัตถุประสงค์การเรียนรู้</CardTitle>
              <CardDescription>สิ่งที่ผู้เรียนควรรู้และสามารถทำได้หลังเรียน</CardDescription>
            </CardHeader>
            <CardContent>
              <TiptapEditor
                content={formData.objectives}
                jsonContent={formData.objectivesJson}
                onChange={handleRichTextChange("objectives", "objectivesJson")}
                placeholder="ระบุวัตถุประสงค์การเรียนรู้..."
                minHeight="150px"
              />
            </CardContent>
          </Card>

          {/* Key Concepts */}
          <Card>
            <CardHeader>
              <CardTitle>แนวคิดสำคัญ</CardTitle>
              <CardDescription>เนื้อหาสาระสำคัญที่ผู้เรียนต้องรู้</CardDescription>
            </CardHeader>
            <CardContent>
              <TiptapEditor
                content={formData.keyConcepts}
                jsonContent={formData.keyConceptsJson}
                onChange={handleRichTextChange("keyConcepts", "keyConceptsJson")}
                placeholder="ระบุแนวคิดสำคัญ..."
                minHeight="150px"
              />
            </CardContent>
          </Card>

          {/* Learning Activities */}
          <Card>
            <CardHeader>
              <CardTitle>กิจกรรมการเรียนรู้</CardTitle>
              <CardDescription>ขั้นตอนและกระบวนการเรียนการสอน</CardDescription>
            </CardHeader>
            <CardContent>
              <TiptapEditor
                content={formData.learningActivities}
                jsonContent={formData.learningActivitiesJson}
                onChange={handleRichTextChange("learningActivities", "learningActivitiesJson")}
                placeholder="อธิบายกิจกรรมการเรียนรู้..."
                minHeight="200px"
              />
            </CardContent>
          </Card>

          {/* Media Resources */}
          <Card>
            <CardHeader>
              <CardTitle>สื่อและแหล่งเรียนรู้</CardTitle>
              <CardDescription>สื่อการสอนและแหล่งข้อมูลที่ใช้</CardDescription>
            </CardHeader>
            <CardContent>
              <TiptapEditor
                content={formData.mediaResources}
                jsonContent={formData.mediaResourcesJson}
                onChange={handleRichTextChange("mediaResources", "mediaResourcesJson")}
                placeholder="ระบุสื่อและแหล่งเรียนรู้..."
                minHeight="120px"
              />
            </CardContent>
          </Card>

          {/* Assessment */}
          <Card>
            <CardHeader>
              <CardTitle>การวัดและประเมินผล</CardTitle>
              <CardDescription>วิธีการประเมินผลการเรียนรู้</CardDescription>
            </CardHeader>
            <CardContent>
              <TiptapEditor
                content={formData.assessment}
                jsonContent={formData.assessmentJson}
                onChange={handleRichTextChange("assessment", "assessmentJson")}
                placeholder="ระบุวิธีการวัดและประเมินผล..."
                minHeight="150px"
              />
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>หมายเหตุ</CardTitle>
              <CardDescription>ข้อมูลเพิ่มเติมหรือคำแนะนำพิเศษ (ไม่บังคับ)</CardDescription>
            </CardHeader>
            <CardContent>
              <TiptapEditor
                content={formData.notes}
                jsonContent={formData.notesJson}
                onChange={handleRichTextChange("notes", "notesJson")}
                placeholder="เพิ่มหมายเหตุ..."
                minHeight="100px"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Research Tab */}
        <TabsContent value="research" className="space-y-4">
          <ResearchPanel
            lessonPlanId={lessonPlanId || "new"}
            subject={formData.subjectName}
            gradeLevel={formData.gradeLevel}
            topic={formData.topic || formData.lessonTitle}
            onUseResearch={(jobId) => {
              setResearchJobId(jobId);
              setUseResearch(true);
              // Switch back to content tab to show the button
              setActiveTab("content");
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Footer Actions */}
      <div className="flex justify-end gap-2">
        <Button onClick={handleSave} disabled={isSaving || !isValid}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              กำลังบันทึก...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              บันทึกแผนการสอน
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default LessonPlanForm;
