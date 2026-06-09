# Performance Report

## Overview
The project is suitable for local or single-instance operation, but several flows will need optimization before production scale: unpaginated list queries, heavy PDF/OCR work, Playwright export, research scraping, and lack of caching.

## N+1 Queries
- Dashboard and list pages mostly use Prisma includes or aggregate queries, so classic N+1 read patterns are limited.
- Research chunk creation writes one chunk at a time in loops; this should use batch writes where possible.
- Linking research sources to lesson plans loops through `LessonPlanSource.create`; for large source lists, use `createMany` or transaction batching.

## Missing Indexes
Existing indexes cover many common fields, but gaps remain:
- `PdfSource.projectId` is used frequently and should have an index.
- `PdfSource.extractionStatus` may be useful for maintenance jobs or status dashboards.
- `ResearchSource.researchJobId` is queried and should be indexed.
- `ResearchSource.createdAt` may need indexing if source history grows.
- `GitHubRepo.fullName` may need uniqueness if duplicate repo records are a risk.

## Large Queries
- `/dashboard/projects` loads all projects with all PDF sources.
- `/dashboard/lesson-plans` loads all lesson plans without pagination.
- `/api/lesson-plans` list endpoint has no pagination.
- Dashboard stats read multiple counts and recent records on every request.

Recommendations:
- Add `take`, `skip`, and search filters.
- Add pagination UI.
- Use counts and selective fields rather than full includes where possible.

## Memory Usage
High-memory operations:
- PDF parsing reads the whole PDF buffer.
- OCR renders PDF pages to canvas images.
- Playwright launches Chromium for export.
- Research extraction may fetch large HTML pages.

Recommendations:
- Keep file size limits.
- Limit OCR pages by default.
- Move OCR/export to background jobs for larger files.
- Stream or chunk file processing if requirements grow.

## Caching Opportunities
- Dashboard stats can be cached briefly.
- Settings singleton can be cached.
- Research source scoring and extracted source content can be cached.
- PDF export could reuse existing export if lesson plan has not changed.
- Static sample data is already local and effectively cached by bundling.

## API Hotspots
- `/api/export-pdf`: Chromium startup dominates.
- `/api/extract-pdf`: OCR and PDF rendering dominate.
- `/api/ai-generate` and `/api/generate-lesson`: external API latency and quota.
- `/api/research/extract`: network fetch + readability parsing + chunking.

## Frontend Performance
- Editor and preview pages can become heavy when rich text is large.
- Tiptap is dynamically loaded in some areas, which helps SSR.
- Dashboard pages could benefit from pagination and skeleton states.

## Production Scaling Recommendations
1. Move file storage to object storage.
2. Move OCR and export into a queue/worker.
3. Add database pagination and missing indexes.
4. Use Redis-backed rate limiting.
5. Add caching for dashboard stats and settings.
6. Add observability around OCR duration, export duration, AI latency, and DB query time.
