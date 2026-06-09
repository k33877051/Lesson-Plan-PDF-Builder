// GET /api/research/sources?jobId=xxx - List sources for a job
// POST /api/research/sources/[id]/link - Link source to lesson plan

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// GET - List sources
const getQuerySchema = z.object({
  jobId: z.string().min(1).optional(),
  lessonPlanId: z.string().min(1).optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
});

export interface ListSourcesResponse {
  success: boolean;
  sources?: Array<{
    id: string;
    title: string;
    url: string;
    platform: string;
    snippet: string | null;
    fullText: string | null;
    author: string | null;
    publishedAt: string | null;
    credibilityScore: number;
    relevanceScore: number;
    totalScore: number;
    language: string;
    chunkCount: number;
    isLinked: boolean;
  }>;
  error?: string;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ListSourcesResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const params = {
      jobId: searchParams.get('jobId') || undefined,
      lessonPlanId: searchParams.get('lessonPlanId') || undefined,
      minScore: searchParams.get('minScore')
        ? parseInt(searchParams.get('minScore')!)
        : undefined,
    };

    const validation = getQuerySchema.safeParse(params);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid parameters: ' + validation.error.message,
        },
        { status: 400 }
      );
    }

    const { jobId, lessonPlanId, minScore } = validation.data;

    if (!jobId && !lessonPlanId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either jobId or lessonPlanId is required',
        },
        { status: 400 }
      );
    }

    // Build where clause inline
    const sources = await prisma.researchSource.findMany({
      where: {
        ...(jobId ? { researchJobId: jobId } : {}),
        ...(minScore !== undefined
          ? {
              AND: [
                { credibilityScore: { gte: minScore } },
                { relevanceScore: { gte: minScore } },
              ],
            }
          : {}),
      },
      orderBy: [
        { credibilityScore: 'desc' },
        { relevanceScore: 'desc' },
      ],
      take: 50,
      include: {
        _count: {
          select: { chunks: true },
        },
        lessonPlans:
          lessonPlanId !== undefined
            ? {
                where: { lessonPlanId: lessonPlanId },
              }
            : false,
      },
    });

    // Get linked source IDs for this lesson plan
    let linkedSourceIds = new Set<string>();
    if (lessonPlanId) {
      const linked = await prisma.lessonPlanSource.findMany({
        where: { lessonPlanId },
        select: { sourceId: true },
      });
      linkedSourceIds = new Set(linked.map((l) => l.sourceId));
    }

    return NextResponse.json({
      success: true,
      sources: sources.map((s) => ({
        id: s.id,
        title: s.title,
        url: s.url,
        platform: s.platform,
        snippet: s.snippet,
        fullText: s.fullText,
        author: s.author,
        publishedAt: s.publishedAt?.toISOString() || null,
        credibilityScore: s.credibilityScore,
        relevanceScore: s.relevanceScore,
        totalScore: Math.round(
          (s.credibilityScore + s.relevanceScore) / 2
        ),
        language: s.language,
        chunkCount: s._count.chunks,
        isLinked: linkedSourceIds.has(s.id),
      })),
    });
  } catch (error) {
    console.error('List sources error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST - Link source to lesson plan
const linkSchema = z.object({
  sourceId: z.string().min(1),
  lessonPlanId: z.string().min(1),
  citationNote: z.string().optional(),
});

export interface LinkSourceResponse {
  success: boolean;
  linkId?: string;
  message?: string;
  error?: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<LinkSourceResponse>> {
  try {
    const body = await request.json();
    const validation = linkSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request: ' + validation.error.message,
        },
        { status: 400 }
      );
    }

    const { sourceId, lessonPlanId, citationNote } = validation.data;

    // Check if link already exists
    const existing = await prisma.lessonPlanSource.findUnique({
      where: {
        lessonPlanId_sourceId: {
          lessonPlanId,
          sourceId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        linkId: existing.id,
        message: 'Source already linked to lesson plan',
      });
    }

    // Create link
    const link = await prisma.lessonPlanSource.create({
      data: {
        lessonPlanId,
        sourceId,
        citationNote,
      },
    });

    return NextResponse.json({
      success: true,
      linkId: link.id,
      message: 'Source linked to lesson plan successfully',
    });
  } catch (error) {
    console.error('Link source error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE - Unlink source from lesson plan
const unlinkSchema = z.object({
  sourceId: z.string().min(1),
  lessonPlanId: z.string().min(1),
});

export interface UnlinkSourceResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function DELETE(
  request: NextRequest
): Promise<NextResponse<UnlinkSourceResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const params = {
      sourceId: searchParams.get('sourceId') || '',
      lessonPlanId: searchParams.get('lessonPlanId') || '',
    };

    const validation = unlinkSchema.safeParse(params);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid parameters: ' + validation.error.message,
        },
        { status: 400 }
      );
    }

    const { sourceId, lessonPlanId } = validation.data;

    // Delete the link
    await prisma.lessonPlanSource.deleteMany({
      where: {
        lessonPlanId,
        sourceId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Source unlinked from lesson plan',
    });
  } catch (error) {
    console.error('Unlink source error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
