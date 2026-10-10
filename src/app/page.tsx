import { Banner, Nav, Footer } from "@/components/chrome";
import Hero, { type HeroStats } from "@/components/Hero";
import Explorer from "@/components/Explorer";
import Showcase, { type Finding } from "@/components/Showcase";
import Charts, { type RankRow, type DistBin, type AtcCell } from "@/components/Charts";
import Methodology from "@/components/Methodology";
import Developers from "@/components/Developers";
import DataSection from "@/components/DataSection";
import ShareableCharts from "@/components/ShareableCharts";
import { getMolecules, getInsights, gapRanking } from "@/lib/data";
import findingsEn from "../../data/findings_en.json";
import findingsFr from "../../data/findings_fr.json";

function buildStats(): HeroStats {
  const ins = getInsights() as unknown as {
    molecules_matched: number;
    max_ratio: number | null;
    max_ratio_molecule: string | null;
    matched_spend_usd: number;
    median_ratio: number | null;
  };
  return {
    molecules_matched: ins.molecules_matched,
    max_ratio: ins.max_ratio,
    max_ratio_molecule: ins.max_ratio_molecule,
    matched_spend_usd: ins.matched_spend_usd,
    median_ratio: ins.median_ratio,
  };
}

function buildCharts() {
  const ranking: RankRow[] = gapRanking(12).map((m) => ({
    display: m.display,
    us: m.us_avg_cost_per_unit_usd ?? 0,
    ca: m.ca_per_unit_usd,
    ratio: m.ratio_us_to_ca ?? 0,
  }));
  const withGap = getMolecules().filter((m) => m.ratio_us_to_ca !== null);
  const bins: DistBin[] = ["1-2x", "2-4x", "4-6x", "6-8x", "8-10x", "10x+"].map((label) => ({ label, count: 0 }));
  for (const m of withGap) {
    const r = m.ratio_us_to_ca as number;
    const idx = r < 2 ? 0 : r < 4 ? 1 : r < 6 ? 2 : r < 8 ? 3 : r < 10 ? 4 : 5;
    bins[idx].count += 1;
  }
  const l1 = new Map<string, { name: string; ratios: number[] }>();
  for (const m of withGap) {
    if (!m.atc_l1) continue;
    const e = l1.get(m.atc_l1) ?? { name: m.atc_l1_name ?? m.atc_l1, ratios: [] };
    e.ratios.push(m.ratio_us_to_ca as number);
    l1.set(m.atc_l1, e);
  }
  const atc: AtcCell[] = [...l1.entries()]
    .map(([code, e]) => {
      const s = [...e.ratios].sort((a, b) => a - b);
      return { code, name: e.name, median_ratio: s[Math.floor(s.length / 2)], n: s.length };
    })
    .filter((c) => c.n >= 3)
    .sort((a, b) => b.median_ratio - a.median_ratio)
    .slice(0, 8);
  return { ranking, distribution: bins, atc };
}

export default function Page() {
  const stats = buildStats();
  const charts = buildCharts();
  return (
    <div id="top">
      <Banner />
      <Nav />
      <main>
        <Hero stats={stats} />
        <Explorer molecules={getMolecules()} />
        <Showcase findingsEn={findingsEn as Finding[]} findingsFr={findingsFr as Finding[]} />
        <Charts ranking={charts.ranking} distribution={charts.distribution} atc={charts.atc} />
        <Methodology />
        <Developers />
        <DataSection />
        <ShareableCharts projectKey="drugprices" />
      </main>
      <Footer />
    </div>
  );
}
