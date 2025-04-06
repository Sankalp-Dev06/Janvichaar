from googleapiclient.discovery import build
import os
import random
from dotenv import load_dotenv

load_dotenv()
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

def get_youtube_comments(video_url, max_comments=200):
    video_id = video_url.split("v=")[-1].split("&")[0]
    youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

    comments = []
    next_page_token = None

    while len(comments) < max_comments:
        request = youtube.commentThreads().list(
            part="snippet",
            videoId=video_id,
            maxResults=100,
            pageToken=next_page_token
        )
        response = request.execute()

        for item in response["items"]:
            comment = item["snippet"]["topLevelComment"]["snippet"]["textDisplay"]
            comments.append(comment)

        next_page_token = response.get("nextPageToken")
        if not next_page_token:
            break

    # Randomly sample up to 200 comments
    return random.sample(comments, min(max_comments, len(comments)))
