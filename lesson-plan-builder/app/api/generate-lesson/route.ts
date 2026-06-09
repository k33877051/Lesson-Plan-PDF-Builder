// POST /api/generate-lesson
// Generates lesson plan using selected sources, creates LessonPlan, connects sources

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { generateObject } from 'ai';
import {
  getAIProviderLabel,
  getLessonPlanAIModel,
  getMissingAIConfigKey,
} from '@/lib/ai/provider';

// Request validation schema
const generateLessonSchema = z.object({
  topic: z.string().min(1, 'กรุณาระบุหัวข้อ'),
  subject: z.string().min(1, 'กรุณาระบุวิชา'),
  gradeLevel: z.string().min(1, 'กรุณาระบุระดับชั้น'),
  durationMinutes: z.number().int().min(1).optional(),
  objectives: z.string().optional(),
  sourceIds: z.array(z.string()).min(1, 'กรุณาเลือกอย่างน้อย 1 แหล่งข้อมูล'),
  teacherName: z.string().optional(),
  schoolName: z.string().optional(),
});

export type GenerateLessonRequest = z.infer<typeof generateLessonSchema>;

// Lesson plan content schema for AI generation
const lessonContentSchema = z.object({
  lessonTitle: z.string().describe('ชื่อหน่วยการเรียนรู้'),
  objectives: z
    .array(z.string())
    .describe('วัตถุประสงค์การเรียนรู้ 3-5 ข้อ ใช้กริยาดีเด่น'),
  keyConcepts: z.array(z.string()).describe('สาระสำคัญ/แนวคิดหลัก 3-5 ข้อ'),
  learningActivities: z
    .array(
      z.object({
        phase: z.enum(['ก่อนเรียน', 'ขณะเรียน', 'หลังเรียน']),
        title: z.string(),
        description: z.string(),
        durationMinutes: z
          .number()
          .describe('ระยะเวลากิจกรรมเป็นนาที หากไม่ระบุให้ใช้ 0'),
      })
    )
    .describe('กิจกรรมการเรียนรู้แบ่งตามขั้นตอน'),
  assessment: z
    .array(
      z.object({
        method: z.string(),
        criteria: z.string(),
        tool: z.string().describe('เครื่องมือประเมินผล หากไม่ระบุให้ใช้ค่าว่าง'),
      })
    )
    .describe('วิธีการวัดและประเมินผล'),
  mediaResources: z
    .array(z.string())
    .describe('สื่อและแหล่งเรียนรู้ที่แนะนำ'),
  notes: z.string().describe('หมายเหตุเพิ่มเติม หากไม่มีให้ใช้ค่าว่าง'),
});

export interface GenerateLessonResponse {
  success: boolean;
  lessonPlanId?: string;
  lessonPlan?: {
    id: string;
    lessonTitle: string;
    subjectName: string;
    gradeLevel: string;
    topic: string;
    objectives: string;
    keyConcepts: string;
    learningActivities: string;
    assessment: string;
    mediaResources: string;
    status: string;
    linkedSources: number;
  };
  usedSources?: Array<{
    sourceId: string;
    title: string;
    url: string;
    credibilityScore: number;
  }>;
  citations?: string[];
  error?: string;
  details?: Array<{ field: string; message: string }>;
}

// Helper function to format sources for AI context
function formatSourcesForAI(
  sources: Array<{
    title: string;
    snippet: string | null;
    url: string;
    author: string | null;
  }>
): string {
  return sources
    .map(
      (source, index) =>
        `[แหล่งข้อมูล ${index + 1}]\n` +
        `ชื่อ: ${source.title}\n` +
        `${source.author ? `ผู้เขียน: ${source.author}\n` : ''}` +
        `เนื้อหา: ${source.snippet?.slice(0, 500) || 'ไม่มีคำอธิบาย'}\n` +
        `URL: ${source.url}`
    )
    .join('\n\n---\n\n');
}

// Helper function to convert arrays to HTML
function formatToHtml(items: string[]): string {
  if (items.length === 0) return '<p></p>';
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function formatActivitiesToHtml(
  activities: Array<{
    phase: string;
    title: string;
    description: string;
    durationMinutes?: number;
  }>
): string {
  if (activities.length === 0) return '<p></p>';

  const phases = ['ก่อนเรียน', 'ขณะเรียน', 'หลังเรียน'] as const;
  let html = '';

  phases.forEach((phase) => {
    const phaseActivities = activities.filter((a) => a.phase === phase);
    if (phaseActivities.length > 0) {
      html += `<h3><strong>ขั้นตอน${phase}</strong></h3>`;
      phaseActivities.forEach((activity, index) => {
        html += `<p><strong>${index + 1}. ${escapeHtml(activity.title)}</strong>${
          activity.durationMinutes
            ? ` (${activity.durationMinutes} นาที)`
            : ''
        }</p>`;
        html += `<p>${escapeHtml(activity.description)}</p>`;
      });
    }
  });

  return html || '<p></p>';
}

function formatAssessmentToHtml(
  assessments: Array<{
    method: string;
    criteria: string;
    tool?: string;
  }>
): string {
  if (assessments.length === 0) return '<p></p>';

  let html = '<ul>';
  assessments.forEach((assessment) => {
    html += `<li><strong>${escapeHtml(assessment.method)}</strong> - ${escapeHtml(
      assessment.criteria
    )}`;
    if (assessment.tool) {
      html += ` (เครื่องมือ: ${escapeHtml(assessment.tool)})`;
    }
    html += '</li>';
  });
  html += '</ul>';

  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<GenerateLessonResponse>> {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = generateLessonSchema.safeParse(body);

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

    const {
      topic,
      subject,
      gradeLevel,
      durationMinutes,
      objectives: customObjectives,
      sourceIds,
      teacherName,
      schoolName,
    } = validation.data;

    const missingConfigKey = getMissingAIConfigKey();

    // Check AI provider API key
    if (missingConfigKey) {
      return NextResponse.json(
        {
          success: false,
          error: `ไม่พบ ${missingConfigKey} กรุณาตั้งค่า environment variable`,
        },
        { status: 500 }
      );
    }

    // Retrieve selected sources
    const sources = await prisma.researchSource.findMany({
      where: {
        id: { in: sourceIds },
      },
      select: {
        id: true,
        title: true,
        snippet: true,
        url: true,
        author: true,
        credibilityScore: true,
        relevanceScore: true,
      },
    });

    if (sources.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบแหล่งข้อมูลที่เลือก',
        },
        { status: 404 }
      );
    }

    // Verify all requested sources were found
    const foundIds = new Set(sources.map((s) => s.id));
    const missingIds = sourceIds.filter((id) => !foundIds.has(id));

    if (missingIds.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `ไม่พบแหล่งข้อมูลบางรายการ: ${missingIds.join(', ')}`,
        },
        { status: 404 }
      );
    }

    // Format sources for AI context
    const sourcesContext = formatSourcesForAI(sources);

    // Generate citations
    const citations = sources.map(
      (source, index) =>
        `[${index + 1}] ${source.title}${source.author ? ` - ${source.author}` : ''}`
    );

    // Build AI prompt
    const systemPrompt = `คุณเป็นครูผู้เชี่ยวชาญในการจัดทำแผนการสอนสำหรับการศึกษาไทย
โปรดสร้างแผนการสอนที่ครบถ้วนและสมบูรณ์ โดยใช้ภาษาไทยที่ถูกต้องเหมาะสมกับการศึกษา

กฎการสร้างเนื้อหา:
1. วัตถุประสงค์ต้องวัดผลได้ ใช้กริยาดีเด่น (อธิบาย, วิเคราะห์, สร้าง, เปรียบเทียบ ฯลฯ)
2. กิจกรรมต้องสอดคล้องกับวัตถุประสงค์ และแบ่งเป็นขั้นตอนที่ชัดเจน
3. การประเมินผลต้องสอดคล้องกับวัตถุประสงค์และกิจกรรม
4. เนื้อหาต้องเหมาะสมกับระดับชั้นและวิชาที่ระบุ
5. ใช้ข้อมูลจากแหล่งข้อมูลที่ให้มาเพื่อสร้างเนื้อหาที่มีคุณภาพ`;

    const userPrompt = `สร้างแผนการสอนสำหรับ:

วิชา: ${subject}
ระดับชั้น: ${gradeLevel}
หัวข้อ: ${topic}
${durationMinutes ? `ระยะเวลา: ${durationMinutes} นาที` : ''}
${customObjectives ? `วัตถุประสงค์ที่ต้องการ: ${customObjectives}` : ''}

ข้อมูลอ้างอิงจากแหล่งข้อมูลต่อไปนี้:

${sourcesContext}

โปรดสร้างเนื้อหาแผนการสอนที่ครอบคลุม:
1. ชื่อหน่วยการเรียนรู้ที่เหมาะสม
2. วัตถุประสงค์การเรียนรู้ 3-5 ข้อ (ใช้กริยาดีเด่น)
3. สาระสำคัญ/แนวคิดหลัก 3-5 ข้อ
4. กิจกรรมการเรียนรู้ (แบ่งเป็น 3 ขั้นตอน: ก่อนเรียน, ขณะเรียน, หลังเรียน) พร้อมระบุระยะเวลา
5. การวัดและประเมินผล 2-3 วิธี
6. สื่อและแหล่งเรียนรู้ที่แนะนำ 3-5 รายการ
7. หมายเหตุเพิ่มเติม (ถ้ามี)`;

    // Generate lesson plan content using AI
    const { object: generatedContent } = await generateObject({
      model: getLessonPlanAIModel(),
      schema: lessonContentSchema,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });

    // Format content for storage
    const lessonPlanData = {
      teacherName: teacherName || '',
      schoolName: schoolName || '',
      subjectName: subject,
      gradeLevel: gradeLevel,
      semester: '', // Will be filled by user later
      academicYear: '', // Will be filled by user later
      lessonTitle: generatedContent.lessonTitle,
      topic: topic,
      durationMinutes: durationMinutes || undefined,
      objectives: formatToHtml(generatedContent.objectives),
      keyConcepts: formatToHtml(generatedContent.keyConcepts),
      learningActivities: formatActivitiesToHtml(generatedContent.learningActivities),
      mediaResources: formatToHtml(generatedContent.mediaResources),
      assessment: formatAssessmentToHtml(generatedContent.assessment),
      notes: generatedContent.notes ? `<p>${escapeHtml(generatedContent.notes)}</p>` : undefined,
      status: 'draft',
    };

    // Create lesson plan and connect sources in transaction
    const lessonPlan = await prisma.$transaction(async (tx) => {
      // Create lesson plan
      const newLessonPlan = await tx.lessonPlan.create({
        data: lessonPlanData,
      });

      // Connect sources
      for (const sourceId of sourceIds) {
        await tx.lessonPlanSource.create({
          data: {
            lessonPlanId: newLessonPlan.id,
            sourceId: sourceId,
            citationNote: `อ้างอิงจากแหล่งข้อมูลการค้นคว้า`,
          },
        });
      }

      return newLessonPlan;
    });

    // Return success response
    return NextResponse.json({
      success: true,
      lessonPlanId: lessonPlan.id,
      lessonPlan: {
        id: lessonPlan.id,
        lessonTitle: lessonPlan.lessonTitle,
        subjectName: lessonPlan.subjectName,
        gradeLevel: lessonPlan.gradeLevel,
        topic: lessonPlan.topic || topic,
        objectives: lessonPlan.objectives,
        keyConcepts: lessonPlan.keyConcepts,
        learningActivities: lessonPlan.learningActivities,
        assessment: lessonPlan.assessment,
        mediaResources: lessonPlan.mediaResources,
        status: lessonPlan.status,
        linkedSources: sources.length,
      },
      usedSources: sources.map((source) => ({
        sourceId: source.id,
        title: source.title,
        url: source.url,
        credibilityScore: source.credibilityScore,
      })),
      citations,
    });
  } catch (error) {
    console.error('Lesson generation error:', error);

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

    // Handle AI generation errors
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          {
            success: false,
            error: 'เกินขีดจำกัดการใช้งาน AI กรุณาลองใหม่ภายหลัง',
          },
          { status: 429 }
        );
      }

      if (
        error.message.includes('quota') ||
        error.message.includes('insufficient_quota')
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              `โควต้า ${getAIProviderLabel()} ไม่เพียงพอ กรุณาตรวจสอบแพ็กเกจหรือการชำระเงินของ API key`,
          },
          { status: 402 }
        );
      }

      if (
        error.message.includes('access_terminated') ||
        error.message.includes('only available for Coding Agents')
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              'KIMI Coding API ใช้ได้เฉพาะ Coding Agents ไม่สามารถใช้กับฟีเจอร์สร้างแผนการสอนนี้ได้โดยตรง',
          },
          { status: 403 }
        );
      }

      if (error.message.includes('API key')) {
        return NextResponse.json(
          {
            success: false,
            error: 'API key ไม่ถูกต้องหรือหมดอายุ',
          },
          { status: 401 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'เกิดข้อผิดพลาดในการสร้างแผนการสอน',
      },
      { status: 500 }
    );
  }
}
