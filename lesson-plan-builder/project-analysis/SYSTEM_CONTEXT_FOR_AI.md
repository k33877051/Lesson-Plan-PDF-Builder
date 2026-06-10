# System Context For AI

> **อัปเดต:** มิถุนายน 2026 — หลัง Master Upgrade  
> ใช้เอกสารนี้เป็นบริบทหลักเมื่อแก้ไขหรือขยายระบบ

This document explains the Lesson Plan PDF Builder project for another AI system that has never seen the source code.

## What The System Does
Lesson Plan PDF Builder is a Thai-language web application for teachers and education staff. It helps users create lesson plans, upload source PDF files, extract text from those PDFs, use AI to draft lesson content, preview lesson plans in A4 format, and export final lesson plans as PDF files.

The system includes an AI research module and an **AI Settings Center** where administrators configure AI providers, function-to-provider mappings, Gemini connection metadata, and a system object registry—all stored in PostgreSQL first, with `.env` as fallback.

## Why It Exists
Teachers often need to prepare structured lesson plans from documents, curriculum material, examples, or research sources. This system reduces manual work by combining document ingestion, rich editing, sample templates, AI drafting, and PDF export in one workflow.

## Main Business Objectives
- Speed up lesson-plan preparation.
- Standardize lesson-plan format for Thai education contexts.
- Convert PDF source material into editable lesson content.
- Help teachers generate objectives, activities, assessment, media resources, and summaries.
- Support research-backed lesson-plan generation.
- Export professional A4 printable PDFs.
- Centralize AI configuration without breaking existing AI routes.

## User Types
The system currently does not enforce login or roles, but intended users are:
- Teacher: creates lesson plans, uploads source PDFs, edits content, exports PDFs.
- Staff: manages projects and lesson plans for a school or department.
- Admin: configures settings, AI providers/functions, object registry, GitHub integration.
- AI system: uses structured API routes to generate content or analyze research sources.

## Important Workflows

### Create Lesson Plan Manually
User goes to `/dashboard/lesson-plans/new`, fills a Thai form or chooses an AI sample lesson plan, submits to `/api/lesson-plans`, then edits the result in `/editor/{id}`.

### Upload And Extract PDF
User goes to `/dashboard/upload` or `/dashboard/projects/new`, uploads a PDF, and the system creates a `Project` and `PdfSource`. On the project detail page, the user clicks extract. The API reads the PDF via `pdf-parse` v2 text-layer first, falls back to OCR (`getScreenshot` + Tesseract) when needed, and saves readable text to the database. Stale `PROCESSING` status (5+ minutes) can be retried automatically.

### AI Drafting
The editor calls `/api/ai-generate`. The backend resolves the model from **database AI settings first** (`lib/ai/settings-provider.ts`), tries providers in priority order via `generateObjectWithProviderFallback`, then falls back to environment variables. Returns sanitized HTML for editor sections. Only **5 pre-existing AI functions** are registered—do not add new function keys without explicit approval.

### AI Settings Center
Admin opens `/dashboard/settings` → tabs: AI Providers, AI Functions, Object Registry, Gemini.
- Providers ที่รองรับ: **OpenAI**, **KIMI**, **Gemini**, **Anthropic Claude**, **Ollama**, **DeepSeek**, **OpenRouter** (local/cloud, `requiresApiKey: false` สำหรับ Ollama).
- Fallback chain runtime: OpenAI → KIMI → Gemini → Anthropic → Ollama → DeepSeek → OpenRouter
- `GET/POST /api/ai/settings` — bulk settings, auto-seed if empty; sync providers/mappings สำหรับ DB ที่มี provider อยู่แล้ว.
- `GET/PUT /api/ai/settings/provider/[key]` — per-provider config (encrypted secrets).
- `GET/PUT /api/ai/functions`, `/api/ai/functions/[key]` — function mappings.
- `GET/POST/DELETE /api/ai/settings/gemini` — Gemini connection state only (no password/cookie storage).
- `GET/POST /api/system/objects`, `/api/system/objects/sync` — registry CRUD and scanner sync.

### Research-Backed Generation
The lesson builder at `/dashboard/lesson-builder` accepts optional `?projectId=` to load extracted PDF text from a project. Users can generate directly from PDF (`sourceIds: []`, `projectId` set) or combine PDF context with ranked research sources via `POST /api/generate-lesson`. The system creates a `LessonPlan` (with `projectId` when applicable) and connects selected `ResearchSource` rows through `LessonPlanSource` when research sources are used.

### Preview And Export
User opens `/preview/{id}`. Export calls `/api/export-pdf`, which launches Playwright, renders the preview page, saves a PDF in `public/exports`, writes an audit log, invalidates dashboard stats cache, and returns a download URL.

### GitHub Integration
Settings page allows connecting a GitHub personal access token (encrypted in DB). Users can list/create repositories and push the project.

### Theme
`ThemeSync` loads theme from `localStorage` or `/api/settings`. Topbar toggle and Settings → Appearance persist theme client-side and to DB on save.

## Database Structure
PostgreSQL managed through Prisma.

Core entities:
- `Project`, `PdfSource`, `LessonPlan`

AI research entities:
- `ResearchJob`, `ResearchQuery`, `ResearchSource`, `SourceChunk`, `LessonPlanSource`

Settings and integration:
- `AppSetting`, `GitHubIntegration`, `GitHubRepo`, `User` (schema-ready, no auth wired)

AI Settings Center:
- `AiProvider`, `AiFunction`, `AiFunctionProvider`, `SystemObjectRegistry`

Audit:
- `AuditLog`

## API Architecture
Next.js App Router route handlers under `app/api`.

Major API groups:
- `/api/lesson-plans` — CRUD with optional pagination; stats cache invalidation on write/delete.
- `/api/projects/[id]` — project deletion.
- `/api/upload-pdf`, `/api/extract-pdf`
- `/api/export-pdf` — Playwright PDF export + audit.
- `/api/ai-generate`, `/api/generate-lesson`
- `/api/ai/*` — AI Settings Center.
- `/api/system/objects/*` — object registry.
- `/api/research/*`, `/api/research-jobs`
- `/api/github/*`, `/api/settings`, `/api/health`

Standard response shape (newer routes): `{ success, data, meta? }` or `{ success, error, code? }`.

## Frontend Layout (Dashboard)
- `ResponsiveShell`: sidebar (desktop), `MobileDrawer` + `MobileBottomNav` (mobile).
- `PageHeader` + `ResponsiveContainer` on dashboard pages.
- Editor at `/editor/[id]` uses `EditorWizard` (outside dashboard shell).
- Preview at `/preview/[id]` uses `PreviewToolbar`.

## Security Model
No application authentication yet. Safeguards include:
- Zod validation, Prisma queries, rate limiting on heavy routes.
- Rich-text sanitization, PDF upload validation.
- SSRF guard on research URL extract (`lib/url-guard.ts`).
- Encrypted GitHub tokens and AI provider secrets.
- Production seed protection header.
- Audit logging for deletes and exports.

Production still requires: auth, private file storage, distributed rate limits.

## Deployment Architecture
Node.js runtime, PostgreSQL, writable local filesystem. Playwright and OCR need compatible hosting. In-memory rate limiting and stats cache are per-process.

## Known Limitations
- No user login or roles.
- Public local storage for uploads and exports.
- In-memory rate limiting and dashboard cache only.
- Some research routes are mock or scaffolded.
- Editor/preview outside dashboard shell (no mobile bottom nav there).
- Notification settings without delivery backend.
- No payment features.

## Constraints For AI Agents (Do Not Break)
1. **Do not register new AI functions** — only the existing 5.
2. **Database-first** for AI settings; `.env` is fallback only.
3. **Gemini**: settings + UI + API only — no browser automation, no Google password/cookies/tokens.
4. **Non-breaking changes** — preserve existing route contracts where possible.
5. Respond and document user-facing text in **Thai**.

## Future Plans
Authentication and authorization, private object storage, background workers, production search providers, observability, durable workflows, multi-tenant school support, optional PWA.

## Related Reports
- `project-analysis/MASTER_UPGRADE_COMPLETE.md`
- `project-analysis/PHASE_1_5_REPORT.md`
- `project-analysis/PHASE_11_15_REPORT.md`
- `project-analysis/PHASE_6_10_REPORT.md`
