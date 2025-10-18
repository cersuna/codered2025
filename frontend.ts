import React, { useEffect, useMemo, useState } from "react";

// --- Types matching sentiment_results.json ---
type SentimentItem = {
  id: string;
  title: string;
  label: "bullish" | "bearish" | "neutral" | string;
  compound: number;
  pos?: number;
  neu?: number;
  neg?: number;
  tickers?: string[];
  permalink?: string;
  features?: {
    emoji_count?: number;
    caps_ratio?: number;
    len_tokens?: number;
  };
};

// --- Small utility helpers ---
const labelClasses: Record<string, string> = {
  bullish:
    "border-green-400/60 bg-green-50/70 dark:bg-green-950/30 text-green-800 dark:text-green-200",
  bearish:
    "border-red-400/60 bg-red-50/70 dark:bg-red-950/30 text-red-800 dark:text-red-200",
  neutral:
    "border-slate-300/60 bg-slate-50/70 dark:bg-slate-900/40 text-slate-700 dark:text-slate-200",
};

const chipClasses: Record<string, string> = {
  bullish: "bg-green-600 text-white",
  bearish: "bg-red-600 text-white",
  neutral: "bg-slate-600 text-white",
};

function classNames(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

function formatScore(n: number | undefined) {
  if (typeof n !== "number") return "–";
  return (n > 0 ? "+" : "") + n.toFixed(3);
}

// --- Main Component ---
export default function WSBSentimentDashboard() {
  const [data, setData] = useState<SentimentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [query, setQuery] = useState("");
  const [labelFilter, setLabelFilter] = useState<"all" | "bullish" | "bearish" | "neutral">("all");
  const [tickerFilter, setTickerFilter] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "scoreAsc" | "scoreDesc">("scoreDesc");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Try to fetch the generated sentiment file in your project root
        const res = await fetch("/sentiment_results.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: SentimentItem[] = await res.json();
        if (isMounted) setData(json);
      } catch (e: any) {
        // Fallback: show helpful demo content so the UI renders
        console.warn("Falling back to demo data:", e);
        if (isMounted)
          setData([
            {
              id: "demo-1",
              title: "HIMS pre earnings run up?",
              label: "bullish",
              compound: 0.7865,
              tickers: ["HIMS"],
              permalink: "https://reddit.com/r/wallstreetbets/comments/demo1",
              features: { emoji_count: 2, caps_ratio: 0.02, len_tokens: 140 },
            },
            {
              id: "demo-2",
              title: "TSLA margins compressing – adding puts",
              label: "bearish",
              compound: -0.612,
              tickers: ["TSLA"],
              permalink: "https://reddit.com/r/wallstreetbets/comments/demo2",
              features: { emoji_count: 0, caps_ratio: 0.01, len_tokens: 90 },
            },
            {
              id: "demo-3",
              title: "AAPL earnings were fine; probably range-bound",
              label: "neutral",
              compound: 0.02,
              tickers: ["AAPL"],
              permalink: "https://reddit.com/r/wallstreetbets/comments/demo3",
              features: { emoji_count: 0, caps_ratio: 0.0, len_tokens: 75 },
            },
          ]);
        if (isMounted) setError("Could not load /sentiment_results.json. Showing demo data.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Distill a unique set of tickers for the filter dropdown
  const allTickers = useMemo(() => {
    const s = new Set<string>();
    data.forEach((d) => (d.tickers || []).forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [data]);

  // Apply filters + sorting
  const filtered = useMemo(() => {
    let items = data;

    if (labelFilter !== "all") items = items.filter((d) => (d.label || "").toLowerCase() === labelFilter);

    if (tickerFilter) items = items.filter((d) => (d.tickers || []).includes(tickerFilter));

    const q = query.trim().toLowerCase();
    if (q) items = items.filter((d) => d.title.toLowerCase().includes(q));

    switch (sortBy) {
      case "scoreAsc":
        items = [...items].sort((a, b) => (a.compound ?? 0) - (b.compound ?? 0));
        break;
      case "scoreDesc":
        items = [...items].sort((a, b) => (b.compound ?? 0) - (a.compound ?? 0));
        break;
      default:
        // If your JSON lacks timestamps, keep original order; otherwise you could sort by created_utc here.
        items = [...items];
    }

    return items;
  }, [data, labelFilter, tickerFilter, query, sortBy]);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-neutral-950/60 border-b border-neutral-200/60 dark:border-neutral-800">
        <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">WSB Sentiment Dashboard</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Green = bullish · Red = bearish · Gray = neutral</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <input
              className="w-52 md:w-64 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search titles…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/70 px-3 py-2 text-sm"
              value={labelFilter}
              onChange={(e) => setLabelFilter(e.target.value as any)}
            >
              <option value="all">All labels</option>
              <option value="bullish">Bullish</option>
              <option value="bearish">Bearish</option>
              <option value="neutral">Neutral</option>
            </select>
            <select
              className="rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/70 px-3 py-2 text-sm"
              value={tickerFilter}
              onChange={(e) => setTickerFilter(e.target.value)}
            >
              <option value="">All tickers</option>
              {allTickers.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              className="rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/70 px-3 py-2 text-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="scoreDesc">Score: High → Low</option>
              <option value="scoreAsc">Score: Low → High</option>
              <option value="recent">Original order</option>
            </select>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {loading && (
          <div className="text-sm text-neutral-500">Loading sentiment_results.json…</div>
        )}
        {error && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50/70 dark:border-amber-600/40 dark:bg-amber-900/20 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
            {error}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-sm text-neutral-500">No posts match your filters.</div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {filtered.map((item) => {
              const label = (item.label || "neutral").toLowerCase();
              const sentimentCls = labelClasses[label] || labelClasses.neutral;
              return (
                <li
                  key={item.id}
                  className={classNames(
                    "rounded-2xl border p-4 shadow-sm transition hover:shadow-md",
                    sentimentCls
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <a
                      href={item.permalink || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold leading-snug hover:underline"
                    >
                      {item.title}
                    </a>
                    <span className={classNames(
                      "ml-2 shrink-0 rounded-full px-2 py-1 text-xs font-medium",
                      chipClasses[label] || chipClasses.neutral
                    )}>
                      {label}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
                    <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5">score {formatScore(item.compound)}</span>
                    {(item.tickers || []).map((t) => (
                      <span key={t} className="rounded-full bg-blue-600/10 text-blue-700 dark:text-blue-300 dark:bg-blue-900/30 px-2 py-0.5">
                        {t}
                      </span>
                    ))}
                  </div>
                  {item.features && (
                    <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                      <div className="rounded-lg bg-white/60 dark:bg-neutral-900/60 p-2">
                        <div className="font-medium text-neutral-700 dark:text-neutral-200">emoji</div>
                        <div>{item.features.emoji_count ?? "–"}</div>
                      </div>
                      <div className="rounded-lg bg-white/60 dark:bg-neutral-900/60 p-2">
                        <div className="font-medium text-neutral-700 dark:text-neutral-200">caps</div>
                        <div>{item.features.caps_ratio?.toFixed?.(2) ?? "–"}</div>
                      </div>
                      <div className="rounded-lg bg-white/60 dark:bg-neutral-900/60 p-2">
                        <div className="font-medium text-neutral-700 dark:text-neutral-200">tokens</div>
                        <div>{item.features.len_tokens ?? "–"}</div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-xs text-neutral-500 dark:text-neutral-400">
        <p>
          Data source: <code>sentiment_results.json</code>. Drop the file in your web root (or serve it via your API)
          and refresh this page.
        </p>
      </footer>
    </div>
  );
}
