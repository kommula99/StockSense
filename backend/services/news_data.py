import os
import requests
from dotenv import load_dotenv

load_dotenv()

NEWS_API_KEY = os.getenv("NEWS_API_KEY")

def get_news(symbol: str):
    url = "https://newsapi.org/v2/everything"
    params = {
        "q": f"{symbol} stock",
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": 10,
        "apiKey": NEWS_API_KEY
    }
    
    response = requests.get(url, params=params)
    data = response.json()
    
    if data.get("status") != "ok":
        return {"error": "Could not fetch news", "details": data}
    
    articles = []
    for article in data.get("articles", []):
        articles.append({
            "title": article.get("title", ""),
            "description": article.get("description", ""),
            "url": article.get("url", ""),
            "publishedAt": article.get("publishedAt", ""),
            "source": article.get("source", {}).get("name", "")
        })
    
    return articles