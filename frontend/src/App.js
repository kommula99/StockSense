import { useState, useEffect, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart, BarChart, Bar, Legend
} from "recharts";

const API_BASE = "http://127.0.0.1:8000/api/stock";

const POPULAR_STOCKS = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "GOOGL", name: "Google" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "META", name: "Meta" },
  { symbol: "RELIANCE.NS", name: "Reliance" },
  { symbol: "TCS.NS", name: "TCS" },
  { symbol: "INFY.NS", name: "Infosys" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank" },
  { symbol: "WIPRO.NS", name: "Wipro" },
];

const formatNum = (n) => {
  if (!n || n === "N/A") return "N/A";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n}`;
};

const getRsiColor = (rsi) => {
  if (!rsi || rsi === "N/A") return "#94a3b8";
  if (rsi > 70) return "#f87171";
  if (rsi < 30) return "#34d399";
  return "#94a3b8";
};

const getRsiLabel = (rsi) => {
  if (!rsi || rsi === "N/A") return "NEUTRAL";
  if (rsi > 70) return "OVERBOUGHT";
  if (rsi < 30) return "OVERSOLD";
  return "NEUTRAL";
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "rgba(15,20,40,0.97)",
        border: "1px solid rgba(99,179,237,0.3)",
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 12,
        color: "#e2e8f0"
      }}>
        <p style={{ color: "#63b3ed", marginBottom: 4, fontWeight: 700 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, margin: "2px 0" }}>
            {p.name}: <strong>{typeof p.value === "number" ? p.value.toFixed(2) : p.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function App() {
  const [symbol, setSymbol] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("price");
  const [chartRange, setChartRange] = useState(90);
  const inputRef = useRef();

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    setError("");
    setData(null);
    fetch(`${API_BASE}/${symbol}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); setLoading(false); return; }
        setData(d);
        setLoading(false);
      })
      .catch(() => { setError("Failed to connect to backend."); setLoading(false); });
  }, [symbol]);

  const handleSearch = () => {
    const val = inputVal.trim().toUpperCase();
    if (val) setSymbol(val);
  };

  const prices = data?.prices?.slice(-chartRange) || [];
  const latestRsi = prices.length ? prices[prices.length - 1]?.rsi : null;
  const company = data?.company || {};
  const sentiment = data?.sentiment || {};
  const news = data?.news || [];
  const prediction = data?.prediction || [];

  const sentimentColor = sentiment.label === "Positive" ? "#34d399"
    : sentiment.label === "Negative" ? "#f87171" : "#fbbf24";

  const priceChange = prices.length > 1
    ? ((prices[prices.length - 1].close - prices[0].close) / prices[0].close * 100).toFixed(2)
    : null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #060b18 0%, #0a1628 50%, #060d1f 100%)",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      color: "#e2e8f0",
      overflowX: "hidden"
    }}>
      {/* Ambient glow effects */}
      <div style={{
        position: "fixed", top: -200, left: -200, width: 600, height: 600,
        borderRadius: "50%", background: "radial-gradient(circle, rgba(56,189,248,0.04) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0
      }} />
      <div style={{
        position: "fixed", bottom: -200, right: -200, width: 500, height: 500,
        borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,0.04) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "0 24px 60px" }}>

        {/* Header */}
        <div style={{ padding: "36px 0 28px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #38bdf8, #6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 900, color: "#fff"
            }}>S</div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px", margin: 0,
              background: "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              StockSense
            </h1>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#38bdf8",
              background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.3)",
              borderRadius: 4, padding: "2px 8px", marginLeft: 4
            }}>AI POWERED</span>
          </div>
          <p style={{ color: "#64748b", margin: 0, fontSize: 13 }}>
            Real-time analysis · LSTM prediction · Sentiment scoring · Global markets
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                ref={inputRef}
                value={inputVal}
                onChange={e => setInputVal(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="Enter symbol: AAPL, TSLA, RELIANCE.NS, TCS.NS..."
                style={{
                  width: "100%", padding: "13px 16px", fontSize: 14,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10, color: "#e2e8f0", outline: "none",
                  transition: "border 0.2s", boxSizing: "border-box",
                  fontFamily: "inherit", letterSpacing: "0.5px"
                }}
                onFocus={e => e.target.style.borderColor = "rgba(56,189,248,0.5)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>
            <button onClick={handleSearch} style={{
              padding: "13px 28px", borderRadius: 10,
              background: "linear-gradient(135deg, #38bdf8, #6366f1)",
              border: "none", color: "#fff", fontWeight: 700, fontSize: 14,
              cursor: "pointer", letterSpacing: "0.5px", fontFamily: "inherit",
              transition: "opacity 0.2s"
            }}
              onMouseOver={e => e.target.style.opacity = 0.85}
              onMouseOut={e => e.target.style.opacity = 1}
            >ANALYZE</button>
          </div>

          {/* Quick select chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {POPULAR_STOCKS.map(s => (
              <button key={s.symbol} onClick={() => { setInputVal(s.symbol); setSymbol(s.symbol); }}
                style={{
                  padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: symbol === s.symbol ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.04)",
                  border: symbol === s.symbol ? "1px solid rgba(56,189,248,0.5)" : "1px solid rgba(255,255,255,0.08)",
                  color: symbol === s.symbol ? "#38bdf8" : "#94a3b8",
                  cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s"
                }}>
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{
              width: 48, height: 48, border: "3px solid rgba(56,189,248,0.15)",
              borderTopColor: "#38bdf8", borderRadius: "50%",
              animation: "spin 0.8s linear infinite", margin: "0 auto 16px"
            }} />
            <p style={{ color: "#64748b", fontSize: 14 }}>Fetching live data + running LSTM model...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)",
            borderRadius: 10, padding: "16px 20px", color: "#f87171", fontSize: 14
          }}>⚠ {error}</div>
        )}

        {/* Main Dashboard */}
        {data && !loading && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>

            {/* Company Header */}
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14, padding: "22px 26px", marginBottom: 18,
              display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: "#f1f5f9" }}>
                    {company.name || data.symbol}
                  </h2>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: "#64748b",
                    background: "rgba(255,255,255,0.05)", borderRadius: 4, padding: "2px 8px",
                    border: "1px solid rgba(255,255,255,0.08)"
                  }}>{data.symbol}</span>
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#64748b" }}>
                  {company.sector !== "N/A" && <span>🏢 {company.sector}</span>}
                  {company.industry !== "N/A" && <span>⚙ {company.industry}</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                {[
                  { label: "Current Price", value: typeof company.currentPrice === "number" ? `$${company.currentPrice.toFixed(2)}` : "N/A" },
                  { label: "Market Cap", value: formatNum(company.marketCap) },
                  { label: "P/E Ratio", value: typeof company.peRatio === "number" ? company.peRatio.toFixed(2) : "N/A" },
                  { label: "52W High", value: company["52wHigh"] !== "N/A" ? `$${Number(company["52wHigh"]).toFixed(2)}` : "N/A" },
                  { label: "52W Low", value: company["52wLow"] !== "N/A" ? `$${Number(company["52wLow"]).toFixed(2)}` : "N/A" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 12, marginBottom: 18 }}>
              {/* Sentiment */}
              <div style={{
                background: "rgba(255,255,255,0.03)", border: `1px solid ${sentimentColor}33`,
                borderRadius: 12, padding: "16px 20px"
              }}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, letterSpacing: 1 }}>SENTIMENT</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: sentimentColor }}>{sentiment.label || "N/A"}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  Score: {typeof sentiment.score === "number" ? sentiment.score.toFixed(3) : "N/A"}
                  {" · "}{sentiment.count || 0} articles
                </div>
              </div>

              {/* RSI */}
              <div style={{
                background: "rgba(255,255,255,0.03)", border: `1px solid ${getRsiColor(latestRsi)}33`,
                borderRadius: 12, padding: "16px 20px"
              }}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, letterSpacing: 1 }}>RSI (14)</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: getRsiColor(latestRsi) }}>
                  {latestRsi ? latestRsi.toFixed(1) : "N/A"}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{getRsiLabel(latestRsi)}</div>
              </div>

              {/* Price change */}
              <div style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${parseFloat(priceChange) >= 0 ? "#34d39933" : "#f8717133"}`,
                borderRadius: 12, padding: "16px 20px"
              }}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, letterSpacing: 1 }}>
                  {chartRange}D CHANGE
                </div>
                <div style={{
                  fontSize: 22, fontWeight: 800,
                  color: parseFloat(priceChange) >= 0 ? "#34d399" : "#f87171"
                }}>
                  {priceChange !== null ? `${priceChange > 0 ? "+" : ""}${priceChange}%` : "N/A"}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  {prices[0]?.close ? `From $${prices[0].close}` : ""}
                </div>
              </div>

              {/* Prediction */}
              {prediction.length > 0 && (
                <div style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(167,139,250,0.2)",
                  borderRadius: 12, padding: "16px 20px"
                }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, letterSpacing: 1 }}>7D PREDICTION</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#a78bfa" }}>
                    ${prediction[prediction.length - 1]?.predicted_price?.toFixed(2) || "N/A"}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>LSTM forecast</div>
                </div>
              )}
            </div>

            {/* Chart Tabs */}
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14, padding: "20px 24px", marginBottom: 18
            }}>
              {/* Tab bar */}
              <div style={{ display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 4 }}>
                  {[
                    { key: "price", label: "Price + MA" },
                    { key: "bollinger", label: "Bollinger Bands" },
                    { key: "rsi", label: "RSI" },
                    { key: "volume", label: "Volume" },
                    { key: "prediction", label: "AI Prediction" },
                  ].map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                      padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                      background: activeTab === t.key ? "rgba(56,189,248,0.15)" : "transparent",
                      border: activeTab === t.key ? "1px solid rgba(56,189,248,0.4)" : "1px solid transparent",
                      color: activeTab === t.key ? "#38bdf8" : "#64748b",
                      cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s"
                    }}>{t.label}</button>
                  ))}
                </div>
                {/* Range selector */}
                <div style={{ display: "flex", gap: 4 }}>
                  {[30, 90, 180, 365].map(r => (
                    <button key={r} onClick={() => setChartRange(r)} style={{
                      padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                      background: chartRange === r ? "rgba(99,102,241,0.2)" : "transparent",
                      border: chartRange === r ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.06)",
                      color: chartRange === r ? "#a5b4fc" : "#64748b",
                      cursor: "pointer", fontFamily: "inherit"
                    }}>{r === 365 ? "1Y" : r === 180 ? "6M" : r === 90 ? "3M" : "1M"}</button>
                  ))}
                </div>
              </div>

              {/* Price + MA Chart */}
              {activeTab === "price" && (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={prices} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 10 }}
                      interval={Math.floor(prices.length / 6)} />
                    <YAxis tick={{ fill: "#475569", fontSize: 10 }} domain={["auto", "auto"]}
                      tickFormatter={v => `$${v}`} width={60} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: "#64748b" }} />
                    <Line type="monotone" dataKey="close" name="Close" stroke="#38bdf8" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="ma20" name="MA20" stroke="#f59e0b" dot={false} strokeWidth={1.5} strokeDasharray="4 2" />
                    <Line type="monotone" dataKey="ma50" name="MA50" stroke="#a78bfa" dot={false} strokeWidth={1.5} strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {/* Bollinger Bands */}
              {activeTab === "bollinger" && (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={prices} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 10 }} interval={Math.floor(prices.length / 6)} />
                    <YAxis tick={{ fill: "#475569", fontSize: 10 }} domain={["auto", "auto"]} tickFormatter={v => `$${v}`} width={60} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: "#64748b" }} />
                    <Line type="monotone" dataKey="bb_upper" name="BB Upper" stroke="#f87171" dot={false} strokeWidth={1.5} strokeDasharray="3 2" />
                    <Line type="monotone" dataKey="close" name="Close" stroke="#38bdf8" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="bb_lower" name="BB Lower" stroke="#34d399" dot={false} strokeWidth={1.5} strokeDasharray="3 2" />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {/* RSI Chart */}
              {activeTab === "rsi" && (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={prices} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 10 }} interval={Math.floor(prices.length / 6)} />
                    <YAxis tick={{ fill: "#475569", fontSize: 10 }} domain={[0, 100]} width={40} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={70} stroke="#f87171" strokeDasharray="4 2" label={{ value: "Overbought 70", fill: "#f87171", fontSize: 10 }} />
                    <ReferenceLine y={30} stroke="#34d399" strokeDasharray="4 2" label={{ value: "Oversold 30", fill: "#34d399", fontSize: 10 }} />
                    <Line type="monotone" dataKey="rsi" name="RSI" stroke="#f59e0b" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {/* Volume */}
              {activeTab === "volume" && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={prices} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 10 }} interval={Math.floor(prices.length / 6)} />
                    <YAxis tick={{ fill: "#475569", fontSize: 10 }} width={60}
                      tickFormatter={v => v >= 1e6 ? `${(v / 1e6).toFixed(0)}M` : v} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="volume" name="Volume" fill="rgba(56,189,248,0.4)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {/* AI Prediction */}
              {activeTab === "prediction" && (
                <div>
                  {prediction.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={prediction} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                          <XAxis dataKey="day" tick={{ fill: "#475569", fontSize: 10 }} />
                          <YAxis tick={{ fill: "#475569", fontSize: 10 }} domain={["auto", "auto"]} tickFormatter={v => `$${v.toFixed(0)}`} width={60} />
                          <Tooltip content={<CustomTooltip />} />
                          <Line type="monotone" dataKey="predicted_price" name="Predicted Price" stroke="#a78bfa" dot={{ fill: "#a78bfa", r: 4 }} strokeWidth={2.5} />
                        </LineChart>
                      </ResponsiveContainer>
                      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                        {prediction.map((p, i) => (
                          <div key={i} style={{
                            flex: "1 1 80px", background: "rgba(167,139,250,0.06)",
                            border: "1px solid rgba(167,139,250,0.2)", borderRadius: 8,
                            padding: "10px 12px", textAlign: "center"
                          }}>
                            <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>Day {i + 1}</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "#a78bfa" }}>
                              ${p.predicted_price?.toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>No prediction data available</div>
                  )}
                </div>
              )}
            </div>

            {/* News */}
            {news.length > 0 && (
              <div style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 14, padding: "20px 24px"
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", letterSpacing: 1, marginBottom: 16, margin: "0 0 16px" }}>
                  LATEST NEWS
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {news.map((article, i) => {
                    const sc = article.sentiment?.compound;
                    const aColor = sc > 0.05 ? "#34d399" : sc < -0.05 ? "#f87171" : "#fbbf24";
                    return (
                      <a key={i} href={article.url} target="_blank" rel="noopener noreferrer"
                        style={{ textDecoration: "none" }}>
                        <div style={{
                          background: "rgba(255,255,255,0.02)", borderLeft: `3px solid ${aColor}`,
                          borderRadius: "0 8px 8px 0", padding: "12px 16px",
                          transition: "background 0.15s"
                        }}
                          onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                          onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                        >
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 4 }}>
                            {article.title}
                          </div>
                          <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#475569" }}>
                            <span>{article.source}</span>
                            <span>{article.publishedAt?.substring(0, 10)}</span>
                            <span style={{ color: aColor, fontWeight: 700 }}>
                              {sc > 0.05 ? "▲ Positive" : sc < -0.05 ? "▼ Negative" : "◆ Neutral"}
                            </span>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!data && !loading && !error && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#334155" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#475569" }}>Search any stock to begin</p>
            <p style={{ fontSize: 13 }}>Supports NYSE, NASDAQ, NSE (add .NS), BSE (add .BO)</p>
          </div>
        )}
      </div>
    </div>
  );
}