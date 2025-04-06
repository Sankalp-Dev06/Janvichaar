from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from collections import Counter
from typing import Optional, Dict, List
import logging
from datetime import datetime
import random

app = FastAPI()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define sentiment mapping
sentiment_map = {
    "POSITIVE": "positive",
    "NEGATIVE": "negative",
    "NEUTRAL": "neutral"
}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    platform: str
    input: str

class FilterRequest(BaseModel):
    keyword: str
    filter_type: str  # 'sentiment' or 'emotion'
    limit: Optional[int] = 20  # Add pagination support

class PlatformStatsRequest(BaseModel):
    platform: str

# Store analysis history (in-memory, consider database for production)
analysis_history = []

# Add sentiment score mapping for sorting
sentiment_score_map = {
    "positive": 3,
    "neutral": 2,
    "negative": 1
}

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail},
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "An unexpected error occurred"},
    )

@app.post("/analyze")
async def analyze(request: AnalyzeRequest):
    """Analyze comments from a given platform URL"""
    platform = request.platform.lower()
    user_input = request.input.strip()

    logger.info(f"Analyzing {platform} content from: {user_input}")

    try:
        # Fetch comments
        if platform == "youtube":
            comments = get_youtube_comments(user_input)
        elif platform == "reddit":
            comments = get_reddit_comments(user_input)
        else:
            raise HTTPException(status_code=400, detail="Unsupported platform")
        
        if not comments:
            raise HTTPException(status_code=404, detail="No comments found")

        # Analyze comments
        results, categorized = analyze_comments(comments)
        
        # Store the current analysis
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

        # Prepare response
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
            "analysis_id": len(analysis_history) - 1,  # Return the index of this analysis
            "timestamp": analysis_entry["timestamp"]
        }

    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/filter-comments")
async def filter_comments(request: FilterRequest):
    """Filter previously analyzed comments by sentiment or emotion"""
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
    """Get recent analysis history"""
    return {
        "history": analysis_history[-limit:][::-1]  # Return most recent first
    }

@app.get("/platform-stats")
async def get_platform_stats():
    """Get summary statistics for each platform"""
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
    """Fetch the latest comments from both YouTube and Reddit platforms"""
    try:
        # Get comments from both platforms
        youtube_comments = get_youtube_comments("https://www.youtube.com/watch?v=dQw4w9WgXcQ")  # Example video
        reddit_comments = get_reddit_comments("https://www.reddit.com/r/Python/comments/")  # Example subreddit
        
        # Combine and format comments
        all_comments = []
        
        # Process YouTube comments
        for comment in youtube_comments[:5]:  # Get latest 5 comments
            # Analyze sentiment for the comment
            sentiment_result = sentiment_pipeline(comment.get("text", ""))[0]
            sentiment = sentiment_map.get(sentiment_result["label"], "Neutral")
            
            all_comments.append({
                "user": comment.get("author", "Anonymous"),
                "content": comment.get("text", ""),
                "sentiment": sentiment.lower(),
                "time": comment.get("publishedAt", "Just now"),
                "platform": "YouTube"
            })
            
        # Process Reddit comments
        for comment in reddit_comments[:5]:  # Get latest 5 comments
            # Analyze sentiment for the comment
            sentiment_result = sentiment_pipeline(comment.get("body", ""))[0]
            sentiment = sentiment_map.get(sentiment_result["label"], "Neutral")
            
            all_comments.append({
                "user": comment.get("author", "Anonymous"),
                "content": comment.get("body", ""),
                "sentiment": sentiment.lower(),
                "time": comment.get("created_utc", "Just now"),
                "platform": "Reddit"
            })
            
        # Sort comments by time (most recent first)
        all_comments.sort(key=lambda x: x["time"], reverse=True)
        
        # If no comments were found, return a sample comment
        if not all_comments:
            all_comments = [{
                "user": "System",
                "content": "No comments available at the moment. Please try again later.",
                "sentiment": "neutral",
                "time": "Just now",
                "platform": "System"
            }]
        
        return {"comments": all_comments}
        
    except Exception as e:
        logger.error(f"Error fetching latest comments: {str(e)}")
        # Return a friendly error message instead of raising an exception
        return {
            "comments": [{
                "user": "System",
                "content": "Unable to fetch comments at the moment. Please try again later.",
                "sentiment": "neutral",
                "time": "Just now",
                "platform": "System"
            }]
        }

@app.get("/top-comments")
async def get_top_comments(platform: Optional[str] = None):
    """Return the top comments based on sentiment analysis, optionally filtered by platform"""
    try:
        # Sample comments data
        all_comments = [
            {
                "user": "TechEnthusiast",
                "content": "This is an amazing product! I've been using it for weeks and it's completely transformed my workflow.",
                "sentiment": "positive",
                "time": "2 hours ago",
                "platform": "YouTube"
            },
            {
                "user": "DataScientist",
                "content": "The analysis features are quite comprehensive. I'd like to see more customization options in the future.",
                "sentiment": "neutral",
                "time": "5 hours ago",
                "platform": "Reddit"
            },
            {
                "user": "NewUser123",
                "content": "I'm having trouble with the interface. It's not as intuitive as I expected.",
                "sentiment": "negative",
                "time": "1 day ago",
                "platform": "YouTube"
            },
            {
                "user": "AIEnthusiast",
                "content": "The sentiment analysis is surprisingly accurate. Great work on training the model!",
                "sentiment": "positive",
                "time": "3 hours ago",
                "platform": "Reddit"
            },
            {
                "user": "TechReviewer",
                "content": "After testing all competitors, this tool has the best accuracy and performance by far.",
                "sentiment": "positive",
                "time": "6 hours ago",
                "platform": "YouTube"
            },
            {
                "user": "MarketingPro",
                "content": "We've integrated this with our customer feedback system and it's saving our team hours of work daily.",
                "sentiment": "positive", 
                "time": "8 hours ago",
                "platform": "Reddit"
            }
        ]
        
        # Filter by platform if specified
        if platform:
            filtered_comments = [comment for comment in all_comments 
                               if comment["platform"].lower() == platform.lower()]
            logger.info(f"Filtered comments for platform: {platform}, found {len(filtered_comments)} comments")
        else:
            filtered_comments = all_comments
            
        return {
            "comments": filtered_comments
        }
    except Exception as e:
        logger.error(f"Error fetching top comments: {str(e)}")
        return {
            "comments": [
                {
                    "user": "System",
                    "content": "Unable to fetch comments at the moment. Please try again later.",
                    "sentiment": "neutral",
                    "time": "Just now",
                    "platform": "System"
                }
            ]
        }

@app.get("/sentiment-trends")
async def get_sentiment_trends():
    """Get sentiment trend data for both Reddit and YouTube platforms"""
    try:
        # Generate time labels for the last 24 hours in hourly intervals
        time_labels = []
        for i in range(24):
            hour = 23 - i
            time_labels.append(f"{hour}:00")
        
        # Generate sample data
        base_reddit = 60
        base_youtube = 55
        
        reddit_trend = []
        youtube_trend = []
        
        for _ in range(24):
            reddit_trend.append(round(base_reddit + random.uniform(-5, 5), 1))
            youtube_trend.append(round(base_youtube + random.uniform(-5, 5), 1))
        
        # Generate emotion data
        emotions = {
            "joy": round(random.uniform(25, 45), 1),
            "sadness": round(random.uniform(15, 35), 1),
            "anger": round(random.uniform(10, 25), 1),
            "fear": round(random.uniform(5, 20), 1),
            "surprise": round(random.uniform(10, 25), 1)
        }
        
        # Normalize emotion percentages to ensure they sum to 100%
        total = sum(emotions.values())
        for emotion in emotions:
            emotions[emotion] = round((emotions[emotion] / total) * 100, 1)
        
        return {
            "time_labels": time_labels,
            "reddit_trend": reddit_trend,
            "youtube_trend": youtube_trend,
            "emotions": emotions
        }
        
    except Exception as e:
        logger.error(f"Error generating sentiment trends: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate sentiment trends")

# Helper functions
def classify_confidence(score: float) -> str:
    """Classify the confidence level based on score"""
    if score >= 0.8:
        return "high"
    elif score >= 0.6:
        return "medium"
    elif score >= 0.4:
        return "low"
    return "very_low"

def normalize_stats(stats: Dict[str, int], total: int) -> Dict[str, float]:
    """Convert counts to percentages"""
    if total == 0:
        return {k: 0.0 for k in stats.keys()}
    return {k: round((v / total) * 100, 1) for k, v in stats.items()}

def calculate_percentages(stats: Counter) -> Dict[str, float]:
    """Calculate percentages for platform statistics"""
    result = {}
    total_comments = stats["total_comments"]
    
    if total_comments == 0:
        return {k: 0.0 for k in stats.keys()}
    
    for key, value in stats.items():
        if key.startswith("sentiment_") or key.startswith("emotion_"):
            result[key] = round((value / total_comments) * 100, 1)
        else:
            result[key] = value
    
    return result

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up sentiment analysis API")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down sentiment analysis API")

@app.route('/analyze-sentiment', methods=['POST'])
def analyze_sentiment():
    try:
        data = request.get_json()
        keyword = data.get('keyword')
        
        if not keyword:
            return jsonify({'error': 'Keyword is required'}), 400

        # Use the filter-comments function to analyze sentiment
        results = filter_comments(keyword)
        
        # Calculate sentiment percentages
        total_comments = len(results)
        if total_comments == 0:
            return jsonify({
                'positive': 0,
                'negative': 0,
                'neutral': 0,
                'comments': []
            })
        
        # Count sentiments
        sentiment_counts = {
            'positive': sum(1 for c in results if c['sentiment'] == 'positive'),
            'negative': sum(1 for c in results if c['sentiment'] == 'negative'),
            'neutral': sum(1 for c in results if c['sentiment'] == 'neutral')
        }
        
        # Calculate percentages
        sentiment_percentages = {
            'positive': round((sentiment_counts['positive'] / total_comments) * 100, 1),
            'negative': round((sentiment_counts['negative'] / total_comments) * 100, 1),
            'neutral': round((sentiment_counts['neutral'] / total_comments) * 100, 1)
        }
        
        # Return sentiment analysis results with sample comments
        return jsonify({
            'positive': sentiment_percentages['positive'],
            'negative': sentiment_percentages['negative'],
            'neutral': sentiment_percentages['neutral'],
            'comments': results[:5]  # Return top 5 comments as examples
        })
        
    except Exception as e:
        logger.error(f"Error analyzing sentiment: {str(e)}")
        return jsonify({'error': str(e)}), 500