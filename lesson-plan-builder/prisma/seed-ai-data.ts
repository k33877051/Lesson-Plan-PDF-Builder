/**
 * Seed script for AI Settings Center
 * 
 * Registers existing AI functions and initial AI providers
 * Run with: npx tsx prisma/seed-ai-data.ts
 */

import { prisma } from "../lib/prisma";
import { encrypt } from "../lib/encryption";

// ==========================================
// AI Functions - Register existing capabilities
// ==========================================

const aiFunctions = [
  {
    key: "ai_helper",
    name: "AI Helper",
    description: "ช่วยร่างเนื้อหาแผนการสอนจากข้อมูลพื้นฐาน เช่น วัตถุประสงค์ กิจกรรม การประเมิน สื่อ และสรุปเนื้อหา",
    category: "content_generation",
    settings: {
      temperature: 0.7,
      maxTokens: 2000,
      responseFormat: "structured_object",
      systemPrompt: "คุณเป็นผู้ช่วยครูผู้เชี่ยวชาญในการจัดทำแผนการสอน"
    }
  },
  {
    key: "generate_lesson",
    name: "Generate Lesson Plan",
    description: "สร้างแผนการสอนฉบับสมบูรณ์จากแหล่งข้อมูลวิชาการที่เลือก พร้อมบันทึกการอ้างอิง",
    category: "content_generation",
    settings: {
      temperature: 0.5,
      maxTokens: 4000,
      responseFormat: "structured_object",
      includeCitations: true,
      systemPrompt: "สร้างแผนการสอนที่มีคุณภาพสูงตามแหล่งข้อมูลที่ให้มา"
    }
  },
  {
    key: "research_automation",
    name: "Research Automation",
    description: "ค้นหาแหล่งข้อมูลวิชาการที่เกี่ยวข้องอัตโนมัติจากหัวข้อ วิชา และระดับชั้น",
    category: "research",
    settings: {
      maxSources: 10,
      minCredibilityScore: 0.6,
      platforms: ["web", "google", "youtube"],
      systemPrompt: "ค้นหาแหล่งข้อมูลที่น่าเชื่อถือสำหรับการศึกษา"
    }
  },
  {
    key: "research_source_extraction",
    name: "Source Content Extraction",
    description: "ดึงเนื้อหาฉบับเต็มจากแหล่งข้อมูล URL พร้อมทำความสะอาดและแบ่งช่วง (chunking)",
    category: "research",
    settings: {
      maxChunkSize: 2000,
      chunkOverlap: 200,
      extractMethod: "readability",
      systemPrompt: "ดึงเนื้อหาที่เป็นประโยชน์จากแหล่งข้อมูล"
    }
  },
  {
    key: "ai_content_analysis",
    name: "Content Analysis & Scoring",
    description: "วิเคราะห์และให้คะแนนคุณภาพแหล่งข้อมูล รวมถึงความน่าเชื่อถือ ความเกี่ยวข้อง และความเหมาะสมทางการศึกษา",
    category: "analysis",
    settings: {
      scoringModel: "educational_criteria",
      weights: {
        credibility: 0.4,
        relevance: 0.4,
        educationalValue: 0.2
      },
      systemPrompt: "ประเมินคุณภาพแหล่งข้อมูลสำหรับการใช้งานทางการศึกษา"
    }
  }
];

// ==========================================
// AI Providers - Initial configuration
// ==========================================

interface ProviderConfig {
  key: string;
  name: string;
  type: string;
  baseUrl: string | null;
  model: string;
  settings: Record<string, unknown>;
  isEnabled: boolean;
  isDefault: boolean;
  priority: number;
  envKeyName: string;
}

const aiProviders: ProviderConfig[] = [
  {
    key: "openai",
    name: "OpenAI",
    type: "openai-compatible",
    baseUrl: null, // Use default OpenAI endpoint
    model: "gpt-4o-mini",
    settings: {
      organization: null,
      apiVersion: "v1"
    },
    isEnabled: true,
    isDefault: false, // Will be set based on env
    priority: 1,
    envKeyName: "OPENAI_API_KEY"
  },
  {
    key: "kimi",
    name: "KIMI AI",
    type: "openai-compatible",
    baseUrl: "https://api.kimi.com/coding/v1",
    model: "kimi-for-coding",
    settings: {
      apiVersion: "v1",
      note: "KIMI Coding API may have restrictions on non-coding tasks"
    },
    isEnabled: true,
    isDefault: false,
    priority: 2,
    envKeyName: "KIMI_API_KEY"
  },
  {
    key: "gemini",
    name: "Google Gemini",
    type: "gemini-native",
    baseUrl: "https://generativelanguage.googleapis.com",
    model: "gemini-2.5-flash",
    settings: {
      apiVersion: "v1beta",
      browserAuth: {
        enabled: false,
        profilePath: "./storage/gemini-profile",
        headless: true
      }
    },
    isEnabled: false, // Disabled by default until configured
    isDefault: false,
    priority: 3,
    envKeyName: "GEMINI_API_KEY"
  },
  {
    key: "anthropic",
    name: "Anthropic Claude",
    type: "anthropic-native",
    baseUrl: null,
    model: "claude-sonnet-4-20250514",
    settings: {
      apiVersion: "v1",
      note: "Claude ผ่าน Anthropic API — คุณภาพสูง เหมาะกับ generate_lesson"
    },
    isEnabled: false,
    isDefault: false,
    priority: 4,
    envKeyName: "ANTHROPIC_API_KEY"
  },
  {
    key: "ollama",
    name: "Ollama",
    type: "openai-compatible",
    baseUrl: "http://127.0.0.1:11434/v1",
    model: "qwen3-coder:480b-cloud",
    settings: {
      local: true,
      requiresApiKey: false,
      ollamaCloud: true,
      note: "Cloud model ผ่าน Ollama daemon — อาจต้อง ollama signin"
    },
    isEnabled: true,
    isDefault: false,
    priority: 5,
    envKeyName: "OLLAMA_API_KEY"
  },
  {
    key: "deepseek",
    name: "DeepSeek",
    type: "openai-compatible",
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    settings: {
      apiVersion: "v1",
      note: "ราคาต่ำ คุณภาพดี เหมาะกับ generate_lesson และ ai_helper"
    },
    isEnabled: false,
    isDefault: false,
    priority: 6,
    envKeyName: "DEEPSEEK_API_KEY"
  },
  {
    key: "openrouter",
    name: "OpenRouter",
    type: "openai-compatible",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "google/gemini-2.0-flash-001",
    settings: {
      apiVersion: "v1",
      note: "Gateway หลายโมเดลผ่าน endpoint เดียว — เปลี่ยน model ตามต้องการ"
    },
    isEnabled: false,
    isDefault: false,
    priority: 7,
    envKeyName: "OPENROUTER_API_KEY"
  }
];

// ==========================================
// Function-Provider Mappings
// ==========================================

const functionProviderMappings: Record<string, Array<{ providerKey: string; priority: number; config?: Record<string, unknown> }>> = {
  ai_helper: [
    { providerKey: "openai", priority: 1, config: { temperature: 0.7 } },
    { providerKey: "kimi", priority: 2, config: { temperature: 0.7 } },
    { providerKey: "gemini", priority: 3, config: { temperature: 0.7 } },
    { providerKey: "anthropic", priority: 4, config: { temperature: 0.7 } },
    { providerKey: "ollama", priority: 5, config: { temperature: 0.7 } },
    { providerKey: "deepseek", priority: 6, config: { temperature: 0.7 } },
    { providerKey: "openrouter", priority: 7, config: { temperature: 0.7 } }
  ],
  generate_lesson: [
    { providerKey: "openai", priority: 1, config: { temperature: 0.5 } },
    { providerKey: "kimi", priority: 2, config: { temperature: 0.5 } },
    { providerKey: "gemini", priority: 3, config: { temperature: 0.5 } },
    { providerKey: "anthropic", priority: 4, config: { temperature: 0.5 } },
    { providerKey: "ollama", priority: 5, config: { temperature: 0.5 } },
    { providerKey: "deepseek", priority: 6, config: { temperature: 0.5 } },
    { providerKey: "openrouter", priority: 7, config: { temperature: 0.5 } }
  ],
  research_automation: [
    { providerKey: "openai", priority: 1 },
    { providerKey: "gemini", priority: 2 },
    { providerKey: "anthropic", priority: 3 },
    { providerKey: "ollama", priority: 5 },
    { providerKey: "deepseek", priority: 6 },
    { providerKey: "openrouter", priority: 7 }
  ],
  research_source_extraction: [
    { providerKey: "openai", priority: 1 },
    { providerKey: "gemini", priority: 2 },
    { providerKey: "anthropic", priority: 3 },
    { providerKey: "ollama", priority: 5 },
    { providerKey: "deepseek", priority: 6 },
    { providerKey: "openrouter", priority: 7 }
  ],
  ai_content_analysis: [
    { providerKey: "openai", priority: 1 },
    { providerKey: "gemini", priority: 2 },
    { providerKey: "anthropic", priority: 3 },
    { providerKey: "ollama", priority: 5 },
    { providerKey: "deepseek", priority: 6 },
    { providerKey: "openrouter", priority: 7 }
  ]
};

// ==========================================
// Seed Functions
// ==========================================

function isLocalProvider(settings: Record<string, unknown>): boolean {
  return settings.requiresApiKey === false || settings.local === true;
}

async function seedAiFunctions() {
  console.log("🌱 Seeding AI Functions...");
  
  for (const func of aiFunctions) {
    await prisma.aiFunction.upsert({
      where: { key: func.key },
      update: {
        name: func.name,
        description: func.description,
        category: func.category,
        settings: func.settings
      },
      create: {
        key: func.key,
        name: func.name,
        description: func.description,
        category: func.category,
        settings: (func.settings || {}) as object,
        isEnabled: true
      }
    });
    console.log(`  ✓ ${func.name} (${func.key})`);
  }
  
  console.log(`✅ Seeded ${aiFunctions.length} AI Functions\n`);
}

async function seedAiProviders() {
  console.log("🌱 Seeding AI Providers...");
  
  // Determine which provider should be default based on env
  const currentProvider = process.env.AI_PROVIDER?.toLowerCase() || "openai";
  
  for (const provider of aiProviders) {
    const envKey = process.env[provider.envKeyName];
    const local = isLocalProvider(provider.settings);

    let encryptedKey: string | null = null;
    if (envKey) {
      try {
        encryptedKey = encrypt(envKey);
        console.log(`  🔐 Encrypted ${provider.envKeyName}`);
      } catch (error) {
        console.warn(`  ⚠️ Failed to encrypt ${provider.envKeyName}:`, error);
      }
    } else if (local) {
      try {
        encryptedKey = encrypt(process.env.OLLAMA_API_KEY || "ollama");
        console.log(`  🔐 Local provider placeholder key (${provider.key})`);
      } catch (error) {
        console.warn(`  ⚠️ Failed to encrypt local key for ${provider.key}:`, error);
      }
    }

    const providerEnabled = !!envKey || local || provider.isEnabled;
    const shouldBeDefault = provider.key === currentProvider && providerEnabled;

    await prisma.aiProvider.upsert({
      where: { key: provider.key },
      update: {
        name: provider.name,
        type: provider.type,
        baseUrl: provider.baseUrl,
        model: provider.model,
        settings: (provider.settings || {}) as object,
        ...(encryptedKey !== null ? { apiKeyEnc: encryptedKey } : {}),
        isEnabled: providerEnabled,
        isDefault: shouldBeDefault,
        priority: provider.priority
      },
      create: {
        key: provider.key,
        name: provider.name,
        type: provider.type,
        baseUrl: provider.baseUrl,
        model: provider.model,
        settings: (provider.settings || {}) as object,
        apiKeyEnc: encryptedKey,
        isEnabled: providerEnabled,
        isDefault: shouldBeDefault,
        priority: provider.priority
      }
    });

    const status = envKey
      ? "🔑 API key configured"
      : local
        ? "🖥️ Local provider"
        : "⚪ No API key";
    const defaultMarker = shouldBeDefault ? " [DEFAULT]" : "";
    console.log(`  ✓ ${provider.name} (${provider.key})${defaultMarker} - ${status}`);
  }
  
  console.log(`✅ Seeded ${aiProviders.length} AI Providers\n`);
}

async function seedFunctionProviderMappings() {
  console.log("🌱 Seeding Function-Provider Mappings...");
  
  // Get all functions and providers from DB
  const functions = await prisma.aiFunction.findMany();
  const providers = await prisma.aiProvider.findMany();
  
  const functionMap = new Map(functions.map(f => [f.key, f.id]));
  const providerMap = new Map(providers.map(p => [p.key, p.id]));
  
  let mappingCount = 0;
  
  for (const [funcKey, mappings] of Object.entries(functionProviderMappings)) {
    const functionId = functionMap.get(funcKey);
    if (!functionId) {
      console.warn(`  ⚠️ Function ${funcKey} not found, skipping mappings`);
      continue;
    }
    
    for (const mapping of mappings) {
      const providerId = providerMap.get(mapping.providerKey);
      if (!providerId) {
        console.warn(`  ⚠️ Provider ${mapping.providerKey} not found, skipping`);
        continue;
      }
      
      await prisma.aiFunctionProvider.upsert({
        where: {
          functionId_providerId: {
            functionId: functionId,
            providerId: providerId
          }
        },
        update: {
          priority: mapping.priority,
          config: (mapping.config || {}) as object,
          isEnabled: true
        },
        create: {
          functionId: functionId,
          providerId: providerId,
          priority: mapping.priority,
          config: (mapping.config || {}) as object,
          isEnabled: true
        }
      });
      
      mappingCount++;
    }
    
    console.log(`  ✓ ${funcKey}: ${mappings.length} provider(s)`);
  }
  
  console.log(`✅ Seeded ${mappingCount} Function-Provider Mappings\n`);
}

// ==========================================
// Main
// ==========================================

async function main() {
  console.log("🚀 Starting AI Settings Center Seed\n");
  console.log("=" .repeat(50));
  
  try {
    // Step 1: Seed AI Functions
    await seedAiFunctions();
    
    // Step 2: Seed AI Providers (with encrypted API keys from env)
    await seedAiProviders();
    
    // Step 3: Seed Function-Provider mappings
    await seedFunctionProviderMappings();
    
    console.log("=" .repeat(50));
    console.log("✅ AI Settings Center seed completed successfully!\n");
    
    // Summary
    const funcCount = await prisma.aiFunction.count();
    const providerCount = await prisma.aiProvider.count();
    const mappingCount = await prisma.aiFunctionProvider.count();
    
    console.log("📊 Summary:");
    console.log(`   AI Functions: ${funcCount}`);
    console.log(`   AI Providers: ${providerCount}`);
    console.log(`   Function-Provider Mappings: ${mappingCount}`);
    console.log();
    
    // Show enabled providers
    const enabledProviders = await prisma.aiProvider.findMany({
      where: { isEnabled: true },
      select: { key: true, name: true, isDefault: true }
    });
    
    console.log("🔌 Active Providers:");
    for (const p of enabledProviders) {
      const defaultMarker = p.isDefault ? " [DEFAULT]" : "";
      console.log(`   • ${p.name} (${p.key})${defaultMarker}`);
    }
    
  } catch (error) {
    console.error("\n❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();