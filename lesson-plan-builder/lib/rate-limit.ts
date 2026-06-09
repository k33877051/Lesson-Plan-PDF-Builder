import { NextRequest, NextResponse } from "next/server";

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

const buckets = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

export function rateLimit(
  request: NextRequest,
  key: string,
  { windowMs, maxRequests }: RateLimitOptions
): NextResponse | null {
  const now = Date.now();
  const clientKey = `${key}:${getClientIp(request)}`;
  const current = buckets.get(clientKey);

  if (!current || current.resetAt <= now) {
    buckets.set(clientKey, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (current.count >= maxRequests) {
    return NextResponse.json(
      { success: false, error: "มีการเรียกใช้งานถี่เกินไป กรุณาลองใหม่ภายหลัง" },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil((current.resetAt - now) / 1000).toString(),
        },
      }
    );
  }

  current.count += 1;
  buckets.set(clientKey, current);
  return null;
}
