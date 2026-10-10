import { NextResponse } from "next/server";

const SPEC = {
  openapi: "3.1.0",
  info: {
    title: "The Molecule Price Gap API",
    version: "1.0.0",
    description:
      "Molecule-level US vs Canadian drug price ledger. US prices come from CMS Medicare Part D Spending by Drug 2024 and are gross of confidential manufacturer rebates, so they overstate net price by an unknown share. Canadian prices are Ontario Drug Benefit formulary Drug Benefit Prices. Independent open-source project by Richardson Dackam, not affiliated with the US CMS, the PMPRB, or any government.",
  },
  servers: [{ url: "/api/v1" }],
  paths: {
    "/summary": {
      get: {
        summary: "Project summary, ledger metadata, and headline insights",
        responses: { "200": { description: "Summary" } },
      },
    },
    "/molecules/search": {
      get: {
        summary: "Search molecules by name, brand, or ATC code",
        parameters: [
          { name: "q", in: "query", schema: { type: "string" }, description: "e.g. apixaban, Rinvoq, B01AF" },
          { name: "limit", in: "query", schema: { type: "integer", default: 25 } },
        ],
        responses: { "200": { description: "Matching molecules" } },
      },
    },
    "/molecules/{key}": {
      get: {
        summary: "Full record for one molecule",
        parameters: [{ name: "key", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Molecule record" }, "404": { description: "Not found" } },
      },
    },
    "/gaps/ranking": {
      get: {
        summary: "Molecules ranked by US-to-Canada price ratio",
        parameters: [{ name: "limit", in: "query", schema: { type: "integer", default: 50 } }],
        responses: { "200": { description: "Ranked molecules" } },
      },
    },
    "/atc": {
      get: {
        summary: "Price-gap breakdown by ATC drug class",
        responses: { "200": { description: "ATC breakdown" } },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(SPEC);
}
