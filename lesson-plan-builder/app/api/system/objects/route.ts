/**
 * System Object Registry API
 * 
 * Routes:
 * - GET: Get all registered system objects (with filtering)
 * 
 * Features:
 * - Filter by objectType, module, isActive
 * - Search by objectKey, objectName
 * - Pagination support
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import {
  apiError,
  apiSuccess,
  ApiErrorCode,
  buildPaginationMeta,
} from "@/lib/api-response";
import { getCachedObjectList, setCachedObjectList } from "@/lib/system/registry-cache";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

// ==========================================
// Validation Schemas
// ==========================================

const querySchema = z.object({
  objectType: z.string().optional(),
  module: z.string().optional(),
  isActive: z.enum(["true", "false"]).transform(v => v === "true").optional(),
  search: z.string().optional(),
  page: z.string().transform(v => parseInt(v, 10)).default(1),
  limit: z.string().transform(v => parseInt(v, 10)).default(50),
});

// ==========================================
// GET /api/system/objects
// ==========================================

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const limited = rateLimit(request, "objects-list", {
      maxRequests: 30,
      windowMs: 60 * 1000,
    });
    if (limited) return limited;

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const params = querySchema.parse({
      objectType: searchParams.get("objectType") || undefined,
      module: searchParams.get("module") || undefined,
      isActive: searchParams.get("isActive") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "50",
    });

    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (params.objectType) where.objectType = params.objectType;
    if (params.module) where.module = params.module;
    if (params.isActive !== undefined) where.isActive = params.isActive;
    
    if (params.search) {
      where.OR = [
        { objectKey: { contains: params.search, mode: "insensitive" } },
        { objectName: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const cacheKey = JSON.stringify({ where, page: params.page, limit: params.limit });
    const cached = getCachedObjectList(cacheKey);
    if (cached) {
      return apiSuccess(cached.objects, { meta: { pagination: cached.pagination } });
    }

    const skip = (params.page - 1) * params.limit;

    const [objects, total] = await Promise.all([
      prisma.systemObjectRegistry.findMany({
        where,
        orderBy: [
          { module: "asc" },
          { objectType: "asc" },
          { objectName: "asc" }
        ],
        skip,
        take: params.limit,
      }),
      prisma.systemObjectRegistry.count({ where })
    ]);

    const pagination = buildPaginationMeta(params.page, params.limit, total);

    const formattedObjects = objects.map((obj) => ({
      id: obj.id,
      objectKey: obj.objectKey,
      objectName: obj.objectName,
      objectType: obj.objectType,
      module: obj.module,
      description: obj.description,
      metadata: obj.metadata,
      isActive: obj.isActive,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    }));

    setCachedObjectList(cacheKey, { objects: formattedObjects, pagination });

    return apiSuccess(formattedObjects, { meta: { pagination } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Invalid query parameters", {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
        details: error.issues,
      });
    }

    console.error("Failed to get system objects:", error);
    return apiError("Failed to retrieve system objects", {
      status: 500,
      code: ApiErrorCode.INTERNAL_ERROR,
    });
  }
}

// ==========================================
// GET Stats Helper
// ==========================================

export async function getObjectStats() {
  const stats = await prisma.systemObjectRegistry.groupBy({
    by: ["objectType", "module"],
    _count: {
      id: true
    },
    where: { isActive: true }
  });

  const byType = stats.reduce((acc, curr) => {
    acc[curr.objectType] = (acc[curr.objectType] || 0) + curr._count.id;
    return acc;
  }, {} as Record<string, number>);

  const byModule = stats.reduce((acc, curr) => {
    acc[curr.module] = (acc[curr.module] || 0) + curr._count.id;
    return acc;
  }, {} as Record<string, number>);

  return { byType, byModule };
}