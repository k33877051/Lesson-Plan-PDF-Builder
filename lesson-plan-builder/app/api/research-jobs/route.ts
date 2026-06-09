// POST /api/research-jobs
// Creates a research job, runs mock research agent, returns job and ranked sources

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { runResearchJob, ResearchJobConfig } from '@/lib/research/research-agent';

// Request validation schema
const createResearchJobSchema = z.object({
  topic: z.string().min(1, 'กรุณาระบุหัวข้อ'),
  subject: z.string().min(1, 'กรุณาระบุวิชา'),
  gradeLevel: z.string().min(1, 'กรุณาระบุระดับชั้น'),
  lessonPlanId: z.string().optional(),
  maxResults: z.number().int().min(1).max(20).optional().default(10),
  minScore: z.number().int().min(0).max(100).optional().default(40),
});

export type CreateResearchJobRequest = z.infer<typeof createResearchJobSchema>;

export interface CreateResearchJobResponse {
  success: boolean;
  jobId?: string;
  status?: string;
  sources?: Array<{
    sourceId: string;
    title: string;
    url: string;
    platform: string;
    snippet: string;
    credibilityScore: number;
    relevanceScore: number;
    totalScore: number;
    qualityLabel: string;
  }>;
  totalSources?: number;
  highQualitySources?: number;
  error?: string;
  details?: Array<{ field: string; message: string }>;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateResearchJobResponse>> {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = createResearchJobSchema.safeParse(body);

    if (!validation.success) {
      const details = validation.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      return NextResponse.json(
        {
          success: false,
          error: 'ข้อมูลไม่ถูกต้อง',
          details,
        },
        { status: 400 }
      );
    }

    const { topic, subject, gradeLevel, lessonPlanId, maxResults, minScore } =
      validation.data;

    // Validate lesson plan exists if provided
    if (lessonPlanId) {
      const lessonPlan = await prisma.lessonPlan.findUnique({
        where: { id: lessonPlanId },
        select: { id: true },
      });

      if (!lessonPlan) {
        return NextResponse.json(
          {
            success: false,
            error: 'ไม่พบแผนการสอนที่ระบุ',
          },
          { status: 404 }
        );
      }
    }

    // Configure and run research job
    const config: ResearchJobConfig = {
      topic,
      subject,
      gradeLevel,
      maxResults,
      minScore,
      useMock: true, // Always use mock provider for now
    };

    // Run the research agent
    const result = await runResearchJob(config, lessonPlanId);

    // Return success response
    return NextResponse.json({
      success: true,
      jobId: result.jobId,
      status: result.status,
      sources: result.sources.map((source) => ({
        sourceId: source.sourceId,
        title: source.title,
        url: source.url,
        platform: source.platform,
        snippet: source.snippet.slice(0, 200) + (source.snippet.length > 200 ? '...' : ''),
        credibilityScore: source.credibilityScore,
        relevanceScore: source.relevanceScore,
        totalScore: source.totalScore,
        qualityLabel: source.qualityLabel,
      })),
      totalSources: result.totalSources,
      highQualitySources: result.highQualitySources,
    });
  } catch (error) {
    console.error('Research job creation error:', error);

    // Handle specific error types
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'ข้อมูลไม่ถูกต้อง',
          details: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'เกิดข้อผิดพลาดในการสร้างงานค้นคว้า',
      },
      { status: 500 }
    );
  }
}

// GET /api/research-jobs?jobId=xxx
// Get status of existing research job
const getJobQuerySchema = z.object({
  jobId: z.string().min(1),
});

export interface GetResearchJobResponse {
  success: boolean;
  job?: {
    jobId: string;
    status: string;
    topic: string;
    subject: string;
    gradeLevel: string;
    sources: Array<{
      sourceId: string;
      title: string;
      url: string;
      platform: string;
      snippet: string;
      credibilityScore: number;
      relevanceScore: number;
      totalScore: number;
      qualityLabel: string;
    }>;
    totalSources: number;
    highQualitySources: number;
  };
  error?: string;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<GetResearchJobResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    const validation = getJobQuerySchema.safeParse({ jobId });

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'กรุณาระบุ jobId',
        },
        { status: 400 }
      );
    }

    // Import dynamically to avoid circular dependencies
    const { getResearchJobStatus } = await import('@/lib/research/research-agent');
    const result = await getResearchJobStatus(validation.data.jobId);

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบงานค้นคว้า',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job: {
        jobId: result.jobId,
        status: result.status,
        topic: '', // Not stored in status result, would need additional query
        subject: '',
        gradeLevel: '',
        sources: result.sources.map((source) => ({
          sourceId: source.sourceId,
          title: source.title,
          url: source.url,
          platform: source.platform,
          snippet: source.snippet.slice(0, 200),
          credibilityScore: source.credibilityScore,
          relevanceScore: source.relevanceScore,
          totalScore: source.totalScore,
          qualityLabel: source.qualityLabel,
        })),
        totalSources: result.totalSources,
        highQualitySources: result.highQualitySources,
      },
    });
  } catch (error) {
    console.error('Get research job error:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'เกิดข้อผิดพลาดในการดึงข้อมูลงานค้นคว้า',
      },
      { status: 500 }
    );
  }
}
