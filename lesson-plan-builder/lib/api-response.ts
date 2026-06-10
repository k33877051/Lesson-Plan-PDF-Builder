/**
 * รูปแบบ API Response มาตรฐาน
 * success: { success: true, data, meta? }
 * error:   { success: false, error, code?, details? }
 */

import { NextResponse } from "next/server";

/** รหัส error คงที่สำหรับ client */
export const ApiErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  AI_PROVIDER_NOT_FOUND: "AI_PROVIDER_NOT_FOUND",
  AI_FUNCTION_NOT_FOUND: "AI_FUNCTION_NOT_FOUND",
  SEED_FORBIDDEN: "SEED_FORBIDDEN",
  SSRF_BLOCKED: "SSRF_BLOCKED",
  UNKNOWN_ACTION: "UNKNOWN_ACTION",
} as const;

export type ApiErrorCodeType = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: ApiErrorCodeType;
  details?: unknown;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/** สร้าง success response */
export function apiSuccess<T>(
  data: T,
  options?: { status?: number; meta?: Record<string, unknown> }
): NextResponse<ApiSuccessResponse<T>> {
  const body: ApiSuccessResponse<T> = { success: true, data };
  if (options?.meta) body.meta = options.meta;
  return NextResponse.json(body, { status: options?.status ?? 200 });
}

/** สร้าง error response */
export function apiError(
  error: string,
  options?: {
    status?: number;
    code?: ApiErrorCodeType;
    details?: unknown;
  }
): NextResponse<ApiErrorResponse> {
  const body: ApiErrorResponse = { success: false, error };
  if (options?.code) body.code = options.code;
  if (options?.details !== undefined) body.details = options.details;
  return NextResponse.json(body, { status: options?.status ?? 500 });
}

/** สร้าง pagination meta */
export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
