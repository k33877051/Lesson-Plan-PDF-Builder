"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Sparkles, FileText, CheckCircle2 } from "lucide-react";

import {
  LessonPlanForm,
  LessonPlanFormData,
} from "@/components/lesson-builder/LessonPlanForm";
import {
  ResearchJobPanel,
  ResearchJobStatus,
} from "@/components/lesson-builder/ResearchJobPanel";
import {
  ResearchSourceTable,
  ResearchSource,
} from "@/components/lesson-builder/ResearchSourceTable";
import {
  LessonPlanEditor,
  LessonPlanData,
} from "@/components/lesson-builder/LessonPlanEditor";

type Step = "form" | "research" | "editor";

interface ApiSource {
  sourceId: string;
  title: string;
  url: string;
  platform: string;
  snippet: string;
  credibilityScore: number;
  relevanceScore: number;
  totalScore: number;
  qualityLabel: string;
}

interface ApiLessonPlan {
  id: string;
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
  status: string;
}

export default function LessonBuilderPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("form");

  // Form state
  const [formData, setFormData] = useState<LessonPlanFormData | null>(null);

  // Research state
  const [researchJob, setResearchJob] = useState<ResearchJobStatus | null>(null);
  const [sources, setSources] = useState<ResearchSource[]>([]);
  const [isResearching, setIsResearching] = useState(false);

  // Selection state
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Editor state
  const [lessonPlan, setLessonPlan] = useState<ApiLessonPlan | null>(null);
  const [usedSources, setUsedSources] = useState<
    Array<{
      sourceId: string;
      title: string;
      url: string;
      platform: string;
      credibilityScore: number;
    }>
  >([]);
  const [citations, setCitations] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Step 1: Start Research
  const handleFormSubmit = async (data: LessonPlanFormData) => {
    setFormData(data);
    setIsResearching(true);
    setCurrentStep("research");

    // Create initial job status
    setResearchJob({
      jobId: "pending",
      status: "pending",
      topic: data.topic,
      subject: data.subject,
      gradeLevel: data.gradeLevel,
      progress: 0,
    });

    try {
      // Call research API
      const response = await fetch("/api/research-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: data.topic,
          subject: data.subject,
          gradeLevel: data.gradeLevel,
          maxResults: 10,
          minScore: 40,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to start research");
      }

      // Update job status
      setResearchJob({
        jobId: result.jobId,
        status: "completed",
        topic: data.topic,
        subject: data.subject,
        gradeLevel: data.gradeLevel,
        progress: 100,
        totalQueries: 5,
        completedQueries: 5,
      });

      // Store sources
      if (result.sources) {
        const mappedSources: ResearchSource[] = result.sources.map(
          (s: ApiSource) => ({
            sourceId: s.sourceId,
            title: s.title,
            url: s.url,
            platform: s.platform,
            snippet: s.snippet,
            credibilityScore: s.credibilityScore,
            relevanceScore: s.relevanceScore,
            totalScore: s.totalScore,
            qualityLabel: s.qualityLabel,
          })
        );
        setSources(mappedSources);
      }

      toast.success(`พบ ${result.totalSources || 0} แหล่งข้อมูล`);
    } catch (error) {
      console.error("Research error:", error);
      toast.error("ไม่สามารถค้นหาแหล่งข้อมูลได้");
      setResearchJob((prev) =>
        prev
          ? {
              ...prev,
              status: "failed",
              error:
                error instanceof Error
                  ? error.message
                  : "เกิดข้อผิดพลาด",
            }
          : null
      );
    } finally {
      setIsResearching(false);
    }
  };

  // Step 2: Generate Lesson Plan
  const handleGenerateLesson = async () => {
    if (!formData || selectedSourceIds.length === 0) return;

    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: formData.topic,
          subject: formData.subject,
          gradeLevel: formData.gradeLevel,
          durationMinutes:
            formData.durationMinutes === ""
              ? undefined
              : Number(formData.durationMinutes),
          teacherName: formData.teacherName,
          schoolName: formData.schoolName,
          sourceIds: selectedSourceIds,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to generate lesson plan");
      }

      setLessonPlan(result.lessonPlan);
      setUsedSources(result.usedSources || []);
      setCitations(result.citations || []);
      setCurrentStep("editor");

      toast.success("สร้างแผนการสอนสำเร็จ");
    } catch (error) {
      console.error("Generate error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "ไม่สามารถสร้างแผนการสอนได้"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Step 3: Save Lesson Plan
  const handleSaveLessonPlan = async (data: LessonPlanData) => {
    if (!lessonPlan) return;

    setIsSaving(true);

    try {
      const response = await fetch("/api/lesson-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          id: lessonPlan.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save lesson plan");
      }

      toast.success("บันทึกแผนการสอนแล้ว");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("ไม่สามารถบันทึกได้");
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (currentStep === "editor") {
      setCurrentStep("research");
    } else if (currentStep === "research") {
      setCurrentStep("form");
    }
  };

  const getStepLabel = (step: Step) => {
    switch (step) {
      case "form":
        return "ข้อมูลแผนการสอน";
      case "research":
        return "ค้นหาแหล่งข้อมูล";
      case "editor":
        return "แก้ไขแผนการสอน";
      default:
        return "";
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/dashboard/lesson-plans")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">สร้างแผนการสอนด้วย AI</h1>
            <p className="text-muted-foreground">
              กรอกข้อมูล ค้นหาแหล่งข้อมูล และสร้างแผนการสอนอัตโนมัติ
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {(["form", "research", "editor"] as Step[]).map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                  currentStep === step
                    ? "bg-primary text-primary-foreground"
                    : currentStep === "editor" ||
                      (currentStep === "research" && step === "form")
                    ? "bg-green-100 text-green-700"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {currentStep === step ||
                currentStep === "editor" ||
                (currentStep === "research" && step === "form") ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <span className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center text-xs">
                    {index + 1}
                  </span>
                )}
                {getStepLabel(step)}
              </div>
              {index < 2 && <Separator className="w-8 mx-2" />}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="space-y-6">
        {/* Step 1: Form */}
        {(currentStep === "form" || currentStep === "research") && (
          <LessonPlanForm
            onSubmit={handleFormSubmit}
            isLoading={isResearching}
            initialData={formData || undefined}
          />
        )}

        {/* Step 2: Research Panel */}
        {currentStep === "research" && (
          <>
            <ResearchJobPanel
              job={researchJob}
              onRetry={() => formData && handleFormSubmit(formData)}
            />

            {sources.length > 0 && (
              <ResearchSourceTable
                sources={sources}
                selectedIds={selectedSourceIds}
                onSelectionChange={setSelectedSourceIds}
                onGenerateLesson={handleGenerateLesson}
                isGenerating={isGenerating}
              />
            )}
          </>
        )}

        {/* Step 3: Editor */}
        {currentStep === "editor" && lessonPlan && (
          <>
            <div className="flex items-center gap-4 mb-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                กลับไปเลือกแหล่งข้อมูล
              </Button>
              <span className="text-muted-foreground">
                แก้ไขเนื้อหาแผนการสอนและบันทึกฉบับร่าง
              </span>
            </div>

            <LessonPlanEditor
              lessonPlan={lessonPlan}
              sources={usedSources}
              citations={citations}
              onSave={handleSaveLessonPlan}
              isSaving={isSaving}
            />
          </>
        )}
      </div>
    </div>
  );
}
