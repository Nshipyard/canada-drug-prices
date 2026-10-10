"use client";

import { useState } from "react";
import { useLang } from "@/i18n";

export type Finding = {
  id: string;
  question: string;
  stat: string;
  body: string;
  cite: string;
};

export default function Showcase({ findingsEn, findingsFr }: { findingsEn: Finding[]; findingsFr: Finding[] }) {
  const { t, lang } = useLang();
  const findings = lang === "fr" ? findingsFr : findingsEn;
  const s = t.showcase;
  const [copied, setCopied] = useState<string | null>(null);

  async function copyCite(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(id);
    window.setTimeout(() => setCopied(null), 1800);
  }

  return (
    <section id="showcase" className="mx-auto max-w-[1392px] px-6 py-14">
      <div className="mx-auto max-w-[1200px]">
        <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-canada">{s.kicker}</p>
        <h2 className="display mt-3 text-[clamp(28px,3.6vw,44px)]">{s.title}</h2>
        <p className="mt-4 max-w-[640px] text-[16px] leading-relaxed text-ink/65">{s.body}</p>

        <div className="mt-8 flex flex-col gap-6">
          {findings.map((f) => (
            <article key={f.id} id={f.id} className="rounded-[32px] border border-line bg-paper-warm p-8 md:p-10">
              <p className="text-[15px] font-medium text-ink/55">{f.question}</p>
              <p className="display mt-3 text-[clamp(30px,4vw,48px)] text-canada">{f.stat}</p>
              <p className="mt-4 max-w-[720px] text-[16px] leading-relaxed text-ink/75">{f.body}</p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => copyCite(f.id, f.cite)}
                  className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-white transition hover:opacity-90"
                >
                  {copied === f.id ? s.copied : s.citeThis}
                </button>
                <a
                  href={`https://x.com/intent/post?text=${encodeURIComponent(f.stat + " " + f.question)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-line px-5 py-2.5 text-[14px] font-semibold text-ink/70 transition hover:border-ink/40"
                >
                  {s.shareX}
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
