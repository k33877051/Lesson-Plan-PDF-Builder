import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const SETTINGS_ID = "default";

const settingsSchema = z.object({
  name: z.string().max(120).nullable().optional(),
  email: z.string().email().max(160).nullable().optional().or(z.literal("")),
  phone: z.string().max(40).nullable().optional(),
  school: z.string().max(160).nullable().optional(),
  position: z.string().max(120).nullable().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  fontSize: z.enum(["small", "medium", "large"]).optional(),
  language: z.enum(["th", "en"]).optional(),
  emailAlerts: z.boolean().optional(),
  exportComplete: z.boolean().optional(),
  newFeatures: z.boolean().optional(),
  weeklyReport: z.boolean().optional(),
  defaultFont: z.enum(["sarabun", "notosansthai", "prompt"]).optional(),
  defaultHeader: z.boolean().optional(),
  defaultFooter: z.boolean().optional(),
  pageSize: z.enum(["a4", "letter", "a3"]).optional(),
  margin: z.enum(["narrow", "normal", "wide"]).optional(),
});

function normalizeEmail(email: string | null | undefined) {
  return email === "" ? null : email;
}

export async function GET() {
  try {
    const settings = await prisma.appSetting.upsert({
      where: { id: SETTINGS_ID },
      update: {},
      create: { id: SETTINGS_ID },
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการดึงการตั้งค่า" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = settingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "ข้อมูลการตั้งค่าไม่ถูกต้อง",
          details: validation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const data = validation.data;
    const settings = await prisma.appSetting.upsert({
      where: { id: SETTINGS_ID },
      create: {
        id: SETTINGS_ID,
        ...data,
        email: normalizeEmail(data.email),
      },
      update: {
        ...data,
        email: normalizeEmail(data.email),
      },
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการบันทึกการตั้งค่า" },
      { status: 500 }
    );
  }
}
