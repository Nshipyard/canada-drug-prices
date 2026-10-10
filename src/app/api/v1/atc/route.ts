import { NextResponse } from "next/server";
import { getAtc } from "@/lib/data";

export async function GET() {
  return NextResponse.json(getAtc());
}
