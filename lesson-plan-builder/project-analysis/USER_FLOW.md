# User Flow

## Customer / Teacher Flow
1. User opens `/dashboard`.
2. User reviews statistics, recent projects, and quick actions.
3. User creates a lesson plan through `/dashboard/lesson-plans/new`.
4. User either fills the form manually or chooses a sample AI lesson plan.
5. Client submits `POST /api/lesson-plans`.
6. System creates a draft `LessonPlan` and redirects to `/editor/{id}`.
7. User edits rich content in Tiptap sections: objectives, concepts, activities, media, assessment, notes.
8. User optionally clicks AI helper to generate lesson-plan sections.
9. User previews through `/preview/{id}`.
10. User exports to PDF through `POST /api/export-pdf`.

## Project / PDF Flow
1. User opens `/dashboard/projects/new`.
2. User uploads a PDF and supplies project name/description.
3. Client submits `POST /api/upload-pdf`.
4. System validates file size, MIME type, and PDF magic bytes.
5. System stores PDF in `public/uploads` and creates `Project` plus `PdfSource`.
6. User opens `/dashboard/projects/{id}`.
7. User clicks "ดึงข้อความ".
8. Client calls `POST /api/extract-pdf`.
9. System reads the PDF, tries text-layer extraction, falls back to OCR when needed, and updates `PdfSource`.
10. User previews extracted text or sees a clear failure message.
11. User clicks **สร้างแผนด้วย AI** → `/dashboard/lesson-builder?projectId=...`.
12. User fills subject/grade and either:
    - clicks **สร้างจาก PDF โดยตรง** (`POST /api/generate-lesson` with `projectId`), or
    - runs research flow then generates with PDF + selected sources.
13. User edits in Lesson Builder, saves via `PUT /api/lesson-plans/[id]`, and can open full editor at `/editor/{id}`.

## AI Research Flow
1. User opens `/dashboard/lesson-builder` or the research tab in the editor.
2. User enters topic, subject, and grade level.
3. Client calls either `POST /api/research-jobs` or `POST /api/research/start`.
4. Research pipeline generates queries, searches mock/web providers, scores sources, stores `ResearchSource`, and chunks content.
5. User selects ranked sources.
6. Client calls `POST /api/generate-lesson`.
7. System generates structured lesson content, creates a `LessonPlan`, and links selected sources through `LessonPlanSource`.

## Admin Flow
There is no enforced admin role. An administrative user can currently access:
- `/dashboard/settings` to edit profile, theme, notifications, PDF preferences, and GitHub connection.
- `/dashboard/projects` to list, view, and delete projects.
- `/dashboard/lesson-plans` to list and delete lesson plans.
- GitHub settings to connect a token, create/list repositories, and push project code.

## Staff Flow
There is no enforced staff role. A staff-like workflow would mirror the teacher flow:
1. Create or upload a project.
2. Extract source PDF text.
3. Create a draft lesson plan.
4. Review/edit the generated content.
5. Export or share the final PDF.

## Payment Flow
No payment flow exists. There are no checkout, subscription, invoice, billing portal, Stripe webhook, or pricing modules.

## GitHub Integration Flow
1. User opens settings GitHub tab.
2. User submits a GitHub personal access token to `POST /api/github/auth`.
3. System verifies token through GitHub API and stores an encrypted token.
4. User can list repositories through `/api/github/repo`.
5. User can create a repository with `POST /api/github/repo`.
6. User can push the current working tree with `POST /api/github/push`.

## Export PDF Flow
1. User opens `/preview/{lessonPlanId}`.
2. User clicks export.
3. Client calls `POST /api/export-pdf`.
4. Server launches Playwright Chromium, opens the preview URL, waits for render, and writes a PDF to `public/exports`.
5. Server returns a download URL.
