import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/github/client";
import { encrypt } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit-log";

const authSchema = z.object({
  token: z.string().min(1, "GitHub token is required"),
});

// POST /api/github/auth - Connect GitHub account
export async function POST(request: NextRequest) {
  // Rate limiting
  const limited = rateLimit(request, "github-auth", {
    windowMs: 60_000,
    maxRequests: 10,
  });
  if (limited) return limited;

  try {
    const body = await request.json();
    const validation = authSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid token format",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { token } = validation.data;

    // Verify token with GitHub
    const verification = await verifyToken(token);

    if (!verification.valid) {
      return NextResponse.json(
        {
          success: false,
          error: verification.error || "Invalid GitHub token",
        },
        { status: 401 }
      );
    }

    // Encrypt token
    const encryptedToken = encrypt(token);

    // Get or create default app setting
    const appSetting = await prisma.appSetting.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" },
    });

    // Save GitHub integration
    const integration = await prisma.gitHubIntegration.upsert({
      where: { appSettingId: appSetting.id },
      update: {
        encryptedToken,
        username: verification.username!,
        isActive: true,
        lastSyncedAt: new Date(),
      },
      create: {
        encryptedToken,
        username: verification.username!,
        appSettingId: appSetting.id,
        isActive: true,
      },
    });

    await writeAuditLog(request, {
      action: "github_auth",
      resourceType: "github",
      metadata: { username: verification.username },
    });

    return NextResponse.json({
      success: true,
      message: "GitHub connected successfully",
      data: {
        username: verification.username,
        connectedAt: integration.createdAt,
      },
    });
  } catch (error) {
    console.error("GitHub auth error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to connect GitHub",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/github/auth - Disconnect GitHub account
export async function DELETE(request: NextRequest) {
  // Rate limiting
  const limited = rateLimit(request, "github-auth-delete", {
    windowMs: 60_000,
    maxRequests: 5,
  });
  if (limited) return limited;

  try {
    const appSetting = await prisma.appSetting.findUnique({
      where: { id: "default" },
      include: { githubIntegration: true },
    });

    if (!appSetting?.githubIntegration) {
      return NextResponse.json(
        {
          success: false,
          error: "No GitHub integration found",
        },
        { status: 404 }
      );
    }

    // Delete integration (cascade will delete repos)
    await prisma.gitHubIntegration.delete({
      where: { id: appSetting.githubIntegration.id },
    });

    return NextResponse.json({
      success: true,
      message: "GitHub disconnected successfully",
    });
  } catch (error) {
    console.error("GitHub disconnect error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to disconnect GitHub",
      },
      { status: 500 }
    );
  }
}