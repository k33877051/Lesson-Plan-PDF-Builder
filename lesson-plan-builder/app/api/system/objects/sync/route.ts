/**
 * System Object Registry Sync API
 * 
 * Routes:
 * - POST: Sync objects to the registry
 * 
 * Features:
 * - Register multiple objects in batch
 * - Update existing objects
 * - Validate object data
 * 
 * Security:
 * - Rate limited (admin-level operation)
 * - Validation on all inputs
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess, ApiErrorCode } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit-log";
import { invalidateObjectListCache } from "@/lib/system/registry-cache";
import { scanAllRegistryObjects } from "@/lib/system/registry-scanner";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

// ==========================================
// Validation Schemas
// ==========================================

const objectEntrySchema = z.object({
  objectKey: z.string().min(1).max(200),
  objectName: z.string().min(1).max(200),
  objectType: z.enum([
    "api_route",
    "prisma_model",
    "react_component",
    "service",
    "feature",
    "utility",
    "middleware",
    "type",
    "enum"
  ]),
  module: z.string().min(1).max(100),
  description: z.string().max(2000).optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable().default({}),
  isActive: z.boolean().default(true),
});

const syncRequestSchema = z.object({
  action: z.enum(["sync", "scan"]).optional(),
  objects: z.array(objectEntrySchema).min(1).max(100).optional(),
  mode: z.enum(["upsert", "insert", "update"]).default("upsert"),
  clearExisting: z.boolean().default(false),
});

// ==========================================
// POST /api/system/objects/sync
// ==========================================

export async function POST(request: NextRequest) {
  try {
    // Strict rate limiting for this admin-level operation
    const limited = rateLimit(request, "objects-sync", {
      maxRequests: 10,
      windowMs: 60 * 1000,
    });
    if (limited) return limited;

    const body = await request.json().catch(() => ({}));
    const searchMode = new URL(request.url).searchParams.get("mode");

    if (body.action === "scan" || searchMode === "scan") {
      const scanned = await scanAllRegistryObjects();
      const results = { created: 0, updated: 0, failed: 0, errors: [] as Array<{ objectKey: string; error: string }> };

      for (const obj of scanned) {
        try {
          await prisma.systemObjectRegistry.upsert({
            where: { objectKey: obj.objectKey },
            create: {
              objectKey: obj.objectKey,
              objectName: obj.objectName,
              objectType: obj.objectType,
              module: obj.module,
              description: obj.description ?? null,
              metadata: (obj.metadata ?? {}) as object,
              isActive: obj.isActive,
            },
            update: {
              objectName: obj.objectName,
              objectType: obj.objectType,
              module: obj.module,
              description: obj.description ?? null,
              metadata: (obj.metadata ?? {}) as object,
              isActive: obj.isActive,
            },
          });
          results.created++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            objectKey: obj.objectKey,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      invalidateObjectListCache();
      await writeAuditLog(request, {
        action: "registry_sync",
        resourceType: "system_registry",
        metadata: { mode: "scan", scanned: scanned.length, ...results },
      });

      return apiSuccess(results, {
        meta: {
          message: `สแกนและซิงค์ ${scanned.length} objects: สำเร็จ ${results.created}, ล้มเหลว ${results.failed}`,
          scanned: scanned.length,
        },
      });
    }

    const validation = syncRequestSchema.safeParse(body);

    if (!validation.success) {
      return apiError("Invalid sync request", {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
        details: validation.error.issues,
      });
    }

    const { objects, mode, clearExisting } = validation.data;

    if (!objects || objects.length === 0) {
      return apiError("objects array is required for manual sync", {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    }

    // If clearExisting is true, delete all existing objects
    if (clearExisting) {
      await prisma.systemObjectRegistry.deleteMany({});
    }

    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: [] as Array<{ objectKey: string; error: string }>,
    };

    // Process each object
    for (const obj of objects) {
      try {
        switch (mode) {
          case "insert":
            await prisma.systemObjectRegistry.create({
              data: {
                objectKey: obj.objectKey,
                objectName: obj.objectName,
                objectType: obj.objectType,
                module: obj.module,
                description: obj.description,
                metadata: obj.metadata || {},
                isActive: obj.isActive,
              },
            });
            results.created++;
            break;

          case "update":
            await prisma.systemObjectRegistry.update({
              where: { objectKey: obj.objectKey },
              data: {
                objectName: obj.objectName,
                objectType: obj.objectType,
                module: obj.module,
                description: obj.description,
                metadata: obj.metadata || {},
                isActive: obj.isActive,
              },
            });
            results.updated++;
            break;

          case "upsert":
          default:
            await prisma.systemObjectRegistry.upsert({
              where: { objectKey: obj.objectKey },
              create: {
                objectKey: obj.objectKey,
                objectName: obj.objectName,
                objectType: obj.objectType,
                module: obj.module,
                description: obj.description,
                metadata: obj.metadata || {},
                isActive: obj.isActive,
              },
              update: {
                objectName: obj.objectName,
                objectType: obj.objectType,
                module: obj.module,
                description: obj.description,
                metadata: obj.metadata || {},
                isActive: obj.isActive,
              },
            });
            results.created++; // Count upserts as created for simplicity
            break;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          objectKey: obj.objectKey,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    invalidateObjectListCache();
    await writeAuditLog(request, {
      action: "registry_sync",
      resourceType: "system_registry",
      metadata: { mode, count: objects.length, ...results },
    });

    return apiSuccess(results, {
      meta: {
        message: `Synced ${objects.length} objects: ${results.created} created, ${results.updated} updated, ${results.failed} failed`,
      },
    });
  } catch (error) {
    console.error("Failed to sync system objects:", error);
    return apiError("Failed to sync system objects", {
      status: 500,
      code: ApiErrorCode.INTERNAL_ERROR,
    });
  }
}

// ==========================================
// DELETE /api/system/objects/sync
// Clear all objects (admin operation)
// ==========================================

export async function DELETE(request: NextRequest) {
  try {
    // Strict rate limiting
    const limited = rateLimit(request, "objects-delete", {
      maxRequests: 5,
      windowMs: 60 * 1000,
    });
    if (limited) return limited;

    // Delete all objects
    const { count } = await prisma.systemObjectRegistry.deleteMany({});

    invalidateObjectListCache();
    await writeAuditLog(request, {
      action: "registry_clear",
      resourceType: "system_registry",
      metadata: { deleted: count },
    });

    return NextResponse.json({
      success: true,
      message: `Cleared ${count} objects from registry`,
      data: { deleted: count }
    });
  } catch (error) {
    console.error("Failed to clear system objects:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to clear system objects"
      },
      { status: 500 }
    );
  }
}

// ==========================================
// GET /api/system/objects/sync
// Get sync statistics and sample objects
// ==========================================

export async function GET(request: NextRequest) {
  try {
    const limited = rateLimit(request, "objects-stats", {
      maxRequests: 30,
      windowMs: 60 * 1000,
    });
    if (limited) return limited;

    const stats = await prisma.systemObjectRegistry.groupBy({
      by: ["objectType", "module"],
      _count: { id: true },
      where: { isActive: true }
    });

    const byType: Record<string, number> = {};
    const byModule: Record<string, number> = {};

    for (const stat of stats) {
      byType[stat.objectType] = (byType[stat.objectType] || 0) + stat._count.id;
      byModule[stat.module] = (byModule[stat.module] || 0) + stat._count.id;
    }

    const total = await prisma.systemObjectRegistry.count();

    // Get sample objects for each type
    const sampleTypes = ["api_route", "prisma_model", "react_component", "service"];
    const samples: Record<string, unknown[]> = {};

    for (const type of sampleTypes) {
      samples[type] = await prisma.systemObjectRegistry.findMany({
        where: { objectType: type },
        take: 3,
        select: {
          objectKey: true,
          objectName: true,
          module: true,
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        total,
        byType,
        byModule,
        samples
      }
    });
  } catch (error) {
    console.error("Failed to get sync stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get sync statistics"
      },
      { status: 500 }
    );
  }
}