/**
 * Gemini Settings Service
 * 
 * Provides configuration management for Google Gemini authentication modes:
 * - API Key: Direct API key authentication
 * - Browser Profile: Configuration-only (no automation) for browser-based auth
 * 
 * Security: NO browser automation, NO Google credentials storage, NO cookies/tokens
 */

import { prisma } from "../prisma";

// ==========================================
// Types
// ==========================================

export type GeminiAuthMode = "api_key" | "browser_profile";

export type BrowserSessionStatus = "disconnected" | "connecting" | "connected" | "error";

export interface GeminiBrowserProfileConfig {
  enabled: boolean;
  profilePath: string;
  headless: boolean;
  sessionStatus: BrowserSessionStatus;
  lastLoginAt: Date | null;
  errorMessage?: string;
  manualInstructions?: string[];
}

export interface GeminiSettings {
  authMode: GeminiAuthMode;
  browserProfile?: GeminiBrowserProfileConfig;
}

// ==========================================
// Default Configuration
// ==========================================

const DEFAULT_BROWSER_PROFILE: GeminiBrowserProfileConfig = {
  enabled: false,
  profilePath: "./storage/gemini-profile",
  headless: false,
  sessionStatus: "disconnected",
  lastLoginAt: null,
  manualInstructions: [
    "1. ติดตั้ง Google Chrome หรือ Chromium บนเครื่อง",
    "2. สร้างโปรไฟล์เบราว์เซอร์ใหม่ที่ path ที่ระบุ",
    "3. เปิดเบราว์เซอร์ด้วยโปรไฟล์นั้น",
    "4. ล็อกอินเข้า Google Account ด้วยตนเอง",
    "5. ไปที่ https://aistudio.google.com/app/apikey เพื่อสร้าง API key",
    "6. บันทึก API key ในช่อง 'API Key' ด้านบน"
  ]
};

// ==========================================
// Settings Management
// ==========================================

/**
 * Get Gemini settings from database
 * Returns default settings if not configured
 */
export async function getGeminiSettings(): Promise<GeminiSettings> {
  const provider = await prisma.aiProvider.findUnique({
    where: { key: "gemini" },
    select: { settings: true }
  });

  const settings = (provider?.settings as GeminiSettings | null) || {
    authMode: "api_key",
    browserProfile: DEFAULT_BROWSER_PROFILE
  };

  // Ensure all required fields exist
  return {
    authMode: settings.authMode || "api_key",
    browserProfile: {
      ...DEFAULT_BROWSER_PROFILE,
      ...settings.browserProfile
    }
  };
}

/**
 * Update Gemini settings
 * Stores configuration only - no browser automation
 */
export async function updateGeminiSettings(
  settings: Partial<GeminiSettings>
): Promise<GeminiSettings> {
  const current = await getGeminiSettings();
  
  const updated: GeminiSettings = {
    authMode: settings.authMode || current.authMode,
    browserProfile: settings.browserProfile
      ? { ...current.browserProfile, ...settings.browserProfile }
      : current.browserProfile
  };

  await prisma.aiProvider.update({
    where: { key: "gemini" },
    data: {
      settings: updated as object
    }
  });

  return updated;
}

/**
 * Update browser profile session status
 * Used to manually track connection status (no automation)
 */
export async function updateBrowserSessionStatus(
  status: BrowserSessionStatus,
  errorMessage?: string
): Promise<void> {
  const current = await getGeminiSettings();
  
  const updatedProfile: GeminiBrowserProfileConfig = {
    ...current.browserProfile!,
    sessionStatus: status,
    lastLoginAt: status === "connected" ? new Date() : (current.browserProfile?.lastLoginAt || null),
    errorMessage: errorMessage
  };

  await updateGeminiSettings({
    browserProfile: updatedProfile
  });
}

/**
 * Set authentication mode
 */
export async function setAuthMode(mode: GeminiAuthMode): Promise<void> {
  await updateGeminiSettings({ authMode: mode });
}

// ==========================================
// Profile Path Management
// ==========================================

/**
 * Update browser profile path
 */
export async function updateProfilePath(path: string): Promise<void> {
  const current = await getGeminiSettings();
  
  await updateGeminiSettings({
    browserProfile: {
      ...current.browserProfile!,
      profilePath: path
    }
  });
}

/**
 * Validate profile path (basic check)
 */
export function validateProfilePath(path: string): { valid: boolean; error?: string } {
  if (!path || path.trim().length === 0) {
    return { valid: false, error: "Profile path is required" };
  }
  
  // Check for invalid characters
  const invalidChars = /[<>:"|?*]/;
  if (invalidChars.test(path)) {
    return { valid: false, error: "Path contains invalid characters" };
  }
  
  // Basic path format check
  if (!path.startsWith("./") && !path.startsWith("/") && !/^[a-zA-Z]:/.test(path)) {
    return { valid: false, error: "Path should be absolute or start with ./" };
  }
  
  return { valid: true };
}

// ==========================================
// Configuration UI Helpers
// ==========================================

/**
 * Get settings for UI display (masked, safe values)
 */
export async function getGeminiSettingsForUI(): Promise<{
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
}> {
  const settings = await getGeminiSettings();
  
  const status = settings.browserProfile?.sessionStatus || "disconnected";
  
  return {
    authMode: settings.authMode,
    browserProfile: {
      enabled: settings.browserProfile?.enabled || false,
      profilePath: settings.browserProfile?.profilePath || DEFAULT_BROWSER_PROFILE.profilePath,
      headless: settings.browserProfile?.headless ?? DEFAULT_BROWSER_PROFILE.headless,
      sessionStatus: status,
      lastLoginAt: settings.browserProfile?.lastLoginAt?.toISOString() || null,
      errorMessage: settings.browserProfile?.errorMessage,
      manualInstructions: DEFAULT_BROWSER_PROFILE.manualInstructions!
    },
    canConnect: status === "disconnected" || status === "error",
    canDisconnect: status === "connecting" || status === "connected"
  };
}

// ==========================================
// Manual Connection Workflow
// ==========================================

/**
 * Mark that user is starting manual connection process
 * Does NOT open browser - just updates status for tracking
 */
export async function markConnectionStarted(): Promise<void> {
  await updateBrowserSessionStatus("connecting");
}

/**
 * Mark that user has completed manual connection
 * Does NOT verify - just records that user says they're connected
 */
export async function markConnectionCompleted(): Promise<void> {
  await updateBrowserSessionStatus("connected");
}

/**
 * Mark connection as disconnected
 */
export async function markConnectionDisconnected(): Promise<void> {
  await updateBrowserSessionStatus("disconnected");
}

/**
 * Mark connection error
 */
export async function markConnectionError(errorMessage: string): Promise<void> {
  await updateBrowserSessionStatus("error", errorMessage);
}

// ==========================================
// Diagnostics
// ==========================================

/**
 * Get Gemini configuration status for health checks
 */
export async function getGeminiStatus(): Promise<{
  configured: boolean;
  authMode: GeminiAuthMode;
  apiKeyConfigured: boolean;
  browserProfileEnabled: boolean;
  browserProfilePath: string;
  sessionStatus: BrowserSessionStatus;
  lastLoginAt: Date | null;
  readyToUse: boolean;
}> {
  const provider = await prisma.aiProvider.findUnique({
    where: { key: "gemini" },
    select: {
      isEnabled: true,
      apiKeyEnc: true,
      settings: true
    }
  });

  const settings = (provider?.settings as GeminiSettings | null) || {
    authMode: "api_key",
    browserProfile: DEFAULT_BROWSER_PROFILE
  };

  const hasApiKey = !!provider?.apiKeyEnc;
  const profileEnabled = settings.browserProfile?.enabled || false;
  const sessionStatus = settings.browserProfile?.sessionStatus || "disconnected";

  // Ready to use if:
  // - API key mode + has API key
  // - OR browser profile mode + session connected
  const readyToUse = 
    (settings.authMode === "api_key" && hasApiKey) ||
    (settings.authMode === "browser_profile" && sessionStatus === "connected");

  return {
    configured: !!provider?.isEnabled,
    authMode: settings.authMode,
    apiKeyConfigured: hasApiKey,
    browserProfileEnabled: profileEnabled,
    browserProfilePath: settings.browserProfile?.profilePath || DEFAULT_BROWSER_PROFILE.profilePath,
    sessionStatus,
    lastLoginAt: settings.browserProfile?.lastLoginAt || null,
    readyToUse
  };
}

/**
 * Get manual setup instructions
 */
export function getManualSetupInstructions(profilePath: string): string[] {
  return [
    "การตั้งค่า Gemini Browser Profile (แบบ Manual)",
    "",
    "1. สร้างโฟลเดอร์สำหรับโปรไฟล์:",
    `   mkdir -p "${profilePath}"`,
    "",
    "2. เปิด Chrome/Chromium ด้วยโปรไฟล์นี้:",
    `   chrome --user-data-dir="${profilePath}"`,
    "",
    "3. ในเบราว์เซอร์ที่เปิด:",
    "   - ล็อกอินเข้า Google Account ของคุณ",
    "   - ไปที่ https://aistudio.google.com/app/apikey",
    "   - สร้าง API Key ใหม่",
    "",
    "4. บันทึก API Key ในหน้า Settings > AI Providers",
    "",
    "หมายเหตุ: ระบบนี้ไม่มีการควบคุมเบราว์เซอร์อัตโนมัติ",
    "ผู้ใช้ต้องดำเนินการทั้งหมดด้วยตนเอง"
  ];
}