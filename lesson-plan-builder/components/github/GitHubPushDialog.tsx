"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { GitFork, Loader2, CheckCircle, ExternalLink, Plus } from "lucide-react";

interface Repository {
  id: string;
  name: string;
  fullName: string;
  url: string;
  isPrivate: boolean;
}

interface GitHubRepoResponse {
  success: boolean;
  data?: Repository[];
  error?: string;
}

interface GitHubPushDialogProps {
  projectId?: string;
  projectName?: string;
  onSuccess?: () => void;
}

export function GitHubPushDialog({
  projectId,
  projectName,
  onSuccess,
}: GitHubPushDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [newRepoName, setNewRepoName] = useState("");
  const [newRepoDescription, setNewRepoDescription] = useState("");
  const [newRepoPrivate, setNewRepoPrivate] = useState(true);
  const [commitMessage, setCommitMessage] = useState(
    projectName
      ? `Update ${projectName} from Lesson Plan PDF Builder`
      : "Update from Lesson Plan PDF Builder"
  );
  const [branch, setBranch] = useState("main");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pushedRepoUrl, setPushedRepoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const response = await fetch("/api/github/repo");
        const data: GitHubRepoResponse = await response.json();

        if (data.success && data.data) {
          setRepos(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch repos:", err);
      }
    };

    if (isOpen) {
      fetchRepos();
    }
  }, [isOpen]);

  // Create new repository
  const handleCreateRepo = async () => {
    if (!newRepoName.trim()) {
      setError("กรุณากรอกชื่อ repository");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/github/repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRepoName.trim(),
          description: newRepoDescription,
          isPrivate: newRepoPrivate,
          projectId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "ไม่สามารถสร้าง repository ได้");
      }

      // Add new repo to list and select it
      const newRepo: Repository = {
        id: data.data.id,
        name: data.data.name,
        fullName: data.data.fullName,
        url: data.data.url,
        isPrivate: newRepoPrivate,
      };

      setRepos([newRepo, ...repos]);
      setSelectedRepo(data.data.id);
      setIsCreatingNew(false);
      setSuccess("สร้าง repository สำเร็จ");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsLoading(false);
    }
  };

  // Push code to selected repository
  const handlePush = async () => {
    if (!selectedRepo) {
      setError("กรุณาเลือก repository");
      return;
    }

    if (!commitMessage.trim()) {
      setError("กรุณากรอก commit message");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/github/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoId: selectedRepo,
          commitMessage: commitMessage.trim(),
          branch,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "ไม่สามารถ push โค้ดได้");
      }

      setSuccess("Push โค้ดสำเร็จ");
      setPushedRepoUrl(data.data.repoUrl);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRepoData = repos.find((r) => r.id === selectedRepo);

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        <GitFork className="mr-2 h-4 w-4" />
        Push to GitHub
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Push โค้ดขึ้น GitHub</DialogTitle>
            <DialogDescription>
              เลือก repository หรือสร้างใหม่เพื่อ push โค้ดโปรเจกต์
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center gap-2">
                  {success}
                  {pushedRepoUrl && (
                    <a
                      href={pushedRepoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      ดูบน GitHub <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {!success && (
              <>
                {/* Repository Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>เลือก Repository</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCreatingNew(!isCreatingNew)}
                    >
                      {isCreatingNew ? (
                        "เลือก repository มีอยู่"
                      ) : (
                        <>
                          <Plus className="mr-1 h-3 w-3" />
                          สร้างใหม่
                        </>
                      )}
                    </Button>
                  </div>

                  {isCreatingNew ? (
                    <div className="space-y-3 border rounded-md p-3">
                      <div className="space-y-2">
                        <Label htmlFor="repo-name">ชื่อ Repository *</Label>
                        <Input
                          id="repo-name"
                          placeholder="my-lesson-plan-project"
                          value={newRepoName}
                          onChange={(e) => setNewRepoName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="repo-desc">คำอธิบาย</Label>
                        <Textarea
                          id="repo-desc"
                          placeholder="คำอธิบายโปรเจกต์..."
                          value={newRepoDescription}
                          onChange={(e) => setNewRepoDescription(e.target.value)}
                          rows={2}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="repo-private"
                          checked={newRepoPrivate}
                          onCheckedChange={(checked) =>
                            setNewRepoPrivate(checked as boolean)
                          }
                        />
                        <Label htmlFor="repo-private" className="cursor-pointer">
                          Repository ส่วนตัว (Private)
                        </Label>
                      </div>
                      <Button
                        onClick={handleCreateRepo}
                        disabled={isLoading || !newRepoName.trim()}
                        size="sm"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            กำลังสร้าง...
                          </>
                        ) : (
                          "สร้าง Repository"
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value={selectedRepo}
                      onValueChange={setSelectedRepo}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือก repository" />
                      </SelectTrigger>
                      <SelectContent>
                        {repos.length === 0 ? (
                          <SelectItem value="" disabled>
                            ไม่พบ repository (กรุณาสร้างใหม่)
                          </SelectItem>
                        ) : (
                          repos.map((repo) => (
                            <SelectItem key={repo.id} value={repo.id}>
                              {repo.fullName}
                              {repo.isPrivate && " 🔒"}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Commit Message */}
                <div className="space-y-2">
                  <Label htmlFor="commit-message">Commit Message</Label>
                  <Input
                    id="commit-message"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="Update from Lesson Plan PDF Builder"
                  />
                </div>

                {/* Branch */}
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Input
                    id="branch"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="main"
                  />
                </div>

                {/* Selected Repo Info */}
                {selectedRepoData && (
                  <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                    <p>Repository: {selectedRepoData.fullName}</p>
                    <p className="truncate">
                      URL:{" "}
                      <a
                        href={selectedRepoData.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {selectedRepoData.url}
                      </a>
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setError(null);
                setSuccess(null);
                setPushedRepoUrl(null);
                setIsCreatingNew(false);
              }}
            >
              {success ? "ปิด" : "ยกเลิก"}
            </Button>
            {!success && (
              <Button
                onClick={handlePush}
                disabled={isLoading || !selectedRepo}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลัง push...
                  </>
                ) : (
                    <>
                      <GitFork className="mr-2 h-4 w-4" />
                      Push โค้ด
                    </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}