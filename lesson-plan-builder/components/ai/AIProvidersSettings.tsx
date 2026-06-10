"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  CheckCircle,
  AlertCircle,
  Key,
  Server,
  Globe,
  Cpu,
  Save,
  ExternalLink,
} from "lucide-react";

interface Provider {
  key: string;
  name: string;
  type: string;
  baseUrl: string | null;
  apiKey: string | null;
  model: string;
  settings: Record<string, unknown>;
  isEnabled: boolean;
  isDefault: boolean;
  priority: number;
}

interface AIStatus {
  configured: boolean;
  defaultProvider: string | null;
  enabledProviders: string[];
  enabledFunctions: string[];
  encryptionStatus: {
    configured: boolean;
    source: string;
    warning?: string;
  };
}

interface ProvidersData {
  providers: Provider[];
  status: AIStatus;
}

interface AIProvidersResponse {
  success: boolean;
  data?: ProvidersData;
  error?: string;
}

export function AIProvidersSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [providers, setProviders] = useState<Provider[]>([]);
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [editingKeys, setEditingKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch("/api/ai/settings");
      const result: AIProvidersResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || "ไม่สามารถโหลดการตั้งค่า AI ได้");
      }

      setProviders(result.data.providers);
      setStatus(result.data.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลด");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProvider = async (providerKey: string) => {
    setIsSaving(prev => ({ ...prev, [providerKey]: true }));
    setError(null);

    try {
      const provider = providers.find(p => p.key === providerKey);
      if (!provider) return;

      const response = await fetch(`/api/ai/settings/provider/${providerKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: provider.name,
          model: provider.model,
          baseUrl: provider.baseUrl,
          apiKey: editingKeys[providerKey] ? provider.apiKey : undefined,
          isEnabled: provider.isEnabled,
          isDefault: provider.isDefault,
          priority: provider.priority,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "ไม่สามารถบันทึกการตั้งค่าได้");
      }

      setSaved(prev => ({ ...prev, [providerKey]: true }));
      setTimeout(() => {
        setSaved(prev => ({ ...prev, [providerKey]: false }));
      }, 3000);

      // Clear editing state
      setEditingKeys(prev => ({ ...prev, [providerKey]: false }));
      
      // Reload providers to get updated data
      await loadProviders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSaving(prev => ({ ...prev, [providerKey]: false }));
    }
  };

  const handleSetDefault = async (providerKey: string) => {
    const updatedProviders = providers.map(p => ({
      ...p,
      isDefault: p.key === providerKey
    }));
    setProviders(updatedProviders);
    await handleSaveProvider(providerKey);
  };

  const updateProvider = (key: string, updates: Partial<Provider>) => {
    setProviders(prev => prev.map(p => 
      p.key === key ? { ...p, ...updates } : p
    ));
  };

  const isLocalProvider = (provider: Provider) =>
    provider.settings?.requiresApiKey === false || provider.settings?.local === true;

  const usesFreeformModel = (key: string) =>
    key === "ollama" || key === "openrouter";

  const getProviderDocUrl = (key: string) => {
    switch (key) {
      case "openai":
        return "https://platform.openai.com/api-keys";
      case "kimi":
        return "https://platform.moonshot.cn/";
      case "ollama":
        return "https://ollama.com/";
      case "anthropic":
        return "https://console.anthropic.com/";
      case "deepseek":
        return "https://platform.deepseek.com/";
      case "openrouter":
        return "https://openrouter.ai/docs";
      default:
        return "https://ai.google.dev/";
    }
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case "openai-compatible":
        return <Server className="h-5 w-5" />;
      case "gemini-native":
        return <Globe className="h-5 w-5" />;
      case "anthropic-native":
        return <Cpu className="h-5 w-5" />;
      default:
        return <Cpu className="h-5 w-5" />;
    }
  };

  const getProviderTypeLabel = (type: string) => {
    switch (type) {
      case "openai-compatible":
        return "OpenAI Compatible";
      case "gemini-native":
        return "Gemini Native";
      case "anthropic-native":
        return "Anthropic Native";
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-3 py-12">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>กำลังโหลดผู้ให้บริการ AI...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Alert */}
      {status?.encryptionStatus.warning && (
        <Alert variant="default">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{status.encryptionStatus.warning}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* AI Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            สถานะระบบ AI
          </CardTitle>
          <CardDescription>
            ภาพรวมการตั้งค่า AI Provider
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={status?.configured ? "default" : "destructive"}>
              {status?.configured ? "พร้อมใช้งาน" : "ยังไม่พร้อมใช้งาน"}
            </Badge>
            {status?.defaultProvider && (
              <Badge variant="secondary">
                ค่าเริ่มต้น: {providers.find(p => p.key === status.defaultProvider)?.name}
              </Badge>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Provider ที่เปิดใช้งาน: {status?.enabledProviders.length || 0} รายการ</p>
            <p>ฟังก์ชัน AI: {status?.enabledFunctions.length || 0} รายการ</p>
          </div>

          {!status?.configured && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                ยังไม่มี AI Provider ที่พร้อมใช้งาน กรุณาตั้งค่า API Key หรือเปิดใช้งาน Ollama (local) ด้านล่าง
              </AlertDescription>
            </Alert>
          )}

          {status?.configured &&
            status.enabledProviders.length === 1 &&
            status.enabledProviders[0] === "ollama" && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  ตอนนี้ใช้ Ollama เป็นตัวเดียว — เหมาะสำหรับ dev/fallback
                  สำหรับแผนการสอนภาษาไทยคุณภาพสูง แนะนำเปิดใช้ OpenAI หรือ Gemini ใน Settings
                </AlertDescription>
              </Alert>
            )}
        </CardContent>
      </Card>

      {/* Provider Cards */}
      <div className="grid gap-6">
        {providers.map((provider) => (
          <Card key={provider.key}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getProviderIcon(provider.type)}
                  <div>
                    <CardTitle>{provider.name}</CardTitle>
                    <CardDescription>
                      {getProviderTypeLabel(provider.type)}
                      {provider.isDefault && (
                        <Badge variant="default" className="ml-2">ค่าเริ่มต้น</Badge>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={provider.isEnabled ? "default" : "secondary"}>
                    {provider.isEnabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                  </Badge>
                  {saved[provider.key] && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>เปิดใช้งาน Provider</Label>
                  <p className="text-sm text-muted-foreground">
                    เปิดใช้งาน Provider นี้สำหรับการสร้างแผนการสอน
                  </p>
                </div>
                <Switch
                  checked={provider.isEnabled}
                  onCheckedChange={(checked) => updateProvider(provider.key, { isEnabled: checked })}
                />
              </div>

              <Separator />

              {/* API Key — ข้ามสำหรับ local provider เช่น Ollama */}
              {isLocalProvider(provider) ? (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    API Key
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    ไม่จำเป็นสำหรับ Ollama local — cloud model อาจต้องรัน{" "}
                    <code className="rounded bg-muted px-1 py-0.5 text-xs">ollama signin</code>{" "}
                    ที่เครื่องก่อนใช้งาน
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    API Key
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type={editingKeys[provider.key] ? "text" : "password"}
                      value={editingKeys[provider.key] ? (provider.apiKey || "") : (provider.apiKey || "ไม่ได้ตั้งค่า")}
                      onChange={(e) => updateProvider(provider.key, { apiKey: e.target.value })}
                      placeholder={`กรอก ${provider.name} API Key`}
                      disabled={!editingKeys[provider.key] && !!provider.apiKey}
                      className="flex-1 font-mono"
                    />
                    {provider.apiKey && !editingKeys[provider.key] ? (
                      <Button
                        variant="outline"
                        onClick={() => setEditingKeys(prev => ({ ...prev, [provider.key]: true }))}
                      >
                        เปลี่ยน
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => setEditingKeys(prev => ({ ...prev, [provider.key]: !prev[provider.key] }))}
                      >
                        {editingKeys[provider.key] ? "ยกเลิก" : "แก้ไข"}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    API Key จะถูกเข้ารหัสก่อนบันทึกลงฐานข้อมูล
                  </p>
                </div>
              )}

              {/* Model Selection */}
              <div className="space-y-2">
                <Label>โมเดลเริ่มต้น</Label>
                {usesFreeformModel(provider.key) ? (
                  <>
                    <Input
                      value={provider.model}
                      onChange={(e) => updateProvider(provider.key, { model: e.target.value })}
                      placeholder={
                        provider.key === "ollama"
                          ? "qwen3-coder:480b-cloud"
                          : "google/gemini-2.0-flash-001"
                      }
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      {provider.key === "ollama"
                        ? "ชื่อ model ตามที่รันใน Ollama เช่น qwen3-coder:480b-cloud, qwen2.5:7b"
                        : "ชื่อ model ตาม OpenRouter เช่น google/gemini-2.0-flash-001, openai/gpt-4o-mini"}
                    </p>
                  </>
                ) : (
                  <Select
                    value={provider.model}
                    onValueChange={(value) => updateProvider(provider.key, { model: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {provider.key === "openai" && (
                        <>
                          <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                          <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                          <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        </>
                      )}
                      {provider.key === "kimi" && (
                        <>
                          <SelectItem value="kimi-for-coding">Kimi for Coding</SelectItem>
                          <SelectItem value="kimi-k2">Kimi K2</SelectItem>
                          <SelectItem value="kimi-k1.5">Kimi K1.5</SelectItem>
                        </>
                      )}
                      {provider.key === "gemini" && (
                        <>
                          <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (แนะนำ)</SelectItem>
                          <SelectItem value="gemini-flash-latest">Gemini Flash Latest</SelectItem>
                          <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                          <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                        </>
                      )}
                      {provider.key === "anthropic" && (
                        <>
                          <SelectItem value="claude-sonnet-4-20250514">Claude Sonnet 4</SelectItem>
                          <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</SelectItem>
                          <SelectItem value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</SelectItem>
                        </>
                      )}
                      {provider.key === "deepseek" && (
                        <>
                          <SelectItem value="deepseek-chat">DeepSeek Chat</SelectItem>
                          <SelectItem value="deepseek-reasoner">DeepSeek Reasoner</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Base URL (for compatible providers) */}
              {provider.type === "openai-compatible" && (
                <div className="space-y-2">
                  <Label>Base URL {provider.key === "ollama" ? "" : "(optional)"}</Label>
                  <Input
                    value={provider.baseUrl || ""}
                    onChange={(e) => updateProvider(provider.key, { baseUrl: e.target.value || null })}
                    placeholder={
                      provider.key === "ollama"
                        ? "http://127.0.0.1:11434/v1"
                        : provider.key === "deepseek"
                          ? "https://api.deepseek.com/v1"
                          : provider.key === "openrouter"
                            ? "https://openrouter.ai/api/v1"
                            : "https://api.example.com/v1"
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {provider.key === "ollama"
                      ? "Ollama OpenAI-compatible endpoint (default: http://127.0.0.1:11434/v1)"
                      : "ปล่อยว่างเพื่อใช้ค่าเริ่มต้น"}
                  </p>
                </div>
              )}

              <Separator />

              {/* Default Provider */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>ตั้งเป็นค่าเริ่มต้น</Label>
                  <p className="text-sm text-muted-foreground">
                    ใช้ Provider นี้เป็นค่าเริ่มต้นสำหรับการสร้างแผนการสอน
                  </p>
                </div>
                <Button
                  variant={provider.isDefault ? "default" : "outline"}
                  onClick={() => handleSetDefault(provider.key)}
                  disabled={provider.isDefault || !provider.isEnabled}
                >
                  {provider.isDefault ? "ค่าเริ่มต้น" : "ตั้งเป็นค่าเริ่มต้น"}
                </Button>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  onClick={() => handleSaveProvider(provider.key)}
                  disabled={isSaving[provider.key]}
                >
                  {isSaving[provider.key] ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      บันทึกการตั้งค่า
                    </>
                  )}
                </Button>
              </div>

              {/* Provider Documentation Link */}
              <div className="flex items-center gap-2 text-sm">
                <ExternalLink className="h-4 w-4" />
                <a
                  href={getProviderDocUrl(provider.key)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  ไปที่เว็บไซต์ {provider.name}
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {providers.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">ยังไม่มี AI Provider</h3>
            <p className="text-muted-foreground">
              ระบบจะโหลด Provider จาก .env โดยอัตโนมัติ หรือคุณสามารถตั้งค่าได้ที่นี่
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}