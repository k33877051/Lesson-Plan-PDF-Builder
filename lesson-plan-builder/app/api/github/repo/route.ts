import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createRepository, listRepositories } from "@/lib/github/client";
import { decrypt } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";

const createRepoSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().default(false),
  projectId: z.string().optional(),
});

// GET /api/github/repo - List repositories
export async function GET(request: NextRequest) {
  // Rate limiting
  const limited = rateLimit(request, "github-repo-list", {
    windowMs: 60_000,
    maxRequests: 20,
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
          error: "GitHub not connected",
        },
        { status: 401 }
      );
    }

    const token = decrypt(appSetting.githubIntegration.encryptedToken);
    const result = await listRepositories(token);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.repos,
    });
  } catch (error) {
    console.error("GitHub repo list error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to list repositories",
      },
      { status: 500 }
    );
  }
}

// POST /api/github/repo - Create new repository
export async function POST(request: NextRequest) {
  // Rate limiting
  const limited = rateLimit(request, "github-repo-create", {
    windowMs: 60_000,
    maxRequests: 5,
  });
  if (limited) return limited;

  try {
    const body = await request.json();
    const validation = createRepoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid repository data",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { name, description, isPrivate, projectId } = validation.data;

    // Get GitHub integration
    const appSetting = await prisma.appSetting.findUnique({
      where: { id: "default" },
      include: { githubIntegration: true },
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

    const token = decrypt(appSetting.githubIntegration.encryptedToken);
    const username = appSetting.githubIntegration.username;

    // Create repository on GitHub
    const result = await createRepository(token, {
      name,
      description,
      private: isPrivate,
      autoInit: false,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

    // Save repository info to database
    const repo = await prisma.gitHubRepo.create({
      data: {
        name,
        fullName: `${username}/${name}`,
        description,
        url: result.repoUrl!,
        sshUrl: result.sshUrl,
        isPrivate,
        integrationId: appSetting.githubIntegration.id,
        projectId: projectId || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Repository created successfully",
      data: {
        id: repo.id,
        name: repo.name,
        fullName: repo.fullName,
        url: repo.url,
        sshUrl: repo.sshUrl,
      },
    });
  } catch (error) {
    console.error("GitHub repo create error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create repository",
      },
      { status: 500 }
    );
  }
}