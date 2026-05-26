import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  await db.execute(sql`ALTER TABLE books ADD COLUMN IF NOT EXISTS ai_summary TEXT`);
  return NextResponse.json({ ok: true });
}
