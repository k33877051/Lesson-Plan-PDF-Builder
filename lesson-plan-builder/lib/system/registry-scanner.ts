/**
 * Registry Scanner — สแกน codebase และลงทะเบียน objects อัตโนมัติ
 */

import fs from "fs/promises";
import path from "path";

export type RegistryObjectType =
  | "api_route"
  | "prisma_model"
  | "react_component"
  | "service"
  | "utility"
  | "feature"
  | "middleware"
  | "type"
  | "enum";

export interface ScannedObject {
  objectKey: string;
  objectName: string;
  objectType: RegistryObjectType;
  module: string;
  description?: string;
  metadata?: Record<string, unknown>;
  isActive: boolean;
}

const PROJECT_ROOT = process.cwd();

async function walkDir(dir: string, ext: string): Promise<string[]> {
  const results: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "generated") {
          continue;
        }
        results.push(...(await walkDir(fullPath, ext)));
      } else if (entry.name.endsWith(ext)) {
        results.push(fullPath);
      }
    }
  } catch {
    // โฟลเดอร์ไม่มี — ข้าม
  }
  return results;
}

function toRelative(filePath: string): string {
  return path.relative(PROJECT_ROOT, filePath).replace(/\\/g, "/");
}

function routeKeyFromPath(relativePath: string): string {
  const withoutPrefix = relativePath
    .replace(/^app\/api\//, "")
    .replace(/\/route\.ts$/, "");
  return `/api/${withoutPrefix}`;
}

/** สแกน API routes */
export async function scanApiRoutes(): Promise<ScannedObject[]> {
  const apiDir = path.join(PROJECT_ROOT, "app", "api");
  const files = await walkDir(apiDir, ".ts");
  const routeFiles = files.filter((f) => f.endsWith("route.ts"));

  return routeFiles.map((filePath) => {
    const relative = toRelative(filePath);
    const routeKey = routeKeyFromPath(relative);
    const parts = routeKey.split("/").filter(Boolean);
    const moduleName = parts[1] ?? "api";

    return {
      objectKey: routeKey,
      objectName: routeKey,
      objectType: "api_route" as const,
      module: moduleName,
      description: `API route ${routeKey}`,
      metadata: { filePath: relative },
      isActive: true,
    };
  });
}

/** สแกน React components */
export async function scanReactComponents(): Promise<ScannedObject[]> {
  const componentsDir = path.join(PROJECT_ROOT, "components");
  const files = await walkDir(componentsDir, ".tsx");

  return files.map((filePath) => {
    const relative = toRelative(filePath);
    const baseName = path.basename(filePath, ".tsx");
    const moduleParts = relative.replace(/^components\//, "").split("/");
    const moduleName = moduleParts.length > 1 ? moduleParts[0] : "components";

    return {
      objectKey: relative.replace(/\.tsx$/, ""),
      objectName: baseName,
      objectType: "react_component" as const,
      module: moduleName,
      description: `React component ${baseName}`,
      metadata: { filePath: relative },
      isActive: true,
    };
  });
}

/** อ่าน Prisma models จาก schema */
export async function scanPrismaModels(): Promise<ScannedObject[]> {
  const schemaPath = path.join(PROJECT_ROOT, "prisma", "schema.prisma");
  const content = await fs.readFile(schemaPath, "utf-8");
  const modelRegex = /^model\s+(\w+)\s*\{/gm;
  const models: ScannedObject[] = [];
  let match: RegExpExecArray | null;

  while ((match = modelRegex.exec(content)) !== null) {
    const modelName = match[1];
    models.push({
      objectKey: `prisma:${modelName}`,
      objectName: modelName,
      objectType: "prisma_model",
      module: "database",
      description: `Prisma model ${modelName}`,
      metadata: { schema: "prisma/schema.prisma" },
      isActive: true,
    });
  }

  const enumRegex = /^enum\s+(\w+)\s*\{/gm;
  while ((match = enumRegex.exec(content)) !== null) {
    const enumName = match[1];
    models.push({
      objectKey: `prisma:enum:${enumName}`,
      objectName: enumName,
      objectType: "enum",
      module: "database",
      description: `Prisma enum ${enumName}`,
      metadata: { schema: "prisma/schema.prisma" },
      isActive: true,
    });
  }

  return models;
}

/** สแกน lib services/utilities */
export async function scanLibFiles(): Promise<ScannedObject[]> {
  const libDir = path.join(PROJECT_ROOT, "lib");
  const files = await walkDir(libDir, ".ts");
  const filtered = files.filter(
    (f) =>
      !f.includes("generated") &&
      !f.endsWith(".d.ts") &&
      path.basename(f) !== "utils.ts"
  );

  return filtered.map((filePath) => {
    const relative = toRelative(filePath);
    const baseName = path.basename(filePath, ".ts");
    const parts = relative.replace(/^lib\//, "").split("/");
    const moduleName = parts.length > 1 ? parts[0] : "lib";
    const isService =
      relative.includes("/services/") ||
      relative.includes("/research/") ||
      relative.includes("/github/") ||
      relative.includes("/ai/");

    return {
      objectKey: relative.replace(/\.ts$/, ""),
      objectName: baseName,
      objectType: isService ? ("service" as const) : ("utility" as const),
      module: moduleName,
      description: `${isService ? "Service" : "Utility"} ${baseName}`,
      metadata: { filePath: relative },
      isActive: true,
    };
  });
}

/** สแกนทั้งหมดและรวมผลลัพธ์ */
export async function scanAllRegistryObjects(): Promise<ScannedObject[]> {
  const [apiRoutes, components, models, libFiles] = await Promise.all([
    scanApiRoutes(),
    scanReactComponents(),
    scanPrismaModels(),
    scanLibFiles(),
  ]);

  const all = [...apiRoutes, ...components, ...models, ...libFiles];
  const seen = new Set<string>();
  return all.filter((obj) => {
    if (seen.has(obj.objectKey)) return false;
    seen.add(obj.objectKey);
    return true;
  });
}
