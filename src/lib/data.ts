import molecules from "../../data/molecules.json";
import insights from "../../data/insights.json";
import atc from "../../data/atc.json";

export type Molecule = {
  molecule: string;
  display: string;
  rxcui: string | null;
  atc: string | null;
  atc_l1: string | null;
  atc_l1_name: string | null;
  atc_l2: string | null;
  atc_l2_name: string | null;
  brand_examples: string[];
  us_spend_2024_usd: number;
  us_units_2024: number;
  us_benes_2024: number;
  us_avg_cost_per_unit_usd: number | null;
  ca_price_per_unit_cad: number | null;
  ca_unit: string | null;
  ca_price_source: string | null;
  ca_per_unit_usd: number | null;
  gap_usd_per_unit: number | null;
  ratio_us_to_ca: number | null;
};

type LedgerFile = {
  source: string;
  vintage: string;
  fx: { usd_cad_2024: number; source: string };
  molecules: Molecule[];
  counts: Record<string, number>;
};

const ledger = molecules as unknown as LedgerFile;

export function getMolecules(): Molecule[] {
  return ledger.molecules;
}

export function getLedgerMeta() {
  return { source: ledger.source, vintage: ledger.vintage, fx: ledger.fx, counts: ledger.counts };
}

export function lookupMolecule(key: string): Molecule | null {
  const q = key.trim().toLowerCase();
  const all = ledger.molecules;
  return (
    all.find((m) => m.molecule === q) ||
    all.find((m) => m.brand_examples.some((b) => b.toLowerCase() === q)) ||
    all.find((m) => m.molecule.includes(q)) ||
    null
  );
}

export function searchMolecules(q: string, limit = 25): Molecule[] {
  const query = q.trim().toLowerCase();
  if (!query) return ledger.molecules.slice(0, limit);
  return ledger.molecules
    .filter(
      (m) =>
        m.molecule.includes(query) ||
        m.display.toLowerCase().includes(query) ||
        m.brand_examples.some((b) => b.toLowerCase().includes(query)) ||
        (m.atc ?? "").toLowerCase().startsWith(query)
    )
    .slice(0, limit);
}

export function gapRanking(limit = 50): Molecule[] {
  return ledger.molecules
    .filter((m) => m.ratio_us_to_ca !== null)
    .sort((a, b) => (b.ratio_us_to_ca as number) - (a.ratio_us_to_ca as number))
    .slice(0, limit);
}

export function getInsights() {
  return insights as unknown as Record<string, unknown>;
}

export function getAtc() {
  return atc as unknown as { l1: unknown[]; l2: unknown[] };
}
