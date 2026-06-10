# Project Report

> **อัปเดต:** มิถุนายน 2026 — Master Upgrade (Phase 1-5, 6-10, 11-15) เสร็จสมบูรณ์  
> รายงานรวม: `project-analysis/MASTER_UPGRADE_COMPLETE.md`

## Project Overview
Lesson Plan PDF Builder is a Thai-first Next.js web application for creating, managing, editing, previewing, exporting, and enriching lesson plans. It combines manual lesson-plan authoring, PDF upload and text extraction, AI-assisted drafting, research source collection, printable A4 previews, PDF export, settings management, GitHub integration, and a **database-first AI Settings Center**.

## Business Purpose
The system exists to help Thai teachers and education staff turn source documents, curriculum ideas, and AI-assisted research into structured lesson plans. Its business goal is to reduce preparation time, standardize lesson-plan formatting, and provide a workflow from raw PDF material to editable lesson content and printable PDF output.

## Main Features
- Responsive dashboard with mobile drawer, bottom navigation, and Thai UI.
- Dashboard statistics with short-lived cache and invalidation on data changes.
- Project management for uploaded PDF source files.
- PDF upload hub and project creation workflow.
- PDF text extraction with text-layer parsing and OCR fallback.
- Lesson plan creation from blank forms, AI samples, or research-backed generation.
- Rich-text lesson plan editing through Tiptap with EditorWizard UX.
- A4 print preview with Thai fonts and mobile PreviewToolbar.
- PDF export via Playwright.
- **AI Settings Center**: providers, functions, Gemini settings, object registry (DB-first, `.env` fallback).
- AI helper for objectives, activities, assessment, and summaries (5 registered functions only).
- AI research automation with mock and web-oriented pipelines.
- Source scoring, chunking, citations, and source linking.
- GitHub token connection, repository creation/listing, and project push workflow.
- Settings: profile, theme (persisted), notifications, PDF defaults, AI tabs, GitHub.
- Audit logging for sensitive operations.
- Theme sync via localStorage + database settings.

## User Roles
The codebase does not enforce roles. Intended roles inferred from UI are:
- Teacher: creates and edits lesson plans, uploads PDFs, exports printable documents.
- Staff/Admin: manages projects, settings, AI configuration, GitHub integration.
- AI assistant/system user: consumes structured APIs to generate lesson content or analyze source material.

## Authentication Methods
No application authentication or authorization is currently implemented. There is no `middleware.ts`, session handling, sign-in page, role guard, or permission system. GitHub integration authenticates against GitHub using a personal access token, but this does not authenticate users into this app.

## Technology Stack
- Framework: Next.js 16 App Router.
- Frontend: React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Radix UI, lucide-react.
- Fonts: Inter + Noto Sans Thai.
- Rich text: Tiptap.
- Backend: Next.js route handlers.
- Database: PostgreSQL through Prisma 7 and `@prisma/adapter-pg`.
- AI: Vercel AI SDK; database-first provider selection via `lib/ai/settings-provider.ts`.
- PDF extraction: `pdf-parse` v2 (`PDFParse`), `pdfjs-dist`, `@napi-rs/canvas@0.1.100`, `tesseract.js`; text-layer ก่อน OCR fallback; `serverExternalPackages` ใน Next.js config.
- PDF export: Playwright Chromium.
- GitHub: `@octokit/rest`, `simple-git`.
- Storage: local filesystem under `public/uploads` and `public/exports`.
- Validation/security: Zod, `sanitize-html`, in-memory rate limiter, SSRF guard, API key encryption.

## Frontend Architecture
The frontend uses Next.js App Router with a **ResponsiveShell** dashboard and separate editor/preview experiences.

- `app/layout.tsx`: root layout with Thai locale, fonts, TooltipProvider, Sonner Toaster.
- `app/dashboard/layout.tsx`: `ResponsiveShell` with sidebar, topbar, mobile drawer, bottom nav.
- `components/layout/responsive-shell.tsx`, `mobile-drawer.tsx`, `mobile-bottom-nav.tsx`, `theme-sync.tsx`.
- `components/layout/page-header.tsx`, `responsive-container.tsx`: standard page layout.
- `app/(main)/editor/[id]/page.tsx`: full-screen editor with EditorWizard.
- `app/(main)/preview/[id]/page.tsx`: full-screen A4 preview with PreviewToolbar.
- `components/ai/*`: AI Settings Center UI panels.
- `components/system/*`: Object Registry panel.
- `lib/nav-config.ts`: shared navigation for sidebar, drawer, and bottom nav.

Most list/detail pages are server components reading Prisma directly. Interactive forms and actions are client components calling `/api/*`.

## Backend Architecture
The backend is implemented as Next.js route handlers in `app/api`. Shared logic lives in `lib`.

Core backend modules:
- `lib/prisma.ts`: PostgreSQL pool and Prisma client.
- `lib/rate-limit.ts`: in-memory rate limiter (expanded route coverage).
- `lib/sanitize-html.ts`: rich text sanitization.
- `lib/api-response.ts`: standardized API response helpers and pagination meta.
- `lib/audit-log.ts`: audit log writes.
- `lib/url-guard.ts`: SSRF protection for research extract.
- `lib/encryption.ts`: encrypt/decrypt for AI provider secrets.
- `lib/ai/settings-provider.ts`, `lib/ai/generate-with-fallback.ts`, `lib/ai/gemini-settings.ts`: DB-first AI config + runtime provider fallback.
- `lib/system/registry-scanner.ts`, `registry-cache.ts`: object registry sync.
- `lib/dashboard-stats-cache.ts`: dashboard stats cache (30s TTL).
- `lib/services/pdf-extraction.ts`: PDF parsing and OCR pipeline.
- `lib/ai/provider.ts`: model provider selection (DB-first).
- `lib/research/*`: research search, extraction, scoring, chunking, citations.
- `lib/github/*`: GitHub client and repository operations.
- `lib/crypto.ts`: GitHub token encryption/decryption.

## Database Overview
The schema contains core models plus AI Settings Center and audit:

**Core:** `Project`, `PdfSource`, `LessonPlan`

**AI research:** `User`, `ResearchJob`, `ResearchQuery`, `ResearchSource`, `SourceChunk`, `LessonPlanSource`

**Settings/GitHub:** `AppSetting`, `GitHubIntegration`, `GitHubRepo`

**AI Settings Center:** `AiProvider`, `AiFunction`, `AiFunctionProvider`, `SystemObjectRegistry`

**Audit:** `AuditLog`

**Enums:** `ExtractionStatus`, `LessonPlanStatus`, `ResearchStatus`

Migrations: `20260609200754_add_ai_settings_center`, `20260609222521_add_audit_log_and_indexes`

## Payment Systems
No payment system is implemented.

## External Integrations
- OpenAI / KIMI / Gemini / **Anthropic Claude** / **Ollama** / **DeepSeek** / **OpenRouter** through Vercel AI SDK (DB-configured, priority fallback chain at runtime).
- **Ollama** — OpenAI-compatible API ที่ `http://127.0.0.1:11434/v1` (local/cloud proxy, default model `qwen3-coder:480b-cloud`, ไม่บังคับ API key).
- Gemini settings UI and API (no browser automation; no stored Google credentials).
- GitHub API through Octokit.
- Playwright for PDF export.
- Tesseract OCR and PDF rendering.
- Research providers scaffolded for Tavily, Google Custom Search, YouTube, mock.

## Storage Systems
- PostgreSQL for structured data, AI settings, audit logs, research, GitHub metadata.
- Local filesystem: `public/uploads`, `public/exports` (web-accessible if URL known).

## Notification Systems
No external notification service. UI uses `sonner` toasts. Settings store notification preferences without delivery backend.

## Security Model
Development/internal-use oriented with post-upgrade hardening:
- No user login or permission checks (roadmap item).
- Rate limiting on research, generate-lesson, settings, lesson-plans, export routes.
- HTML sanitization in lesson-plan APIs.
- PDF upload validation (MIME, size, magic bytes).
- SSRF guard on research URL extract.
- GitHub and AI provider secrets encrypted at rest when encryption key configured.
- Production seed requires `x-admin-seed: true` header.
- Audit log for delete/export and sensitive actions.

## Deployment Architecture
Node.js + PostgreSQL + writable filesystem for uploads/exports. Playwright, OCR, and in-memory rate limiting require careful production planning (object storage, workers, distributed rate limits).

## Upgrade Reports
- `project-analysis/PHASE_1_5_REPORT.md`
- `project-analysis/PHASE_11_15_REPORT.md`
- `project-analysis/PHASE_6_10_REPORT.md`
- `project-analysis/MASTER_UPGRADE_COMPLETE.md`
