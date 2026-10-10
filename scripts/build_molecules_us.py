#!/usr/bin/env python3
"""Step 1: CMS Part D -> normalized molecule ledger (US side only).
Reads the raw CMS CSV, keeps Overall-manufacturer rows for 2024, normalizes
generic names to molecule keys, resolves RxNorm ingredient RxCUI + ATC code,
writes data/molecules_us.json (top N molecules by 2024 spending).

Cache: data/rxnorm_cache.json so RxNav is hit once per molecule.
"""
import csv, json, re, sys, time, threading, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = Path("/tmp/p6/partd_2024.csv")
OUT = ROOT / "data" / "molecules_us.json"
CACHE = ROOT / "data" / "rxnorm_cache.json"
TOP_N = 500

def rxnav(url, timeout=30):
    req = urllib.request.Request(url, headers={"User-Agent": "nshipyard-drug-prices/0.1"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)

def normalize_molecule(gnrc):
    g = (gnrc or "").strip().lower()
    g = re.sub(r"\s+", " ", g)
    g = g.replace(" / ", "/").replace("/", " + ")
    g = re.sub(r"\b\d+(\.\d+)?\s*(mg|mcg|g|ml|%|iu|units?)\b", "", g)
    g = re.sub(r"\s+", " ", g).strip(" -;:,")
    return g

# CMS truncates generic names ("bictegrav + emtricit + tenofov ala"). These
# token expansions restore the full ingredient names before the RxNorm search.
# Each mapping is unambiguous (the truncated token appears nowhere else in
# the top-500 molecule list). Applied in order; the ledger keeps the original
# CMS-derived molecule key.
EXPANSIONS = [
    ("bictegrav", "bictegravir"),
    ("emtricit", "emtricitabine"),
    ("tenofov ala", "tenofovir alafenamide"),
    ("tenofov", "tenofovir"),
    ("elviteg", "elvitegravir"),
    ("emtri ", "emtricitabine "),
    ("lamivudi", "lamivudine"),
    ("umeclidin", "umeclidinium"),
    ("vilanter", "vilanterol"),
    ("glycopyr", "glycopyrronium"),
    ("fluticasone propion", "fluticasone propionate"),
    ("ivacaft", "ivacaftor"),
    ("insulin glargine,hum.rec.anlog", "insulin glargine"),
    ("immune globul g", "immune globulin"),
    ("immun glob g(igg)", "immune globulin"),
    ("varicella-zoster ge", "varicella zoster"),
    ("rsvpref3 antigen", "respiratory syncytial virus"),
    (" brm ", " bromide "),
    (" tr", ""),
]

def expand_for_rxnorm(name):
    q = f" {name} "
    for old, new in EXPANSIONS:
        q = q.replace(f" {old} ", f" {new} ")
        q = q.replace(f" {old}+", f" {new}+")
    q = re.sub(r"\s+", " ", q).strip()
    return q

def resolve_rxnorm(name, cache):
    if name in cache:
        return cache[name]
    result = {"rxcui": None, "atc": None, "rxnorm_name": None}
    try:
        search_name = expand_for_rxnorm(name).replace(" + ", " / ")
        q = urllib.parse.quote(search_name)
        d = rxnav(f"https://rxnav.nlm.nih.gov/REST/rxcui.json?name={q}&search=2")
        ids = (d.get("idGroup") or {}).get("rxnormId") or []
        if ids:
            rxcui = ids[0]
            result["rxcui"] = rxcui
            p = rxnav(f"https://rxnav.nlm.nih.gov/REST/rxcui/{rxcui}/property.json?propName=ATC")
            pcs = ((p.get("propConceptGroup") or {}).get("propConcept")) or []
            atcs = [c["propValue"] for c in pcs if c.get("propName") == "ATC"]
            result["atc"] = atcs[0] if atcs else None
            n = rxnav(f"https://rxnav.nlm.nih.gov/REST/rxcui/{rxcui}.json")
            props = ((n.get("idGroup") or {}))  # not needed
            result["rxnorm_name"] = name
            result["search_name"] = search_name
    except Exception as e:
        result["error"] = str(e)[:80]
    cache[name] = result
    return result

def main():
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}
    mols = {}
    with open(RAW, newline="") as f:
        r = csv.DictReader(f)
        for row in r:
            if row["Mftr_Name"] != "Overall":
                continue
            try:
                spend = float(row["Tot_Spndng_2024"] or 0)
                units = float(row["Tot_Dsg_Unts_2024"] or 0)
                benes = float(row["Tot_Benes_2024"] or 0)
                perunit = float(row["Avg_Spnd_Per_Dsg_Unt_Wghtd_2024"] or 0)
            except ValueError:
                continue
            key = normalize_molecule(row["Gnrc_Name"])
            if not key:
                continue
            m = mols.setdefault(key, {"molecule": key, "brand_examples": [], "spend_2024": 0.0,
                                      "units_2024": 0.0, "benes_2024": 0.0, "perunit_sum": 0.0})
            m["spend_2024"] += spend
            m["units_2024"] += units
            m["benes_2024"] += benes
            m["perunit_sum"] += perunit * units
            b = (row["Brnd_Name"] or "").strip()
            if b and b not in m["brand_examples"]:
                m["brand_examples"].append(b)

    ranked = sorted(mols.values(), key=lambda m: -m["spend_2024"])
    top = ranked[:TOP_N]
    lock = threading.Lock()
    done = {"n": 0, "resolved": 0}

    def work(m):
        res = resolve_rxnorm(m["molecule"], cache)
        with lock:
            m["rxcui"] = res.get("rxcui")
            m["atc"] = res.get("atc")
            m["rxnorm_name"] = res.get("rxnorm_name")
            m["search_name"] = res.get("search_name")
            if res.get("rxcui"):
                done["resolved"] += 1
            done["n"] += 1
            n = done["n"]
        if n % 25 == 0:
            with lock:
                CACHE.write_text(json.dumps(cache, indent=1))
            print(f"{n}/{TOP_N} done, {done['resolved']} resolved", flush=True)

    with ThreadPoolExecutor(max_workers=6) as ex:
        list(ex.map(work, top))
    CACHE.write_text(json.dumps(cache, indent=1))

    for m in top:
        del m["perunit_sum"]
        m["avg_cost_per_unit_usd"] = round(m["spend_2024"] / m["units_2024"], 4) if m["units_2024"] else None
        m["spend_2024"] = round(m["spend_2024"], 2)
        m["units_2024"] = round(m["units_2024"])
        m["benes_2024"] = round(m["benes_2024"])

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        "source": "CMS Medicare Part D Spending by Drug 2024 (DSD_PTD_RY26_P04_V10_DY24_BGM.csv)",
        "vintage": "2024, published 2026-06-25",
        "note": "US amounts are gross of confidential manufacturer rebates; they overstate net price by an unknown share.",
        "molecules": top,
        "counts": {"unique_molecules_total": len(mols), "top_n": TOP_N, "rxcui_resolved": done["resolved"]},
    }, indent=1))
    print(f"wrote {OUT}: {len(top)} molecules, {done['resolved']} with RxCUI")

if __name__ == "__main__":
    main()
