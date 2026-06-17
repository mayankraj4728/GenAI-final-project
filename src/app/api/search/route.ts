import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { semanticSearch } from "@/lib/server/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) {
    return NextResponse.json({ query: q, results: [] });
  }
  try {
    const results = await semanticSearch(q);
    return NextResponse.json({ query: q, results });
  } catch (err) {
    console.error("[api] search failed:", err);
    return NextResponse.json(
      { error: "Search failed. Check the server logs." },
      { status: 500 }
    );
  }
}
