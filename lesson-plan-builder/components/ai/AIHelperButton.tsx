"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
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
  Sparkles,
  Loader2,
  Wand2,
  AlertCircle,
  CheckCircle,
  BookOpen,
  Clock,
  GraduationCap,
} from "lucide-react";

interface AIHelperButtonProps {
  currentSubject?: string;
  currentGrade?: string;
  currentLessonTitle?: string;
  researchJobId?: string;
  useResearchSources?: boolean;
  onGenerated: (content: {
    objectives: string;
    keyConcepts: string;
    learningActivities: string;
    assessment: string;
    mediaResources: string;
  }) => void;
  disabled?: boolean;
}

interface GenerateRequest {
  subject: string;
  grade: string;
  lessonTitle: string;
  duration?: string;
  context?: string;
  researchJobId?: string;
  useResearchSources?: boolean;
}

interface GenerateResponse {
  success: boolean;
  data?: {
    objectives: string;
    keyConcepts: string;
    learningActivities: string;
    assessment: string;
    mediaResources: string;
    summary: string;
  };
  citations?: string[];
  researchUsed?: boolean;
  meta?: {
    provider?: string;
    providerName?: string;
    model?: string;
    fallbackUsed?: boolean;
  };
  error?: string;
}

type GenerateStatus = "idle" | "loading" | "success" | "error" | "input";

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

const grades = [
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

const durations = [
  { value: "1", label: "1 ชั่วโมง" },
  { value: "2", label: "2 ชั่วโมง" },
  { value: "3", label: "3 ชั่วโมง" },
  { value: "4", label: "4 ชั่วโมง" },
  { value: "5", label: "5 ชั่วโมง (1 วัน)" },
  { value: "10", label: "10 ชั่วโมง (2 วัน)" },
  { value: "15", label: "15 ชั่วโมง (3 วัน)" },
];

export function AIHelperButton({
  currentSubject = "",
  currentGrade = "",
  currentLessonTitle = "",
  researchJobId,
  useResearchSources = false,
  onGenerated,
  disabled = false,
}: AIHelperButtonProps) {
  const [status, setStatus] = useState<GenerateStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [providerInfo, setProviderInfo] = useState<string>("");
  const [showDialog, setShowDialog] = useState(false);

  // Form state
  const [subject, setSubject] = useState(currentSubject);
  const [grade, setGrade] = useState(currentGrade);
  const [lessonTitle, setLessonTitle] = useState(currentLessonTitle);
  const [duration, setDuration] = useState("");
  const [context, setContext] = useState("");

  const handleOpen = useCallback(() => {
    // Pre-fill with current values
    setSubject(currentSubject);
    setGrade(currentGrade);
    setLessonTitle(currentLessonTitle);
    setStatus("input");
    setShowDialog(true);
    setErrorMessage("");
  }, [currentSubject, currentGrade, currentLessonTitle]);

  const handleClose = useCallback(() => {
    setShowDialog(false);
    setTimeout(() => {
      if (status !== "loading") {
        setStatus("idle");
      }
    }, 300);
  }, [status]);

  const handleGenerate = useCallback(async () => {
    // Validate required fields
    if (!subject || !grade || !lessonTitle) {
      setErrorMessage("กรุณากรอกข้อมูลให้ครบถ้วน (วิชา ระดับชั้น และหัวข้อบทเรียน)");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const request: GenerateRequest = {
        subject: subjects.find(s => s.value === subject)?.label || subject,
        grade: grades.find(g => g.value === grade)?.label || grade,
        lessonTitle,
        duration: durations.find(d => d.value === duration)?.label || duration,
        context: context || undefined,
        researchJobId: useResearchSources ? researchJobId : undefined,
        useResearchSources: useResearchSources,
      };

      const response = await fetch("/api/ai-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      const data: GenerateResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการสร้างเนื้อหา");
      }

      if (data.data) {
        onGenerated({
          objectives: data.data.objectives,
          keyConcepts: data.data.keyConcepts,
          learningActivities: data.data.learningActivities,
          assessment: data.data.assessment,
          mediaResources: data.data.mediaResources,
        });
        if (data.meta?.providerName) {
          const fallbackNote = data.meta.fallbackUsed ? " (สำรอง)" : "";
          setProviderInfo(
            `ใช้ ${data.meta.providerName}${fallbackNote}${data.meta.model ? ` · ${data.meta.model}` : ""}`
          );
        } else {
          setProviderInfo("");
        }
        setStatus("success");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่คาดคิด";
      setErrorMessage(message);
      setStatus("error");
    }
  }, [subject, grade, lessonTitle, duration, context, onGenerated]);

  const handleApplyAndClose = useCallback(() => {
    handleClose();
  }, [handleClose]);

  const getStatusIcon = () => {
    switch (status) {
      case "loading":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Wand2 className="h-4 w-4" />;
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        disabled={disabled}
        className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:border-purple-300 hover:bg-gradient-to-r hover:from-purple-100 hover:to-blue-100"
      >
        <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
        ให้ AI ช่วยร่างแผนการสอน
      </Button>

      <Dialog open={showDialog} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <DialogTitle>
                {status === "loading"
                  ? "AI กำลังสร้างเนื้อหา..."
                  : status === "success"
                  ? "สร้างเนื้อหาสำเร็จ"
                  : status === "error"
                  ? "เกิดข้อผิดพลาด"
                  : "ให้ AI ช่วยร่างแผนการสอน"}
              </DialogTitle>
            </div>
            <DialogDescription>
              {status === "loading"
                ? "กรุณารอสักครู่ AI กำลังวิเคราะห์และสร้างเนื้อหาแผนการสอนที่เหมาะสม"
                : status === "success"
                ? "AI ได้สร้างเนื้อหาแผนการสอนแล้ว คลิก 'ใช้งานเนื้อหานี้' เพื่อนำไปใส่ในฟอร์ม"
                : status === "error"
                ? errorMessage
                : "กรอกข้อมูลพื้นฐานเพื่อให้ AI ช่วยร่างเนื้อหาแผนการสอน"}
            </DialogDescription>
          </DialogHeader>

          {(status === "input" || status === "error") && (
            <div className="space-y-4 py-4">
              {errorMessage && status === "error" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  วิชา <span className="text-red-500">*</span>
                </Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกวิชา" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  ระดับชั้น <span className="text-red-500">*</span>
                </Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกระดับชั้น" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-muted-foreground" />
                  หัวข้อบทเรียน <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="เช่น ระบบสุริยะของเรา, การแก้สมการเชิงเส้น"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  ระยะเวลา (ถ้ามี)
                </Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกระยะเวลา" />
                  </SelectTrigger>
                  <SelectContent>
                    {durations.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>บริบทเพิ่มเติม (ถ้ามี)</Label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="เช่น เน้นการเรียนรู้แบบรูปแบบโครงงาน, ใช้สื่อดิจิทัล, กลุ่มเป้าหมายเป็นนักเรียนที่ชอบวิทยาศาสตร์"
                  className="w-full min-h-[80px] p-3 border rounded-md text-sm"
                />
              </div>
            </div>
          )}

          {status === "loading" && (
            <div className="py-8">
              <div className="space-y-4">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse rounded-full"
                    style={{ width: "60%" }}
                  />
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span>AI กำลังวิเคราะห์...</span>
                </div>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="py-4 space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700">
                  AI ได้สร้างเนื้อหาแผนการสอนครบถ้วนแล้ว
                  {useResearchSources && " (โดยใช้ข้อมูลจากการค้นคว้า)"}:
                  {providerInfo && (
                    <p className="mt-1 text-xs text-green-600">{providerInfo}</p>
                  )}
                  <ul className="mt-2 ml-4 list-disc text-sm">
                    <li>วัตถุประสงค์การเรียนรู้</li>
                    <li>สาระสำคัญ/แนวคิดหลัก</li>
                    <li>กิจกรรมการเรียนรู้ (3 ขั้นตอน)</li>
                    <li>การวัดและประเมินผล</li>
                    <li>สื่อและแหล่งเรียนรู้</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="flex gap-2">
            {(status === "input" || status === "error") && (
              <>
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  ยกเลิก
                </Button>
                <Button
                  onClick={handleGenerate}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  สร้างเนื้อหา
                </Button>
              </>
            )}

            {status === "loading" && (
              <Button disabled className="flex-1">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                กำลังสร้าง...
              </Button>
            )}

            {status === "success" && (
              <>
                <Button variant="outline" onClick={handleClose}>
                  ปิด
                </Button>
                <Button
                  onClick={handleApplyAndClose}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  ใช้งานเนื้อหานี้
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AIHelperButton;
