// Search Provider Interface
// Abstract interface for different search implementations

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  platform: string;
  author?: string;
  publishedAt?: Date;
  sourceType?: 'academic' | 'educational' | 'government' | 'news' | 'blog' | 'social';
}

export interface SearchQuery {
  query: string;
  platform: string;
  topic: string;
  subject: string;
  gradeLevel: string;
}

export interface SearchProvider {
  name: string;
  search(query: SearchQuery): Promise<SearchResult[]>;
  isAvailable(): boolean;
}

// Base class for search providers
export abstract class BaseSearchProvider implements SearchProvider {
  abstract name: string;

  abstract search(query: SearchQuery): Promise<SearchResult[]>;

  isAvailable(): boolean {
    return true;
  }

  // Rate limiting helper
  protected async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Generate search variations
  protected generateQueryVariations(baseQuery: SearchQuery): string[] {
    const variations: string[] = [];
    const { topic, subject, gradeLevel } = baseQuery;

    // Thai education queries
    variations.push(`แผนการสอน ${subject} ${topic} ${gradeLevel}`);
    variations.push(`หน่วยการเรียนรู้ ${subject} ${topic}`);
    variations.push(`ใบงาน ${subject} ${topic} ระดับ ${gradeLevel}`);
    variations.push(`กิจกรรมการเรียนการสอน ${topic}`);
    variations.push(`สื่อการสอน ${subject} ${topic}`);

    // English variations for academic sources
    variations.push(`${topic} lesson plan ${gradeLevel}`);
    variations.push(`${subject} ${topic} teaching resources`);
    variations.push(`${topic} educational activities`);

    return variations;
  }
}

// Factory for getting appropriate search provider
export function getSearchProvider(): SearchProvider {
  // Check for API keys
  const hasTavily = !!process.env.TAVILY_API_KEY;
  const hasGoogle = !!process.env.GOOGLE_SEARCH_API_KEY && !!process.env.GOOGLE_SEARCH_CX;

  if (hasTavily) {
    return new TavilySearchProvider();
  }

  if (hasGoogle) {
    return new GoogleSearchProvider();
  }

  // Fallback to mock provider for development
  return new MockSearchProvider();
}

// Placeholder implementations - will be overridden by specific providers
import { MockSearchProvider } from './mock-search-provider';

class TavilySearchProvider extends BaseSearchProvider {
  name = 'tavily';

  async search(query: SearchQuery): Promise<SearchResult[]> {
    // Implementation would call Tavily API
    return [];
  }

  isAvailable(): boolean {
    return !!process.env.TAVILY_API_KEY;
  }
}

class GoogleSearchProvider extends BaseSearchProvider {
  name = 'google';

  async search(query: SearchQuery): Promise<SearchResult[]> {
    // Implementation would call Google Custom Search API
    return [];
  }

  isAvailable(): boolean {
    return !!process.env.GOOGLE_SEARCH_API_KEY && !!process.env.GOOGLE_SEARCH_CX;
  }
}
