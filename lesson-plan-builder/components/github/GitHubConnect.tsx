"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GitFork, Loader2, CheckCircle, XCircle, ExternalLink, Trash2 } from "lucide-react";

interface GitHubStatus {
  connected: boolean;
  tokenValid?: boolean;
  data?: {
    username: string;
    avatarUrl?: string;
    isActive: boolean;
    lastSyncedAt?: string;
    repositoriesCount: number;
  };
}

export function GitHubConnect() {
  const [status, setStatus] = useState<GitHubStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const response = await fetch("/api/github/status");
        const data = await response.json();
        setStatus(data);
      } catch (err) {
        console.error("Failed to fetch GitHub status:", err);
      }
    };
    
    loadStatus();
  }, []);

  // Connect GitHub
  const handleConnect = async () => {
    if (!token.trim()) {
      setError("กรุณากรอก GitHub Personal Access Token");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/github/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "ไม่สามารถเชื่อมต่อ GitHub ได้");
      }

      setSuccess("เชื่อมต่อ GitHub สำเร็จ");
      setToken("");
      setShowConnectDialog(false);
      // Reload status after connection
      const statusResponse = await fetch("/api/github/status");
      const statusData = await statusResponse.json();
      setStatus(statusData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect GitHub
  const handleDisconnect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/github/auth", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "ไม่สามารถยกเลิกการเชื่อมต่อได้");
      }

      setSuccess("ยกเลิกการเชื่อมต่อ GitHub สำเร็จ");
      setShowDisconnectDialog(false);
      // Reload status after disconnection
      const statusResponse = await fetch("/api/github/status");
      const statusData = await statusResponse.json();
      setStatus(statusData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitFork className="h-5 w-5" />
            สถานะการเชื่อมต่อ GitHub
          </CardTitle>
          <CardDescription>
            เชื่อมต่อกับ GitHub เพื่อ push โค้ดโปรเจกต์ขึ้น repository
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!status ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              กำลังตรวจสอบสถานะ...
            </div>
          ) : status.connected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {status.tokenValid ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <p className="font-medium">
                    {status.tokenValid ? "เชื่อมต่ออยู่" : "Token หมดอายุหรือไม่ถูกต้อง"}
                  </p>
                  {status.data && (
                    <p className="text-sm text-muted-foreground">
                      ผู้ใช้: {status.data.username}
                    </p>
                  )}
                </div>
              </div>

              {status.data && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">จำนวน Repository:</span>
                    <span className="ml-2 font-medium">{status.data.repositoriesCount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">เชื่อมต่อล่าสุด:</span>
                    <span className="ml-2 font-medium">
                      {status.data.lastSyncedAt
                        ? new Date(status.data.lastSyncedAt).toLocaleString("th-TH")
                        : "-"}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConnectDialog(true)}
                >
                  อัปเดต Token
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDisconnectDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  ยกเลิกการเชื่อมต่อ
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-muted-foreground" />
                <p className="text-muted-foreground">ยังไม่ได้เชื่อมต่อ GitHub</p>
              </div>
              <Button onClick={() => setShowConnectDialog(true)}>
                <GitFork className="mr-2 h-4 w-4" />
                เชื่อมต่อ GitHub
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connect Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>เชื่อมต่อ GitHub</DialogTitle>
            <DialogDescription>
              กรอก GitHub Personal Access Token เพื่อเชื่อมต่อบัญชีของคุณ
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="github-token">GitHub Personal Access Token</Label>
              <Input
                id="github-token"
                type="password"
                placeholder="ghp_xxxxxxxxxxxx"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                สร้าง token ได้ที่{" "}
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  GitHub Settings <ExternalLink className="h-3 w-3" />
                </a>
                {" "}และเลือก scope &quot;repo&quot;
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConnectDialog(false);
                setToken("");
                setError(null);
              }}
            >
              ยกเลิก
            </Button>
            <Button onClick={handleConnect} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังเชื่อมต่อ...
                </>
              ) : (
                <>
                  <GitFork className="mr-2 h-4 w-4" />
                  เชื่อมต่อ
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disconnect Dialog */}
      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ยกเลิกการเชื่อมต่อ GitHub</DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการเชื่อมต่อ? 
              ข้อมูล repository ที่บันทึกไว้จะถูกลบออกจากระบบ
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDisconnectDialog(false)}
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังดำเนินการ...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  ยกเลิกการเชื่อมต่อ
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Message */}
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}