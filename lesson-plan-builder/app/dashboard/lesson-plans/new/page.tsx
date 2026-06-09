"use client";

import { useState, useMemo } from "react";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  educationLevelGroups,
  flatEducationLevels,
  getLevelsByGroup,
  getGroupName,
  getLevelShortLabel,
} from "@/src/data/education-levels";
import { aiDepartments, getDepartmentById } from "@/src/data/ai-departments";
import {
  sampleAILessonPlans,
  filterSamples,
  searchSamples,
  AILessonPlanSample,
} from "@/src/data/sample-ai-lesson-plans";
import {
  AlertCircle,
  ChevronLeft,
  Sparkles,
  Brain,
  BookOpenText,
  X,
  Search,
  GraduationCap,
  Building2,
  Clock,
  Tag,
  Check,
  RotateCcw,
  Wand2,
} from "lucide-react";

// Type definitions
interface LessonPlanFormData {
  lessonTitle: string;
  subjectName: string;
  gradeLevel: string;
  educationGroup: string;
  department: string;
  semester: string;
  academicYear: string;
  durationMinutes: string;
  teacherName: string;
  schoolName: string;
  objectives: string;
  keyConcepts: string;
  learningActivities: string;
  mediaResources: string;
  assessment: string;
  notes: string;
}

const initialFormData: LessonPlanFormData = {
  lessonTitle: "",
  subjectName: "",
  gradeLevel: "",
  educationGroup: "",
  department: "",
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
};

export default function NewLessonPlanPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<LessonPlanFormData>(initialFormData);

  // UI state
  const [showAISamples, setShowAISamples] = useState(false);
  const [selectedSampleId, setSelectedSampleId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedEducationGroup, setSelectedEducationGroup] = useState<string>("all");
  const [selectedFilterGrade, setSelectedFilterGrade] = useState<string>("all");

  // Filter available grade levels based on education group
  const availableGradeLevels = useMemo(() => {
    if (!formData.educationGroup) return flatEducationLevels;
    return getLevelsByGroup(formData.educationGroup);
  }, [formData.educationGroup]);

  // Filter sample lessons
  const filteredSamples = useMemo(() => {
    let samples = sampleAILessonPlans;

    if (searchQuery) {
      samples = searchSamples(searchQuery);
    }

    if (selectedDepartment !== "all") {
      samples = samples.filter((s) => s.department === selectedDepartment);
    }

    if (selectedEducationGroup !== "all") {
      samples = samples.filter((s) => s.educationGroup === selectedEducationGroup);
    }

    if (selectedFilterGrade !== "all") {
      samples = samples.filter((s) => s.gradeLevel === selectedFilterGrade);
    }

    return samples;
  }, [searchQuery, selectedDepartment, selectedEducationGroup, selectedFilterGrade]);

  // Handle education group change
  const handleEducationGroupChange = (groupId: string) => {
    const levels = getLevelsByGroup(groupId);
    setFormData((prev) => ({
      ...prev,
      educationGroup: groupId,
      gradeLevel: levels[0]?.id || "",
    }));
  };

  // Handle sample selection
  const handleSelectSample = (sampleId: string) => {
    setSelectedSampleId(sampleId);
    const sample = sampleAILessonPlans.find((item) => item.id === sampleId);
    if (!sample) return;

    setFormData({
      lessonTitle: sample.title,
      subjectName: sample.subject,
      gradeLevel: sample.gradeLevel,
      educationGroup: sample.educationGroup,
      department: sample.department,
      semester: sample.semester,
      academicYear: sample.academicYear,
      durationMinutes: sample.duration,
      teacherName: sample.teacherName,
      schoolName: sample.schoolName,
      objectives: sample.learningObjectives.map((obj) => `<p>• ${obj}</p>`).join(""),
      keyConcepts: `<p>${sample.keyConcepts}</p>`,
      learningActivities: sample.learningActivities
        .map((act) => {
          if (act.includes(":")) {
            const [phase, desc] = act.split(":");
            return `<p><strong>${phase.trim()}</strong></p><p>${desc.trim()}</p>`;
          }
          return `<p>${act}</p>`;
        })
        .join("<br/>"),
      mediaResources: sample.mediaResources.map((res) => `<p>• ${res}</p>`).join(""),
      assessment: sample.assessment.map((ass) => `<p>• ${ass}</p>`).join(""),
      notes: `<p>${sample.notes}</p>`,
    });

    setShowAISamples(false);
  };

  // Clear all form data
  const handleClear = () => {
    setFormData(initialFormData);
    setSelectedSampleId("");
    setError(null);
  };

  // Create from sample
  const handleCreateFromSample = async () => {
    if (!selectedSampleId) {
      setError("กรุณาเลือกตัวอย่างแผนการสอนก่อน");
      return;
    }
    await handleCreate();
  };

  // Create lesson plan
  const handleCreate = async () => {
    setError(null);
    setIsCreating(true);

    try {
      const response = await fetch("/api/lesson-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          durationMinutes: formData.durationMinutes
            ? Number(formData.durationMinutes)
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
      setIsCreating(false);
    }
  };

  const isValid = formData.lessonTitle && formData.subjectName && formData.gradeLevel;

  const selectedSample = sampleAILessonPlans.find((s) => s.id === selectedSampleId);

  return (
    <div className="container mx-auto py-6 space-y-6">
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
            สร้างด้วยตนเองหรือเลือกจากตัวอย่างแผนการสอน AI
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* AI Sample Selection Card */}
      <Card className="border-dashed border-2 bg-gradient-to-br from-violet-50/50 to-blue-50/50">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-violet-700">
                <Brain className="h-5 w-5" />
                ตัวอย่างแผนการสอน AI
                <Badge variant="secondary" className="ml-2">
                  {sampleAILessonPlans.length} แผน
                </Badge>
              </CardTitle>
              <CardDescription>
                เลือกตัวอย่างแผนการสอนที่เกี่ยวกับ AI และเทคโนโลยีดิจิทัล สำหรับหลากหลายระดับชั้น
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={showAISamples ? "secondary" : "outline"}
                onClick={() => setShowAISamples((v) => !v)}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {showAISamples ? "ปิดตัวอย่าง" : "ใช้ตัวอย่างแผนการสอน AI"}
              </Button>
              {selectedSampleId && (
                <Button variant="default" onClick={handleCreateFromSample} disabled={isCreating}>
                  <Wand2 className="h-4 w-4 mr-2" />
                  สร้างจากตัวอย่าง
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {showAISamples && (
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  <Search className="h-3 w-3 inline mr-1" />
                  ค้นหา
                </Label>
                <Input
                  placeholder="ค้นหาตามชื่อ วิชา หรือ tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3 inline mr-1" />
                  สาขา/แผนก
                </Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="ทั้งหมด" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {aiDepartments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  <GraduationCap className="h-3 w-3 inline mr-1" />
                  กลุ่มการศึกษา
                </Label>
                <Select value={selectedEducationGroup} onValueChange={setSelectedEducationGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="ทั้งหมด" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {educationLevelGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 inline mr-1" />
                  ระดับชั้น
                </Label>
                <Select value={selectedFilterGrade} onValueChange={setSelectedFilterGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="ทั้งหมด" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {flatEducationLevels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sample List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {filteredSamples.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpenText className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>ไม่พบตัวอย่างแผนการสอนที่ตรงกับเงื่อนไข</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {filteredSamples.map((sample) => {
                    const dept = getDepartmentById(sample.department);
                    const isSelected = selectedSampleId === sample.id;
                    return (
                      <button
                        key={sample.id}
                        onClick={() => handleSelectSample(sample.id)}
                        className={`text-left p-3 rounded-lg border transition-all ${
                          isSelected
                            ? "border-violet-500 bg-violet-50"
                            : "border-border hover:border-violet-300 hover:bg-violet-50/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium truncate">{sample.title}</span>
                              {isSelected && <Check className="h-4 w-4 text-violet-600" />}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <Badge
                                variant="secondary"
                                className={`text-xs ${dept?.color || "bg-gray-500"} text-white`}
                              >
                                {dept?.name || sample.department}
                              </Badge>
                              <span>{getLevelShortLabel(sample.gradeLevel)}</span>
                              <span>•</span>
                              <span>{sample.duration} นาที</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {sample.tags.slice(0, 4).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  <Tag className="h-2.5 w-2.5 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Main Form */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลแผนการสอน</CardTitle>
          <CardDescription>กรอกข้อมูลพื้นฐานของแผนการสอน หรือแก้ไขหลังจากเลือกตัวอย่าง</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selected Sample Indicator */}
          {selectedSample && (
            <div className="flex items-center justify-between p-3 bg-violet-50 rounded-lg border border-violet-200">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-violet-600" />
                <span className="text-sm text-violet-800">
                  กำลังใช้ตัวอย่าง: <strong>{selectedSample.title}</strong>
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedSampleId("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                ชื่อแผนการสอน <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.lessonTitle}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, lessonTitle: e.target.value }))
                }
                placeholder="เช่น วิทยาศาสตร์ ม.1 - ระบบสุริยะ"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Education Group */}
              <div className="space-y-2">
                <Label htmlFor="educationGroup">กลุ่มการศึกษา</Label>
                <Select value={formData.educationGroup} onValueChange={handleEducationGroupChange}>
                  <SelectTrigger id="educationGroup">
                    <SelectValue placeholder="เลือกกลุ่มการศึกษา" />
                  </SelectTrigger>
                  <SelectContent>
                    {educationLevelGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Grade Level */}
              <div className="space-y-2">
                <Label htmlFor="grade">
                  ระดับชั้น <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.gradeLevel}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, gradeLevel: value }))
                  }
                  disabled={!formData.educationGroup}
                >
                  <SelectTrigger id="grade">
                    <SelectValue
                      placeholder={
                        formData.educationGroup
                          ? "เลือกระดับชั้น"
                          : "เลือกกลุ่มการศึกษาก่อน"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGradeLevels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="department">สาขา/แผนก (สำหรับ AI และเทคโนโลยี)</Label>
              <Select
                value={formData.department}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, department: value }))
                }
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="เลือกสาขา (ไม่บังคับ)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ไม่ระบุ</SelectItem>
                  {aiDepartments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${dept.color}`} />
                        {dept.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.department && formData.department !== "none" && (
                <p className="text-xs text-muted-foreground">
                  {getDepartmentById(formData.department)?.description}
                </p>
              )}
            </div>

            {/* Subject Name */}
            <div className="space-y-2">
              <Label htmlFor="subject">วิชา/หัวข้อ</Label>
              <Input
                id="subject"
                value={formData.subjectName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, subjectName: e.target.value }))
                }
                placeholder="เช่น พื้นฐานปัญญาประดิษฐ์, Generative AI"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="semester">ภาคเรียน</Label>
                <Select
                  value={formData.semester}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, semester: value }))
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
                  value={formData.academicYear}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, academicYear: e.target.value }))
                  }
                  placeholder="เช่น 2568"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="durationMinutes">ระยะเวลา (นาที)</Label>
                <Input
                  id="durationMinutes"
                  type="number"
                  min="1"
                  value={formData.durationMinutes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      durationMinutes: e.target.value,
                    }))
                  }
                  placeholder="เช่น 60"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="teacherName">ชื่อครูผู้สอน</Label>
                <Input
                  id="teacherName"
                  value={formData.teacherName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, teacherName: e.target.value }))
                  }
                  placeholder="เช่น ครูสมชาย ใจดี"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolName">ชื่อโรงเรียน/สถาบัน</Label>
                <Input
                  id="schoolName"
                  value={formData.schoolName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, schoolName: e.target.value }))
                  }
                  placeholder="เช่น โรงเรียนตัวอย่าง"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Content Preview (Accordion for samples) */}
          {selectedSample && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="content">
                <AccordionTrigger className="text-sm">
                  ดูเนื้อหาแผนการสอนที่เติมแล้ว (วัตถุประสงค์ กิจกรรม สื่อ การประเมิน)
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="font-medium mb-1">วัตถุประสงค์การเรียนรู้</h4>
                      <div
                        className="text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: formData.objectives }}
                      />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">สาระสำคัญ</h4>
                      <div
                        className="text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: formData.keyConcepts }}
                      />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">กิจกรรมการเรียนรู้</h4>
                      <div
                        className="text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: formData.learningActivities }}
                      />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">สื่อและแหล่งเรียนรู้</h4>
                      <div
                        className="text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: formData.mediaResources }}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={handleClear}>
          <RotateCcw className="h-4 w-4 mr-2" />
          ล้างข้อมูล
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/lesson-plans">ยกเลิก</Link>
        </Button>
        <Button onClick={handleCreate} disabled={!isValid || isCreating}>
          {isCreating ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              กำลังสร้าง...
            </>
          ) : (
            <>
              <BookOpenText className="h-4 w-4 mr-2" />
              สร้างแผนการสอน
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
