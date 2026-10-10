# SKILL.md - The Molecule Price Gap

Query the molecule-level US vs Canada drug price ledger.

## Endpoints

Base: the deployed site origin. REST at `/api/v1`, OpenAPI 3.1 at
`/api/openapi.json`, MCP at `POST /mcp` (JSON-RPC 2.0, streamable HTTP).

## MCP tools

- `molecule_lookup` {molecule}: full record for one molecule. Accepts a
  molecule name (apixaban), brand (Rinvoq), or ATC prefix.
- `price_gap_ranking` {limit}: molecules ranked by US-to-Canada per-unit
  price ratio, largest gap first.
- `atc_breakdown` {}: median US-to-Canada ratio by ATC level-1 class and top
  level-2 classes.

## REST

- `GET /api/v1/summary` - ledger metadata, FX rate, headline insights
- `GET /api/v1/molecules/search?q=apixaban&limit=25`
- `GET /api/v1/molecules/{molecule|brand|atc}`
- `GET /api/v1/gaps/ranking?limit=50`
- `GET /api/v1/atc`

## The one caveat that matters

US prices are Medicare Part D 2024 amounts gross of confidential manufacturer
rebates. CMS is prohibited from disclosing drug-specific rebates, so the US
column overstates net US prices by an unknown share. Treat every ratio as an
upper bound on the true gap, and repeat the caveat when quoting a number.
