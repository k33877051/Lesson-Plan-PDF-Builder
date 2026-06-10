/**
 * AI Settings API
 * 
 * Routes:
 * - GET: Get all AI providers and general settings
 * - PUT: Update provider settings (API keys, models, etc.)
 * 
 * Security:
 * - API keys are encrypted before storage
 * - API keys are masked in responses
 * - Rate limiting on all endpoints
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess, ApiErrorCode } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit-log";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import {
  getAllProviders,
  getProvider,
  updateProviderApiKey,
  getMaskedApiKey,
  getAIStatus,
  invalidateSettingsCache,
  providerRequiresApiKey,
  repairProviderDefaults,
  type AiProviderConfig
} from "@/lib/ai/provider";
import { encrypt, isEncrypted } from "@/lib/encryption";

// ==========================================
// Validation Schemas
// ==========================================

const updateProviderSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  model: z.string().min(1).max(100).optional(),
  baseUrl: z.string().url().nullable().optional(),
  apiKey: z.string().min(1).nullable().optional(),
  isEnabled: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  priority: z.number().int().min(0).max(100).optional(),
  settings: z.record(z.string(), z.any()).optional()
});

// ==========================================
// GET /api/ai/settings
// ==========================================

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const limited = rateLimit(request, "ai-settings-get", {
      maxRequests: 30,
      windowMs: 60 * 1000,
    });
    if (limited) return limited;

    const providerCount = await prisma.aiProvider.count();
    if (providerCount === 0) {
      const { seedAiData } = await import("@/prisma/seed-ai-data-module");
      await seedAiData();
      invalidateSettingsCache();
    } else {
      const { syncMissingProviders } = await import("@/prisma/seed-ai-data-module");
      const synced = await syncMissingProviders();
      if (synced > 0) {
        invalidateSettingsCache();
      }
    }

    await repairProviderDefaults();

    const [providers, status] = await Promise.all([
      getAllProviders(),
      getAIStatus()
    ]);

    // Mask API keys for security
    const maskedProviders = providers.map(p => ({
      ...p,
      apiKey: p.apiKey ? getMaskedApiKey(p.apiKey) : null
    }));

    return apiSuccess({
      providers: maskedProviders,
      status,
    });
  } catch (error) {
    console.error("Failed to get AI settings:", error);
    return apiError("Failed to retrieve AI settings", {
      status: 500,
      code: ApiErrorCode.INTERNAL_ERROR,
    });
  }
}

// ==========================================
// PUT /api/ai/settings
// Update general settings or batch update
// ==========================================

export async function PUT(request: NextRequest) {
  try {
    // Rate limiting
    const limited = rateLimit(request, "ai-settings-put", {
      maxRequests: 20,
      windowMs: 60 * 1000,
    });
    if (limited) return limited;

    const body = await request.json();

    // Handle batch updates
    if (body.providers && Array.isArray(body.providers)) {
      const results = await Promise.all(
        body.providers.map(async (update: { key: string } & z.infer<typeof updateProviderSchema>) => {
          try {
            await updateSingleProvider(update.key, update);
            return { key: update.key, success: true };
          } catch (error) {
            return {
              key: update.key,
              success: false,
              error: error instanceof Error ? error.message : "Update failed"
            };
          }
        })
      );

      const allSuccess = results.every(r => r.success);

      return apiSuccess({ results }, {
        meta: {
          message: allSuccess ? "All providers updated" : "Some providers failed to update",
          allSuccess,
        },
      });
    }

    // Single provider update
    if (body.key && typeof body.key === "string") {
      const validation = updateProviderSchema.safeParse(body);

      if (!validation.success) {
        return apiError("Invalid provider settings", {
          status: 400,
          code: ApiErrorCode.VALIDATION_ERROR,
          details: validation.error.issues,
        });
      }

      await updateSingleProvider(body.key, validation.data);

      return apiSuccess(
        { key: body.key },
        { meta: { message: `Provider ${body.key} updated successfully` } }
      );
    }

    return apiError(
      "Invalid request: expected 'key' for single update or 'providers' array for batch update",
      { status: 400, code: ApiErrorCode.VALIDATION_ERROR }
    );
  } catch (error) {
    console.error("Failed to update AI settings:", error);
    return apiError(
      error instanceof Error ? error.message : "Failed to update AI settings",
      { status: 500, code: ApiErrorCode.INTERNAL_ERROR }
    );
  }
}

// ==========================================
// Helper Functions
// ==========================================

async function updateSingleProvider(
  key: string,
  data: z.infer<typeof updateProviderSchema>
) {
  const existingProvider = await prisma.aiProvider.findUnique({ where: { key } });
  const updateData: Record<string, unknown> = {};

  // Handle API key separately (encrypt it)
  if (data.apiKey !== undefined) {
    if (data.apiKey === null) {
      updateData.apiKeyEnc = null;
      const settings = (existingProvider?.settings as Record<string, unknown>) || {};
      if (providerRequiresApiKey(settings)) {
        updateData.isEnabled = false;
      }
    } else {
      updateData.apiKeyEnc = encrypt(data.apiKey);
      if (data.isEnabled === undefined) {
        updateData.isEnabled = true;
      }
    }
  }

  // Other fields
  if (data.name !== undefined) updateData.name = data.name;
  if (data.model !== undefined) updateData.model = data.model;
  if (data.baseUrl !== undefined) updateData.baseUrl = data.baseUrl;
  if (data.isEnabled !== undefined) updateData.isEnabled = data.isEnabled;
  if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.settings !== undefined) updateData.settings = data.settings;

  // Handle default provider logic (unset others if this one is set to default)
  if (data.isDefault) {
    await prisma.aiProvider.updateMany({
      where: { NOT: { key } },
      data: { isDefault: false }
    });
  }

  await prisma.aiProvider.update({
    where: { key },
    data: updateData
  });

  invalidateSettingsCache();
  await repairProviderDefaults();
}

// ==========================================
// POST /api/ai/settings
// Re-seed / Initialize defaults
// ==========================================

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const limited = rateLimit(request, "ai-settings-seed", {
      maxRequests: 5,
      windowMs: 60 * 1000, // Stricter limit for seed operations
    });
    if (limited) return limited;

    const body = await request.json();

    if (body.action === "seed") {
      const isDev = process.env.NODE_ENV === "development";
      const adminSeed = request.headers.get("x-admin-seed") === "true";
      if (!isDev && !adminSeed) {
        return apiError("Seed action requires x-admin-seed header in production", {
          status: 403,
          code: ApiErrorCode.SEED_FORBIDDEN,
        });
      }

      const { seedAiData } = await import("@/prisma/seed-ai-data-module");
      await seedAiData();
      invalidateSettingsCache();

      await writeAuditLog(request, {
        action: "seed",
        resourceType: "ai_settings",
        metadata: { source: "manual_post" },
      });

      return apiSuccess(
        { seeded: true },
        { meta: { message: "AI data seeded successfully" } }
      );
    }

    return apiError("Unknown action", {
      status: 400,
      code: ApiErrorCode.UNKNOWN_ACTION,
    });
  } catch (error) {
    console.error("Failed to seed AI data:", error);
    return apiError("Failed to seed AI data", {
      status: 500,
      code: ApiErrorCode.INTERNAL_ERROR,
    });
  }
}