from fastapi import APIRouter
from services.stock_data import get_stock_data
from services.news_data import get_news
from services.sentiment import analyze_sentiment
from ml.model import predict_prices

router = APIRouter()

@router.get("/{symbol}")
def get_stock_info(symbol: str):
    stock = get_stock_data(symbol)
    
    if "error" in stock:
        return {"error": stock["error"]}
    
    prices = stock["prices"]
    company = stock["company"]
    news = get_news(company["name"])
    sentiment = analyze_sentiment(news)
    prediction = predict_prices(prices)

    return {
        "symbol": symbol.upper(),
        "company": company,
        "prices": prices,
        "news": news,
        "sentiment": sentiment,
        "prediction": prediction
    }