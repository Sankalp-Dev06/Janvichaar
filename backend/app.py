from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from collections import Counter
from typing import Optional, Dict, List
import logging
from datetime import datetime
import random
import os

app = FastAPI()

# ✅ Mount the frontend directory
app.mount("/", StaticFiles(directory=os.path.abspath("../frontend"), html=True), name="static")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

sentiment_map = {
    "POSITIVE": "positive",
    "NEGATIVE": "negative",
    "NEUTRAL": "neutral"
}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    platform: str
    input: str

class FilterRequest(BaseModel):
    keyword: str
    filter_type: str
    limit: Optional[int] = 20

class PlatformStatsRequest(BaseModel):
    platform: str

analysis_history = []

sentiment_score_map = {
    "positive": 3,
    "neutral": 2,
    "negative": 1
}

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
    return JSONResponse(status_code=500, content={"error": "An unexpected error occurred"})

@app.post("/analyze")
async def analyze(request: AnalyzeRequest):
    platform = request.platform.lower()
    user_input = request.input.strip()

    logger.info(f"Analyzing {platform} content from: {user_input}")

    try:
        if platform == "youtube":
            comments = get_youtube_comments(user_input)
        elif platform == "reddit":
            comments = get_reddit_comments(user_input)
        else:
            raise HTTPException(status_code=400, detail="Unsupported platform")

        if not comments:
            raise HTTPException(status_code=404, detail="No comments found")

        results, categorized = analyze_comments(comments)

        app.state.categorized_data = categorized
        analysis_entry = {
            "platform": platform,
            "url": user_input,
            "timestamp": datetime.utcnow().isoformat(),
            "stats": {
                "total_comments": len(comments),
                "sentiment": Counter(item["sentiment"]["label"].lower() for item in results),
                "emotion": Counter(item["emotion"]["label"].lower() for item in results)
            }
        }
        analysis_history.append(analysis_entry)

        sentiment_counts = Counter()
        emotion_counts = Counter()
        sample_comments = []

        for item in results:
            sentiment_label = item["sentiment"]["label"].lower()
            emotion_label = item["emotion"]["label"].lower()

            sentiment_counts[sentiment_label] += 1
            emotion_counts[emotion_label] += 1

            sample_comments.append({
                "text": item["text"],
                "sentiment": {
                    "label": sentiment_label,
                    "score": item["sentiment"]["score"],
                    "confidence": classify_confidence(item["sentiment"]["score"])
                },
                "emotion": {
                    "label": emotion_label,
                    "score": item["emotion"]["score"],
                    "confidence": classify_confidence(item["emotion"]["score"])
                }
            })

        return {
            "platform": platform.capitalize(),
            "url": user_input,
            "comments_analyzed": len(comments),
            "sentiment_stats": normalize_stats(dict(sentiment_counts), len(comments)),
            "emotion_stats": normalize_stats(dict(emotion_counts), len(comments)),
            "sample_comments": sample_comments[:10],
            "analysis_id": len(analysis_history) - 1,
            "timestamp": analysis_entry["timestamp"]
        }

    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/filter-comments")
async def filter_comments(request: FilterRequest):
    keyword = request.keyword.lower()
    filter_type = request.filter_type.lower()
    limit = request.limit

    if filter_type not in ['sentiment', 'emotion']:
        raise HTTPException(status_code=400, detail="Invalid filter type")

    if not hasattr(app.state, 'categorized_data'):
        raise HTTPException(status_code=400, detail="No analysis data available")

    filtered = app.state.categorized_data[filter_type].get(keyword, [])

    return {
        "keyword": keyword,
        "type": filter_type,
        "count": len(filtered),
        "comments": filtered[:limit]
    }

@app.get("/analysis-history")
async def get_analysis_history(limit: int = 5):
    return {
        "history": analysis_history[-limit:][::-1]
    }

@app.get("/platform-stats")
async def get_platform_stats():
    platform_stats = {"reddit": Counter(), "youtube": Counter()}

    for entry in analysis_history:
        platform = entry["platform"]
        platform_stats[platform]["total_analyses"] += 1
        platform_stats[platform]["total_comments"] += entry["stats"]["total_comments"]

        for sentiment, count in entry["stats"]["sentiment"].items():
            platform_stats[platform][f"sentiment_{sentiment}"] += count

        for emotion, count in entry["stats"]["emotion"].items():
            platform_stats[platform][f"emotion_{emotion}"] += count

    return {
        "reddit": calculate_percentages(platform_stats["reddit"]),
        "youtube": calculate_percentages(platform_stats["youtube"])
    }

@app.get("/latest-comments")
async def get_latest_comments():
    try:
        youtube_comments = get_youtube_comments("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
        reddit_comments = get_reddit_comments("https://www.reddit.com/r/Python/comments/")

        all_comments = []

        for comment in youtube_comments[:5]:
            sentiment_result = sentiment_pipeline(comment.get("text", ""))[0]
            sentiment = sentiment_map.get(sentiment_result["label"], "Neutral")

            all_comments.append({
                "user": comment.get("author", "Anonymous"),
                "content": comment.get("text", ""),
                "sentiment": sentiment.lower(),
                "time": comment.get("publishedAt", "Just now"),
                "platform": "YouTube"
            })

        for comment in reddit_comments[:5]:
            sentiment_result = sentiment_pipeline(comment.get("body", ""))[0]
            sentiment = sentiment_map.get(sentiment_result["label"], "Neutral")

            all_comments.append({
                "user": comment.get("author", "Anonymous"),
                "content": comment.get("body", ""),
                "sentiment": sentiment.lower(),
                "time": comment.get("created_utc", "Just now"),
                "platform": "Reddit"
            })

        all_comments.sort(key=lambda x: x["time"], reverse=True)

        if not all_comments:
            all_comments = [{
                "user": "System",
                "content": "No comments available at the moment.",
                "sentiment": "neutral",
                "time": "Just now",
                "platform": "System"
            }]

        return {"comments": all_comments}

    except Exception as e:
        logger.error(f"Error fetching latest comments: {str(e)}")
        return {
            "comments": [{
                "user": "System",
                "content": "Unable to fetch comments at the moment.",
                "sentiment": "neutral",
                "time": "Just now",
                "platform": "System"
            }]
        }

@app.get("/top-comments")
async def get_top_comments(platform: Optional[str] = None):
    try:
        all_comments = [
            {
                "user": "TechEnthusiast",
                "content": "Amazing product!",
                "sentiment": "positive",
                "time": "2 hours ago",
                "platform": "YouTube"
            },
            {
                "user": "NewUser",
                "content": "Could be better.",
                "sentiment": "negative",
                "time": "3 hours ago",
                "platform": "Reddit"
            },
        ]

        if platform:
            filtered_comments = [c for c in all_comments if c["platform"].lower() == platform.lower()]
        else:
            filtered_comments = all_comments

        return {"comments": filtered_comments}

    except Exception as e:
        logger.error(f"Error fetching top comments: {str(e)}")
        return {
            "comments": [{
                "user": "System",
                "content": "Unable to fetch comments.",
                "sentiment": "neutral",
                "time": "Just now",
                "platform": "System"
            }]
        }

@app.get("/sentiment-trends")
async def get_sentiment_trends():
    try:
        time_labels = [f"{23 - i}:00" for i in range(24)]

        reddit_trend = [round(60 + random.uniform(-5, 5), 1) for _ in range(24)]
        youtube_trend = [round(55 + random.uniform(-5, 5), 1) for _ in range(24)]

        emotions = {
            "joy": round(random.uniform(25, 45), 1),
            "sadness": round(random.uniform(15, 35), 1),
            "anger": round(random.uniform(10, 25), 1),
            "fear": round(random.uniform(5, 20), 1),
            "surprise": round(random.uniform(10, 25), 1)
        }

        total = sum(emotions.values())
        for e in emotions:
            emotions[e] = round((emotions[e] / total) * 100, 1)

        return {
            "time_labels": time_labels,
            "reddit_trend": reddit_trend,
            "youtube_trend": youtube_trend,
            "emotions": emotions
        }

    except Exception as e:
        logger.error(f"Error generating trends: {str(e)}")
        raise HTTPException(status_code=500, detail="Trend generation failed")

# Helper functions
def classify_confidence(score: float) -> str:
    if score >= 0.8: return "high"
    elif score >= 0.6: return "medium"
    elif score >= 0.4: return "low"
    return "very_low"

def normalize_stats(stats: Dict[str, int], total: int) -> Dict[str, float]:
    if total == 0: return {k: 0.0 for k in stats}
    return {k: round((v / total) * 100, 1) for k, v in stats.items()}

def calculate_percentages(stats: Counter) -> Dict[str, float]:
    result = {}
    total_comments = stats["total_comments"]
    if total_comments == 0:
        return {k: 0.0 for k in stats}
    for k, v in stats.items():
        if k.startswith("sentiment_") or k.startswith("emotion_"):
            result[k] = round((v / total_comments) * 100, 1)
        else:
            result[k] = v
    return result

@app.on_event("startup")
async def startup_event():
    logger.info("Sentiment analysis API started")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Sentiment analysis API stopped")
