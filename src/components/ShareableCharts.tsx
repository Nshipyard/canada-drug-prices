"use client";

import { useEffect, useState } from "react";

type SharedChart = {
  slug: string;
  headline: string;
  shareText: string;
  exportUrl: string;
  chartUrl: string;
};

function ShareButtons({ chart }: { chart: SharedChart }) {
  const [copied, setCopied] = useState(false);
  const shareData = { title: chart.headline, text: chart.shareText, url: chart.chartUrl };
  const canNativeShare =
    typeof navigator !== "undefined" && "share" in navigator;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(chart.chartUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      {canNativeShare && (
        <button
          onClick={() => navigator.share(shareData)}
          className="rounded-full bg-ink px-5 py-2.5 text-[15px] font-semibold text-white hover:bg-black"
        >
          Share this chart
        </button>
      )}
      <button
        onClick={copy}
        className="rounded-full border border-line px-5 py-2.5 text-[15px] font-semibold hover:border-ink"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
      <a
        href={chart.chartUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[15px] font-semibold text-canada hover:text-canada-dark"
      >
        View on Open Nshipyard →
      </a>
    </div>
  );
}

export default function ShareableCharts({ projectKey }: { projectKey: string }) {
  const [charts, setCharts] = useState<SharedChart[] | null>(null);

  useEffect(() => {
    fetch(`https://canada.nshipyard.com/api/project-charts?project=${projectKey}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setCharts(d?.charts ?? []))
      .catch(() => setCharts([]));
  }, [projectKey]);

  if (!charts || charts.length === 0) return null;

  return (
    <section className="bg-paper-warm">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">
          Shareable assets
        </p>
        <h2 className="display mt-4 max-w-[720px] text-[40px] md:text-[52px]">Share the charts</h2>
        <p className="mt-5 max-w-[640px] text-[18px] leading-relaxed text-ink/70">
          The same charts as on Open Nshipyard, ready to post. Share one
          directly, copy its link, or open the full version.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
          {charts.map((c) => (
            <div
              key={c.slug}
              className="overflow-hidden rounded-[24px] border border-line bg-paper"
            >
              <div className="aspect-[3/4] w-full">
                <iframe
                  src={c.exportUrl}
                  title={c.headline}
                  className="h-full w-full border-0"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <p className="text-[17px] font-semibold leading-snug">{c.headline}</p>
                <ShareButtons chart={c} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
