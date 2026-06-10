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
import { EditorWizard } from "@/components/editor/EditorWizard";
import { useI18n } from "@/components/i18n/language-provider";
import {
  useAcademicYearOptions,
  useEditorWizardSteps,
  useGradeOptions,
  useSemesterOptions,
  useSubjectOptions,
} from "@/lib/i18n/hooks";

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

export function LessonPlanForm({
  initialData,
  onSave,
  onPreview,
  onExport,
  isSaving = false,
  isNew = false,
  lessonPlanId,
}: LessonPlanFormProps) {
  const { t } = useI18n();
  const subjects = useSubjectOptions();
  const gradeLevels = useGradeOptions();
  const semesters = useSemesterOptions();
  const academicYears = useAcademicYearOptions();
  const wizardSteps = useEditorWizardSteps();
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

  const wizardStep =
    activeTab === "review"
      ? "review"
      : activeTab === "research"
        ? "research"
        : activeTab === "content"
          ? "content"
          : "basic";

  const handleWizardStepChange = (stepId: string) => {
    setActiveTab(stepId === "review" ? "review" : stepId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isNew ? t("editor.createTitle") : t("editor.editTitle")}
          </h1>
          <p className="text-muted-foreground">
            {hasChanges ? t("editor.unsavedChanges") : t("editor.savedState")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onPreview && (
            <Button variant="outline" onClick={onPreview}>
              <Eye className="mr-2 h-4 w-4" />
              {t("common.preview")}
            </Button>
          )}
          {onExport && (
            <Button variant="outline" onClick={onExport}>
              <FileDown className="mr-2 h-4 w-4" />
              {t("common.export")}
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving || !isValid}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("common.saving")}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t("common.save")}
              </>
            )}
          </Button>
        </div>
      </div>

      <EditorWizard
        steps={wizardSteps}
        currentStep={wizardStep}
        onStepChange={handleWizardStepChange}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex h-auto w-full justify-start overflow-x-auto md:grid md:grid-cols-4">
          <TabsTrigger value="basic" className="shrink-0">{t("editor.tabs.basic")}</TabsTrigger>
          <TabsTrigger value="content" className="shrink-0">{t("editor.tabs.content")}</TabsTrigger>
          <TabsTrigger value="research" className="shrink-0">
            <BookOpen className="h-4 w-4 mr-1" />
            {t("editor.tabs.research")}
          </TabsTrigger>
          <TabsTrigger value="review" className="shrink-0">{t("editor.tabs.review")}</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("editor.generalInfo.title")}</CardTitle>
              <CardDescription>{t("editor.generalInfo.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teacherName">{t("editor.fields.teacherName")}</Label>
                  <Input
                    id="teacherName"
                    value={formData.teacherName}
                    onChange={(e) => updateField("teacherName", e.target.value)}
                    placeholder={t("editor.placeholders.teacherName")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolName">{t("editor.fields.schoolName")}</Label>
                  <Input
                    id="schoolName"
                    value={formData.schoolName}
                    onChange={(e) => updateField("schoolName", e.target.value)}
                    placeholder={t("editor.placeholders.schoolName")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="academicYear">{t("editor.fields.academicYear")}</Label>
                  <Select
                    value={formData.academicYear}
                    onValueChange={(value) => updateField("academicYear", value)}
                  >
                    <SelectTrigger id="academicYear">
                      <SelectValue placeholder={t("editor.placeholders.academicYear")} />
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

                <div className="space-y-2">
                  <Label htmlFor="semester">{t("editor.fields.semester")}</Label>
                  <Select
                    value={formData.semester}
                    onValueChange={(value) => updateField("semester", value)}
                  >
                    <SelectTrigger id="semester">
                      <SelectValue placeholder={t("editor.placeholders.semester")} />
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
              <CardTitle>{t("editor.subjectInfo.title")}</CardTitle>
              <CardDescription>{t("editor.subjectInfo.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subjectName">
                    {t("editor.fields.subject")} <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.subjectName}
                    onValueChange={(value) => updateField("subjectName", value)}
                  >
                    <SelectTrigger id="subjectName">
                      <SelectValue placeholder={t("editor.placeholders.subject")} />
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

                <div className="space-y-2">
                  <Label htmlFor="gradeLevel">
                    {t("editor.fields.grade")} <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.gradeLevel}
                    onValueChange={(value) => updateField("gradeLevel", value)}
                  >
                    <SelectTrigger id="gradeLevel">
                      <SelectValue placeholder={t("editor.placeholders.grade")} />
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

              <div className="space-y-2">
                <Label htmlFor="lessonTitle">
                  {t("editor.fields.lessonTitle")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lessonTitle"
                  value={formData.lessonTitle}
                  onChange={(e) => updateField("lessonTitle", e.target.value)}
                  placeholder={t("editor.placeholders.lessonTitle")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">
                  {t("editor.fields.researchTopic")}
                  <span className="text-muted-foreground text-xs ml-2">
                    {t("editor.fields.researchTopicHint")}
                  </span>
                </Label>
                <Input
                  id="topic"
                  value={formData.topic || formData.lessonTitle}
                  onChange={(e) => updateField("topic", e.target.value)}
                  placeholder={t("editor.placeholders.researchTopic")}
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
                  {t("editor.useResearch")}
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

          <Card>
            <CardHeader>
              <CardTitle>{t("editor.sections.objectives.title")}</CardTitle>
              <CardDescription>{t("editor.sections.objectives.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <TiptapEditor
                content={formData.objectives}
                jsonContent={formData.objectivesJson}
                onChange={handleRichTextChange("objectives", "objectivesJson")}
                placeholder={t("editor.sections.objectives.placeholder")}
                minHeight="150px"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("editor.sections.keyConcepts.title")}</CardTitle>
              <CardDescription>{t("editor.sections.keyConcepts.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <TiptapEditor
                content={formData.keyConcepts}
                jsonContent={formData.keyConceptsJson}
                onChange={handleRichTextChange("keyConcepts", "keyConceptsJson")}
                placeholder={t("editor.sections.keyConcepts.placeholder")}
                minHeight="150px"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("editor.sections.activities.title")}</CardTitle>
              <CardDescription>{t("editor.sections.activities.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <TiptapEditor
                content={formData.learningActivities}
                jsonContent={formData.learningActivitiesJson}
                onChange={handleRichTextChange("learningActivities", "learningActivitiesJson")}
                placeholder={t("editor.sections.activities.placeholder")}
                minHeight="200px"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("editor.sections.media.title")}</CardTitle>
              <CardDescription>{t("editor.sections.media.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <TiptapEditor
                content={formData.mediaResources}
                jsonContent={formData.mediaResourcesJson}
                onChange={handleRichTextChange("mediaResources", "mediaResourcesJson")}
                placeholder={t("editor.sections.media.placeholder")}
                minHeight="120px"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("editor.sections.assessment.title")}</CardTitle>
              <CardDescription>{t("editor.sections.assessment.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <TiptapEditor
                content={formData.assessment}
                jsonContent={formData.assessmentJson}
                onChange={handleRichTextChange("assessment", "assessmentJson")}
                placeholder={t("editor.sections.assessment.placeholder")}
                minHeight="150px"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("editor.sections.notes.title")}</CardTitle>
              <CardDescription>{t("editor.sections.notes.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <TiptapEditor
                content={formData.notes}
                jsonContent={formData.notesJson}
                onChange={handleRichTextChange("notes", "notesJson")}
                placeholder={t("editor.sections.notes.placeholder")}
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

        <TabsContent value="review" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("editor.review.title")}</CardTitle>
              <CardDescription>{t("editor.review.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{t("editor.review.unitName")}</p>
                  <p className="font-medium">{formData.lessonTitle || "—"}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{t("editor.review.subjectGrade")}</p>
                  <p className="font-medium">
                    {subjects.find((s) => s.value === formData.subjectName)?.label || formData.subjectName || "—"} •{" "}
                    {gradeLevels.find((g) => g.value === formData.gradeLevel)?.label || formData.gradeLevel || "—"}
                  </p>
                </div>
                <div className="rounded-lg border p-3 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">{t("editor.review.teacherSchool")}</p>
                  <p className="font-medium">
                    {formData.teacherName || "—"} {formData.schoolName ? `• ${formData.schoolName}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                {onPreview && (
                  <Button variant="outline" onClick={onPreview} disabled={isNew}>
                    <Eye className="mr-2 h-4 w-4" />
                    {t("common.preview")}
                  </Button>
                )}
                <Button onClick={handleSave} disabled={isSaving || !isValid}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("common.saving")}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {t("editor.review.savePlan")}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Actions */}
      <div className="flex justify-end gap-2">
        <Button onClick={handleSave} disabled={isSaving || !isValid}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("common.saving")}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t("editor.review.savePlan")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default LessonPlanForm;
