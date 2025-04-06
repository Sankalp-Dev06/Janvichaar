from transformers import pipeline, AutoModelForSequenceClassification, AutoTokenizer

# Initialize models with explicit model and tokenizer loading
sentiment_model = AutoModelForSequenceClassification.from_pretrained(
    "nlptown/bert-base-multilingual-uncased-sentiment"
)
sentiment_tokenizer = AutoTokenizer.from_pretrained(
    "nlptown/bert-base-multilingual-uncased-sentiment"
)

emotion_model = AutoModelForSequenceClassification.from_pretrained(
    "j-hartmann/emotion-english-distilroberta-base"
)
emotion_tokenizer = AutoTokenizer.from_pretrained(
    "j-hartmann/emotion-english-distilroberta-base"
)

# Create pipelines with explicitly loaded components
sentiment_pipeline = pipeline(
    task="text-classification",
    model=sentiment_model,
    tokenizer=sentiment_tokenizer
)

emotion_pipeline = pipeline(
    task="text-classification",
    model=emotion_model,
    tokenizer=emotion_tokenizer
)

# Rest of your code remains the same...
# Label mappings
sentiment_map = {
    "1 star": "Negative",
    "2 stars": "Negative",
    "3 stars": "Neutral",
    "4 stars": "Positive",
    "5 stars": "Positive"
}

emotion_map = {
    "anger": "Anger",
    "disgust": "Disgust",
    "fear": "Fear",
    "joy": "Joy",
    "neutral": "Neutral",
    "sadness": "Sadness",
    "surprise": "Surprise"
}

# Custom override rules
EMOTION_OVERRIDES = {
    ":(": "sadness",
    "💢": "anger",
    "😡": "anger",
    "😍": "joy",
    "💔": "sadness",
    "crao": "anger",  # Common typo handling
    "crap": "anger",
    "blikn": "anger"  # Typo for "blink"
}

SENTIMENT_KEYWORDS = {
    "positive": ["recommend", "love", "best", "helping", "awesome", "great"],
    "negative": ["crao", "blikn", "fearmongering", "hot garbage", "sucks", "worst"],
    "neutral": ["maybe", "perhaps", "consider", "possibly"]
}

def analyze_comments(comments: list):
    results = []
    categorized = {
        'sentiment': {'positive': [], 'negative': [], 'neutral': []},
        'emotion': {e.lower(): [] for e in emotion_map.values()}
    }
    
    for text in comments:
        text = text.strip()
        text_lower = text.lower()
        
        # ===== Sentiment Analysis =====
        sentiment = sentiment_pipeline(text)[0]
        sentiment_score = sentiment['score']
        base_sentiment = sentiment_map.get(sentiment['label'], "Neutral")
        
        # Apply confidence threshold (0.4 minimum)
        if sentiment_score < 0.4:
            final_sentiment = "Neutral"
        else:
            final_sentiment = base_sentiment
        
        # Keyword override
        for sentiment_type, keywords in SENTIMENT_KEYWORDS.items():
            if any(kw in text_lower for kw in keywords):
                final_sentiment = sentiment_type.capitalize()
                break
        
        # ===== Emotion Detection =====
        emotion = emotion_pipeline(text)[0]
        base_emotion = emotion_map.get(emotion['label'], "Neutral")
        emotion_score = emotion['score']
        
        # Emoji/keyword override
        final_emotion = base_emotion
        for key, emotion in EMOTION_OVERRIDES.items():
            if key in text_lower or key in text:
                final_emotion = emotion.capitalize()
                break
        
        # Confidence threshold for emotion
        if emotion_score < 0.5:
            final_emotion = "Neutral"
        
        # ===== Build Result =====
        result = {
            "text": text,
            "sentiment": {
                "label": final_sentiment,
                "score": round(sentiment_score, 4),
                "original_label": base_sentiment  # For debugging
            },
            "emotion": {
                "label": final_emotion,
                "score": round(emotion_score, 4),
                "original_label": base_emotion  # For debugging
            }
        }
        
        results.append(result)
        
        # Categorize for filtering
        categorized['sentiment'][final_sentiment.lower()].append(result)
        categorized['emotion'][final_emotion.lower()].append(result)
    
    return results, categorized