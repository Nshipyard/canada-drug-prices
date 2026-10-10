import { NextResponse } from "next/server";
import { searchMolecules } from "@/lib/data";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "25", 10) || 25, 1), 100);
  return NextResponse.json({ q, results: searchMolecules(q, limit) });
}
