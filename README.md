# Lesson Plan PDF Builder

**Languages:** [English](./README.md) · [ภาษาไทย](./README.th.md)

A full-stack web application for educators to create, edit, preview, and export professional lesson plans as PDF documents. The UI supports **Thai and English** — switch languages from the top bar (TH / EN) or in **Settings → Appearance**.

## Overview

Lesson Plan PDF Builder helps teachers build structured lesson plans with rich text, AI-assisted drafting, PDF upload/extraction, web research with citations, and GitHub sync. Export polished PDFs ready for classroom use.

## Core Features

- **Dashboard** — Statistics, quick actions, and recent lesson plans
- **Lesson Plan Editor** — TipTap rich text with objectives, activities, assessment, and more
- **AI Builder** — Generate lesson content via OpenAI, Gemini, or Ollama
- **PDF Import & Export** — Upload PDFs, extract text, export with Playwright/Chromium
- **Research** — AI-powered source search with credibility scoring
- **GitHub Integration** — Push lesson plans to version-controlled repositories
- **Bilingual UI** — Thai / English interface with persistent language preference

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | Next.js 16 (App Router) | React Server Components |
| Language | TypeScript 5.x | Strict mode |
| Styling | Tailwind CSS 4.x | CSS-based config |
| UI | shadcn/ui (radix-nova) | Accessible components |
| Database | PostgreSQL + Prisma 7 | Custom client output |
| Rich Text | TipTap 3.x | Dual HTML + JSON storage |
| PDF | @react-pdf/renderer + Playwright | Server-side export |
| AI | Vercel AI SDK | OpenAI, Gemini, Ollama |
| i18n | Custom `lib/i18n` | Thai / English messages |

## Project Structure

```
Lesson-Plan-PDF-Builder/
├── lesson-plan-builder/     # Main Next.js application
│   ├── app/                 # App Router pages & API routes
│   ├── components/          # UI, editor, dashboard, i18n
│   ├── lib/                 # Prisma, AI, i18n, services
│   └── prisma/              # Database schema
├── AGENTS.md                # AI agent guide
├── ARCHITECTURE.md
└── SCHEMA.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- npm 9+

### Installation

```bash
git clone https://github.com/k33877051/Lesson-Plan-PDF-Builder.git
cd Lesson-Plan-PDF-Builder/lesson-plan-builder

npm install
cp .env.example .env   # configure DATABASE_URL, API keys

npx prisma generate
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Key Environment Variables

```env
DATABASE_URL=postgresql://...
OPENAI_API_KEY=...          # optional, for AI features
GEMINI_API_KEY=...          # optional
AI_PROVIDER=gemini          # openai | gemini | ollama
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run setup:playwright` | Install Chromium for PDF export |

## Language / Internationalization

- Toggle **TH / EN** in the dashboard top bar
- Or set **Settings → Appearance → Language**
- Preference is stored in `localStorage` (`lpb-language`) and synced with the database
- Translation files: `lesson-plan-builder/lib/i18n/messages/th.ts` and `en.ts`

## Documentation

- [AGENTS.md](./AGENTS.md) — Developer & AI agent reference
- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design
- [SCHEMA.md](./SCHEMA.md) — Data models

## License

MIT License

## Support

Open an issue on [GitHub](https://github.com/k33877051/Lesson-Plan-PDF-Builder/issues).
