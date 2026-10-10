"use client";

import { useLang } from "@/i18n";
import McpConnect from "./McpConnect";

const ENDPOINTS = [
  { method: "GET", path: "/api/v1/summary" },
  { method: "GET", path: "/api/v1/molecules/search?q=apixaban" },
  { method: "GET", path: "/api/v1/molecules/apixaban" },
  { method: "GET", path: "/api/v1/gaps/ranking?limit=50" },
  { method: "GET", path: "/api/v1/atc" },
];

export default function Developers() {
  const { t } = useLang();
  const d = t.developers;
  return (
    <section id="developers" className="mx-auto max-w-[1392px] px-6 py-14">
      <div className="mx-auto max-w-[1200px]">
        <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-canada">{d.kicker}</p>
        <h2 className="display mt-3 text-[clamp(28px,3.6vw,44px)]">{d.title}</h2>
        <p className="mt-4 max-w-[640px] text-[16px] leading-relaxed text-ink/65">{d.body}</p>

        <h3 className="mt-10 text-[18px] font-semibold">{d.restTitle}</h3>
        <div className="mt-4 overflow-hidden rounded-[24px] border border-line">
          {ENDPOINTS.map((e) => (
            <a
              key={e.path}
              href={e.path}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-4 border-b border-line/60 px-6 py-4 last:border-0 hover:bg-paper-warm"
            >
              <span className="rounded-full bg-ink px-3 py-1 font-mono text-[12px] font-semibold text-white">{e.method}</span>
              <code className="font-mono text-[13.5px] text-ink/80">{e.path}</code>
            </a>
          ))}
        </div>
        <a href="/api/openapi.json" target="_blank" rel="noreferrer" className="mt-4 inline-block text-[15px] font-medium text-canada hover:text-canada-dark">
          {d.openapiLink} {"\u2192"}
        </a>

        <div className="mt-10 rounded-[28px] border border-line bg-paper-warm p-7 md:p-9">
          <h3 className="text-[18px] font-semibold">{d.csvTitle}</h3>
          <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-ink/65">{d.csvBody}</p>
          <a
            href="/data/molecule-ledger.csv"
            download
            className="mt-5 inline-block rounded-full bg-canada px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-canada-dark"
          >
            {d.csvButton}
          </a>
        </div>

        <McpConnect
          config={{
            slug: "molecule-price-gap",
            displayName: "The Molecule Price Gap",
            exampleEn: "Look up the US vs Canada price gap for upadacitinib.",
            exampleFr: "Cherchez l'écart de prix États-Unis / Canada pour l'upadacitinib.",
          }}
        />
      </div>
    </section>
  );
}
