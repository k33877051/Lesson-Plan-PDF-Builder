import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { initializeAndPush } from "@/lib/github/client";
import { decrypt } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit-log";

const pushSchema = z.object({
  repoId: z.string(),
  commitMessage: z.string().min(1).max(200).default("Update from Lesson Plan PDF Builder"),
  branch: z.string().default("main"),
});

// POST /api/github/push - Push local code to GitHub repository
export async function POST(request: NextRequest) {
  // Rate limiting
  const limited = rateLimit(request, "github-push", {
    windowMs: 60_000,
    maxRequests: 5,
  });
  if (limited) return limited;

  try {
    const body = await request.json();
    const validation = pushSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid push data",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { repoId, commitMessage, branch } = validation.data;

    // Get GitHub integration
    const appSetting = await prisma.appSetting.findUnique({
      where: { id: "default" },
      include: {
        githubIntegration: {
          include: {
            repositories: {
              where: { id: repoId },
            },
          },
        },
      },
    });

    if (!appSetting?.githubIntegration) {
      return NextResponse.json(
        {
          success: false,
          error: "GitHub not connected",
        },
        { status: 401 }
      );
    }

    const repo = appSetting.githubIntegration.repositories[0];
    if (!repo) {
      return NextResponse.json(
        {
          success: false,
          error: "Repository not found",
        },
        { status: 404 }
      );
    }

    // Get the token
    const token = decrypt(appSetting.githubIntegration.encryptedToken);

    // For HTTPS authentication, we need to use the token in the URL
    // Format: https://oauth2:TOKEN@github.com/owner/repo.git
    const authenticatedUrl = repo.sshUrl 
      ? repo.sshUrl 
      : repo.url.replace("https://github.com/", `https://oauth2:${token}@github.com/`);

    // Push code from project root
    const projectRoot = process.cwd();
    
    // Note: In a real implementation, you might want to push only specific files
    // or create a clean export of the project. For now, we'll push everything.
    
    const result = await initializeAndPush(
      projectRoot,
      authenticatedUrl,
      commitMessage,
      branch
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

    // Update last synced time
    await prisma.gitHubIntegration.update({
      where: { id: appSetting.githubIntegration.id },
      data: { lastSyncedAt: new Date() },
    });

    await writeAuditLog(request, {
      action: "github_push",
      resourceType: "github",
      resourceId: repoId,
      metadata: { branch, commitMessage, repoUrl: repo.url },
    });

    return NextResponse.json({
      success: true,
      message: "Code pushed to GitHub successfully",
      data: {
        repoUrl: repo.url,
        branch,
        commitMessage,
        pushedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("GitHub push error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to push code to GitHub",
      },
      { status: 500 }
    );
  }
}