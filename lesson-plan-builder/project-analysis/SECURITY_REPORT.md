# Security Report

## Executive Summary
The application has several good local-development safeguards, but it does not yet have a production security model. The largest risks are missing authentication/authorization, secrets exposure in local environment files, public storage of uploaded/exported files, broad GitHub push behavior, and incomplete coverage of rate limits.

## Authentication
- No login, session, OAuth, JWT, or API-key authentication protects the app.
- No `middleware.ts` is present.
- All dashboard pages and API routes are effectively public if the app is reachable.

## Authorization
- No role or ownership checks exist.
- Any caller can create, update, delete, export, upload, extract, and configure integrations if they can reach the endpoints.
- `User` model exists but is not wired into request context or permissions.

## SQL Injection Risks
- Prisma is used for database operations, reducing classic SQL injection exposure.
- Raw SQL is not part of normal application code.
- Main risk is not SQL injection but unrestricted access to Prisma-backed API routes.

## XSS Risks
- `sanitizeRichText()` is used in key lesson-plan create/update flows.
- `escapeHtml()` is used in AI-generated formatting.
- Preview and sample-rendering areas should be reviewed to ensure every user-provided HTML path is sanitized before rendering.
- Any rich-text HTML stored in the database must be treated as untrusted.

## CSRF Risks
- No CSRF tokens are implemented.
- Since no cookie-based authentication exists, CSRF is currently less important than missing auth.
- If session auth is added later, all state-changing endpoints must add CSRF or same-site protections.

## Rate Limiting
Implemented in memory for some endpoints:
- `/api/upload-pdf`
- `/api/extract-pdf`
- `/api/export-pdf`
- `/api/ai-generate`
- `/api/lesson-plans`
- `/api/github/*`
- `/api/projects/[id]`

Gaps:
- Some research and generation routes do not consistently use rate limiting.
- In-memory rate limiting does not work reliably across multiple instances.
- Client IP is derived from forwarded headers and should be trusted only behind a controlled proxy.

## Secrets Exposure
The `.env` file contains real credentials locally. This report intentionally does not reproduce secret values. Risks:
- If `.env` was ever committed or pushed, keys must be rotated.
- GitHub push workflows must ensure `.env` remains ignored.
- Environment variable names used by the app include `DATABASE_URL`, `OPENAI_API_KEY`, `KIMI_API_KEY`, `KIMI_BASE_URL`, `KIMI_MODEL`, `OPENAI_MODEL`, `AI_PROVIDER`, and `GITHUB_TOKEN_ENCRYPTION_KEY`.

## File Upload Risks
Strengths:
- Upload endpoint checks size, MIME type, and `%PDF-` magic bytes.
- Filenames are generated with timestamp and UUID.
- Read path resolution uses `basename` in the PDF extraction service.

Risks:
- Uploaded PDFs are stored in `public/uploads`, so paths are publicly reachable.
- Exported files are stored in `public/exports`, also publicly reachable.
- Malware scanning is not implemented.
- OCR/PDF parsing may be CPU and memory intensive.

## SSRF Risks
Research extraction fetches URLs from research sources. It should block:
- localhost and private IP ranges.
- cloud metadata endpoints.
- non-HTTP protocols.
- redirects to private addresses.

## GitHub Integration Risks
- User submits a personal access token to the app.
- Token is encrypted at rest, but missing app auth means any reachable user can configure it.
- Push operation can include the whole repository working tree, relying on `.gitignore` for secret exclusion.
- Remote URL may include token for push operations.

## Storage Security
- PostgreSQL stores sensitive GitHub token ciphertext.
- Local public filesystem stores uploaded and exported documents.
- Recommended production design: private object storage plus signed download routes.

## Security Recommendations
1. Add authentication and route protection.
2. Add authorization/ownership checks for projects, lesson plans, settings, and GitHub operations.
3. Move uploads/exports out of `public`.
4. Rotate any keys that may have been shared or committed.
5. Add SSRF guards to research extraction.
6. Replace in-memory rate limiting with Redis or another shared store for production.
7. Add CSP headers and review all rich HTML rendering paths.
8. Restrict GitHub push scope and explicitly exclude secrets.
