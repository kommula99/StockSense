from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

analyzer = SentimentIntensityAnalyzer()

def analyze_sentiment(news):
    if not news or isinstance(news, dict):
        return {
            "score": 0,
            "label": "Neutral",
            "articles_analyzed": 0
        }
    
    total_score = 0
    scored_articles = []
    
    for article in news:
        text = f"{article.get('title', '')} {article.get('description', '')}"
        score = analyzer.polarity_scores(text)
        compound = score["compound"]
        
        scored_articles.append({
            "title": article.get("title", ""),
            "score": compound,
            "label": "Positive" if compound >= 0.05 else "Negative" if compound <= -0.05 else "Neutral",
            "source": article.get("source", ""),
            "url": article.get("url", ""),
            "publishedAt": article.get("publishedAt", "")
        })
        
        total_score += compound
    
    avg_score = round(total_score / len(news), 3)
    
    return {
        "score": avg_score,
        "label": "Positive" if avg_score >= 0.05 else "Negative" if avg_score <= -0.05 else "Neutral",
        "articles_analyzed": len(news),
        "articles": scored_articles
    }