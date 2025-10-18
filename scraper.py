import os
import json
from pathlib import Path
from dotenv import load_dotenv
import praw

# Load Reddit credentials from .env file
load_dotenv()

def make_client():
    """Create and return a Reddit client using PRAW."""
    return praw.Reddit(
        client_id=os.getenv("REDDIT_CLIENT_ID"),
        client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
        user_agent=os.getenv("REDDIT_USER_AGENT")
    )

def fetch_wsb_posts(limit=10, comments_per_post=2):
    reddit = make_client()
    subreddit = reddit.subreddit("wallstreetbets")
    posts = []

    for submission in subreddit.hot(limit=limit * 2):
        if submission.stickied:
            continue

        # Fetch some top-level comments
        submission.comments.replace_more(limit=0)
        top_comments = [
            c.body for c in submission.comments[:comments_per_post]
            if getattr(c, "body", None)
        ]

        # Combine title, selftext, and top comments
        text = " ".join(filter(None, [submission.title, submission.selftext, *top_comments]))

        if text.strip():
            posts.append({
                "id": submission.id,
                "title": submission.title,
                "text": text,
                "permalink": f"https://reddit.com{submission.permalink}",
                "score": submission.score,
                "num_comments": submission.num_comments
            })

        if len(posts) >= limit:
            break

    # Save posts to JSON
    out_path = Path("posts.json")
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(posts, f, indent=2, ensure_ascii=False)

    print(f"✅ Saved {len(posts)} posts to {out_path.resolve()}")
    return posts

if __name__ == "__main__":
    fetch_wsb_posts(limit=8)
