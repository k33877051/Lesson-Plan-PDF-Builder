// AI Research Search Module
// Supports multiple search providers: Tavily, Google Custom Search

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  platform: string;
  publishedAt?: Date;
  author?: string;
}

export interface SearchQuery {
  query: string;
  platform: string; // 'web', 'google', 'youtube', 'academic'
  topic: string;
  subject: string;
  gradeLevel: string;
}

// Tavily AI Search - Primary academic search
async function searchTavily(
  query: string,
  apiKey: string
): Promise<SearchResult[]> {
  if (!apiKey) {
    console.warn('Tavily API key not configured');
    return [];
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: 'advanced',
        include_answer: false,
        include_images: false,
        include_raw_content: false,
        max_results: 10,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }

    const data = await response.json();

    return data.results.map((result: {
      title: string;
      url: string;
      content: string;
      published_date?: string;
      author?: string;
    }) => ({
      title: result.title,
      url: result.url,
      snippet: result.content,
      platform: 'web',
      publishedAt: result.published_date ? new Date(result.published_date) : undefined,
      author: result.author,
    }));
  } catch (error) {
    console.error('Tavily search error:', error);
    return [];
  }
}

// Google Custom Search - Fallback option
async function searchGoogle(
  query: string,
  apiKey: string,
  cx: string
): Promise<SearchResult[]> {
  if (!apiKey || !cx) {
    console.warn('Google Custom Search not configured');
    return [];
  }

  try {
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('cx', cx);
    url.searchParams.set('q', query);
    url.searchParams.set('num', '10');

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.items) {
      return [];
    }

    return data.items.map((item: {
      title: string;
      link: string;
      snippet: string;
      pagemap?: { metatags?: [{ article?: { author?: string; published_time?: string } }] };
    }) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      platform: 'google',
      author: item.pagemap?.metatags?.[0]?.article?.author,
      publishedAt: item.pagemap?.metatags?.[0]?.article?.published_time
        ? new Date(item.pagemap.metatags[0].article.published_time)
        : undefined,
    }));
  } catch (error) {
    console.error('Google search error:', error);
    return [];
  }
}

// YouTube Data API for educational videos
async function searchYouTube(
  query: string,
  apiKey: string
): Promise<SearchResult[]> {
  if (!apiKey) {
    console.warn('YouTube API key not configured');
    return [];
  }

  try {
    // Add educational filter
    const eduQuery = `${query} education tutorial lesson`;
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('q', eduQuery);
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('type', 'video');
    url.searchParams.set('maxResults', '5');
    url.searchParams.set('relevanceLanguage', 'th');

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.items) {
      return [];
    }

    return data.items.map((item: {
      id: { videoId: string };
      snippet: {
        title: string;
        description: string;
        publishedAt: string;
        channelTitle: string;
      };
    }) => ({
      title: item.snippet.title,
      url: `https://youtube.com/watch?v=${item.id.videoId}`,
      snippet: item.snippet.description,
      platform: 'youtube',
      author: item.snippet.channelTitle,
      publishedAt: new Date(item.snippet.publishedAt),
    }));
  } catch (error) {
    console.error('YouTube search error:', error);
    return [];
  }
}

// Generate optimized search queries for lesson planning
export function generateSearchQueries(
  topic: string,
  subject: string,
  gradeLevel: string
): SearchQuery[] {
  const queries: SearchQuery[] = [];

  // Academic/lesson plan queries
  queries.push({
    query: `แผนการสอน ${subject} ${topic} ระดับ ${gradeLevel}`,
    platform: 'web',
    topic,
    subject,
    gradeLevel,
  });

  queries.push({
    query: `การสอน ${topic} ${gradeLevel} วัตถุประสงค์ กิจกรรม`,
    platform: 'web',
    topic,
    subject,
    gradeLevel,
  });

  queries.push({
    query: `lesson plan ${subject} ${topic} objectives activities assessment`,
    platform: 'web',
    topic,
    subject,
    gradeLevel,
  });

  // Educational resources
  queries.push({
    query: `สื่อการสอน ${topic} ${gradeLevel} แบบฝึกหัด`,
    platform: 'web',
    topic,
    subject,
    gradeLevel,
  });

  // YouTube tutorials (if enabled)
  queries.push({
    query: `สอน ${topic} วิธีสอน ${subject}`,
    platform: 'youtube',
    topic,
    subject,
    gradeLevel,
  });

  return queries;
}

// Main search function - tries multiple providers
export async function performSearch(
  searchQuery: SearchQuery
): Promise<SearchResult[]> {
  const tavilyKey = process.env.TAVILY_API_KEY;
  const googleKey = process.env.GOOGLE_SEARCH_API_KEY;
  const googleCx = process.env.GOOGLE_SEARCH_CX;
  const youtubeKey = process.env.YOUTUBE_API_KEY;

  let results: SearchResult[] = [];

  // Try primary search provider based on platform
  if (searchQuery.platform === 'youtube' && youtubeKey) {
    results = await searchYouTube(searchQuery.query, youtubeKey);
  } else if (tavilyKey) {
    results = await searchTavily(searchQuery.query, tavilyKey);
  } else if (googleKey && googleCx) {
    results = await searchGoogle(searchQuery.query, googleKey, googleCx);
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  return results.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}

// Execute multiple searches in parallel
export async function performBatchSearch(
  queries: SearchQuery[]
): Promise<Map<string, SearchResult[]>> {
  const results = new Map<string, SearchResult[]>();

  // Rate limiting - process in batches of 3
  const batchSize = 3;
  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (query) => ({
        query,
        results: await performSearch(query),
      }))
    );

    for (const { query, results: searchResults } of batchResults) {
      results.set(query.query, searchResults);
    }

    // Add small delay between batches to respect rate limits
    if (i + batchSize < queries.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}
