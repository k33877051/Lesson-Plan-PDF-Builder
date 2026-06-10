/**
 * Cache สั้นๆ สำหรับ Object Registry list
 */

import type { PaginationMeta } from "@/lib/api-response";

interface CachedObjectEntry {
  objects: Array<Record<string, unknown>>;
  pagination: PaginationMeta;
}

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { data: CachedObjectEntry; expiresAt: number }>();

export function getCachedObjectList(key: string): CachedObjectEntry | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCachedObjectList(key: string, data: CachedObjectEntry): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function invalidateObjectListCache(): void {
  cache.clear();
}
