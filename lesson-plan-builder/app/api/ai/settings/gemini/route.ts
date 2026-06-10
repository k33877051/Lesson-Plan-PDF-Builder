/**
 * Gemini Settings API
 * 
 * Routes:
 * - GET: Get Gemini settings (UI-safe)
 * - PUT: Update Gemini settings
 * - POST /connect: Mark connection attempt started
 * - POST /disconnect: Mark connection disconnected
 * 
 * Security:
 * - NO browser automation
 * - NO Google credentials storage
 * - NO cookies/tokens handling
 * - Only configuration storage
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import {
  getGeminiSettings,
  getGeminiSettingsForUI,
  updateGeminiSettings,
  markConnectionStarted,
  markConnectionDisconnected,
  markConnectionCompleted,
  markConnectionError,
  setAuthMode,
  updateProfilePath,
  validateProfilePath,
  type GeminiAuthMode,
  type GeminiBrowserProfileConfig
} from "@/lib/ai/gemini-settings";

// ==========================================
// Validation Schemas
// ==========================================

const authModeSchema = z.enum(["api_key", "browser_profile"]);

const updateSettingsSchema = z.object({
  authMode: authModeSchema.optional(),
  browserProfile: z.object({
    enabled: z.boolean().optional(),
    profilePath: z.string().optional(),
    headless: z.boolean().optional()
  }).optional()
});

const connectSchema = z.object({
  action: z.enum(["start", "complete", "error"]),
  errorMessage: z.string().optional()
});

// ==========================================
// GET /api/ai/settings/gemini
// ==========================================

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const limited = rateLimit(request, "gemini-settings-get", {
      maxRequests: 30,
      windowMs: 60 * 1000, // 1 minute
    });
    if (limited) return limited;

    const settings = await getGeminiSettingsForUI();

    return NextResponse.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error("Failed to get Gemini settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve Gemini settings"
      },
      { status: 500 }
    );
  }
}

// ==========================================
// PUT /api/ai/settings/gemini
// ==========================================

export async function PUT(request: NextRequest) {
  try {
    // Rate limiting
    const limited = rateLimit(request, "gemini-settings-put", {
      maxRequests: 20,
      windowMs: 60 * 1000,
    });
    if (limited) return limited;

    const body = await request.json();
    const validation = updateSettingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid settings",
          details: validation.error.issues
        },
        { status: 400 }
      );
    }

    const updates = validation.data;

    // Validate profile path if provided
    if (updates.browserProfile?.profilePath) {
      const pathValidation = validateProfilePath(updates.browserProfile.profilePath);
      if (!pathValidation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid profile path",
            details: pathValidation.error
          },
          { status: 400 }
        );
      }
    }

    // Apply updates
    if (updates.authMode) {
      await setAuthMode(updates.authMode);
    }

    if (updates.browserProfile?.profilePath) {
      await updateProfilePath(updates.browserProfile.profilePath);
    }

    // Update full settings object for other fields
    // Only update fields that were provided
    if (updates.browserProfile) {
      const current = await getGeminiSettings();
      await updateGeminiSettings({
        browserProfile: {
          ...current.browserProfile,
          ...updates.browserProfile
        } as GeminiBrowserProfileConfig
      });
    }

    const updatedSettings = await getGeminiSettingsForUI();

    return NextResponse.json({
      success: true,
      message: "Gemini settings updated",
      data: updatedSettings
    });
  } catch (error) {
    console.error("Failed to update Gemini settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update Gemini settings"
      },
      { status: 500 }
    );
  }
}

// ==========================================
// POST /api/ai/settings/gemini
// Connection status management (no actual browser control)
// ==========================================

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const limited = rateLimit(request, "gemini-settings-post", {
      maxRequests: 10,
      windowMs: 60 * 1000,
    });
    if (limited) return limited;

    const body = await request.json();
    const validation = connectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request",
          details: validation.error.issues
        },
        { status: 400 }
      );
    }

    const { action, errorMessage } = validation.data;

    switch (action) {
      case "start":
        await markConnectionStarted();
        return NextResponse.json({
          success: true,
          message: "Connection attempt marked as started",
          instructions: [
            "1. Open your browser with the configured profile",
            "2. Navigate to https://aistudio.google.com/app/apikey",
            "3. Login to your Google account if needed",
            "4. Create a new API key",
            "5. Return to Settings > AI Providers to save the API key"
          ]
        });

      case "complete":
        await markConnectionCompleted();
        return NextResponse.json({
          success: true,
          message: "Connection marked as completed"
        });

      case "error":
        await markConnectionError(errorMessage || "Unknown error");
        return NextResponse.json({
          success: true,
          message: "Connection error recorded"
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Unknown action"
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Failed to process Gemini connection action:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process request"
      },
      { status: 500 }
    );
  }
}

// ==========================================
// DELETE /api/ai/settings/gemini
// Disconnect / Reset session
// ==========================================

export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting
    const limited = rateLimit(request, "gemini-settings-delete", {
      maxRequests: 10,
      windowMs: 60 * 1000,
    });
    if (limited) return limited;

    await markConnectionDisconnected();

    return NextResponse.json({
      success: true,
      message: "Session marked as disconnected"
    });
  } catch (error) {
    console.error("Failed to disconnect Gemini session:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to disconnect session"
      },
      { status: 500 }
    );
  }
}