# Project Report

## Project Overview
Lesson Plan PDF Builder is a Thai-first Next.js web application for creating, managing, editing, previewing, exporting, and enriching lesson plans. It combines manual lesson-plan authoring, PDF upload and text extraction, AI-assisted drafting, research source collection, printable A4 previews, PDF export, settings management, and GitHub repository integration.

## Business Purpose
The system exists to help Thai teachers and education staff turn source documents, curriculum ideas, and AI-assisted research into structured lesson plans. Its business goal is to reduce preparation time, standardize lesson-plan formatting, and provide a workflow from raw PDF material to editable lesson content and printable PDF output.

## Main Features
- Dashboard with project statistics, recent projects, quick actions, and Thai UI.
- Project management for uploaded PDF source files.
- PDF upload to local storage with database metadata.
- PDF text extraction with text-layer parsing and OCR fallback work in progress.
- Lesson plan creation from blank forms or AI sample data.
- Rich-text lesson plan editing through Tiptap.
- A4 print preview with Thai fonts.
- PDF export via Playwright.
- AI helper for objectives, activities, assessment, and summaries.
- AI research automation with mock and web-oriented pipelines.
- Source scoring, chunking, citations, and source linking.
- GitHub token connection, repository creation/listing, and project push workflow.
- Settings page for profile, theme, notifications, PDF defaults, and GitHub connection.

## User Roles
The codebase does not enforce roles. Intended roles inferred from UI are:
- Teacher: creates and edits lesson plans, uploads PDFs, exports printable documents.
- Staff/Admin: manages projects, settings, GitHub integration, and system configuration.
- AI assistant/system user: consumes structured APIs to generate lesson content or analyze source material.

## Authentication Methods
No application authentication or authorization is currently implemented. There is no `middleware.ts`, session handling, sign-in page, role guard, or permission system. GitHub integration authenticates against GitHub using a personal access token, but this does not authenticate users into this app.

## Technology Stack
- Framework: Next.js 16 App Router.
- Frontend: React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Radix UI, lucide-react.
- Rich text: Tiptap.
- Backend: Next.js route handlers.
- Database: PostgreSQL through Prisma 7 and `@prisma/adapter-pg`.
- AI: Vercel AI SDK with OpenAI-compatible provider support for OpenAI/KIMI configuration.
- PDF extraction: `pdf-parse`, `pdfjs-dist`, `@napi-rs/canvas`, `tesseract.js`.
- PDF export: Playwright Chromium.
- GitHub: `@octokit/rest`, `simple-git`.
- Storage: local filesystem under `public/uploads` and `public/exports`.
- Validation/security helpers: Zod, `sanitize-html`, in-memory rate limiter.

## Frontend Architecture
The frontend uses Next.js App Router with a dashboard shell and separate editor/preview experiences.

- `app/layout.tsx`: root layout with Thai locale, TooltipProvider, and Sonner Toaster.
- `app/dashboard/layout.tsx`: dashboard shell with sidebar and topbar.
- `app/(main)/editor/[id]/page.tsx`: full-screen editor outside the dashboard shell.
- `app/(main)/preview/[id]/page.tsx`: full-screen A4 preview/export page.
- `components/ui`: shadcn primitives.
- `components/layout`: sidebar and topbar.
- `components/editor`, `components/preview`, `components/pdf`, `components/research`, `components/lesson-builder`: domain UI modules.
- `src/data`: sample lesson plans, AI departments, and education levels.

Most list/detail pages are server components reading Prisma directly. Interactive forms and actions are client components calling `/api/*`.

## Backend Architecture
The backend is implemented as Next.js route handlers in `app/api`. Shared logic lives in `lib`.

Core backend modules:
- `lib/prisma.ts`: PostgreSQL pool and Prisma client.
- `lib/rate-limit.ts`: in-memory rate limiter.
- `lib/sanitize-html.ts`: rich text sanitization.
- `lib/services/pdf-extraction.ts`: PDF parsing and OCR pipeline.
- `lib/ai/provider.ts`: OpenAI/KIMI model provider selection.
- `lib/research/*`: research search, extraction, scoring, chunking, citations, and mock agent.
- `lib/github/*`: GitHub client and repository operations.
- `lib/crypto.ts`: GitHub token encryption/decryption.

## Database Overview
The schema contains 12 primary models and 3 enums:
- Core: `Project`, `PdfSource`, `LessonPlan`.
- AI research: `User`, `ResearchJob`, `ResearchQuery`, `ResearchSource`, `SourceChunk`, `LessonPlanSource`.
- Settings/GitHub: `AppSetting`, `GitHubIntegration`, `GitHubRepo`.
- Enums: `ExtractionStatus`, `LessonPlanStatus`, `ResearchStatus`.

Project deletes cascade PDF metadata. Lesson plans can optionally belong to projects/users and link to research sources through `LessonPlanSource`.

## Payment Systems
No payment system is implemented. Stripe is installed as an available MCP/server in Cursor context, but the application code does not contain payment, billing, checkout, subscription, invoice, or webhook flows.

## External Integrations
- OpenAI API through Vercel AI SDK provider.
- KIMI OpenAI-compatible endpoint configuration through `createOpenAI`.
- GitHub API through Octokit.
- Git CLI operations through `simple-git`.
- Playwright for PDF export.
- Tesseract OCR and PDF rendering for PDF text extraction.
- Research providers are scaffolded for Tavily, Google Custom Search, YouTube, and mock sources.

## Storage Systems
- PostgreSQL stores structured application data, lesson content, settings, research sources, chunks, and GitHub metadata.
- Local filesystem stores uploaded PDFs at `public/uploads`.
- Local filesystem stores generated PDF exports at `public/exports`.
- Public storage paths mean files are directly web-accessible if the URL is known.

## Notification Systems
No external notification service is implemented. The UI uses `sonner` toast notifications for local feedback. Settings contain notification preference fields, but no email, SMS, push, or queue-based notification delivery exists.

## Security Model
The current security model is development/internal-use oriented:
- No user login or permission checks.
- Rate limiting exists on several routes but not all heavy or state-changing routes.
- HTML is sanitized in key lesson-plan APIs.
- File upload validates PDF MIME, file size, and magic bytes.
- GitHub tokens are encrypted at rest when a stable encryption key is configured.
- Secrets currently exist in local `.env`; report documents variable names only and does not reproduce values.

## Deployment Architecture
The project is a Next.js application expected to run on Node.js with PostgreSQL and writable filesystem access for uploads/exports. Some routes require Node runtime capabilities: Playwright, filesystem operations, PDF parsing, OCR, and native canvas. Deployment to serverless environments needs care because OCR, Playwright, local filesystem persistence, and in-memory rate limiting may not be suitable without external storage, queues, and distributed rate limits.
