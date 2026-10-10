"use client";

import { useLang } from "@/i18n";

export default function DataSection() {
  const { t } = useLang();
  const d = t.data;
  return (
    <section id="data" className="mx-auto max-w-[1392px] px-6 py-14">
      <div className="mx-auto max-w-[1200px]">
        <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-canada">{d.kicker}</p>
        <h2 className="display mt-3 text-[clamp(28px,3.6vw,44px)]">{d.title}</h2>
        <p className="mt-4 max-w-[640px] text-[16px] leading-relaxed text-ink/65">{d.body}</p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {d.rows.map((r) => (
            <div key={r.name} className="rounded-[28px] border border-line bg-paper p-7">
              <h3 className="text-[18px] font-semibold">{r.name}</h3>
              <p className="mt-1 text-[13px] font-medium uppercase tracking-wide text-ink/45">{r.who}</p>
              <p className="mt-3 text-[15px] leading-relaxed text-ink/70">{r.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
