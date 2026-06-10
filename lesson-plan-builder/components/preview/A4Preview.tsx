"use client";

import { PreviewToolbar } from "@/components/preview/PreviewToolbar";
import { sanitizeRichText } from "@/lib/sanitize-html";

// Import Thai fonts
import "@fontsource/noto-sans-thai/400.css";
import "@fontsource/noto-sans-thai/500.css";
import "@fontsource/noto-sans-thai/600.css";
import "@fontsource/noto-sans-thai/700.css";
import "@fontsource/sarabun/400.css";
import "@fontsource/sarabun/500.css";
import "@fontsource/sarabun/600.css";
import "@fontsource/sarabun/700.css";
import "@fontsource/prompt/400.css";
import "@fontsource/prompt/500.css";
import "@fontsource/prompt/600.css";
import "@fontsource/prompt/700.css";

import "./a4-styles.css";

// Types for lesson plan data
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
  objectivesJson?: unknown;
  keyConcepts: string;
  keyConceptsJson?: unknown;
  learningActivities: string;
  learningActivitiesJson?: unknown;
  mediaResources: string;
  mediaResourcesJson?: unknown;
  assessment: string;
  assessmentJson?: unknown;
  notes?: string;
  notesJson?: unknown;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface A4PreviewProps {
  lessonPlan: LessonPlanData;
  onPrint?: () => void;
  backHref?: string;
}

// Helper to safely render HTML content
function renderHtmlContent(htmlContent: string) {
  if (!htmlContent || htmlContent === "<p></p>") {
    return <p className="text-gray-400 italic">ไม่มีข้อมูล</p>;
  }
  return <div dangerouslySetInnerHTML={{ __html: sanitizeRichText(htmlContent) }} />;
}

// Helper to get subject label
const subjectLabels: Record<string, string> = {
  mathematics: "คณิตศาสตร์",
  science: "วิทยาศาสตร์",
  thai: "ภาษาไทย",
  english: "ภาษาอังกฤษ",
  social: "สังคมศึกษา",
  history: "ประวัติศาสตร์",
  geography: "ภูมิศาสตร์",
  civics: "หน้าที่พลเมือง",
  physics: "ฟิสิกส์",
  chemistry: "เคมี",
  biology: "ชีววิทยา",
  computer: "คอมพิวเตอร์",
  art: "ศิลปะ",
  music: "ดนตรี",
  pe: "พลศึกษา",
  health: "สุขศึกษา",
  other: "อื่นๆ",
};

// Helper to get grade label
const gradeLabels: Record<string, string> = {
  p1: "ประถมศึกษาปีที่ 1",
  p2: "ประถมศึกษาปีที่ 2",
  p3: "ประถมศึกษาปีที่ 3",
  p4: "ประถมศึกษาปีที่ 4",
  p5: "ประถมศึกษาปีที่ 5",
  p6: "ประถมศึกษาปีที่ 6",
  m1: "มัธยมศึกษาปีที่ 1",
  m2: "มัธยมศึกษาปีที่ 2",
  m3: "มัธยมศึกษาปีที่ 3",
  m4: "มัธยมศึกษาปีที่ 4",
  m5: "มัธยมศึกษาปีที่ 5",
  m6: "มัธยมศึกษาปีที่ 6",
  vocational: "อาชีวศึกษา",
  university: "อุดมศึกษา",
};

// Helper to get semester label
const semesterLabels: Record<string, string> = {
  "1": "ภาคเรียนที่ 1",
  "2": "ภาคเรียนที่ 2",
  summer: "ภาคฤดูร้อน",
};

export function A4Preview({
  lessonPlan,
  onPrint,
  backHref = "/dashboard/lesson-plans",
}: A4PreviewProps) {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }
    window.print();
  };

  const subjectLabel = subjectLabels[lessonPlan.subjectName] || lessonPlan.subjectName;
  const gradeLabel = gradeLabels[lessonPlan.gradeLevel] || lessonPlan.gradeLevel;
  const semesterLabel = lessonPlan.semester
    ? semesterLabels[lessonPlan.semester] || lessonPlan.semester
    : "-";

  return (
    <div className="preview-container">
      <PreviewToolbar
        lessonPlanId={lessonPlan.id}
        lessonTitle={lessonPlan.lessonTitle}
        backHref={backHref}
        onPrint={handlePrint}
      />

      {/* A4 Page */}
      <div className="a4-page">
        {/* Header / Letterhead */}
        <header className="a4-header">
          <div className="header-logo">
            <div className="logo-circle">
              <span className="logo-icon">📚</span>
            </div>
            <div className="header-title">
              <h2 className="school-name">{lessonPlan.schoolName || "โรงเรียน"}</h2>
              <p className="document-type">แผนการจัดการเรียนรู้</p>
            </div>
          </div>
        </header>

        {/* Teacher Info Section */}
        <section className="teacher-info">
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">ครูผู้สอน:</span>
              <span className="info-value">{lessonPlan.teacherName || "-"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">กลุ่มสาระการเรียนรู้:</span>
              <span className="info-value">{subjectLabel}</span>
            </div>
            <div className="info-item">
              <span className="info-label">ระดับชั้น:</span>
              <span className="info-value">{gradeLabel}</span>
            </div>
            <div className="info-item">
              <span className="info-label">ภาคเรียน:</span>
              <span className="info-value">{semesterLabel}</span>
            </div>
            <div className="info-item">
              <span className="info-label">ปีการศึกษา:</span>
              <span className="info-value">{lessonPlan.academicYear || "-"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">วันที่จัดทำ:</span>
              <span className="info-value">
                {new Date(lessonPlan.createdAt).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </section>

        {/* Lesson Title */}
        <section className="lesson-title-section">
          <h1 className="lesson-title">{lessonPlan.lessonTitle}</h1>
        </section>

        {/* Content Sections */}
        <div className="content-sections">
          {/* Objectives */}
          <section className="content-section">
            <h3 className="section-title">
              <span className="section-number">1</span>
              วัตถุประสงค์การเรียนรู้
            </h3>
            <div className="section-content">
              {renderHtmlContent(lessonPlan.objectives)}
            </div>
          </section>

          {/* Key Concepts */}
          <section className="content-section">
            <h3 className="section-title">
              <span className="section-number">2</span>
              สาระการเรียนรู้ / แนวคิดสำคัญ
            </h3>
            <div className="section-content">
              {renderHtmlContent(lessonPlan.keyConcepts)}
            </div>
          </section>

          {/* Learning Activities */}
          <section className="content-section">
            <h3 className="section-title">
              <span className="section-number">3</span>
              กระบวนการจัดการเรียนรู้
            </h3>
            <div className="section-content">
              {renderHtmlContent(lessonPlan.learningActivities)}
            </div>
          </section>

          {/* Media Resources */}
          <section className="content-section">
            <h3 className="section-title">
              <span className="section-number">4</span>
              สื่อและแหล่งเรียนรู้
            </h3>
            <div className="section-content">
              {renderHtmlContent(lessonPlan.mediaResources)}
            </div>
          </section>

          {/* Assessment */}
          <section className="content-section">
            <h3 className="section-title">
              <span className="section-number">5</span>
              การวัดและประเมินผล
            </h3>
            <div className="section-content">
              {renderHtmlContent(lessonPlan.assessment)}
            </div>
          </section>

          {/* Notes (if exists) */}
          {lessonPlan.notes && lessonPlan.notes !== "<p></p>" && (
            <section className="content-section">
              <h3 className="section-title">
                <span className="section-number">6</span>
                หมายเหตุ
              </h3>
              <div className="section-content">
                {renderHtmlContent(lessonPlan.notes)}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <footer className="a4-footer">
          <div className="footer-line" />
          <p className="footer-text">
            จัดทำโดย {lessonPlan.teacherName || "-"} | 
            แผนการสอนเลขที่ {lessonPlan.id.slice(-6).toUpperCase()} | 
            สร้างด้วย Lesson Plan PDF Builder
          </p>
        </footer>

        {/* Page number */}
        <div className="page-number">1</div>
      </div>

      {/* Print styles injection */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          
          body {
            background: white;
          }
          
          .preview-toolbar {
            display: none !important;
          }
          
          .a4-page {
            box-shadow: none !important;
            margin: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            padding: 20mm !important;
          }
        }
      `}</style>
    </div>
  );
}

export default A4Preview;
