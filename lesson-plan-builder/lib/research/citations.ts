// Citation Management Module
// Handles source citations for lesson plans

export interface Citation {
  id: string;
  sourceId: string;
  title: string;
  url: string;
  author?: string;
  platform: string;
  accessedAt: Date;
  citationText: string;
  citationNote?: string;
}

export interface CitationFormat {
  format: 'apa' | 'mla' | 'chicago' | 'harvard' | 'thai';
  label: string;
  description: string;
}

export const CITATION_FORMATS: CitationFormat[] = [
  {
    format: 'thai',
    label: 'มาตรฐานไทย',
    description: 'รูปแบบการอ้างอิงมาตรฐานไทยสำหรับงานวิชาการ',
  },
  {
    format: 'apa',
    label: 'APA',
    description: 'American Psychological Association style',
  },
  {
    format: 'mla',
    label: 'MLA',
    description: 'Modern Language Association style',
  },
  {
    format: 'chicago',
    label: 'Chicago',
    description: 'Chicago Manual of Style',
  },
];

// Generate citation text based on format
export function generateCitation(
  title: string,
  url: string,
  author?: string,
  publishedAt?: Date,
  platform?: string,
  format: CitationFormat['format'] = 'thai'
): string {
  const accessedDate = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  switch (format) {
    case 'thai':
      return generateThaiCitation(title, url, author, publishedAt, platform, accessedDate);
    case 'apa':
      return generateAPACitation(title, url, author, publishedAt, accessedDate);
    case 'mla':
      return generateMLACitation(title, url, author, publishedAt, accessedDate);
    case 'chicago':
      return generateChicagoCitation(title, url, author, publishedAt, accessedDate);
    case 'harvard':
      return generateHarvardCitation(title, url, author, publishedAt, accessedDate);
    default:
      return generateThaiCitation(title, url, author, publishedAt, platform, accessedDate);
  }
}

function generateThaiCitation(
  title: string,
  url: string,
  author?: string,
  publishedAt?: Date,
  platform?: string,
  accessedDate?: string
): string {
  const parts: string[] = [];

  if (author) {
    parts.push(author);
  }

  parts.push(`"${title}"`);

  if (platform) {
    parts.push(platform);
  }

  if (publishedAt) {
    const year = publishedAt.getFullYear() + 543; // Convert to Buddhist year
    parts.push(`พ.ศ. ${year}`);
  }

  parts.push(url);

  if (accessedDate) {
    parts.push(`[เข้าถึงเมื่อ ${accessedDate}]`);
  }

  return parts.join('. ');
}

function generateAPACitation(
  title: string,
  url: string,
  author?: string,
  publishedAt?: Date,
  accessedDate?: string
): string {
  const parts: string[] = [];

  if (author) {
    parts.push(author);
  } else {
    parts.push(title);
  }

  if (author) {
    if (publishedAt) {
      parts.push(`(${publishedAt.getFullYear()})`);
    } else {
      parts.push('(n.d.)');
    }
    parts.push(title);
  }

  parts.push(`Retrieved ${accessedDate}, from ${url}`);

  return parts.join('. ');
}

function generateMLACitation(
  title: string,
  url: string,
  author?: string,
  publishedAt?: Date,
  accessedDate?: string
): string {
  const parts: string[] = [];

  if (author) {
    parts.push(author);
  }

  parts.push(`"${title}."`);

  if (publishedAt) {
    parts.push(publishedAt.getFullYear().toString());
  }

  parts.push(url);

  return parts.join('. ');
}

function generateChicagoCitation(
  title: string,
  url: string,
  author?: string,
  publishedAt?: Date,
  accessedDate?: string
): string {
  const parts: string[] = [];

  if (author) {
    parts.push(author);
  }

  parts.push(`"${title}."`);

  if (publishedAt) {
    const month = publishedAt.toLocaleString('en-US', { month: 'long' });
    parts.push(`${month} ${publishedAt.getFullYear()}`);
  }

  parts.push(url);

  return parts.join('. ');
}

function generateHarvardCitation(
  title: string,
  url: string,
  author?: string,
  publishedAt?: Date,
  accessedDate?: string
): string {
  const parts: string[] = [];

  if (author) {
    parts.push(author);
  } else {
    parts.push(title);
  }

  if (publishedAt) {
    parts.push(`(${publishedAt.getFullYear()})`);
  }

  if (author) {
    parts.push(title);
  }

  parts.push(`Available at: ${url}`);
  parts.push(`[Accessed ${accessedDate}]`);

  return parts.join('. ');
}

// Create citation from source
export function createCitation(
  sourceId: string,
  title: string,
  url: string,
  author: string | undefined,
  platform: string,
  publishedAt: Date | undefined,
  citationNote?: string,
  format: CitationFormat['format'] = 'thai'
): Citation {
  const citationText = generateCitation(title, url, author, publishedAt, platform, format);

  return {
    id: `cite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    sourceId,
    title,
    url,
    author,
    platform,
    accessedAt: new Date(),
    citationText,
    citationNote,
  };
}

// Format citations for display in lesson plan
export function formatCitationsForLessonPlan(
  citations: Citation[],
  format: 'list' | 'paragraph' | 'footnotes' = 'list'
): string {
  if (citations.length === 0) {
    return '';
  }

  switch (format) {
    case 'list':
      return citations
        .map((cite, index) => `[${index + 1}] ${cite.citationText}`)
        .join('\n');

    case 'paragraph':
      return 'แหล่งอ้างอิง: ' + citations
        .map((cite) => cite.citationText)
        .join('; ');

    case 'footnotes':
      return citations
        .map((cite, index) => `${index + 1}. ${cite.citationText}`)
        .join('\n');

    default:
      return citations
        .map((cite, index) => `[${index + 1}] ${cite.citationText}`)
        .join('\n');
  }
}

// Extract citations from lesson plan content
export function extractCitationsFromContent(content: string): string[] {
  // Match citation patterns like [1], [2], [Smith 2023], etc.
  const citationPattern = /\[([\d\w\s,.-]+)\]/g;
  const matches = content.match(citationPattern);
  return matches ? [...new Set(matches)] : [];
}

// Insert citation into content
export function insertCitation(
  content: string,
  position: number,
  citationNumber: number
): string {
  return content.slice(0, position) + `[${citationNumber}]` + content.slice(position);
}

// Validate URL format
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Get domain from URL
export function getDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
