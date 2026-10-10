"use client";

import { useMemo, useState } from "react";
import { useLang } from "@/i18n";
import type { Molecule } from "@/lib/data";

function money(n: number | null, cur: string, lang: string) {
  if (n === null || n === undefined) return "n/a";
  return new Intl.NumberFormat(lang === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: cur,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export default function Explorer({ molecules }: { molecules: Molecule[] }) {
  const { t, lang } = useLang();
  const e = t.explorer;
  const [q, setQ] = useState("");
  const [showAll, setShowAll] = useState(false);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    const base = query
      ? molecules.filter(
          (m) =>
            m.molecule.includes(query) ||
            m.display.toLowerCase().includes(query) ||
            m.brand_examples.some((b) => b.toLowerCase().includes(query)) ||
            (m.atc ?? "").toLowerCase().startsWith(query)
        )
      : molecules
          .filter((m) => m.ratio_us_to_ca !== null)
          .sort((a, b) => (b.ratio_us_to_ca as number) - (a.ratio_us_to_ca as number));
    return showAll ? base : base.slice(0, 25);
  }, [q, showAll, molecules]);

  return (
    <section id="explorer" className="mx-auto max-w-[1392px] px-6 py-14">
      <div className="mx-auto max-w-[1200px]">
        <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-canada">{e.kicker}</p>
        <h2 className="display mt-3 text-[clamp(28px,3.6vw,44px)]">{e.title}</h2>
        <p className="mt-4 max-w-[640px] text-[16px] leading-relaxed text-ink/65">{e.body}</p>

        <div className="mt-6 flex max-w-[560px] items-center gap-2">
          <input
            value={q}
            onChange={(ev) => setQ(ev.target.value)}
            placeholder={e.searchPlaceholder}
            aria-label={e.searchLabel}
            className="w-full rounded-full border border-line bg-paper px-5 py-3 text-[15px] outline-none placeholder:text-ink/35 focus:border-canada"
          />
        </div>

        <div className="mt-6 overflow-x-auto rounded-[24px] border border-line">
          <table className="w-full min-w-[760px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-line bg-muted text-[12px] uppercase tracking-[0.08em] text-ink/55">
                <th className="px-5 py-3 font-semibold">{e.columns.molecule}</th>
                <th className="px-5 py-3 font-semibold">{e.columns.atc}</th>
                <th className="px-5 py-3 text-right font-semibold">{e.columns.us}</th>
                <th className="px-5 py-3 text-right font-semibold">{e.columns.ca}</th>
                <th className="px-5 py-3 text-right font-semibold">{e.columns.ratio}</th>
              </tr>
            </thead>
            <tbody>
              {results.map((m) => (
                <tr key={m.molecule} className="border-b border-line/60 last:border-0 hover:bg-paper-warm">
                  <td className="px-5 py-3">
                    <span className="font-semibold capitalize">{m.display}</span>
                    {m.brand_examples.length > 0 && (
                      <span className="block text-[12.5px] text-ink/50">{m.brand_examples.slice(0, 2).join(", ")}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 font-mono text-[12.5px] text-ink/60">{m.atc ?? "n/a"}</td>
                  <td className="px-5 py-3 text-right font-mono">
                    {money(m.us_avg_cost_per_unit_usd, "USD", lang)}
                    <span className="block text-[11px] text-ink/45">{e.grossNote}</span>
                  </td>
                  <td className="px-5 py-3 text-right font-mono">
                    {m.ca_per_unit_usd !== null ? (
                      <>
                        {money(m.ca_per_unit_usd, "USD", lang)}
                        {m.ca_unit && m.ca_unit !== "unit" && (
                          <span className="block text-[11px] text-ink/45">per {m.ca_unit}</span>
                        )}
                      </>
                    ) : (
                      <span className="text-ink/40">{e.noPrice}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {m.ratio_us_to_ca !== null ? (
                      <span className="inline-block rounded-full bg-canada/10 px-3 py-1 font-mono font-semibold text-canada">
                        {m.ratio_us_to_ca.toFixed(1)}x
                      </span>
                    ) : (
                      <span className="text-ink/40">n/a</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {results.length === 0 && <p className="mt-4 text-[15px] text-ink/60">{e.noResult}</p>}
        {!q && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="mt-6 rounded-full border border-line px-6 py-3 text-[15px] font-semibold text-ink/75 transition hover:border-ink/40"
          >
            {e.viewAll}
          </button>
        )}
        <p className="mt-4 text-[13px] text-ink/50">
          {e.unit}: {e.grossNote.toLowerCase()}.
        </p>
      </div>
    </section>
  );
}
