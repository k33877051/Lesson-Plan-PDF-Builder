import { createOpenAI, openai } from "@ai-sdk/openai";

type AIProvider = "openai" | "kimi";

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_KIMI_BASE_URL = "https://api.kimi.com/coding/v1";
const DEFAULT_KIMI_MODEL = "kimi-for-coding";

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER?.toLowerCase();
  return provider === "kimi" ? "kimi" : "openai";
}

export function getAIProviderLabel() {
  return getAIProvider() === "kimi" ? "KIMI AI" : "OpenAI";
}

export function getMissingAIConfigKey() {
  return getAIProvider() === "kimi" && !process.env.KIMI_API_KEY
    ? "KIMI_API_KEY"
    : getAIProvider() === "openai" && !process.env.OPENAI_API_KEY
      ? "OPENAI_API_KEY"
      : null;
}

export function getLessonPlanAIModel() {
  if (getAIProvider() === "kimi") {
    const kimi = createOpenAI({
      name: "kimi",
      baseURL: process.env.KIMI_BASE_URL || DEFAULT_KIMI_BASE_URL,
      apiKey: process.env.KIMI_API_KEY,
    });

    return kimi.chat(process.env.KIMI_MODEL || DEFAULT_KIMI_MODEL);
  }

  return openai(process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL);
}
