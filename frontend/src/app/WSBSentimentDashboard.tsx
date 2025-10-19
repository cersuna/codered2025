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
  const [analysisRunning, setAnalysisRunning] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<string | null>(null);

  // filters
  const [q, setQ] = useState("");
  const [label, setLabel] = useState<"all" | "bullish" | "bearish" | "neutral">("all");
  const [ticker, setTicker] = useState("");

  // API functions
  const fetchSentimentData = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/sentiment");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      return result.sentiment;
    } catch (error) {
      console.error("Error fetching sentiment data:", error);
      throw error;
    }
  };

  const startAnalysis = async () => {
    try {
      setAnalysisRunning(true);
      setError(null);
      
      const response = await fetch("http://localhost:8000/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to start analysis");
      }
      
      // Poll for completion
      await pollAnalysisStatus();
    } catch (error: any) {
      setError(error.message);
      setAnalysisRunning(false);
    }
  };

  const pollAnalysisStatus = async () => {
    const pollInterval = 2000; // Poll every 2 seconds
    const maxAttempts = 150; // Max 5 minutes
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch("http://localhost:8000/api/status");
        const status = await response.json();
        
        if (!status.is_running) {
          if (status.error) {
            throw new Error(status.error);
          }
          
          // Analysis completed, refresh data
          setLastAnalysis(status.last_run);
          await loadData();
          setAnalysisRunning(false);
          return;
        }
        
        // Still running, wait and try again
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error: any) {
        setError(error.message);
        setAnalysisRunning(false);
        return;
      }
    }
    
    // Timeout
    setError("Analysis timed out after 5 minutes");
    setAnalysisRunning(false);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const sentimentData = await fetchSentimentData();
      setData(sentimentData);
      setError(null);
    } catch (error: any) {
      setError("Could not load sentiment data. Showing demo data.");
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
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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
    padding: "4px 8px",
    fontSize: 10,
    fontWeight: 600,
    width: "70px",
    height: "24px",
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
    flexShrink: 0,
  });

  return (
    <main style={{ padding: 24, maxWidth: 1080, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>WSB Sentiment Dashboard</h1>
          <p style={{ color: "#6b7280", margin: 0 }}>Green = bullish · Red = bearish · Gray = neutral</p>
          {lastAnalysis && (
            <p style={{ color: "#6b7280", fontSize: 14, margin: "4px 0 0 0" }}>
              Last analysis: {new Date(lastAnalysis).toLocaleString()}
            </p>
          )}
        </div>
        <button
          onClick={startAnalysis}
          disabled={analysisRunning || loading}
          style={{
            background: analysisRunning ? "#6b7280" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: "12px 24px",
            fontSize: 16,
            fontWeight: 600,
            cursor: analysisRunning || loading ? "not-allowed" : "pointer",
            opacity: analysisRunning || loading ? 0.6 : 1,
            transition: "all 0.2s",
          }}
        >
          {analysisRunning ? "🔄 Analyzing..." : "🔍 Search New WSB Posts"}
        </button>
      </div>

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
      {analysisRunning && (
        <div style={{ background: "#dbeafe", border: "1px solid #3b82f6", color: "#1e40af", padding: 12, borderRadius: 8, marginBottom: 12 }}>
          🔄 Analysis in progress... This may take a few minutes. Please wait.
        </div>
      )}
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
