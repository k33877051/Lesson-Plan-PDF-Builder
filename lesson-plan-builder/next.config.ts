import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // native modules สำหรับ PDF extraction — ห้าม bundle ใน server
  serverExternalPackages: [
    "pdf-parse",
    "pdfjs-dist",
    "@napi-rs/canvas",
    "tesseract.js",
  ],
  // อนุญาต HMR เมื่อเปิดผ่าน 127.0.0.1 (Next.js 16 บล็อก cross-origin dev resource โดย default)
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    return [
      {
        // ไม่ใส่ security headers บน asset/HMR — ป้องกัน WebSocket upgrade พังใน dev mode
        source:
          "/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|uploads|exports).*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
