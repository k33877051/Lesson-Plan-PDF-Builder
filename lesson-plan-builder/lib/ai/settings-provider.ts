/**
 * AI Settings Provider Service
 * 
 * Database-first configuration with .env fallback
 * Provides unified interface for accessing AI provider settings
 * 
 * Features:
 * - Database-first: Read from AiProvider, AiFunction, AiFunctionProvider tables
 * - .env fallback: Use environment variables if database has no values
 * - Encrypted API keys: Automatic encryption/decryption
 * - Masked display: Never expose full API keys in UI/API
 * - Priority-based fallback: Try providers in order if one fails
 */

import { prisma } from "../prisma";
import { decrypt, encrypt, maskApiKey, isEncrypted } from "../encryption";
import { createOpenAI, openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";

// ==========================================
// Types
// ==========================================

export interface AiProviderConfig {
  key: string;
  name: string;
  type: "openai-compatible" | "gemini-native" | "anthropic-native";
  baseUrl: string | null;
  apiKey: string | null;
  model: string;
  settings: Record<string, unknown>;
  isEnabled: boolean;
  isDefault: boolean;
  priority: number;
}

export interface AiFunctionConfig {
  key: string;
  name: string;
  description: string | null;
  category: string;
  settings: Record<string, unknown>;
  isEnabled: boolean;
  providers: Array<{
    providerKey: string;
    providerName: string;
    priority: number;
    config: Record<string, unknown>;
    isEnabled: boolean;
  }>;
}

export interface ActiveProviderResult {
  provider: AiProviderConfig;
  model: LanguageModel;
  functionConfig?: Record<string, unknown>;
}

// ==========================================
// In-memory cache (Phase 13)
// ==========================================

const SETTINGS_CACHE_TTL_MS = 60_000;
let providersCache: { data: AiProviderConfig[]; expiresAt: number } | null = null;
const functionConfigCache = new Map<string, { data: AiFunctionConfig; expiresAt: number }>();

export function invalidateSettingsCache(): void {
  providersCache = null;
  functionConfigCache.clear();
}

function getCachedProviders(): AiProviderConfig[] | null {
  if (!providersCache || Date.now() > providersCache.expiresAt) {
    providersCache = null;
    return null;
  }
  return providersCache.data;
}

function setCachedProviders(data: AiProviderConfig[]): void {
  providersCache = { data, expiresAt: Date.now() + SETTINGS_CACHE_TTL_MS };
}

// ==========================================
// Environment Fallback Values
// ==========================================

const ENV_FALLBACKS: Record<string, Partial<AiProviderConfig>> = {
  openai: {
    key: "openai",
    name: "OpenAI",
    type: "openai-compatible",
    baseUrl: null,
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY || null,
    isEnabled: !!process.env.OPENAI_API_KEY,
    isDefault: (process.env.AI_PROVIDER || "openai") === "openai",
    priority: 1
  },
  kimi: {
    key: "kimi",
    name: "KIMI AI",
    type: "openai-compatible",
    baseUrl: process.env.KIMI_BASE_URL || "https://api.kimi.com/coding/v1",
    model: process.env.KIMI_MODEL || "kimi-for-coding",
    apiKey: process.env.KIMI_API_KEY || null,
    isEnabled: !!process.env.KIMI_API_KEY,
    isDefault: (process.env.AI_PROVIDER || "openai") === "kimi",
    priority: 2
  },
  gemini: {
    key: "gemini",
    name: "Google Gemini",
    type: "gemini-native",
    baseUrl: "https://generativelanguage.googleapis.com",
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY || null,
    isEnabled: !!process.env.GEMINI_API_KEY,
    isDefault: (process.env.AI_PROVIDER || "openai") === "gemini",
    priority: 3
  },
  ollama: {
    key: "ollama",
    name: "Ollama",
    type: "openai-compatible",
    baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434/v1",
    model: process.env.OLLAMA_MODEL || "qwen3-coder:480b-cloud",
    apiKey: process.env.OLLAMA_API_KEY || "ollama",
    isEnabled:
      process.env.AI_PROVIDER === "ollama" ||
      !!process.env.OLLAMA_MODEL ||
      !!process.env.OLLAMA_BASE_URL,
    isDefault: process.env.AI_PROVIDER === "ollama",
    priority: 5,
    settings: { local: true, requiresApiKey: false, ollamaCloud: true }
  },
  anthropic: {
    key: "anthropic",
    name: "Anthropic Claude",
    type: "anthropic-native",
    baseUrl: null,
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
    apiKey: process.env.ANTHROPIC_API_KEY || null,
    isEnabled: !!process.env.ANTHROPIC_API_KEY,
    isDefault: process.env.AI_PROVIDER === "anthropic",
    priority: 4
  },
  deepseek: {
    key: "deepseek",
    name: "DeepSeek",
    type: "openai-compatible",
    baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
    model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
    apiKey: process.env.DEEPSEEK_API_KEY || null,
    isEnabled: !!process.env.DEEPSEEK_API_KEY,
    isDefault: process.env.AI_PROVIDER === "deepseek",
    priority: 6
  },
  openrouter: {
    key: "openrouter",
    name: "OpenRouter",
    type: "openai-compatible",
    baseUrl: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001",
    apiKey: process.env.OPENROUTER_API_KEY || null,
    isEnabled: !!process.env.OPENROUTER_API_KEY,
    isDefault: process.env.AI_PROVIDER === "openrouter",
    priority: 7
  }
};

// ==========================================
// Provider helpers
// ==========================================

/** local provider (เช่น Ollama) ไม่บังคับ API key */
export function providerRequiresApiKey(settings: Record<string, unknown>): boolean {
  return settings.requiresApiKey !== false;
}

function buildProviderConfig(
  dbProvider: {
    key: string;
    name: string;
    type: string;
    baseUrl: string | null;
    model: string;
    settings: unknown;
    isEnabled: boolean;
    isDefault: boolean;
    priority: number;
  },
  apiKey: string | null
): AiProviderConfig {
  const settings = (dbProvider.settings as Record<string, unknown>) || {};
  return {
    key: dbProvider.key,
    name: dbProvider.name,
    type: dbProvider.type as AiProviderConfig["type"],
    baseUrl: dbProvider.baseUrl,
    apiKey,
    model: dbProvider.model,
    settings,
    isEnabled: dbProvider.isEnabled && isProviderOperational({ apiKey, settings }),
    isDefault: dbProvider.isDefault,
    priority: dbProvider.priority
  };
}

export function isProviderOperational(config: {
  apiKey: string | null;
  settings: Record<string, unknown>;
}): boolean {
  if (!providerRequiresApiKey(config.settings)) {
    return true;
  }
  return !!config.apiKey;
}

/** คำสั่งเสริมสำหรับ provider ที่มักไม่ยึด structured output (เช่น Ollama) */
export function getStructuredOutputHint(providerKey: string): string {
  if (providerKey === "ollama") {
    return [
      "",
      "กฎสำคัญ (ต้องปฏิบัติตามทุกข้อ):",
      "- ตอบเป็น JSON object เดียวเท่านั้น ห้ามใช้ markdown code fence หรือข้อความนำ",
      "- เนื้อหาทุกฟิลด์ต้องเป็นภาษาไทยที่อ่านได้ ห้ามใช้ตัวอักษรเพี้ยนหรือภาษาอังกฤษยกเว้นคำศัพท์วิชา",
      "- objectives ต้องมี 3-5 ข้อ, keyConcepts 3-5 ข้อ, activities อย่างน้อย 1 กิจกรรมต่อ phase (ก่อนเรียน/ขณะเรียน/หลังเรียน)",
      "- assessment อย่างน้อย 2 รายการ, mediaResources อย่างน้อย 3 รายการ, summary ต้องไม่ว่าง",
    ].join("\n");
  }
  return "";
}

/**
 * แก้ isDefault ที่ชี้ไป provider ที่ปิดใช้งานหรือไม่พร้อมใช้งาน
 * ตั้ง default เป็น provider ที่พร้อมใช้งานตัวแรกตาม priority
 */
export async function repairProviderDefaults(): Promise<boolean> {
  invalidateSettingsCache();
  const providers = await getAllProviders();
  const operational = providers.filter((p) => p.isEnabled);

  if (operational.length === 0) {
    return false;
  }

  const validDefault = providers.find((p) => p.isDefault && p.isEnabled);
  if (validDefault) {
    return false;
  }

  const nextDefault = operational[0];

  await prisma.aiProvider.updateMany({ data: { isDefault: false } });
  await prisma.aiProvider.update({
    where: { key: nextDefault.key },
    data: { isDefault: true },
  });

  console.log(
    `[ai-settings] ปรับ default provider → ${nextDefault.key} (${nextDefault.name})`
  );
  invalidateSettingsCache();
  return true;
}

function resolveApiKeyForModel(provider: AiProviderConfig): string {
  if (provider.apiKey) {
    return provider.apiKey;
  }
  if (!providerRequiresApiKey(provider.settings)) {
    return "ollama";
  }
  throw new Error(`No API key available for provider: ${provider.key}`);
}

// ==========================================
// Provider Retrieval
// ==========================================

/**
 * Get all AI providers from database with .env fallback
 * Returns providers with decrypted API keys (for internal use)
 */
export async function getAllProviders(): Promise<AiProviderConfig[]> {
  const cached = getCachedProviders();
  if (cached) return cached;

  const dbProviders = await prisma.aiProvider.findMany({
    orderBy: { priority: "asc" }
  });

  const providers: AiProviderConfig[] = [];

  for (const dbProvider of dbProviders) {
    // Decrypt API key if encrypted
    let apiKey: string | null = null;
    if (dbProvider.apiKeyEnc) {
      try {
        apiKey = isEncrypted(dbProvider.apiKeyEnc)
          ? decrypt(dbProvider.apiKeyEnc)
          : dbProvider.apiKeyEnc; // Plain text fallback
      } catch (error) {
        console.error(`Failed to decrypt API key for ${dbProvider.key}:`, error);
        apiKey = null;
      }
    }

    // Fallback to env if no database key
    const envFallback = ENV_FALLBACKS[dbProvider.key];
    if (!apiKey && envFallback?.apiKey) {
      apiKey = envFallback.apiKey;
    }

    providers.push(buildProviderConfig(dbProvider, apiKey));
  }

  // Add providers from env ที่ยังไม่มีใน DB
  for (const [key, envProvider] of Object.entries(ENV_FALLBACKS)) {
    if (providers.some((p) => p.key === key)) {
      continue;
    }

    const envSettings = (envProvider.settings as Record<string, unknown>) || {};
    const hasEnvKey = !!envProvider.apiKey;
    const isLocalEnv = !providerRequiresApiKey(envSettings);

    if (!hasEnvKey && !isLocalEnv) {
      continue;
    }

    providers.push({
      key: envProvider.key!,
      name: envProvider.name!,
      type: envProvider.type as AiProviderConfig["type"],
      baseUrl: envProvider.baseUrl || null,
      apiKey: envProvider.apiKey || (isLocalEnv ? "ollama" : null),
      model: envProvider.model!,
      settings: envSettings,
      isEnabled: !!envProvider.isEnabled,
      isDefault: envProvider.isDefault!,
      priority: envProvider.priority!
    });
  }

  const sorted = providers.sort((a, b) => a.priority - b.priority);
  setCachedProviders(sorted);
  return sorted;
}

/**
 * Get a single provider by key with .env fallback
 */
export async function getProvider(key: string): Promise<AiProviderConfig | null> {
  // Try database first
  const dbProvider = await prisma.aiProvider.findUnique({
    where: { key }
  });

  if (dbProvider) {
    let apiKey: string | null = null;
    if (dbProvider.apiKeyEnc) {
      try {
        apiKey = isEncrypted(dbProvider.apiKeyEnc)
          ? decrypt(dbProvider.apiKeyEnc)
          : dbProvider.apiKeyEnc;
      } catch (error) {
        console.error(`Failed to decrypt API key for ${key}:`, error);
      }
    }

    // Fallback to env
    const envFallback = ENV_FALLBACKS[key];
    if (!apiKey && envFallback?.apiKey) {
      apiKey = envFallback.apiKey;
    }

    return buildProviderConfig(dbProvider, apiKey);
  }

  // Fallback to env only
  const envProvider = ENV_FALLBACKS[key];
  if (envProvider) {
    const envSettings = (envProvider.settings as Record<string, unknown>) || {};
    const apiKey =
      envProvider.apiKey || (!providerRequiresApiKey(envSettings) ? "ollama" : null);

    if (apiKey || !providerRequiresApiKey(envSettings)) {
      return {
        key: envProvider.key!,
        name: envProvider.name!,
        type: envProvider.type as AiProviderConfig["type"],
        baseUrl: envProvider.baseUrl || null,
        apiKey,
        model: envProvider.model!,
        settings: envSettings,
        isEnabled: !!envProvider.isEnabled,
        isDefault: envProvider.isDefault!,
        priority: envProvider.priority!
      };
    }
  }

  return null;
}

/**
 * Get the default provider (first enabled with isDefault=true, or first enabled)
 */
export async function getDefaultProvider(): Promise<AiProviderConfig | null> {
  const providers = await getAllProviders();
  return providers.find(p => p.isEnabled && p.isDefault) ||
         providers.find(p => p.isEnabled) ||
         null;
}

/**
 * Get active provider for a specific function
 * Respects function-provider mappings and priorities
 */
export async function getActiveProviderForFunction(
  functionKey: string
): Promise<AiProviderConfig | null> {
  const providers = await getProvidersForFunction(functionKey);
  if (providers.length > 0) {
    return providers[0];
  }
  return getDefaultProvider();
}

/**
 * รายการ provider ที่พร้อมใช้งานตาม priority (สำหรับ fallback chain)
 */
export async function getProvidersForFunction(
  functionKey: string
): Promise<AiProviderConfig[]> {
  const result: AiProviderConfig[] = [];
  const seen = new Set<string>();

  const func = await prisma.aiFunction.findUnique({
    where: { key: functionKey },
    include: {
      providers: {
        where: { isEnabled: true },
        include: { provider: true },
        orderBy: { priority: "asc" }
      }
    }
  });

  if (func?.isEnabled) {
    for (const mapping of func.providers) {
      if (!mapping.provider.isEnabled) continue;
      const provider = await getProvider(mapping.provider.key);
      if (
        provider?.isEnabled &&
        isProviderOperational(provider) &&
        !seen.has(provider.key)
      ) {
        seen.add(provider.key);
        result.push(provider);
      }
    }
  }

  if (result.length > 0) {
    return result;
  }

  const defaultProvider = await getDefaultProvider();
  if (defaultProvider?.isEnabled && isProviderOperational(defaultProvider)) {
    return [defaultProvider];
  }

  const allProviders = await getAllProviders();
  return allProviders.filter(
    (p) => p.isEnabled && isProviderOperational(p)
  );
}

// ==========================================
// Model Creation (for AI SDK)
// ==========================================

/**
 * Create an AI SDK model instance from provider config
 */
export function createModelFromConfig(provider: AiProviderConfig): LanguageModel {
  const apiKey = resolveApiKeyForModel(provider);

  switch (provider.type) {
    case "openai-compatible": {
      const openaiProvider = createOpenAI({
        name: provider.key,
        baseURL: provider.baseUrl || undefined,
        apiKey
      });
      return openaiProvider.chat(provider.model);
    }

    case "gemini-native":
      // Set API key for Google SDK (it reads from env)
      if (provider.apiKey) {
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = provider.apiKey;
      }
      return google(provider.model);

    case "anthropic-native": {
      const anthropicProvider = createAnthropic({ apiKey });
      return anthropicProvider(provider.model);
    }

    default:
      throw new Error(`Unsupported provider type: ${provider.type}`);
  }
}

/**
 * Get a model for a specific function
 * Main entry point for AI generation
 */
export async function getModelForFunction(
  functionKey: string
): Promise<{ model: LanguageModel; provider: AiProviderConfig }> {
  const provider = await getActiveProviderForFunction(functionKey);
  
  if (!provider) {
    throw new Error("No AI provider available. Please configure an AI provider in settings.");
  }

  if (!isProviderOperational(provider)) {
    throw new Error(
      `Provider ${provider.name} ยังไม่พร้อมใช้งาน กรุณาตั้งค่า API Key หรือเปิดใช้งานใน Settings`
    );
  }

  const model = createModelFromConfig(provider);
  return { model, provider };
}

// ==========================================
// API Key Management
// ==========================================

/**
 * Update provider API key (encrypts before storing)
 */
export async function updateProviderApiKey(
  providerKey: string,
  apiKey: string | null
): Promise<void> {
  const encryptedKey = apiKey ? encrypt(apiKey) : null;
  const existing = await prisma.aiProvider.findUnique({ where: { key: providerKey } });
  const settings = (existing?.settings as Record<string, unknown>) || {};
  const requiresKey = providerRequiresApiKey(settings);

  await prisma.aiProvider.update({
    where: { key: providerKey },
    data: {
      apiKeyEnc: encryptedKey,
      isEnabled: requiresKey ? !!apiKey : existing?.isEnabled ?? true
    }
  });

  invalidateSettingsCache();
}

/**
 * Get masked API key for display
 */
export function getMaskedApiKey(apiKey: string | null): string {
  if (!apiKey) return "Not configured";
  return maskApiKey(apiKey);
}

// ==========================================
// Function Registry
// ==========================================

/**
 * Get all AI functions with their provider mappings
 */
export async function getAllFunctions(): Promise<AiFunctionConfig[]> {
  const functions = await prisma.aiFunction.findMany({
    include: {
      providers: {
        include: { provider: true },
        orderBy: { priority: "asc" }
      }
    },
    orderBy: { name: "asc" }
  });

  return functions.map(func => ({
    key: func.key,
    name: func.name,
    description: func.description,
    category: func.category,
    settings: (func.settings as Record<string, unknown>) || {},
    isEnabled: func.isEnabled,
    providers: func.providers.map(mapping => ({
      providerKey: mapping.provider.key,
      providerName: mapping.provider.name,
      priority: mapping.priority,
      config: (mapping.config as Record<string, unknown>) || {},
      isEnabled: mapping.isEnabled && mapping.provider.isEnabled
    }))
  }));
}

/**
 * Get a single function by key
 */
export async function getFunction(key: string): Promise<AiFunctionConfig | null> {
  const cached = functionConfigCache.get(key);
  if (cached && Date.now() <= cached.expiresAt) {
    return cached.data;
  }

  const func = await prisma.aiFunction.findUnique({
    where: { key },
    include: {
      providers: {
        include: { provider: true },
        orderBy: { priority: "asc" }
      }
    }
  });

  if (!func) return null;

  const result: AiFunctionConfig = {
    key: func.key,
    name: func.name,
    description: func.description,
    category: func.category,
    settings: (func.settings as Record<string, unknown>) || {},
    isEnabled: func.isEnabled,
    providers: func.providers.map(mapping => ({
      providerKey: mapping.provider.key,
      providerName: mapping.provider.name,
      priority: mapping.priority,
      config: (mapping.config as Record<string, unknown>) || {},
      isEnabled: mapping.isEnabled && mapping.provider.isEnabled
    }))
  };

  functionConfigCache.set(key, { data: result, expiresAt: Date.now() + SETTINGS_CACHE_TTL_MS });
  return result;
}

// ==========================================
// Diagnostics
// ==========================================

/**
 * Get AI system status for health checks
 */
export async function getAIStatus(): Promise<{
  configured: boolean;
  defaultProvider: string | null;
  enabledProviders: string[];
  enabledFunctions: string[];
  encryptionStatus: {
    configured: boolean;
    source: string;
    warning?: string;
  };
}> {
  const providers = await getAllProviders();
  const functions = await prisma.aiFunction.findMany({
    where: { isEnabled: true }
  });

  const { isEncryptionConfigured, getEncryptionStatus } = await import("../encryption");

  return {
    configured: providers.some(p => p.isEnabled),
    defaultProvider:
      providers.find((p) => p.isDefault && p.isEnabled)?.key ||
      providers.find((p) => p.isEnabled)?.key ||
      null,
    enabledProviders: providers.filter(p => p.isEnabled).map(p => p.key),
    enabledFunctions: functions.map(f => f.key),
    encryptionStatus: getEncryptionStatus()
  };
}