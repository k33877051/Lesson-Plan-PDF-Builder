"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { A4Preview } from "@/components/preview/A4Preview";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

// Type for lesson plan data
interface LessonPlanData {
  id: string;
  teacherName: string;
  schoolName: string;
  subjectName: string;
  gradeLevel: string;
  semester: string;
  academicYear: string;
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
  notes: string;
  notesJson: unknown;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  data?: LessonPlanData;
  error?: string;
}

export default function PreviewPage() {
  const params = useParams();
  const lessonPlanId = params.id as string;

  const [lessonPlan, setLessonPlan] = useState<LessonPlanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch lesson plan data
  useEffect(() => {
    const fetchLessonPlan = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/lesson-plans/${lessonPlanId}`);
        const result: ApiResponse = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "ไม่พบแผนการสอน");
        }

        if (result.data) {
          setLessonPlan(result.data);
        } else {
          throw new Error("ไม่พบข้อมูลแผนการสอน");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setIsLoading(false);
      }
    };

    if (lessonPlanId) {
      fetchLessonPlan();
    }
  }, [lessonPlanId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
          <p className="text-gray-600">กำลังโหลดแผนการสอน...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/lesson-plans">
                <ChevronLeft className="h-4 w-4 mr-2" />
                กลับไปหน้าแผนการสอน
              </Link>
            </Button>
          </div>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!lessonPlan) {
    return (
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Alert>
            <AlertDescription>ไม่พบแผนการสอน</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <A4Preview
      lessonPlan={lessonPlan}
      onPrint={() => window.print()}
      backHref={`/editor/${lessonPlanId}`}
    />
  );
}
