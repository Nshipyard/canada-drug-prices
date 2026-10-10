"use client";

import { useLang } from "@/i18n";

export type RankRow = { display: string; us: number; ca: number | null; ratio: number };
export type DistBin = { label: string; count: number };
export type AtcCell = { code: string; name: string; median_ratio: number; n: number };

function money(n: number, lang: string) {
  return new Intl.NumberFormat(lang === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n < 10 ? 2 : 0,
  }).format(n);
}

function GapRankingChart({ rows, lang }: { rows: RankRow[]; lang: string }) {
  const W = 720;
  const rowH = 44;
  const H = rows.length * rowH + 40;
  // Bar length encodes the ratio (what the chart ranks by). Absolute per-unit
  // prices differ by 1000x across molecules, so a dollar scale would hide every
  // bar but the largest; exact dollar figures sit in the tooltip and the table.
  const maxR = Math.max(...rows.map((r) => r.ratio));
  const scale = (W - 340) / maxR;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="US vs Canada price ratios">
      {rows.map((r, i) => {
        const y = 30 + i * rowH;
        return (
          <g key={r.display}>
            <title>{`${r.display}: US ${money(r.us, lang)} vs Canada ${r.ca !== null ? money(r.ca, lang) : "no price"} (ratio ${r.ratio.toFixed(1)}x)`}</title>
            <text x={0} y={y + 15} fontSize={13} fill="#0a0f1e" fontWeight={600} style={{ textTransform: "capitalize" }}>
              {r.display.length > 22 ? r.display.slice(0, 21) + "…" : r.display}
            </text>
            <rect x={250} y={y + 2} width={Math.max(2, r.ratio * scale)} height={12} rx={6} fill="#d80621" />
            <text x={250 + r.ratio * scale + 8} y={y + 13} fontSize={11.5} fill="#0a0f1e" fillOpacity={0.75} fontFamily="ui-monospace, monospace">
              {r.ratio.toFixed(1)}x
            </text>
            <text x={250} y={y + 32} fontSize={10.5} fill="#0a0f1e" fillOpacity={0.5} fontFamily="ui-monospace, monospace">
              {money(r.us, lang)} vs {r.ca !== null ? money(r.ca, lang) : "n/a"} per unit
            </text>
          </g>
        );
      })}
      <text x={250} y={14} fontSize={12} fill="#0a0f1e" fillOpacity={0.55}>
        {lang === "fr" ? "Ratio de prix É.-U. / Canada" : "US/Canada price ratio"}
      </text>
    </svg>
  );
}

function DistributionChart({ bins, lang }: { bins: DistBin[]; lang: string }) {
  const W = 720;
  const H = 260;
  const maxC = Math.max(...bins.map((b) => b.count));
  const bw = (W - 40) / bins.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Distribution of price ratios">
      {bins.map((b, i) => {
        const h = (b.count / maxC) * (H - 60);
        const x = 20 + i * bw;
        return (
          <g key={b.label}>
            <title>{`${b.label}: ${b.count} molecules`}</title>
            <rect
              x={x + 3}
              y={H - 40 - h}
              width={bw - 6}
              height={h}
              rx={6}
              fill={b.label.startsWith("8") || b.label.startsWith("10") ? "#d80621" : "#0a0f1e"}
              opacity={b.label.startsWith("8") || b.label.startsWith("10") ? 1 : 0.82}
            />
            <text x={x + bw / 2} y={H - 22} fontSize={11.5} textAnchor="middle" fill="#0a0f1e" fillOpacity={0.6}>
              {b.label}
            </text>
            <text x={x + bw / 2} y={H - 46 - h} fontSize={11.5} textAnchor="middle" fill="#0a0f1e" fontWeight={600}>
              {b.count}
            </text>
          </g>
        );
      })}
      <text x={20} y={16} fontSize={12} fill="#0a0f1e" fillOpacity={0.55}>
        {lang === "fr" ? "Molécules par tranche de ratio É.-U. / Canada" : "Molecules per US/Canada ratio band"}
      </text>
    </svg>
  );
}

function AtcHeatmap({ cells, lang }: { cells: AtcCell[]; lang: string }) {
  const cols = 4;
  const cellW = 170;
  const cellH = 96;
  const W = cols * cellW + 20;
  const rows = Math.ceil(cells.length / cols);
  const H = rows * cellH + 20;
  const maxR = Math.max(...cells.map((c) => c.median_ratio));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Median gap by drug class">
      {cells.map((c, i) => {
        const x = 10 + (i % cols) * cellW;
        const y = 10 + Math.floor(i / cols) * cellH;
        const t = c.median_ratio / maxR;
        const fill = `rgba(216, 6, 33, ${0.12 + 0.88 * t})`;
        return (
          <g key={c.code}>
            <title>{`${c.code} ${c.name}: median ratio ${c.median_ratio.toFixed(1)}x across ${c.n} molecules`}</title>
            <rect x={x} y={y} width={cellW - 12} height={cellH - 12} rx={16} fill={fill} />
            <text x={x + 14} y={y + 26} fontSize={13} fontWeight={700} fill={t > 0.55 ? "#fff" : "#0a0f1e"} fontFamily="ui-monospace, monospace">
              {c.code}
            </text>
            <text x={x + 14} y={y + 44} fontSize={12} fill={t > 0.55 ? "#fff" : "#0a0f1e"} fillOpacity={t > 0.55 ? 0.9 : 0.65}>
              {c.name.length > 20 ? c.name.slice(0, 19) + "…" : c.name}
            </text>
            <text x={x + 14} y={y + 70} fontSize={20} fontWeight={700} fill={t > 0.55 ? "#fff" : "#d80621"}>
              {c.median_ratio.toFixed(1)}x
            </text>
          </g>
        );
      })}
      <text x={10} y={H - 2} fontSize={12} fill="#0a0f1e" fillOpacity={0.55}>
        {lang === "fr" ? "Plus foncé = écart médian plus large" : "Darker = wider median gap"}
      </text>
    </svg>
  );
}

export default function Charts({
  ranking,
  distribution,
  atc,
}: {
  ranking: RankRow[];
  distribution: DistBin[];
  atc: AtcCell[];
}) {
  const { t, lang } = useLang();
  const c = t.charts;
  return (
    <section id="charts" className="mx-auto max-w-[1392px] px-6 py-14">
      <div className="mx-auto max-w-[1200px]">
        <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-canada">{c.kicker}</p>
        <h2 className="display mt-3 text-[clamp(28px,3.6vw,44px)]">{c.title}</h2>
        <p className="mt-4 max-w-[640px] text-[16px] leading-relaxed text-ink/65">{c.body}</p>

        <div className="mt-8 rounded-[32px] border border-line bg-paper p-8 md:p-10">
          <h3 className="display text-[24px] md:text-[28px]">{c.gapRanking}</h3>
          <p className="mt-2 text-[14px] text-ink/60">{c.gapRankingBody}</p>
          <div className="mt-6">
            <GapRankingChart rows={ranking} lang={lang} />
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-[32px] border border-line bg-paper p-8">
            <h3 className="display text-[24px]">{c.distribution}</h3>
            <p className="mt-2 text-[14px] text-ink/60">{c.distributionBody}</p>
            <div className="mt-6">
              <DistributionChart bins={distribution} lang={lang} />
            </div>
          </div>
          <div className="rounded-[32px] border border-line bg-paper p-8">
            <h3 className="display text-[24px]">{c.atcHeatmap}</h3>
            <p className="mt-2 text-[14px] text-ink/60">{c.atcHeatmapBody}</p>
            <div className="mt-6">
              <AtcHeatmap cells={atc} lang={lang} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
