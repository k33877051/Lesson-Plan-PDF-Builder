import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { escapeHtml, sanitizeRichText } from "@/lib/sanitize-html";
import { rateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import { formatChunksForContext } from "@/lib/research/chunk";
import {
  getAIProviderLabel,
  generateObjectWithProviderFallback,
  normalizeLessonPlanAiJson,
  getAIStatus,
} from "@/lib/ai/provider";

// Input validation schema
const generateRequestSchema = z.object({
  subject: z.string().min(1, "กรุณาระบุวิชา"),
  grade: z.string().min(1, "กรุณาระบุระดับชั้น"),
  lessonTitle: z.string().min(1, "กรุณาระบุหัวข้อบทเรียน"),
  duration: z.string().max(80).optional(),
  context: z.string().max(1000).optional(),
  researchJobId: z.string().optional(), // Optional research context
  useResearchSources: z.boolean().optional().default(false),
});

// Output schema for structured generation
const lessonPlanContentSchema = z.object({
  objectives: z.array(z.string()).describe("วัตถุประสงค์การเรียนรู้ 3-5 ข้อ"),
  keyConcepts: z.array(z.string()).describe("สาระสำคัญ/แนวคิดหลัก 3-5 ข้อ"),
  activities: z.array(
    z.object({
      phase: z.enum(["ก่อนเรียน", "ขณะเรียน", "หลังเรียน"]),
      title: z.string(),
      description: z.string(),
      duration: z.string().describe("ระยะเวลาของกิจกรรม หากไม่ระบุให้ใช้ค่าว่าง"),
    })
  ).describe("กิจกรรมการเรียนรู้แบ่งตามขั้นตอน"),
  assessment: z.array(
    z.object({
      method: z.string(),
      criteria: z.string(),
      tool: z.string().describe("เครื่องมือประเมินผล หากไม่ระบุให้ใช้ค่าว่าง"),
    })
  ).describe("วิธีการวัดและประเมินผล"),
  summary: z.string().describe("สรุปเนื้อหาหลักของบทเรียน"),
  mediaResources: z.array(z.string()).describe("สื่อและแหล่งเรียนรู้ที่แนะนำ"),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;
export type LessonPlanContent = z.infer<typeof lessonPlanContentSchema>;

// Fetch research sources for context
async function getResearchContext(
  jobId: string,
  maxSources: number = 5
): Promise<{ sources: Array<{ title: string; url: string; content: string; score: number }>; citations: string[] }> {
  // Get high-quality sources from research job
  const sources = await prisma.researchSource.findMany({
    where: {
      researchJobId: jobId,
      fullText: { not: null },
      AND: [
        { credibilityScore: { gte: 40 } },
        { relevanceScore: { gte: 40 } },
      ],
    },
    orderBy: [
      { relevanceScore: "desc" },
      { credibilityScore: "desc" },
    ],
    take: maxSources,
    include: {
      chunks: {
        orderBy: { createdAt: "asc" },
        take: 3, // Limit chunks per source
      },
    },
  });

  const formatted = sources.map((s) => ({
    title: s.title,
    url: s.url,
    content: s.fullText?.slice(0, 2000) || "", // Limit content length
    score: Math.round((s.credibilityScore + s.relevanceScore) / 2),
  }));

  const citations = sources.map(
    (s, i) => `[${i + 1}] ${s.title} (${s.platform}) - ${s.url}`
  );

  return { sources: formatted, citations };
}

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, "ai-generate", {
      windowMs: 60_000,
      maxRequests: 5,
    });
    if (limited) return limited;

    const aiStatus = await getAIStatus();
    if (!aiStatus.configured) {
      return NextResponse.json(
        { success: false, error: "ยังไม่มี AI Provider ที่พร้อมใช้งาน กรุณาตั้งค่าใน Settings" },
        { status: 500 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = generateRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "ข้อมูลไม่ครบถ้วน",
          details: validation.error.issues.map(issue => ({
            field: issue.path.join("."),
            message: issue.message,
          }))
        },
        { status: 400 }
      );
    }

    const { subject, grade, lessonTitle, duration, context, researchJobId, useResearchSources } = validation.data;

    // Fetch research context if requested
    let researchContext = "";
    let researchCitations: string[] = [];
    if (useResearchSources && researchJobId) {
      try {
        const { sources, citations } = await getResearchContext(researchJobId);
        if (sources.length > 0) {
          researchContext = `\n\nข้อมูลอ้างอิงจากการค้นคว้า:\n${sources.map((s, i) => `[${i + 1}] ${s.title}:\n${s.content.slice(0, 500)}...`).join("\n\n")}`;
          researchCitations = citations;
        }
      } catch (err) {
        console.warn("Failed to fetch research context:", err);
      }
    }

    // Build the prompt
    const systemPrompt = `คุณเป็นครูผู้เชี่ยวชาญในการจัดทำแผนการสอนสำหรับการศึกษาไทย 
โปรดสร้างเนื้อหาแผนการสอนที่ครบถ้วนและสมบูรณ์ โดยใช้ภาษาไทยที่ถูกต้องเหมาะสมกับการศึกษา

กฎการสร้างเนื้อหา:
1. วัตถุประสงค์ต้องวัดผลได้ ใช้กริยาดีเด่น (อธิบาย, วิเคราะห์, สร้าง, เปรียบเทียบ ฯลฯ)
2. กิจกรรมต้องสอดคล้องกับวัตถุประสงค์ และแบ่งเป็นขั้นตอนที่ชัดเจน
3. การประเมินผลต้องสอดคล้องกับวัตถุประสงค์และกิจกรรม
4. เนื้อหาต้องเหมาะสมกับระดับชั้นและวิชาที่ระบุ
5. หากมีข้อมูลอ้างอิง ให้นำมาใช้เพื่อสร้างเนื้อหาที่มีคุณภาพและอ้างอิงถูกต้อง`;

    const userPrompt = `สร้างแผนการสอนสำหรับ:

วิชา: ${subject}
ระดับชั้น: ${grade}
หัวข้อ: ${lessonTitle}
${duration ? `ระยะเวลา: ${duration}` : ""}
${context ? `บริบทเพิ่มเติม: ${context}` : ""}${researchContext}

โปรดสร้างเนื้อหาที่ครอบคลุม:
1. วัตถุประสงค์การเรียนรู้ (3-5 ข้อ)
2. สาระสำคัญ/แนวคิดหลัก (3-5 ข้อ)
3. กิจกรรมการเรียนรู้ (แบ่งเป็น 3 ขั้นตอน: ก่อนเรียน, ขณะเรียน, หลังเรียน)
4. การวัดและประเมินผล (2-3 วิธี)
5. สรุปเนื้อหาหลัก
6. สื่อและแหล่งเรียนรู้ที่แนะนำ (3-5 รายการ)
${researchCitations.length > 0 ? `\nอ้างอิง:\n${researchCitations.join("\n")}` : ""}`;

    // Generate content using AI SDK with structured output + provider fallback
    const { object, provider, fallbackUsed, modelUsed } =
      await generateObjectWithProviderFallback({
      functionKey: "ai_helper",
      schema: lessonPlanContentSchema,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
      normalizeParsedJson: normalizeLessonPlanAiJson,
    });

    // Convert arrays to HTML format for Tiptap editor
    const formatToHtml = (items: string[]) => {
      if (items.length === 0) return "<p></p>";
      return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
    };

    const formatActivitiesToHtml = (activities: LessonPlanContent["activities"]) => {
      if (activities.length === 0) return "<p></p>";
      
      const phases = ["ก่อนเรียน", "ขณะเรียน", "หลังเรียน"] as const;
      let html = "";
      
      phases.forEach(phase => {
        const phaseActivities = activities.filter(a => a.phase === phase);
        if (phaseActivities.length > 0) {
          html += `<h3><strong>ขั้นตอน${phase}</strong></h3>`;
          phaseActivities.forEach((activity, index) => {
            html += `<p><strong>${index + 1}. ${escapeHtml(activity.title)}</strong>${
              activity.duration ? ` (${escapeHtml(activity.duration)})` : ""
            }</p>`;
            html += `<p>${escapeHtml(activity.description)}</p>`;
          });
        }
      });
      
      return html || "<p></p>";
    };

    const formatAssessmentToHtml = (assessments: LessonPlanContent["assessment"]) => {
      if (assessments.length === 0) return "<p></p>";
      
      let html = "<ul>";
      assessments.forEach(assessment => {
        html += `<li><strong>${escapeHtml(assessment.method)}</strong> - ${escapeHtml(assessment.criteria)}`;
        if (assessment.tool) {
          html += ` (เครื่องมือ: ${escapeHtml(assessment.tool)})`;
        }
        html += `</li>`;
      });
      html += "</ul>";
      
      return html;
    };

    // Format the response
    const formattedContent = {
      objectives: sanitizeRichText(formatToHtml(object.objectives)),
      keyConcepts: sanitizeRichText(formatToHtml(object.keyConcepts)),
      learningActivities: sanitizeRichText(formatActivitiesToHtml(object.activities)),
      assessment: sanitizeRichText(formatAssessmentToHtml(object.assessment)),
      mediaResources: sanitizeRichText(formatToHtml(object.mediaResources)),
      summary: escapeHtml(object.summary),
      // Also include raw data for potential future use
      raw: object,
    };

    await writeAuditLog(request, {
      action: "ai_generate",
      resourceType: "lesson_plan",
      metadata: { type: "ai_generate", lessonTitle, subject, grade },
    });

    return NextResponse.json({
      success: true,
      data: formattedContent,
      citations: researchCitations.length > 0 ? researchCitations : undefined,
      researchUsed: researchCitations.length > 0,
      meta: {
        provider: provider.key,
        providerName: provider.name,
        model: modelUsed,
        fallbackUsed,
      },
    });

  } catch (error) {
    console.error("AI Generate Error:", error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { success: false, error: "API key ไม่ถูกต้องหรือหมดอายุ" },
          { status: 401 }
        );
      }
      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          { success: false, error: "เกินขีดจำกัดการใช้งาน กรุณาลองใหม่ภายหลัง" },
          { status: 429 }
        );
      }
      if (error.message.includes("quota") || error.message.includes("insufficient_quota")) {
        return NextResponse.json(
          { success: false, error: `โควต้า ${getAIProviderLabel()} ไม่เพียงพอ กรุณาตรวจสอบแพ็กเกจหรือการชำระเงินของ API key` },
          { status: 402 }
        );
      }
      if (
        error.message.includes("access_terminated") ||
        error.message.includes("only available for Coding Agents")
      ) {
        return NextResponse.json(
          { success: false, error: "KIMI Coding API ใช้ได้เฉพาะ Coding Agents ไม่สามารถใช้กับฟีเจอร์สร้างแผนการสอนนี้ได้โดยตรง" },
          { status: 403 }
        );
      }
      if (error.message.includes("ทุก AI Provider ล้มเหลว")) {
        return NextResponse.json(
          {
            success: false,
            error:
              "ทุก AI Provider ล้มเหลว กรุณาตรวจสอบ OpenAI quota, เปิดใช้ Gemini ใน Settings หรือตั้งค่า Ollama model อื่น",
            details: error.message,
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาดในการสร้างเนื้อหา กรุณาลองใหม่",
      },
      { status: 500 }
    );
  }
}
