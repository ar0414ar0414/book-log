import { NextResponse } from "next/server";
import { searchGoogleBooks } from "@/lib/google-books/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  if (!q) return NextResponse.json([]);

  const results = await searchGoogleBooks(q);
  return NextResponse.json(results);
}
