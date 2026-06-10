"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  User, 
  Bell, 
  Palette, 
  Save,
  Loader2,
  CheckCircle,
  School,
  Mail,
  Phone,
  FileText,
  Printer,
  Languages,
  GitFork,
  Bot,
  Database,
  Cpu,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GitHubConnect } from "@/components/github/GitHubConnect";
import { AIProvidersSettings } from "@/components/ai/AIProvidersSettings";
import { GeminiSettingsPanel } from "@/components/ai/GeminiSettingsPanel";
import { AIFunctionsSettings } from "@/components/ai/AIFunctionsSettings";
import { ObjectRegistryPanel } from "@/components/system/ObjectRegistryPanel";
import { PageHeader } from "@/components/layout/page-header";
import { ResponsiveContainer } from "@/components/layout/responsive-container";
import { setAppTheme } from "@/components/layout/theme-sync";
import { setAppLanguage, useI18n } from "@/components/i18n/language-provider";

interface SettingsResponse {
  success: boolean;
  data?: {
    name: string | null;
    email: string | null;
    phone: string | null;
    school: string | null;
    position: string | null;
    theme: string;
    fontSize: string;
    language: string;
    emailAlerts: boolean;
    exportComplete: boolean;
    newFeatures: boolean;
    weeklyReport: boolean;
    defaultFont: string;
    defaultHeader: boolean;
    defaultFooter: boolean;
    pageSize: string;
    margin: string;
  };
  error?: string;
}

export default function SettingsPage() {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile settings
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    school: "",
    position: "",
  });

  // Appearance settings
  const [appearance, setAppearance] = useState({
    theme: "system",
    fontSize: "medium",
    language: "th",
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    exportComplete: true,
    newFeatures: false,
    weeklyReport: true,
  });

  // PDF Export settings
  const [pdfSettings, setPdfSettings] = useState({
    defaultFont: "sarabun",
    defaultHeader: true,
    defaultFooter: true,
    pageSize: "a4",
    margin: "normal",
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/settings");
        const result: SettingsResponse = await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.error || t("settings.loadError"));
        }

        const data = result.data;
        setProfile({
          name: data.name ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          school: data.school ?? "",
          position: data.position ?? "",
        });
        setAppearance({
          theme: data.theme,
          fontSize: data.fontSize,
          language: data.language,
        });
        setAppTheme(data.theme as "light" | "dark" | "system");
        if (data.language === "th" || data.language === "en") {
          setAppLanguage(data.language);
        }
        setNotifications({
          emailAlerts: data.emailAlerts,
          exportComplete: data.exportComplete,
          newFeatures: data.newFeatures,
          weeklyReport: data.weeklyReport,
        });
        setPdfSettings({
          defaultFont: data.defaultFont,
          defaultHeader: data.defaultHeader,
          defaultFooter: data.defaultFooter,
          pageSize: data.pageSize,
          margin: data.margin,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : t("common.loadError"));
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          ...appearance,
          ...notifications,
          ...pdfSettings,
        }),
      });
      const result: SettingsResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || t("settings.saveError"));
      }

      setAppTheme(appearance.theme as "light" | "dark" | "system");

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("settings.saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ResponsiveContainer className="space-y-6">
      <PageHeader
        title={t("settings.title")}
        description={t("settings.description")}
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <Card>
          <CardContent className="flex items-center gap-3 py-6">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{t("settings.loading")}</span>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto md:grid md:grid-cols-4 lg:grid-cols-8 lg:w-auto">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{t("settings.tabs.profile")}</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">{t("settings.tabs.appearance")}</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">{t("settings.tabs.notifications")}</span>
          </TabsTrigger>
          <TabsTrigger value="pdf" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">{t("settings.tabs.pdf")}</span>
          </TabsTrigger>
          <TabsTrigger value="ai-providers" className="gap-2">
            <Cpu className="h-4 w-4" />
            <span className="hidden sm:inline">{t("settings.tabs.aiProviders")}</span>
          </TabsTrigger>
          <TabsTrigger value="ai-functions" className="gap-2">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">{t("settings.tabs.aiFunctions")}</span>
          </TabsTrigger>
          <TabsTrigger value="registry" className="gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">{t("settings.tabs.registry")}</span>
          </TabsTrigger>
          <TabsTrigger value="github" className="gap-2">
            <GitFork className="h-4 w-4" />
            <span className="hidden sm:inline">{t("settings.tabs.github")}</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t("settings.profile.title")}
              </CardTitle>
              <CardDescription>{t("settings.profile.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("settings.profile.name")}</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder={t("settings.profile.namePlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">{t("settings.profile.position")}</Label>
                  <Input
                    id="position"
                    value={profile.position}
                    onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                    placeholder={t("settings.profile.positionPlaceholder")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {t("settings.profile.email")}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {t("settings.profile.phone")}
                  </Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="0xx-xxx-xxxx"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="school" className="flex items-center gap-2">
                  <School className="h-4 w-4" />
                  {t("settings.profile.school")}
                </Label>
                <Input
                  id="school"
                  value={profile.school}
                  onChange={(e) => setProfile({ ...profile, school: e.target.value })}
                  placeholder={t("settings.profile.schoolPlaceholder")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                {t("settings.appearance.title")}
              </CardTitle>
              <CardDescription>{t("settings.appearance.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>{t("settings.appearance.theme")}</Label>
                <Select
                  value={appearance.theme}
                  onValueChange={(value) => {
                    setAppearance({ ...appearance, theme: value });
                    setAppTheme(value as "light" | "dark" | "system");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">{t("settings.themeLight")}</SelectItem>
                    <SelectItem value="dark">{t("settings.themeDark")}</SelectItem>
                    <SelectItem value="system">{t("settings.themeSystem")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Languages className="h-4 w-4" />
                  {t("settings.appearance.language")}
                </Label>
                <Select
                  value={appearance.language}
                  onValueChange={(value) => {
                    setAppearance({ ...appearance, language: value });
                    setAppLanguage(value as "th" | "en");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="th">ไทย</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>{t("settings.appearance.fontSize")}</Label>
                <Select
                  value={appearance.fontSize}
                  onValueChange={(value) => setAppearance({ ...appearance, fontSize: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">{t("settings.appearance.fontSmall")}</SelectItem>
                    <SelectItem value="medium">{t("settings.appearance.fontMedium")}</SelectItem>
                    <SelectItem value="large">{t("settings.appearance.fontLarge")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {t("settings.notifications.title")}
              </CardTitle>
              <CardDescription>{t("settings.notifications.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("settings.notifications.emailAlerts")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.notifications.emailAlertsDesc")}
                  </p>
                </div>
                <Switch
                  checked={notifications.emailAlerts}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, emailAlerts: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("settings.notifications.exportComplete")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.notifications.exportCompleteDesc")}
                  </p>
                </div>
                <Switch
                  checked={notifications.exportComplete}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, exportComplete: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("settings.notifications.newFeatures")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.notifications.newFeaturesDesc")}
                  </p>
                </div>
                <Switch
                  checked={notifications.newFeatures}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, newFeatures: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("settings.notifications.weeklyReport")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.notifications.weeklyReportDesc")}
                  </p>
                </div>
                <Switch
                  checked={notifications.weeklyReport}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, weeklyReport: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PDF Export Tab */}
        <TabsContent value="pdf" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                {t("settings.pdf.title")}
              </CardTitle>
              <CardDescription>{t("settings.pdf.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>{t("settings.pdf.defaultFont")}</Label>
                <Select
                  value={pdfSettings.defaultFont}
                  onValueChange={(value) => setPdfSettings({ ...pdfSettings, defaultFont: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sarabun">TH Sarabun (สารบาล)</SelectItem>
                    <SelectItem value="notosansthai">Noto Sans Thai</SelectItem>
                    <SelectItem value="prompt">Prompt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>{t("settings.pdf.pageSize")}</Label>
                <Select
                  value={pdfSettings.pageSize}
                  onValueChange={(value) => setPdfSettings({ ...pdfSettings, pageSize: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a4">A4 (210 × 297 mm)</SelectItem>
                    <SelectItem value="letter">Letter (8.5 × 11 in)</SelectItem>
                    <SelectItem value="a3">A3 (297 × 420 mm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("settings.pdf.showHeader")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.pdf.showHeaderDesc")}
                  </p>
                </div>
                <Switch
                  checked={pdfSettings.defaultHeader}
                  onCheckedChange={(checked) => 
                    setPdfSettings({ ...pdfSettings, defaultHeader: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("settings.pdf.showFooter")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.pdf.showFooterDesc")}
                  </p>
                </div>
                <Switch
                  checked={pdfSettings.defaultFooter}
                  onCheckedChange={(checked) => 
                    setPdfSettings({ ...pdfSettings, defaultFooter: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GitHub Tab */}
        <TabsContent value="github" className="space-y-6">
          <GitHubConnect />
        </TabsContent>

        {/* AI Providers Tab */}
        <TabsContent value="ai-providers" className="space-y-6">
          <AIProvidersSettings />
          <GeminiSettingsPanel />
        </TabsContent>

        {/* AI Functions Tab */}
        <TabsContent value="ai-functions" className="space-y-6">
          <AIFunctionsSettings />
        </TabsContent>

        {/* Object Registry Tab */}
        <TabsContent value="registry" className="space-y-6">
          <ObjectRegistryPanel />
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        {saved && (
          <Alert className="flex-1 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">
              {t("settings.saveSuccess")}
            </AlertDescription>
          </Alert>
        )}
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="min-w-[120px]"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("common.saving")}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t("settings.saveButton")}
            </>
          )}
        </Button>
      </div>
    </ResponsiveContainer>
  );
}
