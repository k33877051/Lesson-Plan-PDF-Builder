# Architecture Documentation

## Lesson Plan PDF Builder - Architecture Overview

This document describes the architectural decisions, data flow patterns, and component hierarchy for the Lesson Plan PDF Builder application.

---

## Table of Contents

1. [Architectural Principles](#architectural-principles)
2. [System Architecture](#system-architecture)
3. [Component Hierarchy](#component-hierarchy)
4. [Data Flow Patterns](#data-flow-patterns)
5. [State Management](#state-management)
6. [PDF Generation Strategy](#pdf-generation-strategy)
7. [File Import Architecture](#file-import-architecture)
8. [Accessibility (a11y) Strategy](#accessibility-a11y-strategy)

---

## Architectural Principles

### 1. Separation of Concerns
- **Presentation Layer**: React components responsible for UI rendering
- **Business Logic Layer**: Hooks and services containing application logic
- **Data Layer**: Stores and API services for data persistence

### 2. Component Composition
- Prefer composition over inheritance
- Small, focused components that compose into larger features
- Props drilling avoided through context/store patterns

### 3. Type Safety
- Strict TypeScript configuration
- All API boundaries have defined interfaces
- Runtime validation with Zod for external inputs

### 4. Progressive Enhancement
- Core functionality works without JavaScript (SSR)
- Enhanced interactivity loads progressively
- Graceful degradation for older browsers

### 5. Performance First
- Code splitting at route level
- Lazy loading for heavy components (PDF preview, rich editor)
- Optimistic updates for better UX

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Browser)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Dashboard  │  │    Editor    │  │   Preview    │       │
│  │    Page      │  │    Page      │  │    Page      │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                 │               │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐       │
│  │  Dashboard   │  │   Editor     │  │   PDF        │       │
│  │  Container   │  │   Container  │  │   Generator  │       │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘       │
│         │                 │                                 │
│  ┌──────▼───────────────▼───────┐                           │
│  │      LessonPlan Store       │  (Zustand)                │
│  └──────────────┬──────────────┘                           │
│                 │                                           │
│  ┌──────────────▼──────────────┐                           │
│  │    Services Layer           │                           │
│  │  - File Import Service      │                           │
│  │  - PDF Export Service       │                           │
│  │  - Storage Service          │                           │
│  └─────────────────────────────┘                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Next.js Server                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   API Routes │  │   Server     │  │   Static     │       │
│  │   (if used)  │  │   Components │  │   Assets     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Layers

#### Layer 1: Presentation (UI Components)
**Responsibility**: Render UI, handle user interactions

**Pattern**: Presentational/Container split
- **Presentational Components**: Pure UI, receive data via props
- **Container Components**: Connect to stores, handle business logic

**Example Pattern**:
```
components/
├── ui/              # Primitive, reusable components
├── forms/           # Form-specific components
├── lesson-plan/     # Domain-specific components
│   ├── LessonPlanCard.tsx      # Presentational
│   ├── LessonPlanEditor.tsx    # Presentational
│   └── LessonPlanContainer.tsx # Container (connects to store)
└── layout/          # Layout components
```

#### Layer 2: Business Logic (Hooks & Services)
**Responsibility**: Encapsulate application logic, data transformation

**Pattern**: Custom hooks for reusable logic
- **Feature Hooks**: `useLessonPlan`, `usePDFExport`, `useFileImport`
- **Utility Hooks**: `useLocalStorage`, `useDebounce`, `useMediaQuery`

**Pattern**: Services for external interactions
- **ImportService**: Handles file parsing (Word, Excel, PPT)
- **ExportService**: PDF generation and download
- **StorageService**: localStorage/indexedDB abstraction

#### Layer 3: State Management (Zustand Stores)
**Responsibility**: Application state management

**Store Structure**:
```
stores/
├── lessonPlanStore.ts    # Active lesson plan state
├── dashboardStore.ts     # Dashboard filters, search
├── uiStore.ts           # UI state (modals, toasts, theme)
└── settingsStore.ts     # User preferences
```

**Principles**:
- One store per domain
- Stores are flat (normalized data)
- Actions are methods on the store
- Derived state computed with selectors

---

## Component Hierarchy

### Page Components (Route Entry Points)

```
app/
├── page.tsx                    # Dashboard (root)
├── lesson/
│   ├── new/
│   │   └── page.tsx            # Create new lesson plan
│   └── [id]/
│       ├── page.tsx            # Edit lesson plan
│       └── preview/
│           └── page.tsx        # Preview & export
└── upload/
    └── page.tsx                # Import/upload page
```

### Component Tree Example

```
Dashboard Page (Server Component)
└── DashboardContainer (Client Component)
    ├── DashboardHeader
    │   ├── SearchBar
    │   ├── FilterDropdown
    │   └── CreateButton
    ├── StatsCards
    │   └── StatCard (×4)
    ├── RecentActivity
    │   └── ActivityItem (×n)
    └── LessonPlanGrid
        └── LessonPlanCard (×n)
            ├── CardHeader
            ├── CardContent
            └── CardActions
```

```
Editor Page (Server Component with data fetch)
└── EditorContainer (Client Component)
    ├── EditorHeader
    │   ├── Breadcrumb
    │   ├── TitleInput
    │   ├── SaveStatus
    │   └── ActionsDropdown
    ├── EditorSidebar
    │   ├── SectionNavigator
    │   └── MetadataPanel
    └── EditorContent
        └── LessonSectionEditor (×n)
            ├── SectionHeader
            ├── RichTextEditor
            └── SectionTools
```

### Component Classification

#### 1. Primitive Components (ui/)
Low-level, highly reusable, no business logic
- `Button`, `Input`, `Select`, `Dialog`, `Card`
- From shadcn/ui or custom-built
- Fully accessible with proper ARIA attributes

#### 2. Domain Components (lesson-plan/, upload/, etc.)
Business-specific, but still reusable within domain
- `LessonPlanCard`, `LessonSectionEditor`, `FileUploader`
- May connect to stores for their specific domain
- Encapsulate domain-specific logic

#### 3. Feature Components (composed on pages)
Page-specific compositions
- `DashboardLayout`, `EditorLayout`
- Connect multiple domains
- Handle page-level concerns

---

## Data Flow Patterns

### Pattern 1: Local-First with Persistence

```
User Action
    ↓
Local State Update (Optimistic)
    ↓
Background Persistence (localStorage/IndexedDB)
    ↓
UI Update Confirmation
```

**Use Case**: Lesson plan auto-save
**Implementation**: Zustand store with persistence middleware

### Pattern 2: Import Pipeline

```
File Upload
    ↓
File Validation (type, size)
    ↓
Format Detection (.docx, .xlsx, .pptx)
    ↓
Parser Selection
    ↓
Content Extraction
    ↓
Data Transformation (to LessonPlan schema)
    ↓
Validation against schema
    ↓
Store Update
    ↓
Editor Navigation
```

### Pattern 3: PDF Export Flow

```
Export Request
    ↓
Lesson Plan Data Retrieval
    ↓
PDF Template Selection
    ↓
React-PDF Component Rendering
    ↓
PDF Blob Generation (async)
    ↓
Download Trigger
    ↓
Success Feedback
```

### Pattern 4: Dashboard Data Flow

```
Page Load (Server Component)
    ↓
Hydration (Client Component takes over)
    ↓
Store Initialization (from localStorage)
    ↓
User Interactions (search, filter, sort)
    ↓
Derived State Computation
    ↓
Re-render with filtered results
```

---

## State Management

### Store Architecture

#### lessonPlanStore
```typescript
interface LessonPlanState {
  // Data
  lessonPlans: LessonPlan[];
  activeLessonPlan: LessonPlan | null;
  
  // UI State
  isLoading: boolean;
  saveStatus: 'saved' | 'saving' | 'error';
  
  // Actions
  createLessonPlan: (template?: Template) => LessonPlan;
  updateLessonPlan: (id: string, updates: Partial<LessonPlan>) => void;
  deleteLessonPlan: (id: string) => void;
  setActiveLessonPlan: (id: string | null) => void;
  
  // Selectors
  getLessonPlanById: (id: string) => LessonPlan | undefined;
  getRecentLessonPlans: (count: number) => LessonPlan[];
}
```

#### dashboardStore
```typescript
interface DashboardState {
  // Filters
  searchQuery: string;
  filterSubject: string | null;
  filterGrade: string | null;
  sortBy: 'date' | 'name' | 'subject';
  sortOrder: 'asc' | 'desc';
  
  // View
  viewMode: 'grid' | 'list';
  
  // Actions
  setSearchQuery: (query: string) => void;
  setFilter: (key: string, value: string | null) => void;
  setSort: (by: SortBy, order: SortOrder) => void;
  setViewMode: (mode: ViewMode) => void;
  
  // Selectors
  filteredLessonPlans: (lessonPlans: LessonPlan[]) => LessonPlan[];
}
```

#### uiStore
```typescript
interface UIState {
  // Modal states
  activeModal: string | null;
  modalData: unknown;
  
  // Toast notifications
  toasts: Toast[];
  
  // Theme
  theme: 'light' | 'dark' | 'system';
  
  // Actions
  openModal: (modal: string, data?: unknown) => void;
  closeModal: () => void;
  addToast: (toast: ToastInput) => void;
  removeToast: (id: string) => void;
  setTheme: (theme: Theme) => void;
}
```

### State Persistence Strategy

```typescript
// Zustand with persistence middleware
import { persist, createJSONStorage } from 'zustand/middleware';

export const useLessonPlanStore = create<LessonPlanState>()(
  persist(
    (set, get) => ({
      // ... state and actions
    }),
    {
      name: 'lesson-plan-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist data, not UI state
      partialize: (state) => ({
        lessonPlans: state.lessonPlans,
      }),
    }
  )
);
```

---

## PDF Generation Strategy

### Why @react-pdf/renderer?

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| **@react-pdf/renderer** | React components, SSR, good styling | Learning curve, limited CSS | ✅ Selected |
| **html2pdf.js** | Easy from HTML, familiar | Poor quality, slow, client-only | ❌ |
| **jspdf** | Mature, feature-rich | Imperative API, harder to style | ❌ |
| **Puppeteer** | Full browser, perfect fidelity | Heavy, requires server | ❌ |

### PDF Architecture

```
┌─────────────────────────────────────────────────┐
│           PDF Export Module                     │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐    ┌──────────────┐          │
│  │   PDFDocument │    │   Styles     │          │
│  │   (Root)      │    │   (Theme)    │          │
│  └──────┬───────┘    └──────┬───────┘          │
│         │                    │                  │
│  ┌──────▼───────┐    ┌──────▼───────┐          │
│  │   PDFPage    │    │  PDFStyles   │          │
│  │              │    │              │          │
│  └──────┬───────┘    └──────────────┘          │
│         │                                       │
│  ┌──────▼───────────────▼───────┐              │
│  │      LessonPlanPDF            │              │
│  │  ┌─────────────────────────┐  │              │
│  │  │   Header (Title, Meta)  │  │              │
│  │  ├─────────────────────────┤  │              │
│  │  │   Content Sections      │  │              │
│  │  │  ┌─────────────────┐    │  │              │
│  │  │  │ SectionRenderer │    │  │              │
│  │  │  │ (dynamic types)   │    │  │              │
│  │  │  └─────────────────┘    │  │              │
│  │  └─────────────────────────┘  │              │
│  └───────────────────────────────┘              │
│                                                 │
└─────────────────────────────────────────────────┘
```

### PDF Components Structure

```
components/pdf/
├── PDFDocument.tsx          # Root PDF document
├── PDFPage.tsx                # Page layout wrapper
├── LessonPlanPDF.tsx          # Main lesson plan layout
├── sections/
│   ├── ObjectivesSection.tsx  # Objectives rendering
│   ├── MaterialsSection.tsx   # Materials list
│   ├── ActivitiesSection.tsx # Activities content
│   ├── AssessmentSection.tsx  # Assessment content
│   └── ReflectionSection.tsx  # Reflection content
├── elements/
│   ├── PDFText.tsx            # Styled text component
│   ├── PDFSectionHeader.tsx   # Section header
│   ├── PDFList.tsx            # List rendering
│   └── PDFTable.tsx           # Table rendering
└── styles.ts                  # Shared PDF styles
```

### Dynamic PDF Generation Flow

```typescript
// PDF Generation Hook
function usePDFExport() {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const generatePDF = async (lessonPlan: LessonPlan) => {
    setIsGenerating(true);
    
    try {
      // Create PDF blob
      const blob = await pdf(
        <LessonPlanPDF lessonPlan={lessonPlan} />
      ).toBlob();
      
      // Trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${lessonPlan.title}.pdf`;
      link.click();
      
      URL.revokeObjectURL(url);
    } finally {
      setIsGenerating(false);
    }
  };
  
  return { generatePDF, isGenerating };
}
```

---

## File Import Architecture

### Supported Formats & Parsers

| Format | Library | Parsing Strategy |
|--------|---------|------------------|
| .docx (Word) | mammoth.js | Extract HTML → Clean → Transform |
| .xlsx (Excel) | xlsx | Parse worksheets → Extract rows → Transform |
| .pptx (PowerPoint) | pptx-parser | Extract slides → Combine text → Transform |
| .json (Template) | Native | Direct parse → Validate → Import |

### Import Pipeline Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Import Pipeline                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  1. FILE UPLOAD                                            │
│     ┌──────────────┐                                       │
│     │ FileDropzone │ ← User drops/selects file            │
│     └──────┬───────┘                                       │
│            │                                               │
│  2. VALIDATION                                             │
│     ┌──────▼───────┐                                       │
│     │   validate   │ ← Check type, size, structure        │
│     │   File()     │                                       │
│     └──────┬───────┘                                       │
│            │                                               │
│  3. PARSING                                                │
│     ┌──────▼───────┐     ┌──────────────┐                  │
│     │   detect     │────→│   Parser     │                  │
│     │   Format()   │     │   Factory    │                  │
│     └──────────────┘     └──────┬───────┘                  │
│                                 │                          │
│                    ┌────────────┼────────────┐             │
│                    ▼            ▼            ▼             │
│              ┌────────┐  ┌────────┐  ┌────────┐          │
│              │Word    │  │Excel   │  │PPT     │          │
│              │Parser  │  │Parser  │  │Parser  │          │
│              └───┬────┘  └───┬────┘  └───┬────┘          │
│                  └───────────┼───────────┘                │
│                              ▼                            │
│  4. TRANSFORMATION                                           │
│                    ┌──────────────┐                       │
│                    │  transform   │ ← Normalize to schema │
│                    │  ToLessonPlan│                       │
│                    └──────┬───────┘                       │
│                           │                               │
│  5. VALIDATION                                             │
│                    ┌──────▼───────┐                       │
│                    │    Zod       │ ← Schema validation   │
│                    │   validate   │                       │
│                    └──────┬───────┘                       │
│                           │                               │
│  6. STORAGE                                                │
│                    ┌──────▼───────┐                       │
│                    │  addToStore  │ ← Save to lessonPlanStore│
│                    │              │                       │
│                    └──────┬───────┘                       │
│                           │                               │
│  7. NAVIGATION                                             │
│                    ┌──────▼───────┐                       │
│                    │   router     │ ← Redirect to editor  │
│                    │   .push()    │                       │
│                    └──────────────┘                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Parser Interface

```typescript
// Common interface for all file parsers
interface FileParser<T = unknown> {
  supportedTypes: string[];
  supportedExtensions: string[];
  parse(file: File): Promise<T>;
  transform(data: T): LessonPlanInput;
}

// Parser Factory
class ParserFactory {
  private parsers: FileParser[] = [
    new WordParser(),
    new ExcelParser(),
    new PowerPointParser(),
    new JSONParser(),
  ];
  
  getParser(file: File): FileParser {
    const parser = this.parsers.find(p => 
      p.supportedTypes.includes(file.type) ||
      p.supportedExtensions.some(ext => 
        file.name.endsWith(ext)
      )
    );
    
    if (!parser) {
      throw new Error(`No parser found for file: ${file.name}`);
    }
    
    return parser;
  }
}
```

---

## Accessibility (a11y) Strategy

### WCAG 2.1 Level AA Compliance

#### Keyboard Navigation
- All interactive elements focusable
- Logical tab order
- Escape closes modals
- Enter/Space activates buttons

#### Screen Reader Support
- Semantic HTML elements
- ARIA labels for complex components
- Live regions for status updates
- Alt text for images

#### Visual Accessibility
- Color contrast 4.5:1 minimum
- Focus indicators visible
- Text zoom support up to 200%
- Reduced motion support

#### Implementation Patterns

```typescript
// Accessible component pattern
interface AccessibleProps {
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-labelledby'?: string;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: boolean;
  'aria-selected'?: boolean;
  'aria-disabled'?: boolean;
  role?: string;
}

// Example: Accessible Button
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, isLoading, ...props }, ref) => (
    <button
      ref={ref}
      disabled={isLoading}
      aria-busy={isLoading}
      aria-label={isLoading ? 'Loading...' : undefined}
      {...props}
    >
      {isLoading && <Spinner aria-hidden="true" />}
      {children}
    </button>
  )
);
```

---

## Performance Considerations

### Code Splitting Strategy

```typescript
// Lazy load heavy components
const PDFPreview = lazy(() => 
  import('./components/pdf/PDFPreview')
);

const RichTextEditor = lazy(() => 
  import('./components/editor/RichTextEditor')
);

const FileImporter = lazy(() => 
  import('./components/upload/FileImporter')
);
```

### Bundle Size Budgets

| Chunk | Max Size |
|-------|----------|
| Initial | 200 KB |
| Dashboard | 150 KB |
| Editor | 300 KB (includes TipTap) |
| PDF | 250 KB (includes react-pdf) |
| Upload | 200 KB (includes parsers) |

### Optimization Techniques
- Tree-shaking enabled
- Dynamic imports for routes
- Debounced search (300ms)
- Virtualized lists for large datasets
- Image optimization via Next.js Image

---

## Security Considerations

### File Upload Security
- File type whitelist validation
- File size limits (10MB default)
- Content sanitization
- No server execution (all client-side)

### XSS Prevention
- DOMPurify for HTML content
- React's built-in escaping
- CSP headers (if deploying with custom server)

### Data Privacy
- All data stored locally (no server)
- No third-party analytics without consent
- Export data sanitization

---

## Testing Strategy

### Unit Tests
- Hooks with React Testing Library
- Utilities with Jest
- Component rendering tests

### Integration Tests
- User flows with React Testing Library
- Store interactions
- PDF generation validation

### E2E Tests
- Critical paths with Playwright
- Upload → Edit → Export flow
- Cross-browser compatibility

### Test File Locations
```
__tests__/
├── unit/
│   ├── hooks/
│   ├── utils/
│   └── components/
├── integration/
│   └── flows/
└── e2e/
    └── playwright/
```

---

## Future Architecture Considerations

### Scalability Path
1. **Phase 1**: Local storage (current)
2. **Phase 2**: IndexedDB for larger storage
3. **Phase 3**: Optional cloud sync (user choice)
4. **Phase 4**: Multi-user collaboration

### Potential Additions
- **Real-time collaboration**: Yjs + WebRTC
- **AI assistance**: Integration with LLMs for content suggestions
- **Template marketplace**: Cloud-hosted template sharing
- **Mobile app**: React Native sharing codebase

---

## Decision Log

| Date | Decision | Context | Consequence |
|------|----------|---------|-------------|
| 2024-01 | Zustand over Redux | Simpler API, smaller size | Less middleware ecosystem |
| 2024-01 | @react-pdf over html2pdf | Better quality, React-native | Steeper learning curve |
| 2024-01 | TipTap over Quill | Headless, more extensible | More setup required |
| 2024-01 | App Router over Pages Router | Future-proof, better SSG | New paradigm to learn |
| 2024-01 | Client-side storage first | Privacy, offline-first | Device-dependent storage |
