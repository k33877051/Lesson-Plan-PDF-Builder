/**
 * Individual AI Function API
 * 
 * Routes:
 * - GET: Get specific AI function details
 * - PUT: Update function settings (Phase 1-5: settings only, not core config)
 * 
 * Path: /api/ai/functions/[key]
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

// ==========================================
// Validation Schemas
// ==========================================

const updateFunctionSchema = z.object({
  settings: z.record(z.string(), z.any()).optional(),
  isEnabled: z.boolean().optional()
  // Note: name, description, category are read-only for Phase 1-5
  // Provider mappings are managed separately
});

interface RouteContext {
  params: Promise<{ key: string }>;
}

// ==========================================
// GET /api/ai/functions/[key]
// ==========================================

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    // Rate limiting
    const limited = rateLimit(request, "ai-function-get", {
      maxRequests: 30,
      windowMs: 60 * 1000,
    });
    if (limited) return limited;

    const { key } = await params;

    if (!key || typeof key !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Function key is required"
        },
        { status: 400 }
      );
    }

    const func = await prisma.aiFunction.findUnique({
      where: { key },
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
                isDefault: true,
                priority: true
              }
            }
          },
          orderBy: { priority: "asc" }
        }
      }
    });

    if (!func) {
      return NextResponse.json(
        {
          success: false,
          error: `Function '${key}' not found`
        },
        { status: 404 }
      );
    }

    // Format response
    return NextResponse.json({
      success: true,
      data: {
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
          providerId: mapping.providerId,
          providerKey: mapping.provider.key,
          providerName: mapping.provider.name,
          providerType: mapping.provider.type,
          model: mapping.provider.model,
          priority: mapping.priority,
          config: mapping.config,
          isEnabled: mapping.isEnabled && mapping.provider.isEnabled,
          isDefaultProvider: mapping.provider.isDefault
        }))
      }
    });
  } catch (error) {
    console.error("Failed to get AI function:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve AI function"
      },
      { status: 500 }
    );
  }
}

// ==========================================
// PUT /api/ai/functions/[key]
// ==========================================

export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    // Rate limiting
    const limited = rateLimit(request, "ai-function-put", {
      maxRequests: 20,
      windowMs: 60 * 1000,
    });
    if (limited) return limited;

    const { key } = await params;

    if (!key || typeof key !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Function key is required"
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = updateFunctionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid function settings",
          details: validation.error.issues
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if function exists
    const existingFunction = await prisma.aiFunction.findUnique({
      where: { key }
    });

    if (!existingFunction) {
      return NextResponse.json(
        {
          success: false,
          error: `Function '${key}' not found`
        },
        { status: 404 }
      );
    }

    // Build update data (only mutable fields)
    const updateData: Record<string, unknown> = {};
    if (data.settings !== undefined) updateData.settings = data.settings;
    if (data.isEnabled !== undefined) updateData.isEnabled = data.isEnabled;

    // Update function
    await prisma.aiFunction.update({
      where: { key },
      data: updateData
    });

    // Return updated function
    const updatedFunc = await prisma.aiFunction.findUnique({
      where: { key },
      include: {
        providers: {
          include: {
            provider: {
              select: {
                key: true,
                name: true,
                isEnabled: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Function '${key}' updated successfully`,
      data: updatedFunc
    });
  } catch (error) {
    console.error("Failed to update AI function:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update AI function"
      },
      { status: 500 }
    );
  }
}