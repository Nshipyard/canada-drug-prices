"use client";

import { useLang } from "@/i18n";

export default function Methodology() {
  const { t } = useLang();
  const m = t.methodology;
  return (
    <section id="methodology" className="mx-auto max-w-[1392px] px-6 py-14">
      <div className="mx-auto max-w-[1200px]">
        <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-canada">{m.kicker}</p>
        <h2 className="display mt-3 text-[clamp(28px,3.6vw,44px)]">{m.title}</h2>
        <p className="mt-4 max-w-[640px] text-[16px] leading-relaxed text-ink/65">{m.body}</p>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {m.steps.map((s, i) => (
            <div key={s.title} className="rounded-[28px] border border-line bg-paper-warm p-7">
              <p className="display text-[22px] text-canada">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-2 text-[18px] font-semibold">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink/70">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-[28px] bg-ink p-7 text-white md:p-9">
            <h3 className="text-[18px] font-semibold">{m.limitsTitle}</h3>
            <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-white/75">
              {m.limits.map((l) => (
                <li key={l} className="flex gap-2.5">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-canada" />
                  <span>{l}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[28px] border border-line bg-paper p-7 md:p-9">
            <h3 className="text-[18px] font-semibold">{m.unknownsTitle}</h3>
            <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-ink/70">
              {m.unknowns.map((l) => (
                <li key={l} className="flex gap-2.5">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-canada" />
                  <span>{l}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
