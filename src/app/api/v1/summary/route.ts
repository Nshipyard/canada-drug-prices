import { NextResponse } from "next/server";
import { getInsights, getLedgerMeta } from "@/lib/data";

export async function GET() {
  return NextResponse.json({
    project: "canada-drug-prices",
    ...getLedgerMeta(),
    insights: getInsights(),
    caveat:
      "US amounts are gross of confidential manufacturer rebates and overstate net price by an unknown share. State this on every price comparison.",
  });
}
