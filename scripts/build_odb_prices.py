#!/usr/bin/env python3
"""Step 2: Ontario Drug Benefit formulary -> Canadian per-unit prices.

For each molecule in data/molecules_us.json, query the public ODB e-formulary
search (server-rendered HTML), parse DIN rows, and select the Canadian
comparator price.

SELECTION RULES (documented, auditable):
1. Row generic name must contain every ingredient token of the molecule AND
   must not contain extra ingredients (combo products like Soliqua, which is
   insulin glargine + lixisenatide, are excluded from plain insulin glargine).
2. Form-family consistency: molecules whose dominant presentation is
   injectable (insulins, GLP-1s, monoclonals) only compare against injectable
   formulary rows; inhaled molecules (LABA/LAMA/ICS combos) only against
   inhalation rows. Otherwise oral rows are preferred, any form accepted.
3. Unit normalization: tablets/capsules are priced per unit already;
   injectables are normalized per mL from the pack volume parsed out of the
   product string (e.g. "5x3mL Pk" -> 15 mL). Rows with unparseable volume
   are excluded.
4. The comparator is the LOWEST per-unit price across surviving rows: the
   floor of what Ontario's public plan pays. Documented as such.

What this price IS: the Drug Benefit Price Ontario's public drug plan pays
pharmacies. Not a national list price; private payers pay different prices.
"""
import json, re, time, urllib.request, urllib.parse, html
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IN = ROOT / "data" / "molecules_us.json"
CACHE = ROOT / "data" / "odb_cache.json"
OUT = ROOT / "data" / "molecules_ca.json"

GLP1 = {"semaglutide", "tirzepatide", "dulaglutide", "liraglutide", "exenatide"}
INHALED_TOKENS = {"vilanter", "salmeterol", "formoterol", "tiotropium", "umeclidinium",
                  "glycopyrronium", "aclidinium", "indacaterol", "olodaterol"}

def fetch(url, timeout=40):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (nshipyard-drug-prices/0.1)"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "replace")

SALT_WORDS = r"hcl|hydrochloride|phosphate|sodium|potassium|calcium|magnesium|sulfate|mesylate|maleate|tartrate|fumarate|succinate|besylate|tosylate|dihydrochloride|hydrobromide|nitrate|acetate|citrate|pamoate|embonate"

def strip_salts(name):
    s = re.sub(r",hum\.rec\.anlog", "", name, flags=re.I)
    s = re.sub(r"-[a-z]{4}$", "", s)  # biosimilar suffixes: -aooe, -gnlm
    s = re.sub(r"\s+propanediol\b", "", s, flags=re.I)  # dapagliflozin propanediol solvate
    s = re.sub(rf"\s+({SALT_WORDS})\b", "", s, flags=re.I)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def query_variants(molecule, search_name):
    variants = []
    if search_name:
        variants.append(search_name)
    base = strip_salts(molecule)
    if base and base.lower() != molecule.lower():
        variants.append(base)
    # combo: strip salts from each part
    parts = [strip_salts(p.strip()) for p in molecule.split("+")]
    combo = " + ".join(p for p in parts if p)
    if combo.lower() != molecule.lower() and combo.lower() != base.lower():
        variants.append(combo)
    variants.append(molecule)
    seen, out = set(), []
    for v in variants:
        if v.lower() not in seen:
            seen.add(v.lower())
            out.append(v)
    return out

def query_formulary(name, retries=3):
    q = urllib.parse.quote(name.upper())
    url = f"https://www.formulary.health.gov.on.ca/formulary/results.xhtml?q={q}&type=1"
    last = ""
    for attempt in range(retries):
        try:
            last = fetch(url)
            if "<table" in last:
                return last
        except Exception:
            pass
        time.sleep(2 * (attempt + 1))
    return last

def query_with_variants(molecule, search_name):
    """Try query variants in order; return (rows, variant_used)."""
    for v in query_variants(molecule, search_name):
        page = query_formulary(v)
        if "<table" not in page:
            continue
        rows = parse_rows(page)
        if rows:
            return rows, v
    # fall back to whatever the last variant returned (may be empty = no listing)
    return [], query_variants(molecule, search_name)[-1]
    q = urllib.parse.quote(name.upper())
    url = f"https://www.formulary.health.gov.on.ca/formulary/results.xhtml?q={q}&type=1"
    last = ""
    for attempt in range(retries):
        try:
            last = fetch(url)
            if "<table" in last:
                return last
        except Exception:
            pass
        time.sleep(2 * (attempt + 1))
    return last

def parse_rows(page):
    rows = re.findall(r"<tr[^>]*>(.*?)</tr>", page, re.S)
    out = []
    for r in rows:
        cells = re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", r, re.S)
        txt = [html.unescape(re.sub(r"<[^>]+>", "", c)).strip() for c in cells]
        if len(txt) >= 6 and re.fullmatch(r"\d{8}", txt[0] or ""):
            try:
                price = float(txt[4]) if txt[4] and txt[4] != "N/A" else None
            except ValueError:
                price = None
            out.append({"din": txt[0], "generic": txt[1], "product": txt[2],
                        "mfr": txt[3], "price": price})
    return out

def ingredient_parts(s):
    return [p.strip() for p in re.split(r"[/&+]", s) if p.strip()]

def match_rows(molecule, rows):
    key = strip_salts(molecule)
    mol_parts = [p.strip() for p in key.split("+")]
    mol_tokens = [t for t in re.split(r"[^a-z]+", key.lower()) if len(t) > 2]
    hits = []
    for r in rows:
        g = r["generic"]
        if len(ingredient_parts(g)) != len(mol_parts):
            continue  # rule 1: no extra ingredients (excludes combos like Soliqua)
        gl = g.lower().replace("/", " ")
        # word boundaries: 'latanoprost' must not match 'latanoprostene'
        if all(re.search(rf"\b{re.escape(t)}\b", gl) for t in mol_tokens):
            hits.append(r)
    return hits

def form_family(product):
    p = product.lower()
    if any(k in p for k in ["inj", "syringe", "pen", "cartridge", "vial", "prefilled"]):
        return "injectable"
    if any(k in p for k in ["inhaler", "diskus", "hfa", "turbuhaler", "respimat",
                            "ellipta", "handihaler", "aerolizer", "breezhaler", "nebul"]):
        return "inhalation"
    if any(k in p for k in [" tab", " cap", "tablet", "capsule"]):
        return "oral"
    if "oph" in p or "eye drop" in p:
        return "ophthalmic"
    return "other"

# Standard eye-drop bottle volumes (mL) when the formulary string omits volume.
# Each is the single standard commercial presentation; documented, not guessed per-row.
OPHTHALMIC_ML = {
    "latanoprostene bunod": 2.5,  # Vyzulta 2.5mL bottle
    "bimatoprost": 3.0,           # bimatoprost 0.03% 3mL bottle
    "travoprost": 2.5,            # travoprost 2.5mL bottle
    "bromfenac sodium": 1.6,      # bromfenac 0.07% 1.6mL bottle
}

def required_family(molecule):
    m = molecule.lower()
    if "insulin" in m or m in GLP1 or m.endswith("mab") or m in {
            "pegfilgrastim", "filgrastim", "epoetin alfa", "darbepoetin alfa",
            "denosumab", "abaloparatide", "teriparatide"}:
        return "injectable"
    if any(t in m for t in INHALED_TOKENS):
        return "inhalation"
    return None  # oral preferred, any accepted

def parse_pack(product):
    """Returns (ml_total, count) for injectable pack strings; (0, 1) if unparseable."""
    p = product
    vols = re.findall(r"(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*mL", p, re.I)
    if vols:
        total = sum(float(a) * float(b) for a, b in vols)
        count = sum(int(float(a)) for a, b in vols)
        return total, count
    m2 = re.search(r"[- ](\d+(?:\.\d+)?)\s*mL", p)
    if m2:
        return float(m2.group(1)), 1
    return 0, 1

def per_unit_price(row, molecule=""):
    """Returns (price_per_unit, unit_label) or None if not normalizable."""
    if row["price"] is None:
        return None
    fam = form_family(row["product"])
    if fam in ("oral",):
        return (row["price"], "unit")
    if fam == "ophthalmic":
        p = row["product"]
        m2 = re.search(r"(\d+(?:\.\d+)?)\s*mL", p, re.I)
        ml = float(m2.group(1)) if m2 else OPHTHALMIC_ML.get(molecule.lower(),
               OPHTHALMIC_ML.get(strip_salts(molecule).lower(), 0))
        if ml and ml > 0:
            return (row["price"] / ml, "mL")
        return (row["price"], "package")
    if fam == "other":
        return (row["price"], "package")
    if fam == "injectable":
        total, _ = parse_pack(row["product"])
        if total > 0:
            return (row["price"] / total, "mL")
        return None
    if fam == "inhalation":
        p = row["product"]
        m2 = re.search(r"(\d+)\s*Actuation", p, re.I)
        if m2 and float(m2.group(1)) > 0:
            return (row["price"] / float(m2.group(1)), "actuation")
        m3 = re.search(r"(\d+)\s*Dose", p, re.I)
        if m3 and float(m3.group(1)) > 0:
            return (row["price"] / float(m3.group(1)), "dose")
        return (row["price"], "package")
    return (row["price"], "unit")

def select_price(molecule, rows):
    hits = match_rows(molecule, rows)
    req = required_family(molecule)
    cands = []
    for r in hits:
        fam = form_family(r["product"])
        if req and fam != req:
            continue
        if not req and fam != "oral" and any(form_family(h["product"]) == "oral" for h in hits):
            continue  # prefer oral when oral rows exist
        pu = per_unit_price(r, molecule)
        if pu:
            cands.append((pu[0], pu[1], r))
    if not cands:
        return None, {"rows_seen": len(rows), "hits": len(hits), "note": "no comparable formulary row"}
    cands.sort(key=lambda c: c[0])
    price, unit, row = cands[0]
    ml_total, count = parse_pack(row["product"])
    return price, {"rows_seen": len(rows), "hits": len(hits), "product": row["product"],
                   "din": row["din"], "unit": unit, "form": form_family(row["product"]),
                   "n_candidates": len(cands), "package_cad": row["price"],
                   "container_ml": ml_total, "pack_count": count}

def main():
    us = json.loads(IN.read_text())
    rxcache = json.loads((ROOT / "data" / "rxnorm_cache.json").read_text()) if (ROOT / "data" / "rxnorm_cache.json").exists() else {}
    cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}
    results = []
    mols = us["molecules"]
    for i, m in enumerate(mols):
        mol = m["molecule"]
        search_name = (rxcache.get(mol) or {}).get("search_name")
        if mol in cache and "rows" in cache[mol] and (cache[mol]["rows"] or cache[mol].get("no_listing")):
            rows = cache[mol]["rows"]
        else:
            try:
                rows, used = query_with_variants(mol, search_name)
                page_ok = True
            except Exception as e:
                rows, used, page_ok = [], mol, False
                cache[mol] = {"rows": [], "error": str(e)[:60]}
            if page_ok:
                # empty rows + a valid results table = genuinely not listed
                cache[mol] = {"rows": rows, "no_listing": not rows, "variant": used}
            time.sleep(0.6)
        price, info = select_price(mol, rows)
        results.append({"molecule": mol, "price_cad": round(price, 4) if price else None, **info})
        if i % 20 == 0:
            CACHE.write_text(json.dumps(cache))
            print(f"{i}/{len(mols)} done", flush=True)
    CACHE.write_text(json.dumps(cache))
    OUT.write_text(json.dumps({
        "source": "Ontario Drug Benefit e-formulary, formulary.health.gov.on.ca",
        "retrieved": "2026-10-10",
        "definition": ("Lowest per-unit Drug Benefit Price across formulary rows that match the molecule's "
                       "ingredients exactly (no extra-ingredient combos), in the same form family, with injectables "
                       "normalized per mL. The price Ontario's public drug plan pays pharmacies; not a national list price."),
        "molecules": results,
        "counts": {
            "with_price": sum(1 for r in results if r["price_cad"] is not None),
            "without_price": sum(1 for r in results if r["price_cad"] is None),
        },
    }, indent=1))
    print(f"wrote {OUT}: {sum(1 for r in results if r['price_cad'] is not None)}/{len(results)} with price")

if __name__ == "__main__":
    main()
