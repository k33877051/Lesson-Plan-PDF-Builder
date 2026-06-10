import { prisma } from "@/lib/prisma";
import { ExtractionStatus } from "@/lib/generated/prisma/client";
import { isUsableExtractedText, summarizeText } from "@/lib/services/pdf-extraction";

const MAX_CHARS_PER_PDF = 4000;
const MAX_TOTAL_CHARS = 12000;

export interface ProjectPdfContext {
  projectId: string;
  projectName: string;
  pdfCount: number;
  context: string;
}

/** โหลดข้อความ PDF ที่ดึงแล้วจากโปรเจกต์ เพื่อใส่ใน prompt AI */
export async function getProjectPdfContextForAI(
  projectId: string
): Promise<ProjectPdfContext | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      pdfSources: {
        where: { extractionStatus: ExtractionStatus.COMPLETED },
        select: {
          originalName: true,
          extractedText: true,
          pageCount: true,
        },
      },
    },
  });

  if (!project) return null;

  const usablePdfs = project.pdfSources.filter(
    (pdf) => pdf.extractedText && isUsableExtractedText(pdf.extractedText)
  );

  if (usablePdfs.length === 0) return null;

  let totalLength = 0;
  const sections: string[] = [];

  for (const pdf of usablePdfs) {
    const excerpt = summarizeText(pdf.extractedText!, MAX_CHARS_PER_PDF);
    const section =
      `[ไฟล์: ${pdf.originalName}${pdf.pageCount ? ` (${pdf.pageCount} หน้า)` : ""}]\n` +
      excerpt;

    if (totalLength + section.length > MAX_TOTAL_CHARS) {
      const remaining = MAX_TOTAL_CHARS - totalLength;
      if (remaining > 200) {
        sections.push(section.slice(0, remaining) + "...");
      }
      break;
    }

    sections.push(section);
    totalLength += section.length;
  }

  return {
    projectId: project.id,
    projectName: project.name,
    pdfCount: usablePdfs.length,
    context: sections.join("\n\n---\n\n"),
  };
}
