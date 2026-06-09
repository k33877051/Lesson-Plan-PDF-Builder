# Agent Guide: Lesson Plan PDF Builder

This file is the source of truth for AI coding agents working on this project. Read it first before making any changes.

---

## Project Overview

**Lesson Plan PDF Builder** is a full-stack web application built for Thai educators to create, edit, preview, and export professional lesson plans as PDF documents. The UI is predominantly in Thai language. The application supports AI-assisted content generation, web research with source citation, PDF upload/extraction, and GitHub integration for version-controlled lesson plan storage.

The project is located in the `lesson-plan-builder/` directory. All development commands and file operations should be run from that directory.

---

## Technology Stack

| Layer | Technology | Version | Notes |
|-------|------------|---------|-------|
| Framework | Next.js | 16.2.7 | App Router, React Server Components |
| Language | TypeScript | 5.x | Strict mode enabled |
| UI Library | React | 19.2.4 | |
| Styling | Tailwind CSS | 4.x | Uses `@import "tailwindcss"` (v4 syntax) |
| UI Components | shadcn/ui | — | Config in `components.json`, style: `radix-nova` |
| Icons | Lucide React | 1.17.0 | |
| Database ORM | Prisma | 7.8.0 | Custom output to `lib/generated/prisma` |
| Database | PostgreSQL | — | Via `pg` driver with connection pooling |
| Rich Text | TipTap | 3.26.0 | `@tiptap/react`, `@tiptap/starter-kit` |
| PDF Generation | @react-pdf/renderer | 4.5.1 | React-based PDF generation |
| AI SDK | ai + @ai-sdk/openai | 6.x / 3.x | Uses `gpt-4o-mini` for generation |
| Validation | Zod | 4.4.3 | Runtime validation on API routes |
| Notifications | sonner | 2.0.7 | Toast notifications |
| Fonts (Thai) | @fontsource/sarabun, noto-sans-thai, prompt | 5.2.8 | Primary UI font is Sarabun |
| PDF Parsing | pdf-parse | 2.4.5 | For extracting text from uploaded PDFs |
| GitHub API | @octokit/rest | 22.0.1 | For repo/push integration |
| HTML Sanitization | sanitize-html | 2.17.4 | For cleaning rich text input |
| DOM Parsing | jsdom, @mozilla/readability | 29.x, 0.6.0 | For research content extraction |
| Browser Automation | playwright | 1.60.0 | Likely for scraping/research |

---

## Project Structure

```
lesson-plan-builder/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (Thai lang, Geist fonts, Toaster)
│   ├── globals.css             # Tailwind v4 CSS with CSS variables
│   ├── page.tsx                # Landing/root page
│   ├── (main)/                 # Route group (editor, preview)
│   │   ├── editor/[id]/page.tsx
│   │   └── preview/[id]/page.tsx
│   ├── dashboard/              # Dashboard routes with shared layout
│   │   ├── layout.tsx          # Sidebar + Topbar shell
│   │   ├── page.tsx            # Dashboard home (stats, recent plans)
│   │   ├── lesson-plans/       # List, new, edit, preview lesson plans
│   │   ├── projects/           # Project & PDF management
│   │   ├── upload/             # File upload page
│   │   ├── settings/           # App settings page
│   │   └── help/               # Help page
│   └── api/                    # API routes
│       ├── lesson-plans/       # CRUD for lesson plans
│       ├── ai-generate/        # AI content generation
│       ├── research/           # AI research jobs (start, status, sources, extract)
│       ├── upload-pdf/         # PDF upload handler
│       ├── extract-pdf/        # PDF text extraction
│       ├── export-pdf/         # PDF export API
│       ├── github/             # GitHub auth, repo, push, status
│       └── settings/           # App settings API
├── components/
│   ├── ui/                     # shadcn/ui primitive components
│   │   ├── button.tsx, card.tsx, dialog.tsx, input.tsx, etc.
│   ├── layout/                 # Sidebar, Topbar
│   ├── dashboard/              # Stats cards, recent projects, quick actions
│   ├── editor/                 # LessonPlanForm, TiptapEditor
│   ├── pdf/                    # LessonPlanPDF, PDFExportButton
│   ├── preview/                # A4Preview, a4-styles.css
│   ├── ai/                     # AIHelperButton
│   ├── research/               # ResearchPanel, SourceCard, SourceList
│   └── github/                 # GitHubConnect, GitHubPushDialog
├── lib/
│   ├── generated/prisma/       # Auto-generated Prisma client
│   ├── prisma.ts               # Prisma client singleton with pg adapter
│   ├── utils.ts                # `cn()` helper (clsx + tailwind-merge)
│   ├── crypto.ts               # Token encryption/decryption
│   ├── rate-limit.ts           # Simple in-memory rate limiting
│   ├── sanitize-html.ts        # HTML sanitization helpers
│   ├── github/                 # GitHub client utilities
│   ├── research/               # Research logic (search, chunk, score, citations)
│   └── services/               # pdf-extraction service
├── prisma/
│   └── schema.prisma           # Database schema
├── public/
│   └── uploads/                # Uploaded PDF storage (created at runtime)
├── next.config.ts              # Next.js config with security headers
├── tsconfig.json               # TypeScript config with path alias `@/*`
├── components.json             # shadcn/ui configuration
├── eslint.config.mjs           # ESLint config (flat config, Next.js presets)
└── postcss.config.mjs          # PostCSS config for Tailwind v4
```

---

## Build & Development Commands

Run all commands from the `lesson-plan-builder/` directory:

```bash
# Development server (starts on http://localhost:3000)
npm run dev

# Production build
npm run build

# Production server (after build)
npm run start

# Linting
npm run lint

# There is NO explicit test, format, or type-check script defined in package.json.
# TypeScript checking is handled during the build process.
```

### Database Commands

```bash
# Generate Prisma client (output goes to lib/generated/prisma)
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio
```

---

## Environment Variables

The application requires a `.env` file in `lesson-plan-builder/`. Key variables include:

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `OPENAI_API_KEY` | Yes (for AI features) | OpenAI API key for content generation |
| `NEXT_PUBLIC_APP_URL` | No | Public app URL |

**Important**: The `.env` file contains secrets. Never commit it. It is already in `.gitignore`.

---

## Database Schema (Prisma)

The application uses PostgreSQL with the following key models:

- **`LessonPlan`** — Core entity storing lesson plan data with both HTML (`@db.Text`) and JSON fields for TipTap content. Fields: `teacherName`, `schoolName`, `subjectName`, `gradeLevel`, `semester`, `academicYear`, `lessonTitle`, `objectives`, `keyConcepts`, `learningActivities`, `mediaResources`, `assessment`, `notes` (each with paired `*Json` field).
- **`Project`** — Container for lesson plans and uploaded PDFs.
- **`PdfSource`** — Uploaded PDF metadata, linked to a Project.
- **`ResearchJob`** / **`ResearchQuery`** / **`ResearchSource`** / **`SourceChunk`** — AI research pipeline tracking.
- **`User`** — Simple user model for lesson plan ownership.
- **`AppSetting`** — Application settings singleton (id: `"default"`).
- **`GitHubIntegration`** / **`GitHubRepo`** — GitHub connection and repository tracking.

Status values for LessonPlan are stored as strings: `"draft"`, `"published"`, `"archived"`, `"completed"`. The schema also has a Prisma enum `LessonPlanStatus` (`DRAFT`, `FINAL`, `ARCHIVED`) for the `aiStatus` field.

The Prisma client is generated to `lib/generated/prisma/` using the `prisma-client` generator. Do NOT import from `@prisma/client` directly; import from `@/lib/generated/prisma/client`.

---

## Key Architecture Patterns

### Server Components by Default

Dashboard pages (`app/dashboard/*`) are Server Components that fetch data directly via Prisma. They do NOT use a separate API layer for data fetching. The `LessonPlanForm` and editor components are marked `"use client"` for interactivity.

### Route Conventions

- `app/dashboard/lesson-plans/` — List and create
- `app/dashboard/lesson-plans/[id]/edit/` — Edit (uses client-side editor)
- `app/dashboard/lesson-plans/[id]/preview/` — Preview
- `app/(main)/editor/[id]/page.tsx` — Alternative editor route
- `app/(main)/preview/[id]/page.tsx` — Alternative preview route

### API Route Patterns

All API routes use:
1. `rateLimit()` from `@/lib/rate-limit` for request throttling
2. Zod schemas for input validation
3. `sanitizeRichText()` from `@/lib/sanitize-html` for HTML content
4. Standard `{ success: boolean, data?: T, error?: string }` response shapes
5. Thai-language error messages for user-facing errors

### Rich Text Handling

The app stores content in **two formats simultaneously**:
- HTML string (for rendering/export)
- TipTap JSON (`JSONContent`) in `*Json` fields (for editor state)

When saving, both formats are sent to the API. When AI generates content, it produces HTML that gets sanitized before storage.

### AI Content Generation Flow

1. User clicks "ให้ AI ช่วยร่างแผนการสอน" in the editor
2. `AIHelperButton` collects subject, grade, lesson title, duration, context
3. POST to `/api/ai-generate` with optional `researchJobId`
4. Backend uses `ai` SDK's `generateObject()` with `openai("gpt-4o-mini")` and structured Zod schema
5. Arrays of content are converted to HTML `<ul>`/`<li>` or structured HTML for activities
6. Response is sanitized and returned; `LessonPlanForm` updates its state

### AI Research Flow

1. User enters a topic in the Research tab
2. POST to `/api/research/start` creates a `ResearchJob` with generated search queries
3. Research executes asynchronously (fire-and-forget in the API route)
4. Frontend polls `/api/research/status` for progress
5. Sources are scored by credibility and relevance, stored in `ResearchSource`
6. Full text is chunked into `SourceChunk` records
7. When generating AI content, `researchJobId` can be passed to inject source context into the prompt

### PDF Export

- **Generation**: Uses `@react-pdf/renderer` with Thai-styled components in `components/pdf/LessonPlanPDF.tsx`
- **Preview**: `A4Preview` component shows a print-media styled preview before export
- **API**: `/api/export-pdf` handles server-side export

### PDF Upload & Extraction

- Uploads go to `POST /api/upload-pdf`
- Files are saved to `public/uploads/` with UUID filenames
- PDF magic bytes (`%PDF-`) are validated before saving
- `PdfSource` records track metadata in the database
- Extraction API (`/api/extract-pdf`) can parse text from uploaded PDFs

### GitHub Integration

- Users provide a GitHub personal access token
- Token is encrypted via `lib/crypto.ts` before storage
- Supports connecting repos, pushing lesson plan content, and checking sync status

---

## Code Style Guidelines

### Language & Comments

- **UI text is in Thai**. All user-facing strings, labels, placeholders, and error messages must be in Thai.
- **Code comments can be in Thai or English**. Mixed usage is common in this codebase.
- API error responses are in Thai for client display.

### TypeScript Conventions

- Strict mode is enabled in `tsconfig.json`
- Path alias `@/*` maps to the project root
- Use explicit return types on API route handlers when possible
- Prefer `interface` over `type` for object shapes

### Component Patterns

- Server Components are the default. Mark with `"use client"` only when using:
  - `useState`, `useEffect`, `useCallback`
  - Browser APIs (`window`, `document`, `localStorage`)
  - Event handlers (`onClick`, `onChange`)
  - `usePathname`, `useRouter`
- Dynamic imports with `ssr: false` for heavy client-only components (e.g., `TiptapEditor`)
- Use `cn()` from `@/lib/utils` for conditional Tailwind class merging

### Styling Conventions

- Tailwind CSS v4 with CSS-based configuration (no `tailwind.config.js`)
- Theme variables defined in `app/globals.css` using `oklch()` colors
- Font stack prioritizes Thai fonts: `Sarabun`, `Noto Sans Thai`, `Prompt`
- shadcn/ui components use `radix-nova` style with `neutral` base color

### File Naming

- Components: PascalCase (`LessonPlanForm.tsx`)
- Utilities/hooks: camelCase (`rate-limit.ts`)
- API routes: `route.ts` inside their route folder
- Pages in App Router: `page.tsx`
- Layouts: `layout.tsx`

---

## Security Considerations

### Implemented Measures

1. **Security Headers** in `next.config.ts`:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy` restricting camera, microphone, geolocation

2. **Rate Limiting**: All mutation APIs use in-memory rate limiting via `lib/rate-limit.ts`
   - AI generation: 5 requests/minute
   - Lesson plan writes: 30 requests/minute
   - File uploads: 10 requests/minute
   - GitHub auth: 10 requests/minute

3. **HTML Sanitization**: All rich text fields are passed through `sanitizeRichText()` before database storage.

4. **File Upload Validation**:
   - MIME type whitelist: `application/pdf`, `application/x-pdf`
   - Magic bytes check (`%PDF-`)
   - Max file size: 50MB
   - Files stored with UUID names, original extension forced to `.pdf`

5. **Token Encryption**: GitHub tokens are encrypted at rest using `lib/crypto.ts`.

6. **Zod Validation**: All API routes validate request bodies with Zod schemas.

### Data Privacy

- The app is designed for single-teacher use with a local PostgreSQL instance
- No third-party analytics or tracking
- AI research sources are stored locally in the database

---

## Development Workflow

1. **Start the dev server**: `cd lesson-plan-builder && npm run dev`
2. **Ensure PostgreSQL is running** and `DATABASE_URL` is set
3. **Run Prisma generate** if schema changed: `npx prisma generate`
4. **Make changes** following the patterns above
5. **Run lint**: `npm run lint`
6. **Build to verify**: `npm run build` (catches TypeScript errors)

### Adding New API Routes

1. Create folder under `app/api/<route-name>/`
2. Add `route.ts` with exported HTTP method handlers (`GET`, `POST`, etc.)
3. Add Zod validation schema
4. Add `rateLimit()` check
5. Use `sanitizeRichText()` for any HTML content
6. Return `{ success, data }` or `{ error }` shaped responses
7. Log errors with `console.error()` for server-side debugging

### Adding New Database Models

1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <descriptive_name>`
3. Run `npx prisma generate`
4. Import the generated model types from `@/lib/generated/prisma/client`

### Adding shadcn/ui Components

```bash
npx shadcn add <component-name>
```

Components are installed to `components/ui/`. The project uses the `radix-nova` style.

---

## Testing Strategy

**Current state**: There are no explicit test scripts in `package.json` and no test files in the repository. The project relies on:

- TypeScript strict mode for compile-time correctness
- ESLint for code quality
- Build-time validation (`npm run build`) to catch type errors
- Zod runtime validation on API boundaries

If adding tests in the future, the project has `playwright` installed for E2E testing.

---

## Known Quirks & Important Notes

1. **Next.js 16 Breaking Changes**: The `lesson-plan-builder/AGENTS.md` explicitly warns that this is "NOT the Next.js you know" and APIs may differ from training data. Always check the actual Next.js docs in `node_modules/next/dist/docs/` if unsure.

2. **Dual Status Fields**: `LessonPlan` has both a `status` string field (values: `"draft"`, `"published"`, `"archived"`, `"completed"`) and an `aiStatus` enum field (`DRAFT`, `FINAL`, `ARCHIVED`). The `status` string is the primary one used in the UI and API.

3. **AppSetting Singleton**: App settings use a singleton pattern with `id: "default"`. Most settings queries use `upsert` with this fixed ID.

4. **Prisma Output Path**: The Prisma client is generated to `lib/generated/prisma/`, NOT `node_modules/.prisma/client`. Always import from `@/lib/generated/prisma/client`.

5. **Research is Async**: The `/api/research/start` endpoint creates the job and returns immediately. The actual search runs in a background loop within the same request handler (fire-and-forget). There is no separate worker queue.

6. **PDF Storage**: Uploaded PDFs are stored in `public/uploads/` which is served statically by Next.js. This means uploaded files are publicly accessible by URL.

7. **Thai Font Support**: The PDF component (`LessonPlanPDF`) currently uses `Helvetica` font which has limited Thai glyph support. PDF generation for Thai text may require font embedding improvements.

8. **Client-side Navigation**: The editor and preview pages exist under both `app/(main)/` and `app/dashboard/lesson-plans/[id]/`. The sidebar links point to `/editor/:id` and `/preview/:id`, while the lesson plan list cards link to the dashboard sub-routes.

---

## External Documentation References

- **Architecture**: See `ARCHITECTURE.md` in the project root (high-level design docs)
- **Data Schema**: See `SCHEMA.md` in the project root (detailed type definitions and Zod schemas)
- **Human README**: See `README.md` in the project root
