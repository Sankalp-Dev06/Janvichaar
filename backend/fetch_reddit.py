# fetch_reddit.py
import praw
import random  # Add this import
from prawcore import PrawcoreException
import os
from dotenv import load_dotenv

load_dotenv()

reddit = praw.Reddit(
    client_id=os.getenv("REDDIT_CLIENT_ID"),
    client_secret=os.getenv("REDDIT_SECRET"),
    user_agent=os.getenv("REDDIT_USER_AGENT")
)
def get_reddit_comments(post_url, max_comments=200):
    try:
        submission = reddit.submission(url=post_url)
        submission.comments.replace_more(limit=0)  # Avoid nested comments
        
        # Collect all valid comments
        all_comments = [comment.body for comment in submission.comments.list() if comment.body]
        
        # Shuffle comments to randomize
        random.shuffle(all_comments)
        
        # Return up to 200 comments (or all if fewer exist)
        return all_comments[:max_comments]
    
    except PrawcoreException as e:
        print(f"Reddit API Error: {str(e)}")
        return []
    except Exception as e:
        print(f"Unexpected Error: {str(e)}")
        return []