/**
 * URL Guard — ป้องกัน SSRF ก่อน fetch URL ภายนอก
 */

export class UrlGuardError extends Error {
  code = "SSRF_BLOCKED" as const;

  constructor(message: string) {
    super(message);
    this.name = "UrlGuardError";
  }
}

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
  "169.254.169.254",
]);

function isPrivateIpv4(host: string): boolean {
  const parts = host.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return false;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

/** ตรวจสอบว่า URL ปลอดภัยสำหรับ server-side fetch */
export function assertSafeFetchUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new UrlGuardError("URL ไม่ถูกต้อง");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new UrlGuardError("อนุญาตเฉพาะ HTTP/HTTPS");
  }

  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTS.has(hostname)) {
    throw new UrlGuardError("ไม่อนุญาตให้เข้าถึง localhost หรือ metadata endpoints");
  }

  if (hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new UrlGuardError("ไม่อนุญาตให้เข้าถึง internal hostnames");
  }

  if (isPrivateIpv4(hostname)) {
    throw new UrlGuardError("ไม่อนุญาตให้เข้าถึง private IP ranges");
  }
}

/** ตรวจสอบ URL อย่างปลอดภัย — คืน boolean */
export function isSafeFetchUrl(url: string): boolean {
  try {
    assertSafeFetchUrl(url);
    return true;
  } catch {
    return false;
  }
}
