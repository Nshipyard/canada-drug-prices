"""Re-run select_price over the cached ODB rows (no refetch) and rewrite molecules_ca.json."""
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_odb_prices import select_price

ROOT = Path(__file__).resolve().parent.parent
us = json.loads((ROOT / "data" / "molecules_us.json").read_text())
cache = json.loads((ROOT / "data" / "odb_cache.json").read_text())
results = []
for m in us["molecules"]:
    mol = m["molecule"]
    rec = cache.get(mol, {})
    rows = rec.get("rows", [])
    price, info = select_price(mol, rows) if rows else (None, {"note": "no formulary rows"})
    results.append({"molecule": mol,
                    "price_cad": round(price, 4) if price else None,
                    "unit": info.get("unit"),
                    "product": info.get("product"),
                    "din": info.get("din"),
                    "package_cad": info.get("package_cad"),
                    "container_ml": info.get("container_ml"),
                    "pack_count": info.get("pack_count"),
                    "form": info.get("form"),
                    "n_candidates": info.get("n_candidates"),
                    "rows_seen": info.get("rows_seen"),
                    "note": info.get("note")})
withp = sum(1 for r in results if r["price_cad"])
(ROOT / "data" / "molecules_ca.json").write_text(json.dumps(
    {"source": "Ontario Drug Benefit e-formulary, scraped 2026-10-10",
     "molecules": results}, indent=1))
print(f"reprocessed: {withp}/{len(results)} with price")
