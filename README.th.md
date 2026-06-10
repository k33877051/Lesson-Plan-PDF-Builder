# Lesson Plan PDF Builder

**ภาษา:** [English](./README.md) · [ภาษาไทย](./README.th.md)

แอปพลิเคชันเว็บสำหรับครูไทยในการสร้าง แก้ไข ดูตัวอย่าง และส่งออกแผนการสอนเป็น PDF รองรับ **ภาษาไทยและภาษาอังกฤษ** — สลับภาษาได้จากแถบด้านบน (TH / EN) หรือที่ **ตั้งค่า → รูปลักษณ์**

## ภาพรวม

Lesson Plan PDF Builder ช่วยครูจัดทำแผนการสอนแบบมีโครงสร้าง พร้อม Rich Text Editor, AI ช่วยร่าง, อัปโหลด/ดึงข้อความจาก PDF, ค้นคว้าจากเว็บพร้อมอ้างอิงแหล่งที่มา และซิงก์กับ GitHub ส่งออก PDF คุณภาพสูงพร้อมใช้ในห้องเรียน

## ฟีเจอร์หลัก

- **แดชบอร์ด** — สถิติ ทางลัด และแผนการสอนล่าสุด
- **ตัวแก้ไขแผนการสอน** — TipTap พร้อมวัตถุประสงค์ กิจกรรม การประเมิน ฯลฯ
- **สร้างด้วย AI** — ร่างเนื้อหาผ่าน OpenAI, Gemini หรือ Ollama
- **นำเข้า/ส่งออก PDF** — อัปโหลด PDF ดึงข้อความ ส่งออกด้วย Playwright/Chromium
- **ค้นคว้า (Research)** — ค้นหาแหล่งข้อมูลด้วย AI พร้อมคะแนนความน่าเชื่อถือ
- **GitHub** — Push แผนการสอนไปยัง repository
- **UI สองภาษา** — ไทย / อังกฤษ จำค่าภาษาที่เลือกไว้

## เทคโนโลยี

| ชั้น | เทคโนโลยี | หมายเหตุ |
|------|-----------|----------|
| Framework | Next.js 16 (App Router) | React Server Components |
| ภาษา | TypeScript 5.x | Strict mode |
| สไตล์ | Tailwind CSS 4.x | คอนฟิกแบบ CSS |
| UI | shadcn/ui (radix-nova) | คอมponent เข้าถึงได้ |
| ฐานข้อมูล | PostgreSQL + Prisma 7 | Client สร้างที่ `lib/generated/prisma` |
| Rich Text | TipTap 3.x | เก็บ HTML + JSON |
| PDF | @react-pdf/renderer + Playwright | ส่งออกฝั่งเซิร์ฟเวอร์ |
| AI | Vercel AI SDK | OpenAI, Gemini, Ollama |
| i18n | `lib/i18n` กำหนดเอง | ไฟล์ข้อความ th / en |

## โครงสร้างโปรเจกต์

```
Lesson-Plan-PDF-Builder/
├── lesson-plan-builder/     # แอป Next.js หลัก
│   ├── app/                 # หน้าและ API routes
│   ├── components/          # UI, editor, dashboard, i18n
│   ├── lib/                 # Prisma, AI, i18n, services
│   └── prisma/              # Database schema
├── AGENTS.md
├── ARCHITECTURE.md
└── SCHEMA.md
```

## เริ่มต้นใช้งาน

### สิ่งที่ต้องมี

- Node.js 18+
- PostgreSQL
- npm 9+

### ติดตั้ง

```bash
git clone https://github.com/k33877051/Lesson-Plan-PDF-Builder.git
cd Lesson-Plan-PDF-Builder/lesson-plan-builder

npm install
cp .env.example .env   # ตั้งค่า DATABASE_URL และ API keys

npx prisma generate
npx prisma migrate dev
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

### ตัวแปรสภาพแวดล้อมสำคัญ

```env
DATABASE_URL=postgresql://...
OPENAI_API_KEY=...          # ไม่บังคับ สำหรับฟีเจอร์ AI
GEMINI_API_KEY=...          # ไม่บังคับ
AI_PROVIDER=gemini          # openai | gemini | ollama
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## คำสั่งที่ใช้บ่อย

| คำสั่ง | คำอธิบาย |
|--------|----------|
| `npm run dev` | รันเซิร์ฟเวอร์พัฒนา |
| `npm run build` | Build โปรduction |
| `npm run start` | รันเซิร์ฟเวอร์ production |
| `npm run lint` | ตรวจ ESLint |
| `npm run setup:playwright` | ติดตั้ง Chromium สำหรับส่งออก PDF |

## การสลับภาษา (i18n)

- กด **TH / EN** ที่แถบด้านบนของแดชบอร์ด
- หรือไปที่ **ตั้งค่า → รูปลักษณ์ → ภาษา**
- ระบบเก็บค่าใน `localStorage` (`lpb-language`) และซิงก์กับฐานข้อมูล
- ไฟล์แปล: `lesson-plan-builder/lib/i18n/messages/th.ts` และ `en.ts`

## เอกสารเพิ่มเติม

- [AGENTS.md](./AGENTS.md) — คู่มือนักพัฒนาและ AI agent
- [ARCHITECTURE.md](./ARCHITECTURE.md) — สถาปัตยกรรมระบบ
- [SCHEMA.md](./SCHEMA.md) — โครงสร้างข้อมูล

## ใบอนุญาต

MIT License

## ติดต่อ / รายงานปัญหา

เปิด issue ที่ [GitHub](https://github.com/k33877051/Lesson-Plan-PDF-Builder/issues)
