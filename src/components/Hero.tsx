"use client";

import { useLang } from "@/i18n";

export type HeroStats = {
  molecules_matched: number;
  max_ratio: number | null;
  max_ratio_molecule: string | null;
  matched_spend_usd: number;
  median_ratio: number | null;
};

function fmtMoney(n: number, lang: string) {
  return new Intl.NumberFormat(lang === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(n);
}

export default function Hero({ stats }: { stats: HeroStats }) {
  const { t, lang } = useLang();
  const h = t.hero;
  const items = [
    { value: String(stats.molecules_matched), label: h.statMolecules },
    {
      value: stats.max_ratio !== null ? `${stats.max_ratio.toFixed(1)}x` : "n/a",
      label: h.statMaxGap + (stats.max_ratio_molecule ? ` (${stats.max_ratio_molecule})` : ""),
    },
    { value: fmtMoney(stats.matched_spend_usd, lang), label: h.statSpend },
    {
      value: stats.median_ratio !== null ? `${stats.median_ratio.toFixed(1)}x` : "n/a",
      label: h.statMedianGap,
    },
  ];
  return (
    <section className="mx-auto max-w-[1392px] px-6 pb-12 pt-16 md:pt-24">
      <div className="mx-auto max-w-[760px] text-center">
        <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.2em] text-canada">{h.kicker}</p>
        <h1 className="display text-[clamp(36px,5vw,60px)] leading-[1.05]">{h.title}</h1>
        <p className="mx-auto mt-6 max-w-[640px] text-[17px] leading-relaxed text-ink/65">{h.body}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#explorer"
            className="rounded-full bg-canada px-7 py-3.5 text-[15px] font-semibold text-white transition hover:bg-canada-dark"
          >
            {h.ctaExplorer}
          </a>
          <a
            href="#showcase"
            className="rounded-full border border-line px-7 py-3.5 text-[15px] font-semibold text-ink/75 transition hover:border-ink/40"
          >
            {h.ctaShowcase}
          </a>
        </div>
      </div>
      <div className="mx-auto mt-12 grid max-w-[1200px] grid-cols-2 gap-4 md:grid-cols-4">
        {items.map((s) => (
          <div key={s.label} className="rounded-[24px] border border-line bg-paper-warm p-5 text-center">
            <p className="display text-[30px] text-canada md:text-[34px]">{s.value}</p>
            <p className="mt-2 text-[13px] leading-snug text-ink/60">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
