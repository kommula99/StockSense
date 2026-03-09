import yfinance as yf
import pandas as pd

def get_stock_data(symbol: str):
    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(period="2y")
        
        if df.empty:
            return {"error": f"No data found for symbol: {symbol}"}
        
        # Add technical indicators
        df["MA20"] = df["Close"].rolling(window=20).mean()
        df["MA50"] = df["Close"].rolling(window=50).mean()
        
        # RSI
        delta = df["Close"].diff()
        gain = delta.where(delta > 0, 0).rolling(window=14).mean()
        loss = -delta.where(delta < 0, 0).rolling(window=14).mean()
        rs = gain / loss
        df["RSI"] = 100 - (100 / (1 + rs))
        
        # Bollinger Bands
        df["BB_mid"] = df["Close"].rolling(window=20).mean()
        df["BB_std"] = df["Close"].rolling(window=20).std()
        df["BB_upper"] = df["BB_mid"] + 2 * df["BB_std"]
        df["BB_lower"] = df["BB_mid"] - 2 * df["BB_std"]
        
        df = df.dropna()
        df = df.reset_index()
        
        prices = []
        for _, row in df.iterrows():
            prices.append({
                "date": str(row["Date"])[:10],
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]),
                "ma20": round(float(row["MA20"]), 2),
                "ma50": round(float(row["MA50"]), 2),
                "rsi": round(float(row["RSI"]), 2),
                "bb_upper": round(float(row["BB_upper"]), 2),
                "bb_lower": round(float(row["BB_lower"]), 2),
            })
        
        # Get company info
        info = ticker.info
        company = {
            "name": info.get("longName", symbol),
            "sector": info.get("sector", "N/A"),
            "industry": info.get("industry", "N/A"),
            "marketCap": info.get("marketCap", "N/A"),
            "peRatio": info.get("trailingPE", "N/A"),
            "52wHigh": info.get("fiftyTwoWeekHigh", "N/A"),
            "52wLow": info.get("fiftyTwoWeekLow", "N/A"),
            "currentPrice": info.get("currentPrice", prices[-1]["close"] if prices else "N/A"),
        }
        
        return {"prices": prices, "company": company}
    
    except Exception as e:
        return {"error": str(e)}