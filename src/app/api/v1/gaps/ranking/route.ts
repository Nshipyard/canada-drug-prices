import { NextResponse } from "next/server";
import { gapRanking } from "@/lib/data";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 1), 200);
  return NextResponse.json({
    ranking: gapRanking(limit),
    caveat:
      "US amounts are gross of confidential manufacturer rebates and overstate net price by an unknown share.",
  });
}
