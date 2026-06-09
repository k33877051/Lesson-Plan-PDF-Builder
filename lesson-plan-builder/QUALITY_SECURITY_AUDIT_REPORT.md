# Quality And Security Audit Report

วันที่ตรวจสอบ: 2026-06-09

## สรุปผล

ระบบได้รับการปรับให้หน้าหลักที่ผู้ใช้เข้าถึงไม่ใช้ mock data หรือ simulated data สำหรับข้อมูลธุรกิจแล้ว โดยย้าย flow สำคัญให้ใช้ PostgreSQL/Prisma และ API จริง พร้อมเพิ่ม hardening เบื้องต้นด้าน XSS, upload validation, rate limiting, health check และ production build readiness

## Data Source Inventory

| Route | สถานะหลังตรวจ | แหล่งข้อมูล |
| --- | --- | --- |
| `/dashboard` | ใช้ข้อมูลจริง | Prisma `LessonPlan` และไฟล์ export จริง |
| `/dashboard/lesson-plans` | ใช้ข้อมูลจริง | Prisma `LessonPlan` |
| `/dashboard/lesson-plans/new` | ใช้ข้อมูลจริง | `POST /api/lesson-plans` |
| `/dashboard/lesson-plans/[id]/edit` | redirect ไป flow จริง | `/editor/[id]` |
| `/dashboard/lesson-plans/[id]/preview` | redirect ไป flow จริง | `/preview/[id]` |
| `/dashboard/projects` | ใช้ข้อมูลจริง | Prisma `Project` และ `PdfSource` |
| `/dashboard/projects/new` | ใช้ข้อมูลจริง | `POST /api/upload-pdf` |
| `/dashboard/projects/[id]` | ใช้ข้อมูลจริง | Prisma `Project` และ `PdfSource` |
| `/dashboard/projects/[id]/edit` | redirect ไปข้อมูลจริง | `/dashboard/projects/[id]` |
| `/dashboard/settings` | ใช้ข้อมูลจริง | `GET/PUT /api/settings` และ Prisma `AppSetting` |
| `/dashboard/upload` | redirect ไป flow จริง | `/dashboard/projects/new` |
| `/dashboard/help` | static help content | คู่มือใช้งาน ไม่ใช่ข้อมูลธุรกิจ |
| `/editor/[id]` | ใช้ข้อมูลจริง | `GET/POST/PUT /api/lesson-plans` |
| `/preview/[id]` | ใช้ข้อมูลจริง | `GET /api/lesson-plans/[id]` |

## การเปลี่ยนแปลงที่ดำเนินการ

### Data Integrity

- ลบ mock fallback ใน `/dashboard/projects`
- แปลง dashboard stats และ recent lesson plans ให้ query จาก Prisma จริง
- แปลง `/dashboard/lesson-plans` ให้ query จาก Prisma จริง
- แปลง `/dashboard/lesson-plans/new` ให้สร้าง record จริงผ่าน API แล้ว redirect ไป `/editor/[id]`
- ปิด dashboard edit/preview mock flow ด้วย redirect ไป `/editor/[id]` และ `/preview/[id]`
- เปลี่ยน `/dashboard/upload` ให้ redirect ไป upload PDF flow จริง
- เพิ่ม `AppSetting` model และ `/api/settings` เพื่อให้ settings load/save จากฐานข้อมูลจริง

### Security And Privacy

- เพิ่ม `sanitize-html` และ sanitize rich text ก่อนบันทึก/แสดงผล
- Escape output จาก AI helper ก่อนแปลงเป็น HTML
- เพิ่ม Zod validation และ max length ใน lesson plan/settings/AI APIs
- เพิ่ม rate limit ให้ endpoint สำคัญ: lesson plans, upload PDF, extract PDF, AI generate, export PDF
- ตรวจ magic bytes `%PDF-` ใน upload และบังคับ filename เป็น `.pdf`
- จำกัด `GET /api/upload-pdf` และ `GET /api/lesson-plans` ไม่คืนข้อมูลเกินจำเป็น
- ลดการส่ง full extracted PDF text ไปยัง project detail โดยส่ง preview เท่านั้น
- ปิด `GET /api/export-pdf` ไม่ให้ trigger งาน export หนัก
- เพิ่ม security headers พื้นฐานใน `next.config.ts`
- เพิ่ม `.gitignore` สำหรับ runtime files ใน `public/uploads` และ `public/exports`

### Runtime Stability

- เพิ่ม `/api/health` ตรวจ database และ storage directories
- แก้ `pdf-parse` ให้ lazy import ระหว่าง extraction จริง เพื่อไม่ทำให้ production build ล้ม
- แก้ client component ไม่ให้ import Prisma generated enum เข้า client bundle
- เพิ่ม `runtime = "nodejs"` และ `maxDuration` ให้ PDF export route

## ปัญหาที่อาจเกิดขึ้นในอนาคต

### Critical

- ยังไม่มี authentication/authorization และ owner scoping ดังนั้น production จริงยังต้องเพิ่มระบบผู้ใช้ก่อนเปิดให้ใช้งานหลายคน
- ไฟล์ upload/export ยังอยู่ใต้ `public/` แม้ถูก ignore จาก git แล้ว แต่ยังเป็น public URL ใน runtime ควรย้ายไป private storage หรือ signed download route

### High

- Playwright export ยังต้องมี Chromium binary ใน runtime environment หาก deploy serverless ต้องเตรียม strategy เฉพาะ
- In-memory rate limit เหมาะกับ dev/single instance เท่านั้น หาก deploy multi-instance ต้องย้ายไป Redis หรือ managed rate limiter
- AI generation ส่งข้อมูลไป OpenAI ต้องมี privacy notice และ consent ก่อนใช้งานจริง

### Medium

- ยังไม่มี audit log สำหรับ create/update/delete
- ยังไม่มี quota ต่อผู้ใช้/โปรเจกต์ สำหรับ upload/export/extract
- ยังไม่มี cleanup policy สำหรับ uploaded PDFs ระยะยาว
- Project edit/delete ยังไม่ได้ implement เป็น flow จริง จึง redirect/แสดงเมนูบางส่วนแบบจำกัด

## Verification

- `npx tsc --noEmit` ผ่าน
- `npm run lint` ผ่าน
- `npm run build` ผ่าน
- Search keyword `mock`, `Simulate`, `Math.random`, `hardcoded`, `ข้อมูลตัวอย่าง` ไม่พบใน workspace หลักหลังแก้ไข

## Acceptance Criteria

- ทุกหน้าที่แสดงข้อมูลธุรกิจต้องใช้ Prisma/API จริง หรือแสดง empty/error state จริง
- ไม่มี mock data fallback ใน production-visible pages
- API ที่รับ HTML ต้อง sanitize ก่อนบันทึกหรือก่อน render
- Upload PDF ต้องตรวจ MIME, size และ magic bytes
- PDF export ต้องใช้ POST เท่านั้น
- Production build ต้องผ่านก่อน deploy

