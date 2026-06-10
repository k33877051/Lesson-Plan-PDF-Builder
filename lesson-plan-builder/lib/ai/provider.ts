import { createOpenAI, openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import type { LanguageModel } from "ai";
import {
  getModelForFunction,
  getProvider,
  getDefaultProvider,
  getAllProviders,
  updateProviderApiKey,
  getMaskedApiKey,
  type AiProviderConfig
} from "./settings-provider";

// Legacy type for backward compatibility
type LegacyAIProvider = "openai" | "kimi" | "gemini";

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_KIMI_BASE_URL = "https://api.kimi.com/coding/v1";
const DEFAULT_KIMI_MODEL = "kimi-for-coding";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

// ==========================================
// Legacy Functions (Backward Compatibility)
// ==========================================

/**
 * Get AI provider from environment (legacy method)
 * @deprecated Use getActiveProviderForFunction() from settings-provider.ts instead
 */
export function getAIProvider(): LegacyAIProvider {
  const provider = process.env.AI_PROVIDER?.toLowerCase();
  if (provider === "kimi") return "kimi";
  if (provider === "gemini") return "gemini";
  return "openai";
}

/**
 * Get AI provider label (legacy method)
 * @deprecated Use provider name from database instead
 */
export function getAIProviderLabel(): string {
  const provider = getAIProvider();
  switch (provider) {
    case "kimi": return "KIMI AI";
    case "gemini": return "Google Gemini";
    default: return "OpenAI";
  }
}

/**
 * Check for missing API key configuration (legacy method)
 * @deprecated Use getAIStatus() from settings-provider.ts instead
 */
export function getMissingAIConfigKey(): string | null {
  const provider = getAIProvider();
  switch (provider) {
    case "kimi":
      return process.env.KIMI_API_KEY ? null : "KIMI_API_KEY";
    case "gemini":
      return process.env.GEMINI_API_KEY ? null : "GEMINI_API_KEY";
    default:
      return process.env.OPENAI_API_KEY ? null : "OPENAI_API_KEY";
  }
}

/**
 * Get lesson plan AI model (legacy method with database-first fallback)
 * This maintains backward compatibility while adding database support
 */
export async function getLessonPlanAIModel(): Promise<LanguageModel> {
  try {
    // Try database-first approach
    const { model } = await getModelForFunction("ai_helper");
    return model;
  } catch (error) {
    // Fallback to legacy environment-based approach
    console.warn("Database provider not available, falling back to .env:", error);
    return getLegacyLessonPlanAIModel();
  }
}

/**
 * Legacy model creation (env-only fallback)
 */
function getLegacyLessonPlanAIModel(): LanguageModel {
  const provider = getAIProvider();

  switch (provider) {
    case "kimi": {
      const apiKey = process.env.KIMI_API_KEY;
      if (!apiKey) {
        throw new Error("KIMI_API_KEY is not configured");
      }
      const kimi = createOpenAI({
        name: "kimi",
        baseURL: process.env.KIMI_BASE_URL || DEFAULT_KIMI_BASE_URL,
        apiKey,
      });
      return kimi.chat(process.env.KIMI_MODEL || DEFAULT_KIMI_MODEL);
    }

    case "gemini": {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured. Please set it in .env or configure via Settings > AI Providers");
      }
      // Set API key for Google SDK (it reads from env)
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
      return google(process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL);
    }

    default: { // openai
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not configured");
      }
      return openai(process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL);
    }
  }
}

// ==========================================
// New Database-First Exports
// ==========================================

export {
  getModelForFunction,
  getProvider,
  getDefaultProvider,
  getAllProviders,
  updateProviderApiKey,
  getMaskedApiKey,
  type AiProviderConfig
};

// Re-export from settings-provider for convenience
export {
  getAllFunctions,
  getFunction,
  getActiveProviderForFunction,
  getAIStatus,
  invalidateSettingsCache,
  providerRequiresApiKey,
  isProviderOperational,
  getStructuredOutputHint,
  getProvidersForFunction,
  repairProviderDefaults,
} from "./settings-provider";

export type { AiFunctionConfig } from "./settings-provider";

export { generateObjectWithProviderFallback } from "./generate-with-fallback";
export { normalizeLessonPlanAiJson, normalizeGenerateLessonJson } from "./normalize-lesson-json";

// ==========================================
// Provider Creation Helpers
// ==========================================

/**
 * Create an OpenAI-compatible provider instance
 */
export function createOpenAIProvider(
  apiKey: string,
  baseUrl?: string,
  model: string = DEFAULT_OPENAI_MODEL
): LanguageModel {
  const provider = createOpenAI({
    apiKey,
    baseURL: baseUrl,
  });
  return provider.chat(model);
}

/**
 * Create a Gemini provider instance
 */
export function createGeminiProvider(
  apiKey: string,
  model: string = DEFAULT_GEMINI_MODEL
): LanguageModel {
  // Set API key for Google SDK (it reads from env)
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
  return google(model);
}

// ==========================================
// Provider Configuration Types
// ==========================================

export interface ProviderConfig {
  key: string;
  name: string;
  type: "openai-compatible" | "gemini-native" | "anthropic-native";
  models: string[];
  requiresBaseUrl: boolean;
  defaultBaseUrl?: string;
  description?: string;
}

/**
 * Available provider configurations for UI display
 */
export const AVAILABLE_PROVIDERS: ProviderConfig[] = [
  {
    key: "openai",
    name: "OpenAI",
    type: "openai-compatible",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    requiresBaseUrl: false,
    description: "OpenAI GPT models via official API"
  },
  {
    key: "kimi",
    name: "KIMI AI",
    type: "openai-compatible",
    models: ["kimi-for-coding", "kimi-k2", "kimi-k1.5"],
    requiresBaseUrl: true,
    defaultBaseUrl: "https://api.kimi.com/coding/v1",
    description: "Moonshot AI KIMI models (OpenAI-compatible)"
  },
  {
    key: "gemini",
    name: "Google Gemini",
    type: "gemini-native",
    models: [
      "gemini-2.5-flash",
      "gemini-flash-latest",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
    ],
    requiresBaseUrl: false,
    description: "Google Gemini models via Google AI SDK"
  },
  {
    key: "anthropic",
    name: "Anthropic Claude",
    type: "anthropic-native",
    models: [
      "claude-sonnet-4-20250514",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022"
    ],
    requiresBaseUrl: false,
    description: "Anthropic Claude models via Anthropic SDK"
  },
  {
    key: "ollama",
    name: "Ollama",
    type: "openai-compatible",
    models: ["qwen3-coder:480b-cloud", "qwen2.5:7b", "llama3.2", "mistral"],
    requiresBaseUrl: true,
    defaultBaseUrl: "http://127.0.0.1:11434/v1",
    description: "Ollama local/cloud models (OpenAI-compatible API)"
  },
  {
    key: "deepseek",
    name: "DeepSeek",
    type: "openai-compatible",
    models: ["deepseek-chat", "deepseek-reasoner"],
    requiresBaseUrl: true,
    defaultBaseUrl: "https://api.deepseek.com/v1",
    description: "DeepSeek API (OpenAI-compatible, ราคาต่ำ)"
  },
  {
    key: "openrouter",
    name: "OpenRouter",
    type: "openai-compatible",
    models: ["google/gemini-2.0-flash-001", "openai/gpt-4o-mini", "deepseek/deepseek-chat"],
    requiresBaseUrl: true,
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    description: "OpenRouter multi-model gateway"
  }
];

/**
 * Get provider configuration by key
 */
export function getProviderConfig(key: string): ProviderConfig | undefined {
  return AVAILABLE_PROVIDERS.find(p => p.key === key);
}