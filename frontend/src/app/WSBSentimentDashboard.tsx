"use client";

import { useEffect, useMemo, useState } from "react";

type SentimentItem = {
  id: string;
  title: string;
  label: "bullish" | "bearish" | "neutral" | string;
  compound: number;
  tickers?: string[];
  permalink?: string;
  features?: { emoji_count?: number; caps_ratio?: number; len_tokens?: number };
};

export default function WSBSentimentDashboard() {
  const [data, setData] = useState<SentimentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filters
  const [q, setQ] = useState("");
  const [label, setLabel] = useState<"all" | "bullish" | "bearish" | "neutral">("all");
  const [ticker, setTicker] = useState("");

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/sentiment_results.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: SentimentItem[] = await res.json();
        if (live) setData(json);
      } catch (e: any) {
        setError("Could not load /sentiment_results.json. Showing demo data.");
        if (live)
          setData([
            {
              id: "demo-1",
              title: "HIMS pre earnings run up?",
              label: "bullish",
              compound: 0.7865,
              tickers: ["HIMS"],
              permalink: "#",
              features: { emoji_count: 2, caps_ratio: 0.02, len_tokens: 140 },
            },
            {
              id: "demo-2",
              title: "TSLA margins compressing – adding puts",
              label: "bearish",
              compound: -0.612,
              tickers: ["TSLA"],
              permalink: "#",
              features: { emoji_count: 0, caps_ratio: 0.01, len_tokens: 90 },
            },
          ]);
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const allTickers = useMemo(() => {
    const s = new Set<string>();
    data.forEach((d) => (d.tickers || []).forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [data]);

  const filtered = useMemo(() => {
    let items = data;
    if (label !== "all") items = items.filter((d) => (d.label || "").toLowerCase() === label);
    if (ticker) items = items.filter((d) => (d.tickers || []).includes(ticker));
    const qq = q.trim().toLowerCase();
    if (qq) items = items.filter((d) => d.title.toLowerCase().includes(qq));
    return items;
  }, [data, label, ticker, q]);

  const cardColor = (lbl: string) =>
    lbl === "bullish" ? "#e8f7ee" : lbl === "bearish" ? "#fde8e8" : "#f3f4f6";
  const borderColor = (lbl: string) =>
    lbl === "bullish" ? "#34d399" : lbl === "bearish" ? "#f87171" : "#d1d5db";
  const chipStyle = (lbl: string): React.CSSProperties => ({
    background: lbl === "bullish" ? "#10b981" : lbl === "bearish" ? "#ef4444" : "#6b7280",
    color: "white",
    borderRadius: 9999,
    padding: "2px 8px",
    fontSize: 12,
    fontWeight: 600,
  });

  return (
    <main style={{ padding: 24, maxWidth: 1080, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>WSB Sentiment Dashboard</h1>
      <p style={{ color: "#6b7280", marginBottom: 16 }}>Green = bullish · Red = bearish · Gray = neutral</p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <input
          placeholder="Search titles…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db", minWidth: 220 }}
        />
        <select
          value={label}
          onChange={(e) => setLabel(e.target.value as any)}
          style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db" }}
        >
          <option value="all">All labels</option>
          <option value="bullish">Bullish</option>
          <option value="bearish">Bearish</option>
          <option value="neutral">Neutral</option>
        </select>
        <select
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db" }}
        >
          <option value="">All tickers</option>
          {allTickers.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {loading && <div style={{ color: "#6b7280" }}>Loading…</div>}
      {error && (
        <div style={{ background: "#fef3c7", border: "1px solid #f59e0b", color: "#92400e", padding: 8, borderRadius: 8, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <ul style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
        {filtered.map((item) => {
          const lbl = (item.label || "neutral").toLowerCase();
          return (
            <li
              key={item.id}
              style={{
                background: cardColor(lbl),
                border: `1px solid ${borderColor(lbl)}`,
                borderRadius: 16,
                padding: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <a
                  href={item.permalink || "#"}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontWeight: 700, color: "#111827", textDecoration: "none" }}
                >
                  {item.title}
                </a>
                <span style={chipStyle(lbl)}>{lbl}</span>
              </div>
              <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", fontSize: 12, color: "#374151" }}>
                <span style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 9999, padding: "2px 8px" }}>
                  score {(item.compound > 0 ? "+" : "") + (item.compound ?? 0).toFixed(3)}
                </span>
                {(item.tickers || []).map((t) => (
                  <span key={t} style={{ background: "#e0e7ff", color: "#1e3a8a", borderRadius: 9999, padding: "2px 8px" }}>
                    {t}
                  </span>
                ))}
              </div>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 && !loading && <div style={{ color: "#6b7280", marginTop: 12 }}>No posts match your filters.</div>}
    </main>
  );
}
