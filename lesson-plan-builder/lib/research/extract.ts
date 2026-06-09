// Content Extraction Module
// Extracts and cleans content from URLs

import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export interface ExtractedContent {
  title: string;
  content: string;
  author?: string;
  publishedAt?: Date;
  wordCount: number;
  readingTime: number; // minutes
  images: string[];
  videos: string[];
  error?: string;
}

// Check if URL is extractable (not a video, PDF, etc.)
export function isExtractableUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.toLowerCase();

    // Skip non-text content
    const skipExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mp3', '.doc', '.docx', '.ppt', '.pptx'];
    if (skipExtensions.some((ext) => path.endsWith(ext))) {
      return false;
    }

    // Skip social media posts (hard to extract meaningfully)
    const skipHosts = ['twitter.com', 'x.com', 'facebook.com', 'instagram.com', 'tiktok.com'];
    if (skipHosts.some((host) => parsed.hostname.includes(host))) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// Fetch and extract content from a URL
export async function extractContent(url: string): Promise<ExtractedContent> {
  if (!isExtractableUrl(url)) {
    return {
      title: '',
      content: '',
      wordCount: 0,
      readingTime: 0,
      images: [],
      videos: [],
      error: 'URL not extractable',
    };
  }

  try {
    // Fetch with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'th,en;q=0.9',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Parse with JSDOM
    const dom = new JSDOM(html, { url });
    const document = dom.window.document;

    // Use Readability for main content extraction
    const reader = new Readability(document);
    const article = reader.parse();

    if (!article) {
      // Fallback: extract text from body
      const bodyText = document.body?.textContent || '';
      const cleanedText = cleanExtractedText(bodyText);

      return {
        title: document.title || 'Untitled',
        content: cleanedText,
        wordCount: countWords(cleanedText),
        readingTime: estimateReadingTime(cleanedText),
        images: [],
        videos: [],
      };
    }

    // Clean the extracted content
    const cleanedContent = cleanExtractedText(article.textContent || '');

    // Extract media
    const images = extractImages(document, url);
    const videos = extractVideos(document, url);

    return {
      title: article.title || document.title || 'Untitled',
      content: cleanedContent,
      author: article.byline || undefined,
      publishedAt: extractPublishedDate(document),
      wordCount: countWords(cleanedContent),
      readingTime: estimateReadingTime(cleanedContent),
      images,
      videos,
    };
  } catch (error) {
    console.error(`Content extraction error for ${url}:`, error);
    return {
      title: '',
      content: '',
      wordCount: 0,
      readingTime: 0,
      images: [],
      videos: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Clean extracted text
function cleanExtractedText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\t/g, ' ')
    .trim();
}

// Count words in text
function countWords(text: string): number {
  // Support both Thai and English
  const thaiWords = text.match(/[\u0E00-\u0E7F]+/g) || [];
  const englishWords = text.match(/\b[a-zA-Z]+\b/g) || [];
  return thaiWords.length + englishWords.length;
}

// Estimate reading time
function estimateReadingTime(text: string): number {
  const words = countWords(text);
  // Average reading speed: 200 words per minute
  return Math.ceil(words / 200);
}

// Extract images from document
function extractImages(document: Document, baseUrl: string): string[] {
  const images: string[] = [];
  const imgElements = document.querySelectorAll('img');

  imgElements.forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('data:')) {
      try {
        const absoluteUrl = new URL(src, baseUrl).toString();
        images.push(absoluteUrl);
      } catch {
        // Invalid URL, skip
      }
    }
  });

  return images.slice(0, 5); // Limit to 5 images
}

// Extract videos from document
function extractVideos(document: Document, baseUrl: string): string[] {
  const videos: string[] = [];

  // YouTube embeds
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach((iframe) => {
    const src = iframe.getAttribute('src');
    if (src?.includes('youtube.com') || src?.includes('youtu.be')) {
      videos.push(src);
    }
  });

  // Video tags
  const videoTags = document.querySelectorAll('video');
  videoTags.forEach((video) => {
    const src = video.getAttribute('src');
    if (src) {
      try {
        const absoluteUrl = new URL(src, baseUrl).toString();
        videos.push(absoluteUrl);
      } catch {
        // Invalid URL, skip
      }
    }
  });

  return videos;
}

// Extract published date from document metadata
function extractPublishedDate(document: Document): Date | undefined {
  // Try common meta tags
  const selectors = [
    'meta[property="article:published_time"]',
    'meta[name="publishedDate"]',
    'meta[name="datePublished"]',
    'meta[property="og:published_time"]',
    'meta[name="publish-date"]',
  ];

  for (const selector of selectors) {
    const meta = document.querySelector(selector);
    const content = meta?.getAttribute('content');
    if (content) {
      const date = new Date(content);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  return undefined;
}

// Extract batch of URLs
export async function extractBatchContent(
  urls: string[],
  concurrency: number = 3
): Promise<Map<string, ExtractedContent>> {
  const results = new Map<string, ExtractedContent>();

  // Process in batches to control concurrency
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        const content = await extractContent(url);
        return { url, content };
      })
    );

    for (const { url, content } of batchResults) {
      results.set(url, content);
    }

    // Small delay between batches
    if (i + concurrency < urls.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}

// Get content summary (first N characters)
export function getContentSummary(content: string, maxLength: number = 500): string {
  if (content.length <= maxLength) {
    return content;
  }

  // Try to end at a sentence
  const truncated = content.slice(0, maxLength);
  const lastSentence = truncated.match(/.*[.!?]/);

  if (lastSentence) {
    return lastSentence[0];
  }

  return truncated + '...';
}
