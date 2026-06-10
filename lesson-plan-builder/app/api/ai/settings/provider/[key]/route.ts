/**
 * Individual AI Provider Settings API
 * 
 * Routes:
 * - GET: Get specific provider settings (masked)
 * - PUT: Update specific provider settings
 * 
 * Path: /api/ai/settings/provider/[key]
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { getProvider, updateProviderApiKey, getMaskedApiKey, providerRequiresApiKey } from "@/lib/ai/provider";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";

// ==========================================
// Validation Schemas
// ==========================================

const updateProviderSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  model: z.string().min(1).max(100).optional(),
  baseUrl: z.string().url().nullable().optional(),
  apiKey: z.string().min(1).max(500).nullable().optional(),
  isEnabled: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  priority: z.number().int().min(0).max(100).optional(),
  settings: z.record(z.string(), z.any()).optional()
});

interface RouteContext {
  params: Promise<{ key: string }>;
}

// ==========================================
// GET /api/ai/settings/provider/[key]
// ==========================================

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    // Rate limiting
    const limited = rateLimit(request, "ai-provider-get", {
      maxRequests: 30,
      windowMs: 60 * 1000,
    });
    if (limited) return limited;

    const { key } = await params;

    if (!key || typeof key !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Provider key is required"
        },
        { status: 400 }
      );
    }

    const provider = await getProvider(key);

    if (!provider) {
      return NextResponse.json(
        {
          success: false,
          error: `Provider '${key}' not found`
        },
        { status: 404 }
      );
    }

    // Return masked provider
    return NextResponse.json({
      success: true,
      data: {
        ...provider,
        apiKey: provider.apiKey ? getMaskedApiKey(provider.apiKey) : null
      }
    });
  } catch (error) {
    console.error(`Failed to get provider:`, error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve provider settings"
      },
      { status: 500 }
    );
  }
}

// ==========================================
// PUT /api/ai/settings/provider/[key]
// ==========================================

export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    // Rate limiting
    const limited = rateLimit(request, "ai-provider-put", {
      maxRequests: 20,
      windowMs: 60 * 1000,
    });
    if (limited) return limited;

    const { key } = await params;

    if (!key || typeof key !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Provider key is required"
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = updateProviderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid provider settings",
          details: validation.error.issues
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if provider exists
    const existingProvider = await prisma.aiProvider.findUnique({
      where: { key }
    });

    if (!existingProvider) {
      return NextResponse.json(
        {
          success: false,
          error: `Provider '${key}' not found`
        },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.model !== undefined) updateData.model = data.model;
    if (data.baseUrl !== undefined) updateData.baseUrl = data.baseUrl;
    if (data.isEnabled !== undefined) updateData.isEnabled = data.isEnabled;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.settings !== undefined) updateData.settings = data.settings;

    // Handle API key update (encrypt if provided)
    if (data.apiKey !== undefined) {
      if (data.apiKey === null) {
        updateData.apiKeyEnc = null;
        const settings = (existingProvider.settings as Record<string, unknown>) || {};
        if (providerRequiresApiKey(settings)) {
          updateData.isEnabled = false;
        }
      } else {
        updateData.apiKeyEnc = encrypt(data.apiKey);
        // Enable if API key is provided and wasn't explicitly disabled
        if (data.isEnabled === undefined) {
          updateData.isEnabled = true;
        }
      }
    }

    // Handle default provider logic
    if (data.isDefault) {
      // Unset default on all other providers
      await prisma.aiProvider.updateMany({
        where: { NOT: { key } },
        data: { isDefault: false }
      });
      updateData.isDefault = true;
    } else if (data.isDefault === false) {
      updateData.isDefault = false;
    }

    // Update provider
    await prisma.aiProvider.update({
      where: { key },
      data: updateData
    });

    // Return updated provider (masked)
    const updatedProvider = await getProvider(key);

    return NextResponse.json({
      success: true,
      message: `Provider '${key}' updated successfully`,
      data: updatedProvider ? {
        ...updatedProvider,
        apiKey: updatedProvider.apiKey ? getMaskedApiKey(updatedProvider.apiKey) : null
      } : null
    });
  } catch (error) {
    console.error("Failed to update provider:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update provider"
      },
      { status: 500 }
    );
  }
}