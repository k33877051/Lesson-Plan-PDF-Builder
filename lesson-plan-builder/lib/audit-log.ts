/**
 * Audit Log Service — บันทึกการกระทำสำคัญในระบบ
 */

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "export"
  | "ai_generate"
  | "github_push"
  | "github_auth"
  | "seed"
  | "registry_sync"
  | "registry_clear";

export type AuditResourceType =
  | "lesson_plan"
  | "project"
  | "ai_settings"
  | "github"
  | "pdf"
  | "system_registry"
  | "research";

export interface AuditLogInput {
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
}

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return request.headers.get("x-real-ip");
}

/** บันทึก audit log (ไม่ throw — ไม่ให้กระทบ main flow) */
export async function writeAuditLog(
  request: NextRequest,
  input: AuditLogInput
): Promise<void> {
  try {
    const safeMetadata = input.metadata
      ? JSON.parse(JSON.stringify(input.metadata))
      : {};

    await prisma.auditLog.create({
      data: {
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId ?? null,
        metadata: safeMetadata as object,
        ipAddress: getClientIp(request),
        userAgent: request.headers.get("user-agent"),
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
