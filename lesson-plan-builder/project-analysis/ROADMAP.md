# Roadmap

## Short Term Improvements
- Add authentication for all dashboard and API routes.
- Add authorization checks for project, lesson plan, settings, and GitHub operations.
- Move API keys out of shared/local contexts and rotate exposed credentials if needed.
- Finish OCR hardening and add clear extraction metadata.
- Add pagination to project and lesson-plan lists.
- Add missing indexes for frequently queried foreign keys.
- Add rate limiting to research and generate-lesson endpoints.
- Add SSRF protection for URL extraction.
- Improve error responses with stable error codes.
- Add tests for PDF upload, extraction, lesson CRUD, and AI schema validation.

## Medium Term Improvements
- Move uploads and exports from public filesystem to private object storage.
- Add signed download routes for uploaded and exported files.
- Move OCR, PDF export, and research scraping into background jobs.
- Consolidate duplicate research pipelines into one architecture.
- Replace mock research provider with production search provider configuration.
- Build user/team model around the existing `User` table.
- Add audit logs for delete, export, GitHub, and AI generation actions.
- Add cache layer for dashboard stats and settings.
- Improve GitHub push safety by restricting files and checking status before push.

## Long Term Improvements
- Multi-tenant workspace model for schools, teachers, and departments.
- Role-based access control for teacher, staff, admin, and system roles.
- Durable workflow engine for AI research and document processing.
- Full RAG pipeline with pgvector or external vector database.
- Real external notification delivery for email or messaging.
- Production observability with metrics, tracing, structured logs, and alerting.
- CI/CD pipeline with automated lint, typecheck, tests, migrations, and deployment checks.
- Cloud storage and CDN architecture for generated assets.
- Internationalization beyond Thai if needed.
- Marketplace/payment integration if the product becomes SaaS.
