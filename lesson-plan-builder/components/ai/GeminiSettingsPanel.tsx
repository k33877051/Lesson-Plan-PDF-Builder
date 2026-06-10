"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Globe,
  CheckCircle,
  AlertCircle,
  Unplug,
  Play,
  ExternalLink,
} from "lucide-react";

type GeminiAuthMode = "api_key" | "browser_profile";
type BrowserSessionStatus = "disconnected" | "connecting" | "connected" | "error";

interface GeminiSettingsData {
  authMode: GeminiAuthMode;
  browserProfile: {
    enabled: boolean;
    profilePath: string;
    headless: boolean;
    sessionStatus: BrowserSessionStatus;
    lastLoginAt: string | null;
    errorMessage?: string;
    manualInstructions: string[];
  };
  canConnect: boolean;
  canDisconnect: boolean;
}

const STATUS_LABELS: Record<BrowserSessionStatus, string> = {
  disconnected: "ไม่ได้เชื่อมต่อ",
  connecting: "กำลังเชื่อมต่อ",
  connected: "เชื่อมต่อแล้ว",
  error: "เกิดข้อผิดพลาด",
};

const STATUS_VARIANT: Record<BrowserSessionStatus, "default" | "secondary" | "destructive" | "outline"> = {
  disconnected: "secondary",
  connecting: "outline",
  connected: "default",
  error: "destructive",
};

export function GeminiSettingsPanel() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [settings, setSettings] = useState<GeminiSettingsData | null>(null);
  const [profilePath, setProfilePath] = useState("");
  const [headless, setHeadless] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/ai/settings/gemini");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "โหลดการตั้งค่า Gemini ไม่สำเร็จ");
      }
      const data = json.data as GeminiSettingsData;
      setSettings(data);
      setProfilePath(data.browserProfile.profilePath);
      setHeadless(data.browserProfile.headless);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      const res = await fetch("/api/ai/settings/gemini", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authMode: settings?.authMode,
          browserProfile: {
            profilePath,
            headless,
            enabled: settings?.authMode === "browser_profile",
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "บันทึกไม่สำเร็จ");
      }
      setSettings(json.data);
      setSuccess("บันทึกการตั้งค่า Gemini สำเร็จ");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectionAction = async (action: "start" | "complete" | "error") => {
    try {
      setIsSaving(true);
      setError(null);
      const res = await fetch("/api/ai/settings/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "ดำเนินการไม่สำเร็จ");
      }
      await loadSettings();
      if (json.instructions) {
        setSuccess("ดูขั้นตอนการเชื่อมต่อด้านล่าง");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsSaving(true);
      const res = await fetch("/api/ai/settings/gemini", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "ตัดการเชื่อมต่อไม่สำเร็จ");
      }
      await loadSettings();
      setSuccess("ตัดการเชื่อมต่อแล้ว");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          การตั้งค่า Gemini
        </CardTitle>
        <CardDescription>
          กำหนดโหมดการยืนยันตัวตนและโปรไฟล์เบราว์เซอร์ (ไม่มี automation — ไม่เก็บรหัสผ่านหรือ token)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>โหมดการยืนยันตัวตน</Label>
          <Select
            value={settings?.authMode ?? "api_key"}
            onValueChange={(v: GeminiAuthMode) =>
              setSettings((s) => (s ? { ...s, authMode: v } : s))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="api_key">API Key</SelectItem>
              <SelectItem value="browser_profile">Browser Profile (ตั้งค่าเท่านั้น)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {settings?.authMode === "browser_profile" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="profilePath">Path โปรไฟล์เบราว์เซอร์</Label>
              <Input
                id="profilePath"
                value={profilePath}
                onChange={(e) => setProfilePath(e.target.value)}
                placeholder="./storage/gemini-profile"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Headless mode</Label>
                <p className="text-xs text-muted-foreground">ใช้สำหรับบันทึก config เท่านั้น</p>
              </div>
              <Switch checked={headless} onCheckedChange={setHeadless} />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">สถานะเซสชัน:</span>
              <Badge variant={STATUS_VARIANT[settings.browserProfile.sessionStatus]}>
                {STATUS_LABELS[settings.browserProfile.sessionStatus]}
              </Badge>
              {settings.browserProfile.lastLoginAt && (
                <span className="text-xs text-muted-foreground">
                  ล่าสุด: {new Date(settings.browserProfile.lastLoginAt).toLocaleString("th-TH")}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {settings.canConnect && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => handleConnectionAction("start")}
                >
                  <Play className="h-4 w-4 mr-1" />
                  เริ่มเชื่อมต่อ (ด้วยตนเอง)
                </Button>
              )}
              {settings.browserProfile.sessionStatus === "connecting" && (
                <Button
                  size="sm"
                  disabled={isSaving}
                  onClick={() => handleConnectionAction("complete")}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  เสร็จสิ้นการเชื่อมต่อ
                </Button>
              )}
              {settings.canDisconnect && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isSaving}
                  onClick={handleDisconnect}
                >
                  <Unplug className="h-4 w-4 mr-1" />
                  ตัดการเชื่อมต่อ
                </Button>
              )}
            </div>

            <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
              <p className="text-sm font-medium">ขั้นตอนการเชื่อมต่อด้วยตนเอง</p>
              <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                {settings.browserProfile.manualInstructions.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
              <Button variant="link" className="h-auto p-0" asChild>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  เปิด Google AI Studio
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            </div>
          </>
        )}

        <Button onClick={saveSettings} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          บันทึกการตั้งค่า Gemini
        </Button>
      </CardContent>
    </Card>
  );
}
