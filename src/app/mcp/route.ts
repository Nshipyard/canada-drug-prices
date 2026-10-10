import { NextResponse } from "next/server";
import { lookupMolecule, gapRanking, getAtc, searchMolecules } from "@/lib/data";

// Minimal MCP server over streamable HTTP (JSON-RPC 2.0 via POST).
// Supports: initialize, tools/list, tools/call. Stateless.

const SERVER = { name: "canada-drug-prices", version: "1.0.0" };

const TOOLS = [
  {
    name: "molecule_lookup",
    description:
      "Full price record for one molecule: US Medicare Part D 2024 spending and per-unit cost, Canadian per-unit price, US-to-Canada price ratio, ATC class, and brand examples. US amounts are gross of confidential rebates and overstate net price by an unknown share.",
    inputSchema: {
      type: "object",
      properties: {
        molecule: { type: "string", description: "Molecule name, e.g. apixaban, upadacitinib, or a brand like Rinvoq" },
      },
      required: ["molecule"],
    },
  },
  {
    name: "price_gap_ranking",
    description:
      "Molecules ranked by US-to-Canada per-unit price ratio, largest gap first. Each row carries US per-unit cost (gross of rebates), Canadian per-unit price, and the ratio.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "integer", description: "Max molecules, default 25" },
      },
    },
  },
  {
    name: "atc_breakdown",
    description:
      "Median US-to-Canada price ratio by ATC level-1 class and the top level-2 classes by molecule count and median gap.",
    inputSchema: { type: "object", properties: {} },
  },
];

function ok(id: unknown, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}
function err(id: unknown, code: number, message: number | string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}
function textResult(data: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handle(msg: any) {
  if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return err(msg?.id ?? null, -32600, "Invalid Request");
  }
  const id = msg.id ?? null;
  switch (msg.method) {
    case "initialize":
      return ok(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: SERVER,
      });
    case "notifications/initialized":
      return null;
    case "tools/list":
      return ok(id, { tools: TOOLS });
    case "tools/call": {
      const { name, arguments: args } = msg.params ?? {};
      try {
        if (name === "molecule_lookup") {
          const hit = lookupMolecule(String(args?.molecule ?? ""));
          if (!hit) return err(id, -32001, `No molecule ${args?.molecule}`);
          return ok(id, textResult(hit));
        }
        if (name === "price_gap_ranking") {
          const limit = Math.min(Math.max(parseInt(String(args?.limit ?? "25"), 10) || 25, 1), 200);
          return ok(id, textResult({ ranking: gapRanking(limit) }));
        }
        if (name === "atc_breakdown") {
          return ok(id, textResult(getAtc()));
        }
        if (name === "molecule_search") {
          return ok(id, textResult({ results: searchMolecules(String(args?.q ?? ""), 25) }));
        }
        return err(id, -32602, `Unknown tool ${name}`);
      } catch (e) {
        return err(id, -32000, `Tool error: ${(e as Error).message}`);
      }
    }
    default:
      return err(id, -32601, `Method not found: ${msg.method}`);
  }
}

export async function POST(req: Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(err(null, -32700, "Parse error"), { status: 400 });
  }
  if (Array.isArray(body)) {
    const out = body.map(handle).filter((r) => r !== null);
    return NextResponse.json(out);
  }
  const out = handle(body);
  if (out === null) return new NextResponse(null, { status: 202 });
  return NextResponse.json(out);
}

export async function GET() {
  return NextResponse.json(
    { error: "This MCP server accepts JSON-RPC 2.0 via POST only." },
    { status: 405 }
  );
}

export async function DELETE() {
  return new NextResponse(null, { status: 405 });
}
