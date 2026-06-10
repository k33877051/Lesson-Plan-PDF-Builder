/**
 * Cache สั้นๆ สำหรับ dashboard stats
 */

export interface DashboardStatsData {
  totalLessonPlans: number;
  completedLessonPlans: number;
  draftLessonPlans: number;
  exportedPdfCount: number;
}

const CACHE_TTL_MS = 30_000;
let cache: { data: DashboardStatsData; expiresAt: number } | null = null;

export function getCachedDashboardStats(): DashboardStatsData | null {
  if (!cache || Date.now() > cache.expiresAt) {
    cache = null;
    return null;
  }
  return cache.data;
}

export function setCachedDashboardStats(data: DashboardStatsData): void {
  cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
}

export function invalidateDashboardStatsCache(): void {
  cache = null;
}
