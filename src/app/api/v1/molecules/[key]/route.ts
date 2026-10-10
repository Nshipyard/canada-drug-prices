import { NextResponse } from "next/server";
import { lookupMolecule } from "@/lib/data";

export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const hit = lookupMolecule(decodeURIComponent(key));
  if (!hit) return NextResponse.json({ error: `No molecule ${key}` }, { status: 404 });
  return NextResponse.json(hit);
}
