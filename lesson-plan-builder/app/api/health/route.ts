import { NextResponse } from "next/server";
import { access, mkdir } from "fs/promises";
import { join } from "path";
import { checkDatabaseConnection } from "@/lib/prisma";

export async function GET() {
  const uploadsDir = join(process.cwd(), "public", "uploads");
  const exportsDir = join(process.cwd(), "public", "exports");

  const [database] = await Promise.all([checkDatabaseConnection()]);

  const storage = await Promise.all(
    [uploadsDir, exportsDir].map(async (dir) => {
      try {
        await mkdir(dir, { recursive: true });
        await access(dir);
        return true;
      } catch {
        return false;
      }
    })
  );

  const healthy = database && storage.every(Boolean);

  return NextResponse.json(
    {
      success: healthy,
      checks: {
        database,
        uploadsDir: storage[0],
        exportsDir: storage[1],
      },
    },
    { status: healthy ? 200 : 503 }
  );
}
