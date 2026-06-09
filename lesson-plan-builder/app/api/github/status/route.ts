import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/github/client";
import { decrypt } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";

// GET /api/github/status - Check GitHub connection status
export async function GET(request: NextRequest) {
  // Rate limiting
  const limited = rateLimit(request, "github-status", {
    windowMs: 60_000,
    maxRequests: 30,
  });
  if (limited) return limited;

  try {
    const appSetting = await prisma.appSetting.findUnique({
      where: { id: "default" },
      include: {
        githubIntegration: {
          include: {
            repositories: true,
          },
        },
      },
    });

    if (!appSetting?.githubIntegration) {
      return NextResponse.json({
        success: true,
        connected: false,
        message: "GitHub not connected",
      });
    }

    const integration = appSetting.githubIntegration;

    // Verify token is still valid
    let tokenValid = false;
    try {
      const token = decrypt(integration.encryptedToken);
      const verification = await verifyToken(token);
      tokenValid = verification.valid;
    } catch {
      tokenValid = false;
    }

    return NextResponse.json({
      success: true,
      connected: true,
      tokenValid,
      data: {
        username: integration.username,
        avatarUrl: integration.avatarUrl,
        isActive: integration.isActive,
        lastSyncedAt: integration.lastSyncedAt,
        repositoriesCount: integration.repositories.length,
        repositories: integration.repositories.map(repo => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.fullName,
          url: repo.url,
          isPrivate: repo.isPrivate,
        })),
      },
    });
  } catch (error) {
    console.error("GitHub status error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get GitHub status",
      },
      { status: 500 }
    );
  }
}