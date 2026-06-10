// GET /api/research/status?jobId=xxx - Get research job status

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

const querySchema = z.object({
  jobId: z.string().min(1),
});

export interface ResearchStatusResponse {
  success: boolean;
  job?: {
    id: string;
    topic: string;
    subject: string;
    gradeLevel: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    queries: Array<{
      id: string;
      query: string;
      platform: string;
      status: string;
      resultsCount: number | null;
      createdAt: string;
    }>;
    sources: Array<{
      id: string;
      title: string;
      url: string;
      platform: string;
      snippet: string | null;
      credibilityScore: number;
      relevanceScore: number;
    }>;
  };
  error?: string;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ResearchStatusResponse>> {
  try {
    const limited = rateLimit(request, "research-status", {
      windowMs: 60_000,
      maxRequests: 60,
    });
    if (limited) return limited as NextResponse<ResearchStatusResponse>;

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    const validation = querySchema.safeParse({ jobId });

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid jobId parameter',
        },
        { status: 400 }
      );
    }

    const job = await prisma.researchJob.findUnique({
      where: { id: validation.data.jobId },
      include: {
        queries: {
          orderBy: { createdAt: 'asc' },
        },
        sources: {
          orderBy: [
            { credibilityScore: 'desc' },
            { relevanceScore: 'desc' },
          ],
          take: 20, // Limit sources in status
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: 'Research job not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        topic: job.topic,
        subject: job.subject,
        gradeLevel: job.gradeLevel,
        status: job.status,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
        queries: job.queries.map((q) => ({
          id: q.id,
          query: q.query,
          platform: q.platform,
          status: q.status,
          resultsCount: q.resultsCount,
          createdAt: q.createdAt.toISOString(),
        })),
        sources: job.sources.map((s) => ({
          id: s.id,
          title: s.title,
          url: s.url,
          platform: s.platform,
          snippet: s.snippet,
          credibilityScore: s.credibilityScore,
          relevanceScore: s.relevanceScore,
        })),
      },
    });
  } catch (error) {
    console.error('Get research status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
