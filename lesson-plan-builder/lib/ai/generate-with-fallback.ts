import { generateObject, generateText } from "ai";
import type { z } from "zod";
import {
  createModelFromConfig,
  getProvidersForFunction,
  getStructuredOutputHint,
  type AiProviderConfig,
} from "./settings-provider";
import { extractJsonFromText } from "./parse-json-response";

export interface GenerateObjectWithFallbackOptions<T extends z.ZodTypeAny> {
  functionKey: string;
  schema: T;
  system: string;
  prompt: string;
  temperature?: number;
  /** ปรับ JSON ก่อน validate (ใช้กับ Ollama text fallback) */
  normalizeParsedJson?: (raw: unknown) => unknown;
}

export interface GenerateObjectWithFallbackResult<T extends z.ZodTypeAny> {
  object: z.infer<T>;
  provider: AiProviderConfig;
  /** ใช้ provider สำรอง (ไม่ใช่ตัวแรกใน chain) */
  fallbackUsed: boolean;
  /** โมเดลที่ใช้จริง (อาจต่างจาก config ถ้า Gemini สลับโมเดล) */
  modelUsed: string;
}

const OLLAMA_TEXT_FALLBACK_HINT =
  "\n\nตอบเป็น JSON object เดียวเท่านั้น ห้ามใช้ markdown code fence หรือข้อความอธิบาย";

/** โมเดล Gemini สำรองเมื่อโมเดลหลัก overload (503) */
const GEMINI_MODEL_FALLBACKS = [
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-1.5-flash",
];

function isTransientProviderError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("high demand") ||
    message.includes("UNAVAILABLE") ||
    message.includes("503") ||
    message.includes("overloaded") ||
    message.includes("rate limit")
  );
}

function getModelsToTry(provider: AiProviderConfig): string[] {
  if (provider.type !== "gemini-native") {
    return [provider.model];
  }
  return [...new Set([provider.model, ...GEMINI_MODEL_FALLBACKS].filter(Boolean))];
}

async function tryOllamaTextFallback<T extends z.ZodTypeAny>(
  provider: AiProviderConfig,
  options: GenerateObjectWithFallbackOptions<T>,
  system: string,
  temperature: number
): Promise<z.infer<T>> {
  const model = createModelFromConfig(provider);
  const { text } = await generateText({
    model,
    system: system + OLLAMA_TEXT_FALLBACK_HINT,
    prompt: options.prompt,
    temperature,
  });

  const parsed = extractJsonFromText(text);
  const normalized = options.normalizeParsedJson
    ? options.normalizeParsedJson(parsed)
    : parsed;
  const validated = options.schema.safeParse(normalized);
  if (!validated.success) {
    throw new Error(
      `Ollama JSON ไม่ตรง schema: ${validated.error.issues.map((i) => i.message).join(", ")}`
    );
  }
  return validated.data;
}

async function generateStructuredWithProvider<T extends z.ZodTypeAny>(
  provider: AiProviderConfig,
  options: GenerateObjectWithFallbackOptions<T>
): Promise<{ object: z.infer<T>; modelUsed: string }> {
  const modelsToTry = getModelsToTry(provider);
  const system = options.system + getStructuredOutputHint(provider.key);
  const temperature = options.temperature ?? 0.7;
  let lastError: unknown;

  for (let i = 0; i < modelsToTry.length; i++) {
    const modelName = modelsToTry[i];
    const isLastModel = i === modelsToTry.length - 1;

    try {
      const model = createModelFromConfig({ ...provider, model: modelName });
      const { object } = await generateObject({
        model,
        schema: options.schema,
        system,
        prompt: options.prompt,
        temperature,
      });

      if (modelName !== provider.model) {
        console.info(
          `[AI fallback] ใช้ Gemini model "${modelName}" แทน ${provider.model}`
        );
      }

      return { object: object as z.infer<T>, modelUsed: modelName };
    } catch (objectError) {
      lastError = objectError;

      if (
        provider.type === "gemini-native" &&
        !isLastModel &&
        isTransientProviderError(objectError)
      ) {
        console.warn(
          `[AI fallback] Gemini "${modelName}" ไม่พร้อม — ลองโมเดลถัดไป`
        );
        continue;
      }

      if (provider.key === "ollama") {
        const object = await tryOllamaTextFallback(
          provider,
          options,
          system,
          temperature
        );
        return { object, modelUsed: provider.model };
      }

      throw objectError;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("ไม่สามารถสร้างเนื้อหา AI ได้");
}

/** ลอง generateObject ตามลำดับ priority จนกว่าจะสำเร็จ */
export async function generateObjectWithProviderFallback<T extends z.ZodTypeAny>(
  options: GenerateObjectWithFallbackOptions<T>
): Promise<GenerateObjectWithFallbackResult<T>> {
  const providers = await getProvidersForFunction(options.functionKey);

  if (providers.length === 0) {
    throw new Error(
      "No AI provider available. Please configure an AI provider in settings."
    );
  }

  const errors: string[] = [];

  for (let index = 0; index < providers.length; index++) {
    const provider = providers[index];
    try {
      const { object, modelUsed } = await generateStructuredWithProvider(
        provider,
        options
      );

      const fallbackUsed = index > 0;
      if (fallbackUsed) {
        console.info(
          `[AI fallback] ใช้ provider "${provider.key}" สำหรับ ${options.functionKey}`
        );
      }

      return {
        object,
        provider: { ...provider, model: modelUsed },
        fallbackUsed,
        modelUsed,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `[AI fallback] provider "${provider.key}" ล้มเหลวสำหรับ ${options.functionKey}:`,
        message
      );
      errors.push(`${provider.name}: ${message}`);
    }
  }

  throw new Error(`ทุก AI Provider ล้มเหลว (${errors.join(" | ")})`);
}
