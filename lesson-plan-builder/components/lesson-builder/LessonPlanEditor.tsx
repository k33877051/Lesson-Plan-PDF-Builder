"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Save, Loader2, FileDown, CheckCircle2, FileText } from "lucide-react";
import { LessonPlanSources } from "./LessonPlanSources";

// Dynamic import for TiptapEditor to avoid SSR issues
const TiptapEditor = dynamic(
  () => import("@/components/editor/TiptapEditor").then((mod) => mod.TiptapEditor),
  {
    ssr: false,
    loading: () => (
      <div className="border rounded-md p-4 bg-muted/50 animate-pulse h-[300px]">
        <div className="h-4 bg-muted rounded w-3/4 mb-2" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
    ),
  }
);

export interface LessonPlanData {
  id?: string;
  lessonTitle: string;
  subjectName: string;
  gradeLevel: string;
  topic: string;
  durationMinutes?: number;
  teacherName?: string;
  schoolName?: string;
  objectives: string;
  keyConcepts: string;
  learningActivities: string;
  mediaResources: string;
  assessment: string;
  notes?: string;
}

interface LinkedSource {
  sourceId: string;
  title: string;
  url: string;
  platform: string;
  credibilityScore: number;
}

interface LessonPlanEditorProps {
  lessonPlan: LessonPlanData;
  sources: LinkedSource[];
  citations: string[];
  onSave: (data: LessonPlanData) => Promise<void>;
  isSaving?: boolean;
}

export function LessonPlanEditor({
  lessonPlan: initialLessonPlan,
  sources,
  citations,
  onSave,
  isSaving = false,
}: LessonPlanEditorProps) {
  const [lessonPlan, setLessonPlan] = useState<LessonPlanData>(initialLessonPlan);
  const [activeTab, setActiveTab] = useState("objectives");
  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);

  // Reset when initialLessonPlan changes
  useEffect(() => {
    setLessonPlan(initialLessonPlan);
    setHasChanges(false);
    setSaved(false);
  }, [initialLessonPlan]);

  const updateField = (field: keyof LessonPlanData, value: string) => {
    setLessonPlan((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setSaved(false);
  };

  const handleSave = async () => {
    await onSave(lessonPlan);
    setHasChanges(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const getSubjectLabel = (subject: string) => {
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
  };

  const getGradeLabel = (grade: string) => {
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
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Editor */}
      <div className="lg:col-span-2 space-y-4">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  แก้ไขแผนการสอน
                </CardTitle>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Badge variant="outline">{getSubjectLabel(lessonPlan.subjectName)}</Badge>
                  <Badge variant="outline">{getGradeLabel(lessonPlan.gradeLevel)}</Badge>
                  {lessonPlan.durationMinutes && (
                    <Badge variant="outline">{lessonPlan.durationMinutes} นาที</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <span className="text-sm text-yellow-600">มีการเปลี่ยนแปลง</span>
                )}
                {saved && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    บันทึกแล้ว
                  </span>
                )}
                <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      บันทึกฉบับร่าง
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Lesson Title */}
            <div className="space-y-2">
              <Label htmlFor="lessonTitle">ชื่อหน่วยการเรียนรู้</Label>
              <Input
                id="lessonTitle"
                value={lessonPlan.lessonTitle}
                onChange={(e) => updateField("lessonTitle", e.target.value)}
                className="text-lg font-medium"
              />
            </div>

            <Separator />

            {/* Editor Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5">
                <TabsTrigger value="objectives">วัตถุประสงค์</TabsTrigger>
                <TabsTrigger value="concepts">สาระสำคัญ</TabsTrigger>
                <TabsTrigger value="activities">กิจกรรม</TabsTrigger>
                <TabsTrigger value="assessment">การประเมิน</TabsTrigger>
                <TabsTrigger value="resources">สื่อ</TabsTrigger>
              </TabsList>

              <TabsContent value="objectives" className="mt-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">วัตถุประสงค์การเรียนรู้</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TiptapEditor
                      content={lessonPlan.objectives}
                      onChange={(html) => updateField("objectives", html)}
                      placeholder="ระบุวัตถุประสงค์การเรียนรู้..."
                      minHeight="250px"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="concepts" className="mt-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">สาระสำคัญ / แนวคิดหลัก</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TiptapEditor
                      content={lessonPlan.keyConcepts}
                      onChange={(html) => updateField("keyConcepts", html)}
                      placeholder="ระบุสาระสำคัญ..."
                      minHeight="250px"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activities" className="mt-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">กิจกรรมการเรียนรู้</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TiptapEditor
                      content={lessonPlan.learningActivities}
                      onChange={(html) => updateField("learningActivities", html)}
                      placeholder="อธิบายกิจกรรมการเรียนรู้..."
                      minHeight="300px"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="assessment" className="mt-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">การวัดและประเมินผล</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TiptapEditor
                      content={lessonPlan.assessment}
                      onChange={(html) => updateField("assessment", html)}
                      placeholder="ระบุวิธีการวัดและประเมินผล..."
                      minHeight="250px"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="resources" className="mt-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">สื่อและแหล่งเรียนรู้</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TiptapEditor
                      content={lessonPlan.mediaResources}
                      onChange={(html) => updateField("mediaResources", html)}
                      placeholder="ระบุสื่อและแหล่งเรียนรู้..."
                      minHeight="250px"
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <LessonPlanSources
          sources={sources}
          citations={citations}
          onInsertCitation={(num) => {
            // Insert citation logic would go here
            console.log("Insert citation:", num);
          }}
        />

        {/* Export Options */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">ส่งออก</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <FileDown className="mr-2 h-4 w-4" />
              ดาวน์โหลด PDF
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              ส่งออก Word
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
