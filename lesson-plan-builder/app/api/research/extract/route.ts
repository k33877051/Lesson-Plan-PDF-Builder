// POST /api/research/extract - Extract and process content from a source URL

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { extractContent } from '@/lib/research/extract';
import {
  calculateSourceScore,
  type SourceScore,
} from '@/lib/research/score';
import { chunkContent } from '@/lib/research/chunk';

const extractSchema = z.object({
  sourceId: z.string().min(1),
});

export interface ExtractResponse {
  success: boolean;
  sourceId?: string;
  content?: {
    title: string;
    content: string;
    author: string | null;
    publishedAt: string | null;
    wordCount: number;
    readingTime: number;
  };
  score?: SourceScore;
  chunks?: Array<{
    id: string;
    position: number;
    content: string;
    wordCount: number;
    hasObjectives: boolean;
    hasActivities: boolean;
    hasAssessment: boolean;
  }>;
  message?: string;
  error?: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ExtractResponse>> {
  try {
    const body = await request.json();
    const validation = extractSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request: ' + validation.error.message,
        },
        { status: 400 }
      );
    }

    const { sourceId } = validation.data;

    // Get source from database
    const source = await prisma.researchSource.findUnique({
      where: { id: sourceId },
      include: {
        researchJob: true,
      },
    });

    if (!source) {
      return NextResponse.json(
        {
          success: false,
          error: 'Source not found',
        },
        { status: 404 }
      );
    }

    // Check if already extracted
    if (source.fullText) {
      const chunks = await prisma.sourceChunk.findMany({
        where: { sourceId },
        orderBy: { createdAt: 'asc' },
      });

      return NextResponse.json({
        success: true,
        sourceId,
        message: 'Content already extracted',
        content: {
          title: source.title,
          content: source.fullText.slice(0, 500) + '...',
          author: source.author,
          publishedAt: source.publishedAt?.toISOString() || null,
          wordCount: chunks.reduce(
            (sum, c) =>
              sum +
              (c.content.match(/[\u0E00-\u0E7F]+|\b[a-zA-Z]+\b/g) || [])
                .length,
            0
          ),
          readingTime: Math.ceil(chunks.length * 2),
        },
        score: {
          credibilityScore: source.credibilityScore,
          relevanceScore: source.relevanceScore,
          educationalScore: 50, // Estimated
          totalScore: Math.round(
            (source.credibilityScore + source.relevanceScore) / 2
          ),
          reasons: ['Previously extracted'],
        },
        chunks: chunks.map((c) => ({
          id: c.id,
          position: 1,
          content: c.content.slice(0, 200) + '...',
          wordCount: c.content.split(/\s+/).length,
          hasObjectives: false,
          hasActivities: false,
          hasAssessment: false,
        })),
      });
    }

    // Extract content from URL
    const extracted = await extractContent(source.url);

    if (extracted.error || !extracted.content) {
      return NextResponse.json(
        {
          success: false,
          error: extracted.error || 'Failed to extract content',
        },
        { status: 422 }
      );
    }

    // Calculate scores
    const score = calculateSourceScore(
      source.url,
      extracted,
      source.researchJob?.topic || '',
      source.researchJob?.subject || '',
      source.researchJob?.gradeLevel || ''
    );

    // Chunk content
    const chunks = chunkContent(extracted.content, source.url);

    // Save to database
    await prisma.$transaction(async (tx) => {
      // Update source with extracted content
      await tx.researchSource.update({
        where: { id: sourceId },
        data: {
          fullText: extracted.content,
          author: extracted.author || source.author,
          publishedAt: extracted.publishedAt || source.publishedAt,
          credibilityScore: score.credibilityScore,
          relevanceScore: score.relevanceScore,
        },
      });

      // Create chunks
      for (const chunk of chunks) {
        await tx.sourceChunk.create({
          data: {
            sourceId,
            content: chunk.content,
            summary: chunk.summary,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      sourceId,
      message: 'Content extracted successfully',
      content: {
        title: extracted.title,
        content: extracted.content.slice(0, 500) + '...',
        author: extracted.author || null,
        publishedAt: extracted.publishedAt?.toISOString() || null,
        wordCount: extracted.wordCount,
        readingTime: extracted.readingTime,
      },
      score,
      chunks: chunks.map((c) => ({
        id: c.id,
        position: c.metadata.position,
        content: c.content.slice(0, 200) + '...',
        wordCount: c.metadata.wordCount,
        hasObjectives: c.metadata.hasObjectives || false,
        hasActivities: c.metadata.hasActivities || false,
        hasAssessment: c.metadata.hasAssessment || false,
      })),
    });
  } catch (error) {
    console.error('Extract content error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
