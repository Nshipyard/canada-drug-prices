#!/usr/bin/env python3
"""Step 3: merge US + Canadian prices -> the molecule ledger.

Reads data/molecules_us.json and data/molecules_ca.json, converts Canadian
prices to USD at the 2024 Bank of Canada average (1 USD = 1.3698 CAD), and
writes:
  data/molecules.json        full ledger (app + API + MCP)
  data/insights.json          hero stats
  data/atc.json               ATC breakdown
  data/findings_en.json       showcase findings (EN)
  data/findings_fr.json       showcase findings (FR)
  public/data/molecule-ledger.csv   downloadable ledger
"""
import csv, json, statistics
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
USD_CAD_2024 = 1.3698

# Molecules excluded from the ranking: the CMS per-unit figure and the ODB
# comparator measure different things (different forms, routes, or dose mixes).
# Each is documented so the exclusion is auditable, not silent.
QUARANTINE = {
    "clonidine": "CMS row is the transdermal patch; ODB comparator is oral tablets",
    "epinephrine": "CMS per-unit mixes auto-injectors (Auvi-Q, EpiPen) with ampules; ODB comparator is the cheapest ampule",
    "ipratropium bromide": "CMS dosage unit mixes per-inhaler (Atrovent HFA) and per-vial (nebulizer solution)",
    "tiotropium bromide": "CMS dosage unit mixes per-capsule (HandiHaler) and per-inhaler (Respimat)",
    "beclomethasone dipropionate": "CMS mixes nasal sprays and inhalers; ODB cheapest match is a topical ointment",
    "budesonide": "CMS per-unit mixes oral capsules, inhalers, and oral suspension",
    "lanreotide acetate": "syringe dose mix (60/90/120mg) cannot be matched to the single ODB biosimilar product",
    "insulin lispro-aabc": "Lyumjev (ultra-rapid) matched ODB insulin lispro (Humalog/Admelog); different products",
    "semaglutide": "CMS per-unit mixes tablets (Rybelsus), Ozempic pens, and Wegovy pens",
    "risankizumab-rzaa": "dose mix (75mg syringe vs 150mg pen vs on-body injector) cannot be matched to the single ODB product",
    "infliximab": "CMS is IV vials; ODB comparator is the subcutaneous pen (Remsima SC); different routes",
    "buprenorphine": "CMS mixes patch, buccal film, and depot injection; ODB lists only the depot syringe",
    "buprenorphine hcl": "CMS is oral/sublingual; ODB lists only the Sublocade depot syringe",
    "ondansetron hcl": "CMS is oral tablets; ODB query returned only the injectable (tablets sit under a different generic string)",
    "enoxaparin sodium": "cannot determine whether the CMS dosage unit is per mL or per syringe",
    "fluticasone propionate": "CMS dosage unit mixes inhalers and nasal spray with unclear per-unit definitions",
}

# Molecules where the CMS Part D dosage unit is one container (syringe, pen,
# vial), verified via per-claim/per-unit relationships in the brand rows.
# For these the Canadian side uses the per-container price, not per mL.
PER_CONTAINER = {
    "ustekinumab", "tocilizumab", "pegfilgrastim", "denosumab",
    "glatiramer acetate", "etanercept", "adalimumab", "adalimumab-adbm",
    "guselkumab", "bimekizumab-bkzx",
}

ATC_L1 = {
    "A": "Alimentary tract and metabolism", "B": "Blood and blood forming organs",
    "C": "Cardiovascular system", "D": "Dermatologicals",
    "G": "Genito urinary system and sex hormones",
    "H": "Systemic hormonal preparations", "J": "Antiinfectives for systemic use",
    "L": "Antineoplastic and immunomodulating agents", "M": "Musculo-skeletal system",
    "N": "Nervous system", "P": "Antiparasitic products", "R": "Respiratory system",
    "S": "Sensory organs", "V": "Various",
}
ATC_L2 = {
    "A01": "Stomatological preparations", "A02": "Drugs for acid related disorders",
    "A03": "Drugs for functional gastrointestinal disorders", "A04": "Antiemetics and antinauseants",
    "A05": "Bile and liver therapy", "A06": "Drugs for constipation", "A07": "Antidiarrheals",
    "A08": "Antiobesity preparations", "A09": "Digestives", "A10": "Drugs used in diabetes",
    "A11": "Vitamins", "A12": "Mineral supplements", "A16": "Other alimentary tract products",
    "B01": "Antithrombotic agents", "B02": "Antihemorrhagics", "B03": "Antianemic preparations",
    "B05": "Blood substitutes and perfusion solutions",
    "C01": "Cardiac therapy", "C02": "Antihypertensives", "C03": "Diuretics",
    "C07": "Beta blocking agents", "C08": "Calcium channel blockers",
    "C09": "Agents acting on the renin-angiotensin system", "C10": "Lipid modifying agents",
    "D01": "Antifungals for dermatological use", "D07": "Corticosteroids, dermatological",
    "D10": "Anti-acne preparations", "D11": "Other dermatological preparations",
    "G01": "Gynecological antiinfectives", "G02": "Other gynecologicals", "G03": "Sex hormones",
    "G04": "Urologicals", "H01": "Pituitary and hypothalamic hormones",
    "H02": "Corticosteroids for systemic use", "H03": "Thyroid therapy",
    "J01": "Antibacterials for systemic use", "J02": "Antimycotics for systemic use",
    "J05": "Antivirals for systemic use", "J06": "Immune sera and immunoglobulins",
    "L01": "Antineoplastic agents", "L02": "Endocrine therapy",
    "L03": "Immunostimulants", "L04": "Immunosuppressants",
    "M01": "Antiinflammatory and antirheumatic products", "M02": "Topical products for joint and muscular pain",
    "M03": "Muscle relaxants", "M04": "Antigout preparations", "M05": "Drugs for treatment of bone diseases",
    "N01": "Anesthetics", "N02": "Analgesics", "N03": "Antiepileptics", "N04": "Anti-parkinson drugs",
    "N05": "Psycholeptics", "N06": "Psychoanaleptics", "N07": "Other nervous system drugs",
    "P01": "Antiprotozoals",
    "R01": "Nasal preparations", "R03": "Drugs for obstructive airway diseases",
    "R05": "Cough and cold preparations", "R06": "Antihistamines for systemic use",
    "S01": "Ophthalmologicals", "S02": "Otologicals", "S03": "Ophthalmological and otological preparations",
    "V01": "Allergens", "V03": "All other therapeutic products", "V04": "Diagnostic agents",
    "V06": "General nutrients", "V08": "Contrast media",
}

def money(n):
    return f"${n:,.2f}"

def main():
    us = json.loads((ROOT / "data" / "molecules_us.json").read_text())
    ca = {r["molecule"]: r for r in json.loads((ROOT / "data" / "molecules_ca.json").read_text())["molecules"]}
    molecules = []
    for m in us["molecules"]:
        if m["molecule"] in QUARANTINE:
            continue  # excluded: documented unit/form mismatch, see QUARANTINE
        c = ca.get(m["molecule"], {})
        atc = m.get("atc")
        price_cad = c.get("price_cad")
        unit = c.get("unit")
        if m["molecule"] in PER_CONTAINER and c.get("package_cad"):
            # CMS dosage unit is one container: compare per-container prices
            per_container_cad = c["package_cad"] / (c.get("pack_count") or 1)
            price_cad = round(per_container_cad, 4)
            unit = "container"
        ca_usd = round(price_cad / USD_CAD_2024, 4) if price_cad else None
        us_unit = m.get("avg_cost_per_unit_usd")
        ratio = round(us_unit / ca_usd, 2) if (us_unit and ca_usd) else None
        molecules.append({
            "molecule": m["molecule"],
            "display": m["molecule"].title(),
            "rxcui": m.get("rxcui"),
            "atc": atc,
            "atc_l1": atc[0] if atc else None,
            "atc_l1_name": ATC_L1.get(atc[0]) if atc else None,
            "atc_l2": atc[:3] if atc else None,
            "atc_l2_name": ATC_L2.get(atc[:3]) if atc else None,
            "brand_examples": m.get("brand_examples", [])[:3],
            "us_spend_2024_usd": m["spend_2024"],
            "us_units_2024": m["units_2024"],
            "us_benes_2024": m["benes_2024"],
            "us_avg_cost_per_unit_usd": us_unit,
            "ca_price_per_unit_cad": price_cad,
            "ca_unit": unit,
            "ca_price_source": ("Ontario Drug Benefit formulary, lowest Drug Benefit Price per " + (unit or "unit") + ", " + c.get("product", "")) if price_cad else None,
            "ca_price_din": c.get("din"),
            "ca_per_unit_usd": ca_usd,
            "gap_usd_per_unit": round(us_unit - ca_usd, 2) if (us_unit and ca_usd) else None,
            "ratio_us_to_ca": ratio,
        })

    matched = [m for m in molecules if m["ratio_us_to_ca"] is not None]
    matched.sort(key=lambda m: -m["ratio_us_to_ca"])
    ratios = sorted(m["ratio_us_to_ca"] for m in matched)
    median_ratio = round(statistics.median(ratios), 1) if ratios else None
    top = matched[0] if matched else None
    matched_spend = sum(m["us_spend_2024_usd"] for m in matched)

    insights = {
        "molecules_matched": len(matched),
        "molecules_total": len(molecules),
        "molecules_quarantined": len(QUARANTINE),
        "quarantine": QUARANTINE,
        "max_ratio": top["ratio_us_to_ca"] if top else None,
        "max_ratio_molecule": top["display"] if top else None,
        "matched_spend_usd": round(matched_spend, 2),
        "median_ratio": median_ratio,
        "fx_usd_cad_2024": USD_CAD_2024,
        "us_vintage": us["vintage"],
        "ca_source": "Ontario Drug Benefit e-formulary, retrieved 2026-10-10",
        "caveat": "US amounts are gross of confidential manufacturer rebates and overstate net US prices by an unknown share.",
    }
    (ROOT / "data" / "insights.json").write_text(json.dumps(insights, indent=1))

    # ATC breakdown
    l1 = {}
    for m in matched:
        if not m["atc_l1"]:
            continue
        e = l1.setdefault(m["atc_l1"], {"code": m["atc_l1"], "name": m["atc_l1_name"], "ratios": [], "n": 0})
        e["ratios"].append(m["ratio_us_to_ca"]); e["n"] += 1
    l1rows = []
    for e in l1.values():
        s = sorted(e["ratios"])
        l1rows.append({"code": e["code"], "name": e["name"], "median_ratio": round(s[len(s)//2], 1), "n": e["n"]})
    l1rows.sort(key=lambda r: -r["median_ratio"])
    l2 = {}
    for m in matched:
        if not m["atc_l2"]:
            continue
        e = l2.setdefault(m["atc_l2"], {"code": m["atc_l2"], "name": m["atc_l2_name"] or m["atc_l2"], "ratios": [], "n": 0})
        e["ratios"].append(m["ratio_us_to_ca"]); e["n"] += 1
    l2rows = []
    for e in l2.values():
        if e["n"] < 3:
            continue
        s = sorted(e["ratios"])
        l2rows.append({"code": e["code"], "name": e["name"], "median_ratio": round(s[len(s)//2], 1), "n": e["n"]})
    l2rows.sort(key=lambda r: -r["median_ratio"])
    (ROOT / "data" / "atc.json").write_text(json.dumps({"l1": l1rows, "l2": l2rows[:15]}, indent=1))

    (ROOT / "data" / "molecules.json").write_text(json.dumps({
        "source": "US: CMS Medicare Part D Spending by Drug 2024 (Overall rows). Canada: Ontario Drug Benefit e-formulary lowest Drug Benefit Price per unit.",
        "vintage": "US 2024 (published 2026-06-25); Canada retrieved 2026-10-10",
        "fx": {"usd_cad_2024": USD_CAD_2024, "source": "Bank of Canada daily average 2024"},
        "molecules": molecules,
        "counts": {"molecules_total": len(molecules), "molecules_matched": len(matched),
                   "rxcui_resolved": us["counts"]["rxcui_resolved"]},
    }, indent=1))

    # CSV
    with open(ROOT / "public" / "data" / "molecule-ledger.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["molecule", "rxcui", "atc", "atc_l1_name", "brand_examples",
                    "us_spend_2024_usd", "us_units_2024", "us_benes_2024",
                    "us_avg_cost_per_unit_usd", "ca_price_per_unit_cad", "ca_unit",
                    "ca_price_per_unit_usd", "gap_usd_per_unit", "ratio_us_to_ca",
                    "ca_price_source", "ca_price_din"])
        for m in molecules:
            w.writerow([m["molecule"], m["rxcui"] or "", m["atc"] or "", m["atc_l1_name"] or "",
                        "; ".join(m["brand_examples"]), m["us_spend_2024_usd"], m["us_units_2024"],
                        m["us_benes_2024"], m["us_avg_cost_per_unit_usd"] or "",
                        m["ca_price_per_unit_cad"] or "", m["ca_unit"] or "",
                        m["ca_per_unit_usd"] or "",
                        m["gap_usd_per_unit"] or "", m["ratio_us_to_ca"] or "",
                        m["ca_price_source"] or "", m["ca_price_din"] or ""])

    # Findings (numbers baked in)
    under2 = sum(1 for r in ratios if r < 2)
    over8 = sum(1 for r in ratios if r >= 8)
    top5 = matched[:5]
    top5list = ", ".join(f"{m['display']} ({m['ratio_us_to_ca']:.1f}x)" for m in top5)
    topclass = l1rows[0] if l1rows else None
    rinvoq = next((m for m in matched if m["molecule"] == "upadacitinib"), None)

    findings_en = [
        {
            "id": "widest-gap",
            "question": "Which molecule has the widest US-to-Canada price gap?",
            "stat": f"{top['display']} costs {top['ratio_us_to_ca']:.1f}x more per unit in the US than in Canada",
            "body": (f"One {top['display']} dosage unit costs {money(top['us_avg_cost_per_unit_usd'])} under Medicare Part D "
                     f"against {money(top['ca_per_unit_usd'])} through Ontario's public drug plan. The five widest gaps are {top5list}. "
                     f"US figures are gross of confidential rebates, so treat each ratio as an upper bound."),
            "cite": (f"The Molecule Price Gap (Open Nshipyard, Richardson Dackam): {top['display']} has the widest US-to-Canada "
                     f"per-unit price gap at {top['ratio_us_to_ca']:.1f}x (Medicare Part D 2024 vs Ontario Drug Benefit formulary, "
                     f"US gross of confidential rebates)."),
        },
        {
            "id": "median-gap",
            "question": "What is the typical gap, not just the extreme?",
            "stat": f"The median molecule costs {median_ratio:.1f}x more in the US",
            "body": (f"Across {len(matched)} matched molecules, the median US-to-Canada per-unit ratio is {median_ratio:.1f}x. "
                     f"{under2} molecules sit under 2x, while {over8} sit at 8x or more. The gap is structural, not a handful of outliers."),
            "cite": (f"The Molecule Price Gap (Open Nshipyard, Richardson Dackam): median US-to-Canada per-unit price ratio "
                     f"is {median_ratio:.1f}x across {len(matched)} matched molecules (Medicare Part D 2024 vs Ontario Drug Benefit, US gross of rebates)."),
        },
        {
            "id": "matched-spend",
            "question": "How much spending does the ledger cover?",
            "stat": f"${matched_spend/1e9:.1f}B in 2024 Medicare Part D spending across {len(matched)} molecules",
            "body": (f"The matched molecules account for ${matched_spend/1e9:.1f} billion of 2024 Medicare Part D spending, "
                     f"so the gaps describe where most of the money goes, not a niche corner of the market."),
            "cite": (f"The Molecule Price Gap (Open Nshipyard, Richardson Dackam): matched molecules cover "
                     f"${matched_spend/1e9:.1f}B of 2024 Medicare Part D spending across {len(matched)} molecules."),
        },
        {
            "id": "class-gap",
            "question": "Which drug classes have the widest gaps?",
            "stat": f"{topclass['name']} leads at a {topclass['median_ratio']:.1f}x median ratio",
            "body": (f"By ATC level-1 class, {topclass['name']} ({topclass['code']}) has the widest median gap at {topclass['median_ratio']:.1f}x "
                     f"across {topclass['n']} molecules. Some classes are structurally cheaper in Canada than others, which is where negotiation leverage concentrates."),
            "cite": (f"The Molecule Price Gap (Open Nshipyard, Richardson Dackam): {topclass['name']} has the widest median "
                     f"US-to-Canada per-unit gap at {topclass['median_ratio']:.1f}x (ATC level-1, {topclass['n']} molecules)."),
        },
    ]
    if rinvoq:
        findings_en.append({
            "id": "anecdote-row",
            "question": "What happened to the Rinvoq anecdote?",
            "stat": f"Upadacitinib (Rinvoq): {rinvoq['ratio_us_to_ca']:.1f}x",
            "body": (f"The often-quoted Rinvoq comparison is one row of {len(matched)} here: {money(rinvoq['us_avg_cost_per_unit_usd'])} "
                     f"per unit in the US against {money(rinvoq['ca_per_unit_usd'])} in Canada. The ledger replaces the anecdote with a number anyone can check."),
            "cite": (f"The Molecule Price Gap (Open Nshipyard, Richardson Dackam): upadacitinib (Rinvoq) per-unit ratio "
                     f"{rinvoq['ratio_us_to_ca']:.1f}x (Medicare Part D 2024 vs Ontario Drug Benefit, US gross of rebates)."),
        })

    fr_map = {
        "widest-gap": ("Quelle molécule présente le plus grand écart de prix entre les États-Unis et le Canada ?",
                      f"La molécule {top['display']} coûte {top['ratio_us_to_ca']:.1f} fois plus cher par unité aux États-Unis qu'au Canada"),
        "median-gap": ("Quel est l'écart typique, au-delà des extrêmes ?",
                       f"La molécule médiane coûte {median_ratio:.1f} fois plus cher aux États-Unis"),
        "matched-spread": ("", ""),
        "matched-spend": ("Combien de dépenses le registre couvre-t-il ?",
                          f"{matched_spend/1e9:.1f} G$ de dépenses Medicare Part D en 2024 sur {len(matched)} molécules"),
        "class-gap": ("Quelles classes de médicaments ont les écarts les plus larges ?",
                      f"{topclass['name']} mène avec un ratio médian de {topclass['median_ratio']:.1f}"),
        "anecdote-row": ("Qu'est devenu l'anecdote Rinvoq ?",
                         f"Upadacitinib (Rinvoq) : {rinvoq['ratio_us_to_ca']:.1f}x" if rinvoq else ""),
    }
    fr_bodies = {
        "widest-gap": (f"Une unité posologique de {top['display']} coûte {money(top['us_avg_cost_per_unit_usd'])} sous Medicare Part D "
                       f"contre {money(top['ca_per_unit_usd'])} via le régime public ontarien. Les cinq plus grands écarts : {top5list}. "
                       f"Les chiffres américains sont bruts des rabais confidentiels ; chaque ratio est une borne haute."),
        "median-gap": (f"Sur {len(matched)} molécules appariées, le ratio médian États-Unis / Canada par unité est de {median_ratio:.1f}. "
                       f"{under2} molécules sont sous 2x, {over8} à 8x ou plus. L'écart est structurel, pas une poignée d'exceptions."),
        "matched-spend": (f"Les molécules appariées représentent {matched_spend/1e9:.1f} milliards de dollars de dépenses Medicare Part D en 2024 : "
                          f"les écarts décrivent là où va l'essentiel de l'argent, pas un recoin du marché."),
        "class-gap": (f"Par classe ATC de niveau 1, {topclass['name']} ({topclass['code']}) a l'écart médian le plus large : {topclass['median_ratio']:.1f} "
                      f"sur {topclass['n']} molécules. Certaines classes sont structurellement moins chères au Canada, et c'est là que se concentre le levier de négociation."),
        "anecdote-row": (f"La comparaison Rinvoq souvent citée devient une ligne parmi {len(matched)} : {money(rinvoq['us_avg_cost_per_unit_usd'])} "
                         f"par unité aux États-Unis contre {money(rinvoq['ca_per_unit_usd'])} au Canada. Le registre remplace l'anecdote par un chiffre vérifiable.") if rinvoq else "",
    }
    fr_cites = {
        "widest-gap": (f"The Molecule Price Gap (Open Nshipyard, Richardson Dackam) : {top['display']} présente le plus grand écart "
                       f"de prix unitaire États-Unis / Canada, {top['ratio_us_to_ca']:.1f}x (Medicare Part D 2024 contre formulaires ODB, chiffres américains bruts des rabais)."),
        "median-gap": (f"The Molecule Price Gap (Open Nshipyard, Richardson Dackam) : le ratio médian de prix unitaire États-Unis / Canada "
                       f"est de {median_ratio:.1f} sur {len(matched)} molécules appariées."),
        "matched-spend": (f"The Molecule Price Gap (Open Nshipyard, Richardson Dackam) : les molécules appariées couvrent "
                          f"{matched_spend/1e9:.1f} G$ de dépenses Medicare Part D en 2024."),
        "class-gap": (f"The Molecule Price Gap (Open Nshipyard, Richardson Dackam) : {topclass['name']} a l'écart médian le plus large, "
                      f"{topclass['median_ratio']:.1f}x (ATC niveau 1, {topclass['n']} molécules)."),
        "anecdote-row": (f"The Molecule Price Gap (Open Nshipyard, Richardson Dackam) : upadacitinib (Rinvoq), ratio unitaire "
                         f"{rinvoq['ratio_us_to_ca']:.1f}x.") if rinvoq else "",
    }
    findings_fr = []
    for f in findings_en:
        q, s = fr_map.get(f["id"], (f["question"], f["stat"]))
        findings_fr.append({"id": f["id"], "question": q, "stat": s,
                            "body": fr_bodies.get(f["id"], f["body"]),
                            "cite": fr_cites.get(f["id"], f["cite"])})

    (ROOT / "data" / "findings_en.json").write_text(json.dumps(findings_en, indent=1, ensure_ascii=False))
    (ROOT / "data" / "findings_fr.json").write_text(json.dumps(findings_fr, indent=1, ensure_ascii=False))
    print(f"matched {len(matched)}/{len(molecules)}, median {median_ratio}x, top {top['display']} {top['ratio_us_to_ca']:.1f}x")

if __name__ == "__main__":
    main()
