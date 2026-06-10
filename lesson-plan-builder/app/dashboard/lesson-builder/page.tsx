"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Sparkles, FileText, CheckCircle2, Loader2 } from "lucide-react";

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
import { ResponsiveContainer } from "@/components/layout/responsive-container";
import { PageHeader } from "@/components/layout/page-header";

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

interface ProjectContext {
  id: string;
  name: string;
  extractedPdfCount: number;
}

function buildGeneratePayload(
  data: LessonPlanFormData,
  projectId: string | null,
  sourceIds: string[]
) {
  return {
    topic: data.topic,
    subject: data.subject,
    gradeLevel: data.gradeLevel,
    durationMinutes:
      data.durationMinutes === "" ? undefined : Number(data.durationMinutes),
    teacherName: data.teacherName,
    schoolName: data.schoolName,
    sourceIds,
    ...(projectId ? { projectId } : {}),
  };
}

function LessonBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get("projectId");

  const [currentStep, setCurrentStep] = useState<Step>("form");
  const [projectContext, setProjectContext] = useState<ProjectContext | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(Boolean(projectIdParam));
  const [formInitialData, setFormInitialData] = useState<Partial<LessonPlanFormData>>({});

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
  const [skippedResearch, setSkippedResearch] = useState(false);

  useEffect(() => {
    if (!projectIdParam) return;

    let cancelled = false;

    async function loadProject() {
      setIsLoadingProject(true);
      try {
        const response = await fetch(`/api/projects/${projectIdParam}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "ไม่สามารถโหลดโปรเจกต์ได้");
        }

        if (cancelled) return;

        const data = result.data;
        setProjectContext({
          id: data.id,
          name: data.name,
          extractedPdfCount: data.extractedPdfCount,
        });
        setFormInitialData({ topic: data.name });

        if (data.extractedPdfCount === 0) {
          toast.warning("โปรเจกต์นี้ยังไม่มี PDF ที่ดึงข้อความได้ — ลองค้นหาแหล่งข้อมูลแทน");
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : "โหลดข้อมูลโปรเจกต์ไม่สำเร็จ"
          );
        }
      } finally {
        if (!cancelled) setIsLoadingProject(false);
      }
    }

    loadProject();

    return () => {
      cancelled = true;
    };
  }, [projectIdParam]);

  // Step 1: Start Research
  const handleFormSubmit = async (data: LessonPlanFormData) => {
    setFormData(data);
    setSkippedResearch(false);
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

  // Step 2: Generate Lesson Plan (จาก research sources)
  const handleGenerateLesson = async () => {
    if (!formData || selectedSourceIds.length === 0) return;

    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildGeneratePayload(
            formData,
            projectContext?.id ?? null,
            selectedSourceIds
          )
        ),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to generate lesson plan");
      }

      setLessonPlan(result.lessonPlan);
      setUsedSources(result.usedSources || []);
      setCitations(result.citations || []);
      setSkippedResearch(false);
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

  // สร้างจาก PDF โดยตรง (ข้าม research)
  const handleGenerateFromPdf = async (data: LessonPlanFormData) => {
    if (!projectContext?.id || projectContext.extractedPdfCount === 0) {
      toast.error("ไม่มี PDF ที่พร้อมใช้งานในโปรเจกต์นี้");
      return;
    }

    setFormData(data);
    setIsGenerating(true);
    setSkippedResearch(true);

    try {
      const response = await fetch("/api/generate-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildGeneratePayload(data, projectContext.id, [])
        ),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to generate lesson plan");
      }

      setLessonPlan(result.lessonPlan);
      setUsedSources(result.usedSources || []);
      setCitations(result.citations || []);
      setCurrentStep("editor");

      toast.success("สร้างแผนการสอนจาก PDF สำเร็จ");
    } catch (error) {
      console.error("Generate from PDF error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "ไม่สามารถสร้างแผนการสอนจาก PDF ได้"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Step 3: Save Lesson Plan (อัปเดต record ที่ generate-lesson สร้างไว้แล้ว)
  const handleSaveLessonPlan = async (data: LessonPlanData) => {
    if (!lessonPlan?.id) return;

    setIsSaving(true);

    try {
      const response = await fetch(`/api/lesson-plans/${lessonPlan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonTitle: data.lessonTitle,
          subjectName: data.subjectName,
          gradeLevel: data.gradeLevel,
          teacherName: data.teacherName || null,
          schoolName: data.schoolName || null,
          objectives: data.objectives,
          keyConcepts: data.keyConcepts,
          learningActivities: data.learningActivities,
          mediaResources: data.mediaResources,
          assessment: data.assessment,
          notes: data.notes || null,
          status: "draft",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save lesson plan");
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

  const handleOpenInEditor = () => {
    if (!lessonPlan?.id) return;
    router.push(`/editor/${lessonPlan.id}`);
  };

  const handleBack = () => {
    if (currentStep === "editor") {
      setCurrentStep(skippedResearch ? "form" : "research");
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
    <ResponsiveContainer className="space-y-6 py-2 md:py-0">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => router.push("/dashboard/lesson-plans")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageHeader
            title="สร้างแผนการสอนด้วย AI"
            description="กรอกข้อมูล ค้นหาแหล่งข้อมูล และสร้างแผนการสอนอัตโนมัติ"
            className="flex-1"
          />
        </div>

        {/* Step Indicator */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 lg:max-w-[50%]">
          {(["form", "research", "editor"] as Step[]).map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={`flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs sm:text-sm ${
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
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-current text-xs">
                    {index + 1}
                  </span>
                )}
                {getStepLabel(step)}
              </div>
              {index < 2 && <Separator className="mx-2 hidden w-6 sm:block sm:w-8" />}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="space-y-6">
        {isLoadingProject && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>กำลังโหลดข้อมูลโปรเจกต์...</AlertDescription>
          </Alert>
        )}

        {projectContext && projectContext.extractedPdfCount > 0 && (
          <Alert className="border-primary/30 bg-primary/5">
            <FileText className="h-4 w-4" />
            <AlertDescription>
              ใช้เนื้อหาจากโปรเจกต์ <strong>{projectContext.name}</strong> — PDF ที่พร้อมใช้{" "}
              {projectContext.extractedPdfCount} ไฟล์ (สามารถสร้างจาก PDF โดยตรงได้)
            </AlertDescription>
          </Alert>
        )}

        {/* Step 1: Form */}
        {(currentStep === "form" || currentStep === "research") && (
          <LessonPlanForm
            onSubmit={handleFormSubmit}
            isLoading={isResearching}
            initialData={formData || formInitialData}
            showPdfGenerate={
              Boolean(projectContext && projectContext.extractedPdfCount > 0)
            }
            isPdfGenerating={isGenerating}
            onGenerateFromPdf={handleGenerateFromPdf}
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
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {skippedResearch ? "กลับไปแก้ข้อมูล" : "กลับไปเลือกแหล่งข้อมูล"}
              </Button>
              <Button variant="secondary" onClick={handleOpenInEditor}>
                เปิดใน Editor เต็มหน้าจอ
              </Button>
              <span className="text-muted-foreground text-sm">
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
    </ResponsiveContainer>
  );
}

export default function LessonBuilderPage() {
  return (
    <Suspense
      fallback={
        <ResponsiveContainer className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </ResponsiveContainer>
      }
    >
      <LessonBuilderContent />
    </Suspense>
  );
}
