// POST /api/research/start - Start a research job

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { generateSearchQueries, performSearch } from '@/lib/research/search';

// Research status enum values
const ResearchStatus = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

const startResearchSchema = z.object({
  topic: z.string().min(1),
  subject: z.string().min(1),
  gradeLevel: z.string().min(1),
  lessonPlanId: z.string().optional(),
});

export type StartResearchRequest = z.infer<typeof startResearchSchema>;

export interface StartResearchResponse {
  success: boolean;
  jobId?: string;
  message?: string;
  queryCount?: number;
  error?: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<StartResearchResponse>> {
  try {
    const limited = rateLimit(request, "research-start", {
      windowMs: 60_000,
      maxRequests: 15,
    });
    if (limited) return limited as NextResponse<StartResearchResponse>;

    const body = await request.json();
    const validation = startResearchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request: ' + validation.error.message,
        },
        { status: 400 }
      );
    }

    const { topic, subject, gradeLevel, lessonPlanId } = validation.data;

    // Generate search queries
    const queries = generateSearchQueries(topic, subject, gradeLevel);

    // Create research job
    const job = await prisma.researchJob.create({
      data: {
        topic,
        subject,
        gradeLevel,
        status: ResearchStatus.PENDING,
        lessonPlanId,
        queries: {
          create: queries.map((q) => ({
            query: q.query,
            platform: q.platform,
            status: ResearchStatus.PENDING,
          })),
        },
      },
      include: {
        queries: true,
      },
    });

    // Start research process asynchronously
    // Don't await this - it runs in background
    executeResearchJob(job.id, queries);

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Research job started successfully',
      queryCount: queries.length,
    });
  } catch (error) {
    console.error('Start research error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Background research execution
async function executeResearchJob(
  jobId: string,
  queries: ReturnType<typeof generateSearchQueries>
): Promise<void> {
  try {
    // Update job status to RUNNING
    await prisma.researchJob.update({
      where: { id: jobId },
      data: { status: ResearchStatus.RUNNING },
    });

    // Process each query
    for (const query of queries) {
      try {
        // Update query status
        await prisma.researchQuery.updateMany({
          where: { query: query.query, researchJobId: jobId },
          data: { status: ResearchStatus.RUNNING },
        });

        // Perform search
        const results = await performSearch(query);

        // Save sources
        for (const result of results.slice(0, 5)) {
          // Limit to 5 sources per query
          try {
            await prisma.researchSource.upsert({
              where: { url: result.url },
              create: {
                title: result.title,
                url: result.url,
                platform: result.platform,
                snippet: result.snippet,
                author: result.author,
                publishedAt: result.publishedAt,
                credibilityScore: 50, // Default score
                relevanceScore: 50, // Default score
                language: 'th',
                researchJobId: jobId,
              },
              update: {
                // Update if exists (might have better snippet)
                snippet: result.snippet,
                researchJobId: jobId,
              },
            });
          } catch (sourceError) {
            console.warn('Failed to save source:', result.url, sourceError);
          }
        }

        // Update query status
        await prisma.researchQuery.updateMany({
          where: { query: query.query, researchJobId: jobId },
          data: {
            status: ResearchStatus.COMPLETED,
            resultsCount: results.length,
          },
        });
      } catch (queryError) {
        console.error('Query error:', query.query, queryError);

        // Mark query as failed
        await prisma.researchQuery.updateMany({
          where: { query: query.query, researchJobId: jobId },
          data: { status: ResearchStatus.FAILED },
        });
      }

      // Small delay between queries to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Update job status to COMPLETED
    await prisma.researchJob.update({
      where: { id: jobId },
      data: { status: ResearchStatus.COMPLETED },
    });
  } catch (error) {
    console.error('Research job execution error:', error);

    // Update job status to FAILED
    await prisma.researchJob.update({
      where: { id: jobId },
      data: { status: ResearchStatus.FAILED },
    });
  }
}
