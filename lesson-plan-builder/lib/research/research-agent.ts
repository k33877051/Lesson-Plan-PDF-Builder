// Research Agent
// Orchestrates the complete research pipeline

import { prisma } from '@/lib/prisma';
import { MockSearchProvider } from './mock-search-provider';
import {
  calculateSourceScore,
  rankSources,
  getQualityLabel,
} from './scorer';
import { generateCitation } from './citations';

// Re-export types from search-provider
export type { SearchResult, SearchQuery } from './search-provider';

// Research job types
export interface ResearchJobConfig {
  topic: string;
  subject: string;
  gradeLevel: string;
  platforms?: string[];
  maxResults?: number;
  minScore?: number;
  useMock?: boolean;
}

export interface ResearchJobResult {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  queries: ResearchQueryResult[];
  sources: ResearchSourceResult[];
  totalSources: number;
  highQualitySources: number;
  message?: string;
}

export interface ResearchQueryResult {
  queryId: string;
  query: string;
  platform: string;
  status: string;
  resultsCount: number;
}

export interface ResearchSourceResult {
  sourceId: string;
  title: string;
  url: string;
  platform: string;
  snippet: string;
  credibilityScore: number;
  relevanceScore: number;
  educationalScore: number;
  totalScore: number;
  qualityLabel: string;
  isLinked?: boolean;
}

// Generate search queries based on topic, subject, and grade
export function generateResearchQueries(
  topic: string,
  subject: string,
  gradeLevel: string
): Array<{ query: string; platform: string }> {
  const queries: Array<{ query: string; platform: string }> = [];

  const subjectThai = getSubjectThaiName(subject);
  const gradeThai = getGradeThaiName(gradeLevel);

  // Thai government/educational sources
  queries.push({
    query: `แผนการสอน ${subjectThai} ${topic} ${gradeThai} สพฐ`,
    platform: 'government',
  });

  queries.push({
    query: `หน่วยการเรียนรู้ ${subjectThai} ${topic}`,
    platform: 'educational',
  });

  queries.push({
    query: `ใบงาน ${subjectThai} ${topic} ${gradeThai}`,
    platform: 'educational',
  });

  queries.push({
    query: `สื่อการสอน ${subjectThai} ${topic}`,
    platform: 'video',
  });

  // English queries for international sources
  queries.push({
    query: `${topic} ${subject} lesson plan ${gradeLevel}`,
    platform: 'web',
  });

  queries.push({
    query: `${topic} teaching resources activities`,
    platform: 'web',
  });

  queries.push({
    query: `${topic} educational video tutorial`,
    platform: 'youtube',
  });

  // Activity-specific queries
  queries.push({
    query: `กิจกรรมการเรียนรู้ ${topic} ${gradeThai}`,
    platform: 'activity',
  });

  queries.push({
    query: `แบบฝึกหัด ${subjectThai} ${topic}`,
    platform: 'worksheet',
  });

  return queries;
}

// Get Thai subject name
function getSubjectThaiName(subject: string): string {
  const subjectMap: Record<string, string> = {
    mathematics: 'คณิตศาสตร์',
    science: 'วิทยาศาสตร์',
    thai: 'ภาษาไทย',
    english: 'ภาษาอังกฤษ',
    social: 'สังคมศึกษา',
    history: 'ประวัติศาสตร์',
    geography: 'ภูมิศาสตร์',
    physics: 'ฟิสิกส์',
    chemistry: 'เคมี',
    biology: 'ชีววิทยา',
    computer: 'คอมพิวเตอร์',
    art: 'ศิลปะ',
    music: 'ดนตรี',
    pe: 'พลศึกษา',
    health: 'สุขศึกษา',
  };

  return subjectMap[subject.toLowerCase()] || subject;
}

// Get Thai grade name
function getGradeThaiName(gradeLevel: string): string {
  const gradeMap: Record<string, string> = {
    p1: 'ป.1',
    p2: 'ป.2',
    p3: 'ป.3',
    p4: 'ป.4',
    p5: 'ป.5',
    p6: 'ป.6',
    m1: 'ม.1',
    m2: 'ม.2',
    m3: 'ม.3',
    m4: 'ม.4',
    m5: 'ม.5',
    m6: 'ม.6',
    vocational: 'อาชีวะ',
    university: 'มหาวิทยาลัย',
  };

  return gradeMap[gradeLevel.toLowerCase()] || gradeLevel;
}

// Create chunks from source content
export async function createSourceChunks(
  sourceId: string,
  content: string,
  maxChunkSize: number = 1000
): Promise<void> {
  // Simple chunking by paragraphs and length
  const paragraphs = content.split(/\n\n+/);
  const chunks: Array<{ content: string; summary?: string }> = [];

  let currentChunk = '';
  for (const para of paragraphs) {
    if ((currentChunk + para).length <= maxChunkSize) {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    } else {
      if (currentChunk) {
        chunks.push({
          content: currentChunk,
          summary: currentChunk.slice(0, 200) + '...',
        });
      }
      currentChunk = para;
    }
  }

  if (currentChunk) {
    chunks.push({
      content: currentChunk,
      summary: currentChunk.slice(0, 200) + '...',
    });
  }

  // Save chunks to database
  for (const chunk of chunks) {
    await prisma.sourceChunk.create({
      data: {
        sourceId,
        content: chunk.content,
        summary: chunk.summary,
      },
    });
  }
}

// Main research orchestration
export async function runResearchJob(
  config: ResearchJobConfig,
  lessonPlanId?: string
): Promise<ResearchJobResult> {
  const { topic, subject, gradeLevel, maxResults = 10, minScore = 40 } = config;

  // 1. Create research job in database
  const job = await prisma.researchJob.create({
    data: {
      topic,
      subject,
      gradeLevel,
      status: 'RUNNING',
      lessonPlanId,
    },
  });

  try {
    // 2. Generate search queries
    const queries = generateResearchQueries(topic, subject, gradeLevel);

    // 3. Save queries to database
    const queryRecords = await Promise.all(
      queries.map((q) =>
        prisma.researchQuery.create({
          data: {
            researchJobId: job.id,
            query: q.query,
            platform: q.platform,
            status: 'RUNNING',
          },
        })
      )
    );

    // 4. Execute searches (using mock provider for now)
    const searchProvider = new MockSearchProvider();
    const allResults: Array<{
      queryId: string;
      platform: string;
      results: Awaited<ReturnType<typeof searchProvider.search>>;
    }> = [];

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      const queryRecord = queryRecords[i];

      try {
        const results = await searchProvider.search({
          query: query.query,
          platform: query.platform,
          topic,
          subject,
          gradeLevel,
        });

        allResults.push({
          queryId: queryRecord.id,
          platform: query.platform,
          results,
        });

        // Update query status
        await prisma.researchQuery.update({
          where: { id: queryRecord.id },
          data: {
            status: 'COMPLETED',
            resultsCount: results.length,
          },
        });
      } catch (error) {
        console.error(`Search error for query ${query.query}:`, error);
        await prisma.researchQuery.update({
          where: { id: queryRecord.id },
          data: { status: 'FAILED' },
        });
      }
    }

    // 5. Flatten and deduplicate results
    const uniqueUrls = new Set<string>();
    const flatResults: Array<{
      queryId: string;
      result: (typeof allResults)[0]['results'][0];
    }> = [];

    for (const { queryId, results } of allResults) {
      for (const result of results) {
        if (!uniqueUrls.has(result.url)) {
          uniqueUrls.add(result.url);
          flatResults.push({ queryId, result });
        }
      }
    }

    // 6. Score and rank sources
    const rankedSources = rankSources(
      flatResults.map((item) => ({
        ...item.result,
        queryId: item.queryId,
      })),
      topic,
      subject,
      gradeLevel,
      minScore
    );

    // 7. Save sources to database and create chunks
    const savedSources: ResearchSourceResult[] = [];

    for (const source of rankedSources.slice(0, maxResults)) {
      try {
        // Generate citation
        const citation = generateCitation(
          source.title,
          source.url,
          source.author,
          source.publishedAt,
          source.platform,
          'thai'
        );

        // Save source
        const savedSource = await prisma.researchSource.create({
          data: {
            researchJobId: job.id,
            title: source.title,
            url: source.url,
            platform: source.platform,
            snippet: source.snippet,
            author: source.author,
            publishedAt: source.publishedAt,
            credibilityScore: source.scores.credibilityScore,
            relevanceScore: source.scores.relevanceScore,
            // Store educational score in fullText temporarily if needed
            fullText: `Educational Score: ${source.scores.educationalScore}\n\nCitation: ${citation}`,
            language: 'th',
          },
        });

        // Create chunks from snippet (in real implementation, would fetch full content)
        await createSourceChunks(savedSource.id, source.snippet || '');

        savedSources.push({
          sourceId: savedSource.id,
          title: source.title,
          url: source.url,
          platform: source.platform,
          snippet: source.snippet || '',
          credibilityScore: source.scores.credibilityScore,
          relevanceScore: source.scores.relevanceScore,
          educationalScore: source.scores.educationalScore,
          totalScore: source.scores.totalScore,
          qualityLabel: getQualityLabel(source.scores.totalScore),
        });
      } catch (error) {
        console.error(`Error saving source ${source.url}:`, error);
      }
    }

    // 8. Update job status
    await prisma.researchJob.update({
      where: { id: job.id },
      data: { status: 'COMPLETED' },
    });

    // 9. Return results
    return {
      jobId: job.id,
      status: 'completed',
      queries: queryRecords.map((q) => ({
        queryId: q.id,
        query: q.query,
        platform: q.platform,
        status: q.status,
        resultsCount: q.resultsCount || 0,
      })),
      sources: savedSources,
      totalSources: savedSources.length,
      highQualitySources: savedSources.filter((s) => s.totalScore >= 70).length,
    };
  } catch (error) {
    // Update job as failed
    await prisma.researchJob.update({
      where: { id: job.id },
      data: { status: 'FAILED' },
    });

    throw error;
  }
}

// Get research job status
export async function getResearchJobStatus(
  jobId: string
): Promise<ResearchJobResult | null> {
  const job = await prisma.researchJob.findUnique({
    where: { id: jobId },
    include: {
      queries: true,
      sources: {
        include: {
          _count: {
            select: { chunks: true },
          },
        },
      },
    },
  });

  if (!job) return null;

  // Calculate scores from stored data
  const sources: ResearchSourceResult[] = job.sources.map((source) => {
    const totalScore = Math.round(
      (source.credibilityScore + source.relevanceScore) / 2
    );

    return {
      sourceId: source.id,
      title: source.title,
      url: source.url,
      platform: source.platform,
      snippet: source.snippet || '',
      credibilityScore: source.credibilityScore,
      relevanceScore: source.relevanceScore,
      educationalScore: 0, // Not stored separately in DB
      totalScore,
      qualityLabel: getQualityLabel(totalScore),
    };
  });

  return {
    jobId: job.id,
    status: job.status.toLowerCase() as ResearchJobResult['status'],
    queries: job.queries.map((q) => ({
      queryId: q.id,
      query: q.query,
      platform: q.platform,
      status: q.status.toLowerCase(),
      resultsCount: q.resultsCount || 0,
    })),
    sources,
    totalSources: sources.length,
    highQualitySources: sources.filter((s) => s.totalScore >= 70).length,
  };
}

// Link source to lesson plan
export async function linkSourceToLessonPlan(
  sourceId: string,
  lessonPlanId: string,
  citationNote?: string
): Promise<boolean> {
  try {
    await prisma.lessonPlanSource.create({
      data: {
        lessonPlanId,
        sourceId,
        citationNote,
      },
    });
    return true;
  } catch (error) {
    // Already linked or other error
    console.error('Error linking source:', error);
    return false;
  }
}

// Unlink source from lesson plan
export async function unlinkSourceFromLessonPlan(
  sourceId: string,
  lessonPlanId: string
): Promise<boolean> {
  try {
    await prisma.lessonPlanSource.deleteMany({
      where: {
        lessonPlanId,
        sourceId,
      },
    });
    return true;
  } catch (error) {
    console.error('Error unlinking source:', error);
    return false;
  }
}

// Get sources for lesson plan
export async function getLessonPlanSources(
  lessonPlanId: string
): Promise<ResearchSourceResult[]> {
  const links = await prisma.lessonPlanSource.findMany({
    where: { lessonPlanId },
    include: {
      source: true,
    },
  });

  return links.map((link) => {
    const totalScore = Math.round(
      (link.source.credibilityScore + link.source.relevanceScore) / 2
    );

    return {
      sourceId: link.source.id,
      title: link.source.title,
      url: link.source.url,
      platform: link.source.platform,
      snippet: link.source.snippet || '',
      credibilityScore: link.source.credibilityScore,
      relevanceScore: link.source.relevanceScore,
      educationalScore: 0,
      totalScore,
      qualityLabel: getQualityLabel(totalScore),
      isLinked: true,
    };
  });
}
