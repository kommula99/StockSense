import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { createChart, CandlestickSeries, LineSeries, HistogramSeries } from "lightweight-charts";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";

const API = "http://127.0.0.1:8000/api/stock";

const QUICK_PICKS = [
  { label: "AAPL", flag: "🇺🇸" },
  { label: "TSLA", flag: "🇺🇸" },
  { label: "NVDA", flag: "🇺🇸" },
  { label: "MSFT", flag: "🇺🇸" },
  { label: "RELIANCE.NS", flag: "🇮🇳" },
  { label: "TCS.NS", flag: "🇮🇳" },
  { label: "INFY.NS", flag: "🇮🇳" },
  { label: "HDFCBANK.NS", flag: "🇮🇳" },
];

const RANGES = ["1M", "3M", "6M", "1Y", "2Y"];

function filterByRange(prices, range) {
  const now = new Date();
  const months = { "1M": 1, "3M": 3, "6M": 6, "1Y": 12, "2Y": 24 };
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - months[range]);
  return prices.filter((p) => new Date(p.date) >= cutoff);
}

// TradingView Candlestick Chart Component
function CandlestickChart({ prices, range }) {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const seriesRef = useRef(null);
  const ma20Ref = useRef(null);
  const ma50Ref = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !prices?.length) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
    }

    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 420,
      layout: {
        background: { color: "#0d1117" },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: "#38bdf8", labelBackgroundColor: "#38bdf8" },
        horzLine: { color: "#38bdf8", labelBackgroundColor: "#38bdf8" },
      },
      rightPriceScale: {
        borderColor: "#1e293b",
        textColor: "#94a3b8",
      },
      timeScale: {
        borderColor: "#1e293b",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartInstanceRef.current = chart;

    const filtered = filterByRange(prices, range);

    const candleData = filtered.map((p) => ({
      time: p.date,
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
    }));

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });
    candleSeries.setData(candleData);
    seriesRef.current = candleSeries;

    // MA20 Line
    const ma20Data = filtered
      .filter((p) => p.ma20)
      .map((p) => ({ time: p.date, value: p.ma20 }));
    const ma20Series = chart.addSeries(LineSeries, {
      color: "#f59e0b",
      lineWidth: 1,
      title: "MA20",
    });
    ma20Series.setData(ma20Data);
    ma20Ref.current = ma20Series;

    // MA50 Line
    const ma50Data = filtered
      .filter((p) => p.ma50)
      .map((p) => ({ time: p.date, value: p.ma50 }));
    const ma50Series = chart.addSeries(LineSeries, {
      color: "#a78bfa",
      lineWidth: 1,
      title: "MA50",
    });
    ma50Series.setData(ma50Data);
    ma50Ref.current = ma50Series;

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartRef.current) {
        chart.applyOptions({ width: chartRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [prices, range]);

  return <div ref={chartRef} style={{ width: "100%", borderRadius: "8px", overflow: "hidden" }} />;
}

// Volume Chart
function VolumeChart({ prices, range }) {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !prices?.length) return;
    if (chartInstanceRef.current) chartInstanceRef.current.remove();

    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 160,
      layout: { background: { color: "#0d1117" }, textColor: "#94a3b8" },
      grid: { vertLines: { color: "#1e293b" }, horzLines: { color: "#1e293b" } },
      rightPriceScale: { borderColor: "#1e293b" },
      timeScale: { borderColor: "#1e293b", timeVisible: true },
    });
    chartInstanceRef.current = chart;

    const filtered = filterByRange(prices, range);
    const volData = filtered.map((p) => ({
      time: p.date,
      value: p.volume,
      color: p.close >= p.open ? "#22c55e55" : "#ef444455",
    }));

    const volSeries = chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" } });
    volSeries.setData(volData);
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartRef.current) chart.applyOptions({ width: chartRef.current.clientWidth });
    };
    window.addEventListener("resize", handleResize);
    return () => { window.removeEventListener("resize", handleResize); chart.remove(); };
  }, [prices, range]);

  return <div ref={chartRef} style={{ width: "100%", borderRadius: "8px", overflow: "hidden" }} />;
}

export default function App() {
  const [symbol, setSymbol] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [range, setRange] = useState("3M");
  const [activeTab, setActiveTab] = useState("candlestick");

  const analyze = async (sym) => {
    const target = sym || symbol;
    if (!target) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await axios.get(`${API}/${target.toUpperCase()}`);
      setData(res.data);
    } catch (e) {
      setError("Could not fetch data. Check the symbol and try again.");
    }
    setLoading(false);
  };

  const sentimentColor =
    data?.sentiment?.label === "Positive" ? "#22c55e"
    : data?.sentiment?.label === "Negative" ? "#ef4444"
    : "#f59e0b";

  const filteredPrices = data ? filterByRange(data.prices, range) : [];

  const rsiData = filteredPrices.map((p) => ({ date: p.date.slice(5), rsi: p.rsi }));

  const predictionData = data?.prediction?.predictions?.map((p, i) => ({
    date: `Day ${i + 1}`,
    price: p,
  })) || [];

  const currentPrice = data?.company?.currentPrice;
  const lastClose = data?.prices?.[data.prices.length - 1]?.close;
  const prevClose = data?.prices?.[data.prices.length - 2]?.close;
  const priceChange = lastClose && prevClose ? (lastClose - prevClose).toFixed(2) : null;
  const priceChangePct = lastClose && prevClose ? (((lastClose - prevClose) / prevClose) * 100).toFixed(2) : null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d1117",
      color: "#e2e8f0",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    }}>
      {/* Top Nav */}
      <div style={{
        borderBottom: "1px solid #1e293b",
        padding: "0 32px",
        display: "flex",
        alignItems: "center",
        height: "56px",
        background: "#0d1117",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <span style={{ fontSize: "1.2rem", fontWeight: "800", color: "#38bdf8", letterSpacing: "-0.5px" }}>
          ◈ StockSense
        </span>
        <span style={{ marginLeft: "12px", fontSize: "0.7rem", color: "#475569", background: "#1e293b", padding: "2px 8px", borderRadius: "4px" }}>
          AI-POWERED
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && analyze()}
            placeholder="Symbol e.g. AAPL, TCS.NS"
            style={{
              padding: "8px 14px",
              borderRadius: "6px",
              border: "1px solid #334155",
              background: "#161b22",
              color: "#e2e8f0",
              fontSize: "0.85rem",
              width: "240px",
              fontFamily: "inherit",
              outline: "none",
            }}
          />
          <button onClick={() => analyze()} style={{
            padding: "8px 20px",
            borderRadius: "6px",
            background: "#38bdf8",
            color: "#0d1117",
            fontWeight: "700",
            fontSize: "0.85rem",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
          }}>
            ANALYSE
          </button>
        </div>
      </div>

      <div style={{ padding: "24px 32px", maxWidth: "1400px", margin: "0 auto" }}>

        {/* Quick Picks */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
          {QUICK_PICKS.map((q) => (
            <button key={q.label} onClick={() => { setSymbol(q.label); analyze(q.label); }}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                border: "1px solid #1e293b",
                background: "#161b22",
                color: "#94a3b8",
                fontSize: "0.78rem",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.target.style.borderColor = "#38bdf8"; e.target.style.color = "#38bdf8"; }}
              onMouseLeave={e => { e.target.style.borderColor = "#1e293b"; e.target.style.color = "#94a3b8"; }}
            >
              {q.flag} {q.label}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "80px", color: "#475569" }}>
            <div style={{ fontSize: "2rem", marginBottom: "16px" }}>⏳</div>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>Fetching data and running LSTM model...</p>
            <p style={{ margin: "8px 0 0", fontSize: "0.78rem", color: "#334155" }}>This may take 15–20 seconds</p>
          </div>
        )}

        {error && (
          <div style={{ background: "#1a0000", border: "1px solid #ef4444", borderRadius: "8px", padding: "16px", color: "#ef4444", marginBottom: "24px" }}>
            ⚠ {error}
          </div>
        )}

        {data && (
          <>
            {/* Company Header */}
            <div style={{
              background: "#161b22",
              border: "1px solid #1e293b",
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "flex-start",
              gap: "32px",
              flexWrap: "wrap",
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
                  <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: "800", color: "#f1f5f9" }}>
                    {data.symbol}
                  </h1>
                  <span style={{
                    background: sentimentColor + "22",
                    color: sentimentColor,
                    border: `1px solid ${sentimentColor}44`,
                    padding: "2px 10px",
                    borderRadius: "20px",
                    fontSize: "0.72rem",
                    fontWeight: "700",
                  }}>
                    {data.sentiment.label}
                  </span>
                </div>
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem" }}>{data.company.name}</p>
                <p style={{ margin: "4px 0 0", color: "#475569", fontSize: "0.75rem" }}>
                  {data.company.sector} · {data.company.industry}
                </p>
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "baseline" }}>
                <span style={{ fontSize: "2.2rem", fontWeight: "800", color: "#f1f5f9" }}>
                  ${currentPrice?.toLocaleString?.() ?? currentPrice}
                </span>
                {priceChange && (
                  <span style={{ fontSize: "1rem", color: priceChange >= 0 ? "#22c55e" : "#ef4444", fontWeight: "600" }}>
                    {priceChange >= 0 ? "▲" : "▼"} {Math.abs(priceChange)} ({Math.abs(priceChangePct)}%)
                  </span>
                )}
              </div>

              <div style={{ marginLeft: "auto", display: "flex", gap: "24px", flexWrap: "wrap" }}>
                {[
                  ["Market Cap", typeof data.company.marketCap === "number" ? `$${(data.company.marketCap / 1e9).toFixed(1)}B` : "N/A"],
                  ["P/E Ratio", data.company.peRatio !== "N/A" ? Number(data.company.peRatio).toFixed(2) : "N/A"],
                  ["52W High", `$${data.company["52wHigh"]}`],
                  ["52W Low", `$${data.company["52wLow"]}`],
                ].map(([label, val]) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <p style={{ margin: 0, color: "#475569", fontSize: "0.7rem" }}>{label}</p>
                    <p style={{ margin: 0, color: "#e2e8f0", fontWeight: "700", fontSize: "0.95rem" }}>{val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart Controls */}
            <div style={{
              background: "#161b22",
              border: "1px solid #1e293b",
              borderRadius: "12px",
              padding: "20px 24px",
              marginBottom: "20px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                {/* Tab Switcher */}
                <div style={{ display: "flex", gap: "4px", background: "#0d1117", borderRadius: "8px", padding: "4px" }}>
                  {[
                    { key: "candlestick", label: "🕯 Candlestick" },
                    { key: "rsi", label: "📉 RSI" },
                    { key: "prediction", label: "🤖 Prediction" },
                  ].map((tab) => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                      style={{
                        padding: "6px 16px",
                        borderRadius: "6px",
                        border: "none",
                        background: activeTab === tab.key ? "#1e293b" : "transparent",
                        color: activeTab === tab.key ? "#38bdf8" : "#475569",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontWeight: activeTab === tab.key ? "700" : "400",
                        transition: "all 0.15s",
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Range Selector */}
                <div style={{ display: "flex", gap: "4px" }}>
                  {RANGES.map((r) => (
                    <button key={r} onClick={() => setRange(r)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "6px",
                        border: `1px solid ${range === r ? "#38bdf8" : "#1e293b"}`,
                        background: range === r ? "#38bdf822" : "transparent",
                        color: range === r ? "#38bdf8" : "#475569",
                        fontSize: "0.78rem",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontWeight: range === r ? "700" : "400",
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Legend for candlestick */}
              {activeTab === "candlestick" && (
                <div style={{ display: "flex", gap: "20px", marginBottom: "12px", fontSize: "0.75rem" }}>
                  <span style={{ color: "#22c55e" }}>▲ Bullish</span>
                  <span style={{ color: "#ef4444" }}>▼ Bearish</span>
                  <span style={{ color: "#f59e0b" }}>— MA20</span>
                  <span style={{ color: "#a78bfa" }}>— MA50</span>
                </div>
              )}

              {activeTab === "candlestick" && (
                <>
                  <CandlestickChart prices={data.prices} range={range} />
                  <div style={{ marginTop: "12px" }}>
                    <p style={{ margin: "0 0 8px", color: "#475569", fontSize: "0.72rem" }}>VOLUME</p>
                    <VolumeChart prices={data.prices} range={range} />
                  </div>
                </>
              )}

              {activeTab === "rsi" && (
                <div>
                  {/* RSI Indicator Badge */}
                  {filteredPrices.length > 0 && (() => {
                    const latestRSI = filteredPrices[filteredPrices.length - 1]?.rsi;
                    const rsiLabel = latestRSI > 70 ? "Overbought" : latestRSI < 30 ? "Oversold" : "Neutral";
                    const rsiColor = latestRSI > 70 ? "#ef4444" : latestRSI < 30 ? "#22c55e" : "#f59e0b";
                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                        <span style={{ color: "#475569", fontSize: "0.8rem" }}>Current RSI:</span>
                        <span style={{
                          background: rsiColor + "22",
                          color: rsiColor,
                          border: `1px solid ${rsiColor}44`,
                          padding: "3px 12px",
                          borderRadius: "20px",
                          fontSize: "0.8rem",
                          fontWeight: "700",
                        }}>
                          {latestRSI?.toFixed(1)} — {rsiLabel}
                        </span>
                      </div>
                    );
                  })()}
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={rsiData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#334155" tick={{ fontSize: 10 }} interval={Math.floor(rsiData.length / 8)} />
                      <YAxis stroke="#334155" tick={{ fontSize: 10 }} domain={[0, 100]} />
                      <Tooltip contentStyle={{ background: "#161b22", border: "1px solid #334155", borderRadius: "8px", fontFamily: "inherit", fontSize: "0.8rem" }} />
                      <ReferenceLine y={70} stroke="#ef444488" strokeDasharray="4 4" label={{ value: "Overbought 70", fill: "#ef4444", fontSize: 10 }} />
                      <ReferenceLine y={30} stroke="#22c55e88" strokeDasharray="4 4" label={{ value: "Oversold 30", fill: "#22c55e", fontSize: 10 }} />
                      <Line type="monotone" dataKey="rsi" stroke="#38bdf8" dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {activeTab === "prediction" && (
                <div>
                  <p style={{ margin: "0 0 16px", color: "#475569", fontSize: "0.8rem" }}>
                    LSTM model trained on 2 years of data · 7-day forecast
                  </p>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={predictionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#334155" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#334155" tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
                      <Tooltip contentStyle={{ background: "#161b22", border: "1px solid #334155", borderRadius: "8px", fontFamily: "inherit" }} />
                      <Line type="monotone" dataKey="price" stroke="#a78bfa" dot={{ fill: "#a78bfa", r: 5 }} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
                    {data.prediction.predictions.map((p, i) => (
                      <div key={i} style={{
                        background: "#0d1117",
                        border: "1px solid #1e293b",
                        borderRadius: "8px",
                        padding: "12px 16px",
                        textAlign: "center",
                        minWidth: "80px",
                      }}>
                        <p style={{ margin: 0, color: "#475569", fontSize: "0.7rem" }}>DAY {i + 1}</p>
                        <p style={{ margin: "4px 0 0", color: "#a78bfa", fontWeight: "700", fontSize: "0.95rem" }}>${p}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Row — Sentiment + News */}
            <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "20px" }}>
              {/* Sentiment Card */}
              <div style={{
                background: "#161b22",
                border: "1px solid #1e293b",
                borderRadius: "12px",
                padding: "24px",
              }}>
                <p style={{ margin: "0 0 16px", color: "#475569", fontSize: "0.72rem", letterSpacing: "0.05em" }}>SENTIMENT ANALYSIS</p>
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{
                    width: "80px", height: "80px", borderRadius: "50%",
                    background: sentimentColor + "22",
                    border: `3px solid ${sentimentColor}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 16px",
                    fontSize: "1.8rem",
                  }}>
                    {data.sentiment.label === "Positive" ? "📈" : data.sentiment.label === "Negative" ? "📉" : "➡️"}
                  </div>
                  <p style={{ margin: 0, fontSize: "1.4rem", fontWeight: "800", color: sentimentColor }}>
                    {data.sentiment.label}
                  </p>
                  <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.85rem" }}>
                    Score: {data.sentiment.score}
                  </p>
                  <p style={{ margin: "4px 0 0", color: "#475569", fontSize: "0.75rem" }}>
                    {data.sentiment.articles_analyzed} articles analysed
                  </p>
                </div>
              </div>

              {/* News Feed */}
              <div style={{
                background: "#161b22",
                border: "1px solid #1e293b",
                borderRadius: "12px",
                padding: "24px",
                maxHeight: "420px",
                overflowY: "auto",
              }}>
                <p style={{ margin: "0 0 16px", color: "#475569", fontSize: "0.72rem", letterSpacing: "0.05em" }}>LATEST NEWS</p>
                {data.sentiment.articles.map((article, i) => {
                  const ac = article.score >= 0.05 ? "#22c55e" : article.score <= -0.05 ? "#ef4444" : "#f59e0b";
                  return (
                    <a key={i} href={article.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                      <div style={{
                        padding: "12px 14px",
                        marginBottom: "8px",
                        borderRadius: "8px",
                        background: "#0d1117",
                        borderLeft: `3px solid ${ac}`,
                        transition: "background 0.15s",
                        cursor: "pointer",
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = "#161b22"}
                        onMouseLeave={e => e.currentTarget.style.background = "#0d1117"}
                      >
                        <p style={{ margin: "0 0 4px", color: "#e2e8f0", fontSize: "0.82rem", lineHeight: "1.4" }}>
                          {article.title}
                        </p>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          <span style={{ color: "#475569", fontSize: "0.72rem" }}>{article.source}</span>
                          <span style={{
                            background: ac + "22", color: ac,
                            padding: "1px 8px", borderRadius: "10px", fontSize: "0.68rem", fontWeight: "700",
                          }}>
                            {article.label}
                          </span>
                          <span style={{ color: "#334155", fontSize: "0.68rem" }}>{article.score}</span>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {!data && !loading && (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#334155" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>◈</div>
            <p style={{ margin: 0, fontSize: "1rem", color: "#475569" }}>Enter a stock symbol above to begin analysis</p>
            <p style={{ margin: "8px 0 0", fontSize: "0.8rem", color: "#334155" }}>
              Supports NYSE · NASDAQ · NSE (add .NS) · BSE (add .BO)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}