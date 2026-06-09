import { Octokit } from "@octokit/rest";
import { simpleGit, SimpleGit } from "simple-git";

// GitHub client configuration
export interface GitHubConfig {
  token: string;
  username?: string;
}

// Create Octokit client
export function createGitHubClient(token: string): Octokit {
  return new Octokit({
    auth: token,
    userAgent: "lesson-plan-pdf-builder/1.0",
  });
}

// Verify token and get user info
export async function verifyToken(token: string): Promise<{
  valid: boolean;
  username?: string;
  error?: string;
}> {
  try {
    const octokit = createGitHubClient(token);
    const { data: user } = await octokit.rest.users.getAuthenticated();
    
    return {
      valid: true,
      username: user.login,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Invalid token",
    };
  }
}

// Create a new repository
export async function createRepository(
  token: string,
  options: {
    name: string;
    description?: string;
    private?: boolean;
    autoInit?: boolean;
  }
): Promise<{
  success: boolean;
  repoUrl?: string;
  sshUrl?: string;
  error?: string;
}> {
  try {
    const octokit = createGitHubClient(token);
    
    const { data: repo } = await octokit.rest.repos.createForAuthenticatedUser({
      name: options.name,
      description: options.description,
      private: options.private ?? false,
      auto_init: options.autoInit ?? false,
    });

    return {
      success: true,
      repoUrl: repo.html_url,
      sshUrl: repo.ssh_url,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create repository",
    };
  }
}

// Check if repository exists
export async function checkRepositoryExists(
  token: string,
  owner: string,
  repo: string
): Promise<boolean> {
  try {
    const octokit = createGitHubClient(token);
    await octokit.rest.repos.get({ owner, repo });
    return true;
  } catch {
    return false;
  }
}

// Initialize git in local directory and push to remote
export async function initializeAndPush(
  localPath: string,
  remoteUrl: string,
  commitMessage: string = "Initial commit",
  branch: string = "main"
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const git: SimpleGit = simpleGit(localPath);
    
    // Check if already a git repo
    const isRepo = await git.checkIsRepo();
    
    if (!isRepo) {
      // Initialize repo
      await git.init();
      
      // Add all files
      await git.add(".");
      
      // Initial commit
      await git.commit(commitMessage);
    } else {
      // Stage all changes
      await git.add(".");
      
      // Check if there are changes to commit
      const status = await git.status();
      if (status.files.length > 0) {
        await git.commit(commitMessage);
      }
    }
    
    // Check current branch
    const currentBranch = await git.branch();
    const currentBranchName = currentBranch.current;
    
    // Rename branch if needed
    if (currentBranchName !== branch) {
      await git.checkoutLocalBranch(branch);
    }
    
    // Add remote
    const remotes = await git.getRemotes();
    const hasOrigin = remotes.some(r => r.name === "origin");
    
    if (hasOrigin) {
      await git.removeRemote("origin");
    }
    
    await git.addRemote("origin", remoteUrl);
    
    // Push to remote
    await git.push("origin", branch, ["--set-upstream"])
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Git operation failed",
    };
  }
}

// Get repository information
export async function getRepository(
  token: string,
  owner: string,
  repo: string
): Promise<{
  success: boolean;
  repo?: {
    name: string;
    fullName: string;
    description: string | null;
    private: boolean;
    url: string;
    defaultBranch: string;
  };
  error?: string;
}> {
  try {
    const octokit = createGitHubClient(token);
    const { data } = await octokit.rest.repos.get({ owner, repo });
    
    return {
      success: true,
      repo: {
        name: data.name,
        fullName: data.full_name,
        description: data.description,
        private: data.private,
        url: data.html_url,
        defaultBranch: data.default_branch,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get repository",
    };
  }
}

// List user repositories
export async function listRepositories(
  token: string,
  type: "all" | "owner" | "member" = "owner",
  sort: "created" | "updated" | "pushed" | "full_name" = "updated",
  perPage: number = 30
): Promise<{
  success: boolean;
  repos?: Array<{
    name: string;
    fullName: string;
    description: string | null;
    private: boolean;
    url: string;
    updatedAt: string;
  }>;
  error?: string;
}> {
  try {
    const octokit = createGitHubClient(token);
    const { data } = await octokit.rest.repos.listForAuthenticatedUser({
      type,
      sort,
      per_page: perPage,
    });
    
    return {
      success: true,
      repos: data.map(repo => ({
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        private: repo.private,
        url: repo.html_url,
        updatedAt: repo.updated_at ?? new Date().toISOString(),
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list repositories",
    };
  }
}