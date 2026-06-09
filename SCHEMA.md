# Data Schema Documentation

## Lesson Plan PDF Builder - TypeScript Schema Definitions

This document defines all data models, interfaces, and types used throughout the application. All schemas use Zod for runtime validation.

---

## Table of Contents

1. [Core Models](#core-models)
2. [LessonPlan Schema](#lessonplan-schema)
3. [LessonSection Schema](#lessonsection-schema)
4. [Template Schema](#template-schema)
5. [User Preferences Schema](#user-preferences-schema)
6. [Supporting Types](#supporting-types)
7. [Zod Validation Schemas](#zod-validation-schemas)
8. [Type Guards](#type-guards)

---

## Core Models

### Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Entity Relationships                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐         ┌─────────────┐                       │
│   │   Template  │◄────────│  LessonPlan │                       │
│   │             │  0..1   │             │                       │
│   └─────────────┘         │  - id       │                       │
│                           │  - title    │                       │
│   ┌─────────────┐         │  - subject  │                       │
│   │   UserPrefs │         │  - sections │◄──────┐               │
│   │             │         │  - metadata │       │               │
│   │ - settings  │         └─────────────┘       │               │
│   │ - defaults  │                               │               │
│   └─────────────┘                    ┌──────────▼──────────┐     │
│                                      │   LessonSection   │     │
│                                      │                   │     │
│                                      │  - id             │     │
│                                      │  - type           │     │
│                                      │  - content        │     │
│                                      │  - order          │     │
│                                      └───────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## LessonPlan Schema

### Interface Definition

```typescript
/**
 * Core Lesson Plan entity
 * Represents a complete lesson plan document
 */
interface LessonPlan {
  /** Unique identifier (UUID v4) */
  id: string;
  
  /** Display title */
  title: string;
  
  /** Subject area (e.g., "Mathematics", "Science") */
  subject: string;
  
  /** Grade level (e.g., "9th Grade", "K-12") */
  grade: string;
  
  /** Lesson duration in minutes */
  duration: number;
  
  /** Ordered array of lesson sections */
  sections: LessonSection[];
  
  /** Template ID if created from template */
  templateId?: string;
  
  /** Additional metadata */
  metadata: LessonPlanMetadata;
}
```

### Metadata Sub-schema

```typescript
/**
 * Metadata for tracking and organization
 */
interface LessonPlanMetadata {
  /** Creation timestamp */
  createdAt: ISOString;
  
  /** Last modification timestamp */
  updatedAt: ISOString;
  
  /** Creator/author name */
  author: string;
  
  /** Optional description/summary */
  description?: string;
  
  /** Tags for categorization */
  tags: string[];
  
  /** Color coding for UI */
  color: ColorCode;
  
  /** Completion status */
  status: LessonPlanStatus;
  
  /** Version number for optimistic locking */
  version: number;
}
```

### Complete LessonPlan Type Definition

```typescript
// types/lesson-plan.ts

/**
 * ISO 8601 date string type alias
 */
type ISOString = string;

/**
 * Color codes for UI organization
 */
type ColorCode = 
  | 'slate' 
  | 'red' 
  | 'orange' 
  | 'amber' 
  | 'green' 
  | 'emerald' 
  | 'teal' 
  | 'cyan' 
  | 'blue' 
  | 'indigo' 
  | 'violet' 
  | 'purple' 
  | 'fuchsia' 
  | 'pink' 
  | 'rose';

/**
 * Status lifecycle for lesson plans
 */
type LessonPlanStatus = 
  | 'draft'           // Initial creation, incomplete
  | 'in_progress'     // Being actively worked on
  | 'review'          // Ready for review/approval
  | 'complete'        // Finalized and ready for use
  | 'archived';       // No longer active but kept for reference

/**
 * Complete Lesson Plan entity
 */
export interface LessonPlan {
  id: string;
  title: string;
  subject: string;
  grade: string;
  duration: number;  // in minutes
  sections: LessonSection[];
  templateId?: string;
  metadata: LessonPlanMetadata;
}

/**
 * Metadata for lesson plan tracking
 */
export interface LessonPlanMetadata {
  createdAt: ISOString;
  updatedAt: ISOString;
  author: string;
  description?: string;
  tags: string[];
  color: ColorCode;
  status: LessonPlanStatus;
  version: number;
}

/**
 * Input type for creating new lesson plans
 * Omits auto-generated fields
 */
export type LessonPlanInput = Omit<LessonPlan, 'id' | 'metadata'> & {
  metadata?: Omit<LessonPlanMetadata, 'createdAt' | 'updatedAt' | 'version'>;
};

/**
 * Update type - all fields optional except id
 */
export type LessonPlanUpdate = Partial<Omit<LessonPlan, 'id' | 'metadata'>> & {
  id: string;
  metadata?: Partial<LessonPlanMetadata>;
};

/**
 * Summary view for dashboard listings
 */
export interface LessonPlanSummary {
  id: string;
  title: string;
  subject: string;
  grade: string;
  duration: number;
  status: LessonPlanStatus;
  updatedAt: ISOString;
  color: ColorCode;
  sectionCount: number;
}
```

---

## LessonSection Schema

### Section Type Enum

```typescript
/**
 * Standard lesson plan section types
 * Based on common educational frameworks
 */
type LessonSectionType =
  | 'objectives'      // Learning objectives/goals
  | 'standards'       // Educational standards alignment
  | 'materials'       // Required materials and resources
  | 'introduction'    // Lesson opening/hook
  | 'activities'      // Main learning activities
  | 'assessment'      // Assessment/check for understanding
  | 'differentiation' // Differentiation strategies
  | 'closure'         // Lesson conclusion
  | 'homework'        // Homework assignments
  | 'reflection'      // Teacher reflection notes
  | 'resources'       // Additional resources
  | 'custom';         // Custom section type
```

### Section Interface

```typescript
/**
 * Individual lesson plan section
 * Rich content with formatting support
 */
interface LessonSection {
  /** Unique identifier within lesson */
  id: string;
  
  /** Section type/category */
  type: LessonSectionType;
  
  /** Custom title (optional, uses default if not set) */
  customTitle?: string;
  
  /** Rich text content (HTML or JSON format) */
  content: SectionContent;
  
  /** Display order (0-indexed) */
  order: number;
  
  /** Whether section is required */
  isRequired: boolean;
  
  /** Whether section is collapsed in editor */
  isCollapsed: boolean;
  
  /** Section-specific metadata */
  metadata?: SectionMetadata;
}
```

### Content Types

```typescript
// types/section.ts

/**
 * Content format types
 */
type ContentFormat = 'html' | 'json' | 'markdown';

/**
 * Rich content structure
 * Supports multiple content types for flexibility
 */
export interface SectionContent {
  /** Format identifier */
  format: ContentFormat;
  
  /** Actual content data */
  data: string;
  
  /** Plain text version for search/preview */
  plainText: string;
  
  /** Word count for analytics */
  wordCount: number;
}

/**
 * Section metadata for extended functionality
 */
export interface SectionMetadata {
  /** Estimated time allocation */
  timeAllocation?: number;
  
  /** Priority/importance level */
  priority?: 'low' | 'medium' | 'high';
  
  /** Whether visible in PDF export */
  visibleInExport?: boolean;
  
  /** Custom CSS classes for PDF */
  pdfStyles?: string;
  
  /** Standards alignment codes */
  standards?: string[];
}

/**
 * Complete Lesson Section entity
 */
export interface LessonSection {
  id: string;
  type: LessonSectionType;
  customTitle?: string;
  content: SectionContent;
  order: number;
  isRequired: boolean;
  isCollapsed: boolean;
  metadata?: SectionMetadata;
}

/**
 * Default titles for each section type
 */
export const DEFAULT_SECTION_TITLES: Record<LessonSectionType, string> = {
  objectives: 'Learning Objectives',
  standards: 'Standards Alignment',
  materials: 'Materials & Resources',
  introduction: 'Introduction / Hook',
  activities: 'Learning Activities',
  assessment: 'Assessment',
  differentiation: 'Differentiation Strategies',
  closure: 'Closure',
  homework: 'Homework',
  reflection: 'Teacher Reflection',
  resources: 'Additional Resources',
  custom: 'Custom Section',
};

/**
 * Default section order for new lesson plans
 */
export const DEFAULT_SECTION_ORDER: LessonSectionType[] = [
  'objectives',
  'standards',
  'materials',
  'introduction',
  'activities',
  'assessment',
  'differentiation',
  'closure',
  'homework',
];

/**
 * Input type for creating sections
 */
export type LessonSectionInput = Omit<LessonSection, 'id'>;

/**
 * Update type for sections
 */
export type LessonSectionUpdate = Partial<LessonSection> & { id: string };
```

### Section Templates

```typescript
/**
 * Pre-defined content templates for sections
 */
export const SECTION_TEMPLATES: Record<LessonSectionType, string> = {
  objectives: `<ul>
  <li>Students will be able to...</li>
  <li>Students will understand...</li>
</ul>`,
  standards: `<p><strong>Subject Standard:</strong> [Insert standard code]</p>
<p><strong>Description:</strong> [Insert standard description]</p>`,
  materials: `<ul>
  <li>Textbook / Workbook</li>
  <li>Whiteboard / Markers</li>
  <li>Handouts</li>
</ul>`,
  introduction: `<p><strong>Hook (5 minutes):</strong></p>
<p>[Describe your opening activity to engage students]</p>`,
  activities: `<p><strong>Activity 1: [Activity Name]</strong></p>
<p><em>Duration:</em> [X minutes]</p>
<p><em>Description:</em></p>
<p>[Detailed description of the activity]</p>

<p><em>Instructions:</em></p>
<ol>
  <li>Step 1...</li>
  <li>Step 2...</li>
</ol>`,
  assessment: `<p><strong>Formative Assessment:</strong></p>
<ul>
  <li>[Assessment method 1]</li>
  <li>[Assessment method 2]</li>
</ul>
<p><strong>Success Criteria:</strong></p>
<p>[Define what success looks like]</p>`,
  differentiation: `<p><strong>For Advanced Learners:</strong></p>
<p>[Extension activities]</p>
<p><strong>For Struggling Learners:</strong></p>
<p>[Support strategies]</p>`,
  closure: `<p><strong>Exit Ticket / Wrap-up:</strong></p>
<p>[Describe how you will close the lesson]</p>`,
  homework: `<p><strong>Assignment:</strong></p>
<p>[Describe homework or follow-up work]</p>
<p><strong>Due:</strong> [Due date]</p>`,
  reflection: `<p><strong>Post-Lesson Notes:</strong></p>
<p><em>What worked well:</em></p>
<p>[Notes]</p>
<p><em>Areas for improvement:</em></p>
<p>[Notes]</p>`,
  resources: `<ul>
  <li>[Resource 1 with link if applicable]</li>
  <li>[Resource 2 with link if applicable]</li>
</ul>`,
  custom: `<p>[Add your custom content here]</p>`,
};
```

---

## Template Schema

### Template Interface

```typescript
// types/template.ts

/**
 * Template for quickly creating new lesson plans
 * Contains pre-defined structure and default content
 */
export interface Template {
  /** Unique identifier */
  id: string;
  
  /** Template name */
  name: string;
  
  /** Template description */
  description: string;
  
  /** Subject category */
  subject: string;
  
  /** Grade range */
  grade: string;
  
  /** Default duration in minutes */
  defaultDuration: number;
  
  /** Sections with default content */
  sections: TemplateSection[];
  
  /** Metadata */
  metadata: TemplateMetadata;
}

/**
 * Template section structure
 */
export interface TemplateSection {
  type: LessonSectionType;
  customTitle?: string;
  defaultContent?: string;
  isRequired: boolean;
  isIncluded: boolean;
  order: number;
}

/**
 * Template metadata
 */
export interface TemplateMetadata {
  createdAt: ISOString;
  updatedAt: ISOString;
  author: string;
  version: number;
  isDefault: boolean;
  category: TemplateCategory;
  tags: string[];
}

/**
 * Template categories
 */
type TemplateCategory =
  | 'general'
  | 'math'
  | 'science'
  | 'language-arts'
  | 'social-studies'
  | 'art'
  | 'music'
  | 'pe'
  | 'technology'
  | 'custom';

/**
 * Template summary for listings
 */
export interface TemplateSummary {
  id: string;
  name: string;
  description: string;
  subject: string;
  grade: string;
  category: TemplateCategory;
  sectionCount: number;
}
```

### Built-in Templates

```typescript
/**
 * Default built-in templates
 */
export const BUILT_IN_TEMPLATES: Template[] = [
  {
    id: 'template-default',
    name: 'Standard Lesson Plan',
    description: 'General purpose lesson plan template with all standard sections',
    subject: 'General',
    grade: 'Any',
    defaultDuration: 45,
    sections: DEFAULT_SECTION_ORDER.map((type, index) => ({
      type,
      isRequired: ['objectives', 'activities', 'assessment'].includes(type),
      isIncluded: true,
      order: index,
    })),
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: 'System',
      version: 1,
      isDefault: true,
      category: 'general',
      tags: ['default', 'standard'],
    },
  },
  {
    id: 'template-mini',
    name: 'Mini Lesson (15 min)',
    description: 'Short lesson template for quick activities or interventions',
    subject: 'General',
    grade: 'Any',
    defaultDuration: 15,
    sections: [
      { type: 'objectives', isRequired: true, isIncluded: true, order: 0 },
      { type: 'materials', isRequired: false, isIncluded: true, order: 1 },
      { type: 'activities', isRequired: true, isIncluded: true, order: 2 },
      { type: 'assessment', isRequired: false, isIncluded: true, order: 3 },
      { type: 'closure', isRequired: false, isIncluded: true, order: 4 },
    ],
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: 'System',
      version: 1,
      isDefault: false,
      category: 'general',
      tags: ['short', 'mini', 'intervention'],
    },
  },
  {
    id: 'template-5e',
    name: '5E Inquiry Model',
    description: 'Science-focused lesson plan following the 5E instructional model',
    subject: 'Science',
    grade: 'Middle School',
    defaultDuration: 90,
    sections: [
      { type: 'objectives', isRequired: true, isIncluded: true, order: 0 },
      { type: 'standards', isRequired: true, isIncluded: true, order: 1 },
      { type: 'materials', isRequired: true, isIncluded: true, order: 2 },
      { 
        type: 'introduction', 
        customTitle: 'Engage',
        isRequired: true, 
        isIncluded: true, 
        order: 3 
      },
      { 
        type: 'activities', 
        customTitle: 'Explore',
        isRequired: true, 
        isIncluded: true, 
        order: 4 
      },
      { 
        type: 'activities', 
        customTitle: 'Explain',
        isRequired: true, 
        isIncluded: true, 
        order: 5 
      },
      { 
        type: 'activities', 
        customTitle: 'Elaborate',
        isRequired: true, 
        isIncluded: true, 
        order: 6 
      },
      { 
        type: 'assessment', 
        customTitle: 'Evaluate',
        isRequired: true, 
        isIncluded: true, 
        order: 7 
      },
      { type: 'reflection', isRequired: false, isIncluded: true, order: 8 },
    ],
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: 'System',
      version: 1,
      isDefault: false,
      category: 'science',
      tags: ['5e', 'inquiry', 'science', 'ngss'],
    },
  },
];
```

---

## User Preferences Schema

### Settings Interface

```typescript
// types/settings.ts

/**
 * User preferences and application settings
 * Persisted across sessions
 */
export interface UserPreferences {
  /** Unique user identifier (generated locally) */
  userId: string;
  
  /** Display name */
  displayName: string;
  
  /** UI preferences */
  ui: UIPreferences;
  
  /** Editor preferences */
  editor: EditorPreferences;
  
  /** PDF export preferences */
  pdf: PDFPreferences;
  
  /** Default values for new lesson plans */
  defaults: DefaultSettings;
  
  /** Privacy settings */
  privacy: PrivacySettings;
  
  /** Metadata */
  metadata: SettingsMetadata;
}

/**
 * UI-related preferences
 */
export interface UIPreferences {
  /** Theme preference */
  theme: 'light' | 'dark' | 'system';
  
  /** Dashboard view mode */
  dashboardView: 'grid' | 'list';
  
  /** Sidebar collapsed state */
  sidebarCollapsed: boolean;
  
  /** Show completed/archived plans */
  showArchived: boolean;
  
  /** Default items per page */
  itemsPerPage: number;
  
  /** Sort preferences for dashboard */
  defaultSort: {
    by: 'date' | 'name' | 'subject';
    order: 'asc' | 'desc';
  };
}

/**
 * Editor preferences
 */
export interface EditorPreferences {
  /** Auto-save interval in seconds (0 = disabled) */
  autoSaveInterval: number;
  
  /** Default expanded sections */
  autoExpandSections: boolean;
  
  /** Show word count */
  showWordCount: boolean;
  
  /** Spell check enabled */
  spellCheck: boolean;
  
  /** Default font size in editor */
  defaultFontSize: 'small' | 'medium' | 'large';
  
  /** Enable rich text formatting */
  richTextEnabled: boolean;
  
  /** Default section order preference */
  preferredSectionOrder: LessonSectionType[];
}

/**
 * PDF export preferences
 */
export interface PDFPreferences {
  /** Default page size */
  pageSize: 'letter' | 'a4' | 'legal';
  
  /** Default orientation */
  orientation: 'portrait' | 'landscape';
  
  /** Include cover page */
  includeCoverPage: boolean;
  
  /** Include table of contents */
  includeTableOfContents: boolean;
  
  /** Include page numbers */
  includePageNumbers: boolean;
  
  /** Header text */
  headerText?: string;
  
  /** Footer text */
  footerText?: string;
  
  /** Font family for PDF */
  fontFamily: 'serif' | 'sans-serif' | 'system';
}

/**
 * Default settings for new lesson plans
 */
export interface DefaultSettings {
  /** Default author name */
  defaultAuthor: string;
  
  /** Default subject */
  defaultSubject: string;
  
  /** Default grade */
  defaultGrade: string;
  
  /** Default duration */
  defaultDuration: number;
  
  /** Default template ID */
  defaultTemplateId: string;
  
  /** Default color code */
  defaultColor: ColorCode;
}

/**
 * Privacy settings
 */
export interface PrivacySettings {
  /** Allow analytics */
  allowAnalytics: boolean;
  
  /** Store data locally only */
  localOnly: boolean;
  
  /** Auto-delete after days (0 = never) */
  autoDeleteDays: number;
}

/**
 * Settings metadata
 */
export interface SettingsMetadata {
  createdAt: ISOString;
  updatedAt: ISOString;
  version: number;
}
```

### Default Preferences

```typescript
/**
 * Default preferences for new users
 */
export const DEFAULT_PREFERENCES: UserPreferences = {
  userId: '', // Generated on first load
  displayName: 'Teacher',
  ui: {
    theme: 'system',
    dashboardView: 'grid',
    sidebarCollapsed: false,
    showArchived: false,
    itemsPerPage: 12,
    defaultSort: {
      by: 'date',
      order: 'desc',
    },
  },
  editor: {
    autoSaveInterval: 30,
    autoExpandSections: true,
    showWordCount: true,
    spellCheck: true,
    defaultFontSize: 'medium',
    richTextEnabled: true,
    preferredSectionOrder: DEFAULT_SECTION_ORDER,
  },
  pdf: {
    pageSize: 'letter',
    orientation: 'portrait',
    includeCoverPage: true,
    includeTableOfContents: false,
    includePageNumbers: true,
    fontFamily: 'sans-serif',
  },
  defaults: {
    defaultAuthor: '',
    defaultSubject: 'General',
    defaultGrade: '',
    defaultDuration: 45,
    defaultTemplateId: 'template-default',
    defaultColor: 'blue',
  },
  privacy: {
    allowAnalytics: false,
    localOnly: true,
    autoDeleteDays: 0,
  },
  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  },
};
```

---

## Supporting Types

### Common Utility Types

```typescript
// types/common.ts

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/**
 * API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Sort configuration
 */
export interface SortConfig<T> {
  field: keyof T;
  direction: 'asc' | 'desc';
}

/**
 * Filter configuration
 */
export interface FilterConfig<T> {
  field: keyof T;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in';
  value: unknown;
}

/**
 * Toast notification
 */
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * File upload status
 */
export interface FileUploadStatus {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  result?: LessonPlan;
}

/**
 * Import result
 */
export interface ImportResult {
  success: boolean;
  lessonPlan?: LessonPlan;
  errors: ImportError[];
  warnings: ImportWarning[];
}

export interface ImportError {
  code: string;
  message: string;
  field?: string;
}

export interface ImportWarning {
  code: string;
  message: string;
  field?: string;
}

/**
 * Export options
 */
export interface ExportOptions {
  format: 'pdf' | 'json' | 'html' | 'docx';
  includeMetadata: boolean;
  filename?: string;
}

/**
 * Statistics for dashboard
 */
export interface DashboardStats {
  totalLessonPlans: number;
  lessonPlansByStatus: Record<LessonPlanStatus, number>;
  lessonPlansBySubject: Record<string, number>;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'created' | 'updated' | 'deleted' | 'exported' | 'imported';
  lessonPlanId: string;
  lessonPlanTitle: string;
  timestamp: ISOString;
}
```

---

## Zod Validation Schemas

### Lesson Plan Validation

```typescript
// lib/validation/lesson-plan.ts

import { z } from 'zod';

/**
 * Color code validation
 */
export const colorCodeSchema = z.enum([
  'slate', 'red', 'orange', 'amber', 'green', 'emerald',
  'teal', 'cyan', 'blue', 'indigo', 'violet', 'purple',
  'fuchsia', 'pink', 'rose',
]);

/**
 * Status validation
 */
export const lessonPlanStatusSchema = z.enum([
  'draft', 'in_progress', 'review', 'complete', 'archived',
]);

/**
 * Section type validation
 */
export const lessonSectionTypeSchema = z.enum([
  'objectives', 'standards', 'materials', 'introduction',
  'activities', 'assessment', 'differentiation', 'closure',
  'homework', 'reflection', 'resources', 'custom',
]);

/**
 * Section content validation
 */
export const sectionContentSchema = z.object({
  format: z.enum(['html', 'json', 'markdown']),
  data: z.string(),
  plainText: z.string(),
  wordCount: z.number().int().min(0),
});

/**
 * Section metadata validation
 */
export const sectionMetadataSchema = z.object({
  timeAllocation: z.number().int().min(0).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  visibleInExport: z.boolean().optional(),
  pdfStyles: z.string().optional(),
  standards: z.array(z.string()).optional(),
}).optional();

/**
 * Lesson section validation
 */
export const lessonSectionSchema = z.object({
  id: z.string().uuid(),
  type: lessonSectionTypeSchema,
  customTitle: z.string().optional(),
  content: sectionContentSchema,
  order: z.number().int().min(0),
  isRequired: z.boolean(),
  isCollapsed: z.boolean(),
  metadata: sectionMetadataSchema,
});

/**
 * Lesson plan metadata validation
 */
export const lessonPlanMetadataSchema = z.object({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  author: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  tags: z.array(z.string().max(50)).max(20),
  color: colorCodeSchema,
  status: lessonPlanStatusSchema,
  version: z.number().int().min(1),
});

/**
 * Complete lesson plan validation
 */
export const lessonPlanSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  subject: z.string().min(1).max(100),
  grade: z.string().min(1).max(50),
  duration: z.number().int().min(1).max(480), // Max 8 hours
  sections: z.array(lessonSectionSchema).min(1),
  templateId: z.string().uuid().optional(),
  metadata: lessonPlanMetadataSchema,
});

/**
 * Lesson plan input validation (for creation)
 */
export const lessonPlanInputSchema = lessonPlanSchema.omit({
  id: true,
  metadata: true,
}).extend({
  metadata: lessonPlanMetadataSchema.omit({
    createdAt: true,
    updatedAt: true,
    version: true,
  }).optional(),
});

/**
 * Lesson plan update validation
 */
export const lessonPlanUpdateSchema = lessonPlanSchema.partial().required({
  id: true,
});
```

### Template Validation

```typescript
// lib/validation/template.ts

import { z } from 'zod';
import { lessonSectionTypeSchema } from './lesson-plan';

export const templateCategorySchema = z.enum([
  'general', 'math', 'science', 'language-arts', 'social-studies',
  'art', 'music', 'pe', 'technology', 'custom',
]);

export const templateSectionSchema = z.object({
  type: lessonSectionTypeSchema,
  customTitle: z.string().optional(),
  defaultContent: z.string().optional(),
  isRequired: z.boolean(),
  isIncluded: z.boolean(),
  order: z.number().int().min(0),
});

export const templateMetadataSchema = z.object({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  author: z.string(),
  version: z.number().int().min(1),
  isDefault: z.boolean(),
  category: templateCategorySchema,
  tags: z.array(z.string()),
});

export const templateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  subject: z.string().min(1).max(100),
  grade: z.string().min(1).max(50),
  defaultDuration: z.number().int().min(1).max(480),
  sections: z.array(templateSectionSchema),
  metadata: templateMetadataSchema,
});
```

### Settings Validation

```typescript
// lib/validation/settings.ts

import { z } from 'zod';
import { colorCodeSchema } from './lesson-plan';
import { lessonSectionTypeSchema } from './lesson-plan';

export const uiPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  dashboardView: z.enum(['grid', 'list']),
  sidebarCollapsed: z.boolean(),
  showArchived: z.boolean(),
  itemsPerPage: z.number().int().min(5).max(50),
  defaultSort: z.object({
    by: z.enum(['date', 'name', 'subject']),
    order: z.enum(['asc', 'desc']),
  }),
});

export const editorPreferencesSchema = z.object({
  autoSaveInterval: z.number().int().min(0).max(300),
  autoExpandSections: z.boolean(),
  showWordCount: z.boolean(),
  spellCheck: z.boolean(),
  defaultFontSize: z.enum(['small', 'medium', 'large']),
  richTextEnabled: z.boolean(),
  preferredSectionOrder: z.array(lessonSectionTypeSchema),
});

export const pdfPreferencesSchema = z.object({
  pageSize: z.enum(['letter', 'a4', 'legal']),
  orientation: z.enum(['portrait', 'landscape']),
  includeCoverPage: z.boolean(),
  includeTableOfContents: z.boolean(),
  includePageNumbers: z.boolean(),
  headerText: z.string().max(100).optional(),
  footerText: z.string().max(100).optional(),
  fontFamily: z.enum(['serif', 'sans-serif', 'system']),
});

export const defaultSettingsSchema = z.object({
  defaultAuthor: z.string().max(100),
  defaultSubject: z.string().max(100),
  defaultGrade: z.string().max(50),
  defaultDuration: z.number().int().min(1).max(480),
  defaultTemplateId: z.string().uuid(),
  defaultColor: colorCodeSchema,
});

export const privacySettingsSchema = z.object({
  allowAnalytics: z.boolean(),
  localOnly: z.boolean(),
  autoDeleteDays: z.number().int().min(0).max(365),
});

export const settingsMetadataSchema = z.object({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  version: z.number().int().min(1),
});

export const userPreferencesSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string().min(1).max(100),
  ui: uiPreferencesSchema,
  editor: editorPreferencesSchema,
  pdf: pdfPreferencesSchema,
  defaults: defaultSettingsSchema,
  privacy: privacySettingsSchema,
  metadata: settingsMetadataSchema,
});
```

---

## Type Guards

```typescript
// lib/types/guards.ts

import { 
  LessonSectionType, 
  LessonPlanStatus, 
  ColorCode,
  TemplateCategory,
} from '@/types';

/**
 * Valid section types array
 */
const VALID_SECTION_TYPES: LessonSectionType[] = [
  'objectives', 'standards', 'materials', 'introduction',
  'activities', 'assessment', 'differentiation', 'closure',
  'homework', 'reflection', 'resources', 'custom',
];

/**
 * Valid status values array
 */
const VALID_STATUSES: LessonPlanStatus[] = [
  'draft', 'in_progress', 'review', 'complete', 'archived',
];

/**
 * Valid color codes array
 */
const VALID_COLORS: ColorCode[] = [
  'slate', 'red', 'orange', 'amber', 'green', 'emerald',
  'teal', 'cyan', 'blue', 'indigo', 'violet', 'purple',
  'fuchsia', 'pink', 'rose',
];

/**
 * Valid template categories array
 */
const VALID_CATEGORIES: TemplateCategory[] = [
  'general', 'math', 'science', 'language-arts', 'social-studies',
  'art', 'music', 'pe', 'technology', 'custom',
];

/**
 * Type guard for LessonSectionType
 */
export function isLessonSectionType(value: unknown): value is LessonSectionType {
  return typeof value === 'string' && 
    VALID_SECTION_TYPES.includes(value as LessonSectionType);
}

/**
 * Type guard for LessonPlanStatus
 */
export function isLessonPlanStatus(value: unknown): value is LessonPlanStatus {
  return typeof value === 'string' && 
    VALID_STATUSES.includes(value as LessonPlanStatus);
}

/**
 * Type guard for ColorCode
 */
export function isColorCode(value: unknown): value is ColorCode {
  return typeof value === 'string' && 
    VALID_COLORS.includes(value as ColorCode);
}

/**
 * Type guard for TemplateCategory
 */
export function isTemplateCategory(value: unknown): value is TemplateCategory {
  return typeof value === 'string' && 
    VALID_CATEGORIES.includes(value as TemplateCategory);
}

/**
 * Assert that value is a valid LessonSectionType
 */
export function assertLessonSectionType(
  value: unknown,
  message = 'Invalid section type'
): asserts value is LessonSectionType {
  if (!isLessonSectionType(value)) {
    throw new Error(message);
  }
}

/**
 * Assert that value is a valid LessonPlanStatus
 */
export function assertLessonPlanStatus(
  value: unknown,
  message = 'Invalid lesson plan status'
): asserts value is LessonPlanStatus {
  if (!isLessonPlanStatus(value)) {
    throw new Error(message);
  }
}
```

---

## Type Exports

```typescript
// types/index.ts

// Core types
export type {
  LessonPlan,
  LessonPlanMetadata,
  LessonPlanInput,
  LessonPlanUpdate,
  LessonPlanSummary,
} from './lesson-plan';

export type {
  LessonSection,
  LessonSectionType,
  LessonSectionInput,
  LessonSectionUpdate,
  SectionContent,
  SectionMetadata,
  ContentFormat,
} from './section';

export type {
  Template,
  TemplateSection,
  TemplateMetadata,
  TemplateSummary,
  TemplateCategory,
} from './template';

export type {
  UserPreferences,
  UIPreferences,
  EditorPreferences,
  PDFPreferences,
  DefaultSettings,
  PrivacySettings,
  SettingsMetadata,
} from './settings';

// Common types
export type {
  ApiResponse,
  ApiError,
  PaginationParams,
  PaginatedResponse,
  SortConfig,
  FilterConfig,
  Toast,
  FileUploadStatus,
  ImportResult,
  ImportError,
  ImportWarning,
  ExportOptions,
  DashboardStats,
  ActivityItem,
} from './common';

// Constants
export { 
  DEFAULT_SECTION_TITLES,
  DEFAULT_SECTION_ORDER,
  SECTION_TEMPLATES,
} from './section';

export {
  BUILT_IN_TEMPLATES,
} from './template';

export {
  DEFAULT_PREFERENCES,
} from './settings';

// Type aliases
export type ISOString = string;
export type { ColorCode } from './lesson-plan';

// Re-export guards
export {
  isLessonSectionType,
  isLessonPlanStatus,
  isColorCode,
  isTemplateCategory,
  assertLessonSectionType,
  assertLessonPlanStatus,
} from '../lib/types/guards';
```
