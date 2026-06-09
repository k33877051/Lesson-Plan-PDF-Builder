"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LessonPlanForm, LessonPlanData } from "@/components/editor/LessonPlanForm";
import { ChevronLeft, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { JSONContent } from "@tiptap/react";

// Type for API response
interface ApiResponse {
  success: boolean;
  data?: {
    id: string;
    teacherName: string | null;
    schoolName: string | null;
    subjectName: string;
    gradeLevel: string;
    semester: string | null;
    academicYear: string | null;
    lessonTitle: string;
    objectives: string;
    objectivesJson: unknown;
    keyConcepts: string;
    keyConceptsJson: unknown;
    learningActivities: string;
    learningActivitiesJson: unknown;
    mediaResources: string;
    mediaResourcesJson: unknown;
    assessment: string;
    assessmentJson: unknown;
    notes: string | null;
    notesJson: unknown;
    status: string;
  };
  error?: string;
}

// Helper function to safely convert JSON
function safeJsonContent(json: unknown): JSONContent | null {
  if (!json) return null;
  if (typeof json === "object") return json as JSONContent;
  return null;
}

export default function LessonPlanEditorPage() {
  const params = useParams();
  const router = useRouter();
  const lessonPlanId = params.id as string;
  const isNew = lessonPlanId === "new";

  const [lessonPlan, setLessonPlan] = useState<Partial<LessonPlanData> | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // โหลดข้อมูลแผนการสอน (ถ้าไม่ใช่การสร้างใหม่)
  useEffect(() => {
    if (isNew) {
      return;
    }

    const fetchLessonPlan = async () => {
      try {
        const response = await fetch(`/api/lesson-plans/${lessonPlanId}`);
        const result: ApiResponse = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "ไม่พบแผนการสอน");
        }

        if (result.data) {
          const data = result.data;
          setLessonPlan({
            id: data.id,
            teacherName: data.teacherName || "",
            schoolName: data.schoolName || "",
            subjectName: data.subjectName,
            gradeLevel: data.gradeLevel,
            semester: data.semester || "",
            academicYear: data.academicYear || "",
            lessonTitle: data.lessonTitle,
            objectives: data.objectives,
            objectivesJson: safeJsonContent(data.objectivesJson),
            keyConcepts: data.keyConcepts,
            keyConceptsJson: safeJsonContent(data.keyConceptsJson),
            learningActivities: data.learningActivities,
            learningActivitiesJson: safeJsonContent(data.learningActivitiesJson),
            mediaResources: data.mediaResources,
            mediaResourcesJson: safeJsonContent(data.mediaResourcesJson),
            assessment: data.assessment,
            assessmentJson: safeJsonContent(data.assessmentJson),
            notes: data.notes || "",
            notesJson: safeJsonContent(data.notesJson),
            status: data.status,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLessonPlan();
  }, [lessonPlanId, isNew]);

  // บันทึกแผนการสอน
  const handleSave = useCallback(async (data: LessonPlanData) => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const url = isNew ? "/api/lesson-plans" : `/api/lesson-plans/${lessonPlanId}`;
      const method = isNew ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "เกิดข้อผิดพลาดในการบันทึก");
      }

      setSuccessMessage(isNew ? "สร้างแผนการสอนสำเร็จ" : "บันทึกแผนการสอนสำเร็จ");

      // ถ้าสร้างใหม่ ให้ redirect ไปยังหน้าแก้ไข
      if (isNew && result.data?.id) {
        router.push(`/editor/${result.data.id}`);
      }

      // ซ่อนข้อความสำเร็จหลัง 3 วินาที
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSaving(false);
    }
  }, [isNew, lessonPlanId, router]);

  // ดูตัวอย่าง - navigate ไปยังหน้า preview
  const handlePreview = useCallback(() => {
    if (isNew) {
      // ถ้าเป็นการสร้างใหม่ ให้บันทึกก่อนแล้วค่อยดูตัวอย่าง
      alert("กรุณาบันทึกแผนการสอนก่อน จึงจะสามารถดูตัวอย่างได้");
      return;
    }
    router.push(`/preview/${lessonPlanId}`);
  }, [isNew, lessonPlanId, router]);

  // ส่งออก (ยังไม่ implement)
  const handleExport = useCallback(() => {
    // TODO: Implement export
    console.log("Export not implemented yet");
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Back Button */}
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/lesson-plans">
            <ChevronLeft className="mr-2 h-4 w-4" />
            กลับไปหน้าแผนการสอน
          </Link>
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {successMessage && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Lesson Plan Form */}
      <LessonPlanForm
        initialData={lessonPlan}
        onSave={handleSave}
        onPreview={handlePreview}
        onExport={handleExport}
        isSaving={isSaving}
        isNew={isNew}
      />
    </div>
  );
}
