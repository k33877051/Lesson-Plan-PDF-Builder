# System Context For AI

This document explains the Lesson Plan PDF Builder project for another AI system that has never seen the source code.

## What The System Does
Lesson Plan PDF Builder is a Thai-language web application for teachers and education staff. It helps users create lesson plans, upload source PDF files, extract text from those PDFs, use AI to draft lesson content, preview lesson plans in A4 format, and export final lesson plans as PDF files.

The system also includes an AI research module. This module can create research jobs, generate search queries, collect or mock educational sources, score sources, chunk source content, and link selected sources to lesson plans as citations.

## Why It Exists
Teachers often need to prepare structured lesson plans from documents, curriculum material, examples, or research sources. This system reduces manual work by combining document ingestion, rich editing, sample templates, AI drafting, and PDF export in one workflow.

## Main Business Objectives
- Speed up lesson-plan preparation.
- Standardize lesson-plan format for Thai education contexts.
- Convert PDF source material into editable lesson content.
- Help teachers generate objectives, activities, assessment, media resources, and summaries.
- Support research-backed lesson-plan generation.
- Export professional A4 printable PDFs.

## User Types
The system currently does not enforce login or roles, but intended users are:
- Teacher: creates lesson plans, uploads source PDFs, edits content, exports PDFs.
- Staff: manages projects and lesson plans for a school or department.
- Admin: configures settings, GitHub integration, and operational preferences.
- AI system: uses structured API routes to generate content or analyze research sources.

## Important Workflows

### Create Lesson Plan Manually
User goes to `/dashboard/lesson-plans/new`, fills a Thai form or chooses an AI sample lesson plan, submits to `/api/lesson-plans`, then edits the result in `/editor/{id}`.

### Upload And Extract PDF
User goes to `/dashboard/projects/new`, uploads a PDF, and the system creates a `Project` and `PdfSource`. On the project detail page, the user clicks extract. The API reads the PDF, tries text extraction, falls back to OCR when necessary, and saves readable text to the database.

### AI Drafting
The editor can call `/api/ai-generate` with subject, grade, lesson title, duration, optional context, and optional research context. The backend uses a Zod structured output schema through the Vercel AI SDK and returns sanitized HTML for editor sections.

### Research-Backed Generation
The lesson builder creates research jobs through `/api/research-jobs` or `/api/research/start`. Sources are ranked, selected, and sent to `/api/generate-lesson`. The system generates a lesson plan and connects selected `ResearchSource` rows through `LessonPlanSource`.

### Preview And Export
User opens `/preview/{id}`. Export calls `/api/export-pdf`, which launches Playwright, renders the preview page, saves a PDF in `public/exports`, and returns a download URL.

### GitHub Integration
The settings page allows connecting a GitHub personal access token. The token is encrypted in the database. Users can list/create repositories and push the project through Git operations.

## Database Structure
The database is PostgreSQL managed through Prisma.

Core entities:
- `Project`: groups uploaded PDFs and optional lesson plans.
- `PdfSource`: stores PDF metadata, file path, page count, extracted text, extraction status, and errors.
- `LessonPlan`: stores teacher/school/subject/grade metadata and lesson-plan sections as text plus optional JSON.

AI research entities:
- `ResearchJob`: tracks topic, subject, grade level, and research status.
- `ResearchQuery`: stores generated search queries per job.
- `ResearchSource`: stores discovered sources, URLs, snippets, full text, scores, language, and platform.
- `SourceChunk`: stores chunks for RAG-like use.
- `LessonPlanSource`: joins lesson plans to sources with citation notes.

Settings and integration entities:
- `AppSetting`: singleton settings record.
- `GitHubIntegration`: encrypted token and GitHub user metadata.
- `GitHubRepo`: connected GitHub repository metadata.
- `User`: schema-ready but not currently wired into auth.

## API Architecture
All backend endpoints are Next.js App Router route handlers under `app/api`.

Major API groups:
- `/api/lesson-plans`: lesson plan CRUD.
- `/api/projects/[id]`: project deletion.
- `/api/upload-pdf`: PDF upload and project creation.
- `/api/extract-pdf`: PDF text extraction and OCR.
- `/api/export-pdf`: Playwright PDF export.
- `/api/ai-generate`: AI helper for editor sections.
- `/api/generate-lesson`: AI generation from selected research sources.
- `/api/research/*`: asynchronous research pipeline.
- `/api/research-jobs`: mock/synchronous research agent pipeline.
- `/api/github/*`: GitHub token, repo, status, and push operations.
- `/api/settings`: settings read/update.
- `/api/health`: health checks.

## Security Model
The current application has no real authentication or authorization. Security currently relies on local/development access assumptions. Some safeguards exist: input validation with Zod, Prisma query APIs, rate limiting on selected endpoints, rich-text sanitization, PDF upload validation, and GitHub token encryption. Production use requires authentication, authorization, private file storage, stronger rate limiting, and SSRF protection.

## Deployment Architecture
The app expects a Node.js runtime, PostgreSQL, and writable local filesystem access. It uses local paths for uploads and exports. PDF export requires Playwright Chromium. OCR requires native canvas and Tesseract assets. These characteristics make deployment to simple serverless environments risky unless uploads/exports are moved to object storage and OCR/export are moved to workers or durable background jobs.

## Known Limitations
- No user login or roles.
- Public local storage for uploads and exports.
- In-memory rate limiting only.
- Some research routes are mock or scaffolded.
- KIMI Coding endpoint may reject non-coding-agent use.
- OCR may be slow and limited to configured page count.
- Lists are not paginated.
- Some heavy operations run inline in API routes.
- Notification settings exist but no delivery system exists.
- Payment features do not exist.

## Future Plans
The most important future work is to add authentication and authorization, private storage, background processing, robust OCR, production search providers, pagination, observability, durable workflows, and eventually multi-user or multi-tenant school support.
