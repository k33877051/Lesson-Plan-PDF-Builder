# Bug Report

## Possible Bugs
- KIMI Coding API endpoint responds that `kimi-for-coding` is available only for coding agents; lesson-plan generation through that provider may fail unless a compatible KIMI model/API is used.
- OCR extraction can be slow and may fail if Thai/English trained data is unavailable or if serverless runtime cannot load native canvas dependencies.
- Some API routes return generic error messages, hiding root causes from the UI.
- `PROCESSING` extraction status can remain stuck if the server crashes during PDF extraction.
- Research start route uses fire-and-forget background execution; server restart may leave jobs in `RUNNING`.
- Research source URL uniqueness is global; the same source discovered by multiple jobs may attach to only one latest relationship depending on upsert behavior.
- AI provider selection is environment-based, so changing `.env` requires server restart.
- GitHub push may fail when repository state is dirty, remote already exists, or credentials are invalid.

## Dead Code / Unused Areas
- `User` model exists but is not wired into authentication or lesson-plan ownership.
- `/dashboard/lesson-builder` exists but is not linked from the primary sidebar.
- Legacy/basic `src/data/sample-lesson-plans.ts` may be unused after AI samples were added.
- Some research providers are scaffolded but not fully implemented.
- Settings notification preferences exist but no notification delivery service uses them.

## Duplicate Logic
- Research scoring appears in more than one module.
- Lesson plan form logic appears in several places: new page, editor form, and lesson-builder components.
- File-size formatting helpers appear in multiple dashboard pages.
- PDF path resolution exists in multiple places and should be centralized.
- AI lesson content schemas exist in both `/api/ai-generate` and `/api/generate-lesson`.

## Missing Error Handling
- Several APIs return generic `500` responses without actionable details.
- Upload writes file then creates DB records; rollback exists but there is no DB/filesystem transaction.
- Research extraction needs better network timeout, redirect, SSRF, and content-size handling.
- GitHub operations need clearer UI feedback for permission failures and remote conflicts.

## Data Quality Issues
- Older PDF extraction could store binary-looking garbage text as `COMPLETED`.
- There is no dedicated extraction metadata column for method, processed pages, or quality score.
- Lesson plan status uses both string `status` and enum `aiStatus`, which can drift.

## Recommended Fix Priority
1. Add authentication/authorization.
2. Finish and harden OCR/PDF extraction including stuck `PROCESSING` recovery.
3. Replace generic API errors with structured error codes.
4. Consolidate AI schemas and research pipelines.
5. Add pagination and indexes.
6. Move long-running tasks to a queue.
