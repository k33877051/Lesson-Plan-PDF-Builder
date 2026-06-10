/**
 * AI Functions API
 * 
 * Routes:
 * - GET: Get all AI functions with their provider mappings
 * 
 * Features:
 * - Lists all registered AI functions
 * - Shows which providers are configured for each function
 * - Read-only for Phase 1-5 (no editing)
 */

import { NextRequest } from "next/server";
import { apiError, apiSuccess, ApiErrorCode } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

// ==========================================
// GET /api/ai/functions
// ==========================================

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const limited = rateLimit(request, "ai-functions-list", {
      maxRequests: 30,
      windowMs: 60 * 1000,
    });
    if (limited) return limited;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const enabledOnly = searchParams.get("enabled") === "true";

    // Build where clause
    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (enabledOnly) where.isEnabled = true;

    const functions = await prisma.aiFunction.findMany({
      where,
      include: {
        providers: {
          include: {
            provider: {
              select: {
                key: true,
                name: true,
                type: true,
                model: true,
                isEnabled: true,
                isDefault: true
              }
            }
          },
          orderBy: { priority: "asc" }
        }
      },
      orderBy: { name: "asc" }
    });

    // Format for response
    const formattedFunctions = functions.map(func => ({
      id: func.id,
      key: func.key,
      name: func.name,
      description: func.description,
      category: func.category,
      settings: func.settings,
      isEnabled: func.isEnabled,
      createdAt: func.createdAt,
      updatedAt: func.updatedAt,
      providers: func.providers.map(mapping => ({
        id: mapping.id,
        providerKey: mapping.provider.key,
        providerName: mapping.provider.name,
        providerType: mapping.provider.type,
        model: mapping.provider.model,
        priority: mapping.priority,
        config: mapping.config,
        isEnabled: mapping.isEnabled && mapping.provider.isEnabled,
        isDefaultProvider: mapping.provider.isDefault
      }))
    }));

    return apiSuccess({
      functions: formattedFunctions,
      count: formattedFunctions.length,
      categories: [...new Set(functions.map((f) => f.category))],
    });
  } catch (error) {
    console.error("Failed to get AI functions:", error);
    return apiError("Failed to retrieve AI functions", {
      status: 500,
      code: ApiErrorCode.INTERNAL_ERROR,
    });
  }
}

// ==========================================
// Helper: Get categories
// ==========================================

export async function getAIFunctionCategories(): Promise<string[]> {
  const categories = await prisma.aiFunction.findMany({
    distinct: ["category"],
    select: { category: true }
  });
  return categories.map(c => c.category);
}