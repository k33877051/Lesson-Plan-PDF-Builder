# Lesson Plan PDF Builder

A modern, full-stack web application for teachers to create, edit, preview, and export professional lesson plans as PDF documents.

## Overview

Lesson Plan PDF Builder empowers educators with an intuitive interface to craft structured lesson plans with rich content, reusable templates, and professional PDF export capabilities. The application supports importing from various formats (Word, Excel, PowerPoint) and provides a live preview of the final PDF output.

## Core Features

- **Dashboard**: Centralized view of all lesson plans with statistics, search, filtering, and recent activity tracking
- **Upload & Import**: Support for importing lesson plans from Word (.docx), Excel (.xlsx), PowerPoint (.pptx), and JSON templates
- **Rich Text Editor**: Comprehensive editor with sections for objectives, materials, activities, assessment, and reflection
- **Live Preview**: Real-time WYSIWYG preview of the lesson plan before export
- **Professional PDF Export**: High-quality PDF generation with customizable formatting and styling

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | Next.js 14 (App Router) | React framework with SSR/SSG |
| **Language** | TypeScript 5.x | Type-safe development |
| **Styling** | Tailwind CSS 3.x | Utility-first CSS framework |
| **UI Components** | shadcn/ui | Accessible, composable components |
| **PDF Generation** | @react-pdf/renderer | React-based PDF generation |
| **State Management** | Zustand | Lightweight state management |
| **Form Handling** | React Hook Form + Zod | Type-safe forms with validation |
| **Rich Text** | TipTap Editor | Headless rich text editor |
| **File Handling** | Mammoth.js / XLSX / PptxGenJS | Document parsing libraries |
| **Icons** | Lucide React | Consistent iconography |
| **Date/Time** | date-fns | Date formatting and manipulation |

## Why This Stack?

### Next.js + TypeScript
- App Router provides server components for initial data fetching
- Type safety throughout the application reduces runtime errors
- Built-in optimization and deployment readiness

### Tailwind CSS + shadcn/ui
- Rapid UI development with utility classes
- Consistent design system through shadcn component library
- Dark mode support out of the box
- Tree-shakeable - only used styles are included

### @react-pdf/renderer (PDF Generation)
- Native React components for PDF generation
- Server-side PDF generation capability
- Better styling control than html2canvas-based solutions
- TypeScript support

### Zustand (State Management)
- Simpler API than Redux, less boilerplate
- Excellent TypeScript support
- Small bundle size (~1KB)
- No provider wrapper needed

### TipTap Editor
- Headless - complete control over UI
- Extensible plugin system
- Collaborative editing ready (via extensions)
- Good accessibility support

## Project Structure

```
lesson-plan-pdf-builder/
├── app/                    # Next.js App Router pages
├── components/             # Reusable UI components
├── lib/                    # Utilities, hooks, and services
├── types/                  # TypeScript type definitions
├── hooks/                  # Custom React hooks
├── stores/                 # Zustand state stores
├── services/               # API and external service integrations
└── public/                 # Static assets
```

For complete structure, see [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md)

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later (or pnpm/yarn)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd lesson-plan-pdf-builder

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
npm run dev

# Open http://localhost:3000
```

### Environment Variables

```env
# Application
NEXT_PUBLIC_APP_NAME="Lesson Plan PDF Builder"
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database (if using external storage)
# DATABASE_URL=

# File Upload (if using cloud storage)
# UPLOAD_MAX_SIZE=10485760

# Optional: Analytics
# NEXT_PUBLIC_ANALYTICS_ID=
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors automatically |
| `npm run type-check` | Run TypeScript compiler check |
| `npm run test` | Run Jest tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run format` | Format code with Prettier |

## Development Workflow

1. **Start the dev server**: `npm run dev`
2. **Create a feature branch**: `git checkout -b feature/your-feature`
3. **Make changes** following the [ARCHITECTURE.md](./ARCHITECTURE.md) guidelines
4. **Run checks**: `npm run lint && npm run type-check`
5. **Commit changes** following conventional commits
6. **Push and create PR**

## Architecture & Design

- **Architecture**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Data Models**: See [SCHEMA.md](./SCHEMA.md)
- **Routing**: See [ROUTES.md](./ROUTES.md)
- **Folder Structure**: See [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Targets

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Lighthouse Score: 90+ (Performance, Accessibility, Best Practices, SEO)

## Contributing

1. Read the architecture documentation
2. Follow the component patterns defined in [ARCHITECTURE.md](./ARCHITECTURE.md)
3. Ensure all new code includes TypeScript types
4. Add tests for new features
5. Update documentation as needed

## License

MIT License - See [LICENSE](./LICENSE) for details

## Support

For issues, feature requests, or questions, please open an issue on the repository.
