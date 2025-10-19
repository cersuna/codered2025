from dotenv import load_dotenv
import praw
import os

# Load environment variables from .env
load_dotenv()

# Print to confirm they loaded
print("CLIENT_ID:", os.getenv("REDDIT_CLIENT_ID"))
print("SECRET LEN:", len(os.getenv("REDDIT_CLIENT_SECRET") or ""))
print("USER_AGENT:", os.getenv("REDDIT_USER_AGENT"))

# Create Reddit client
reddit = praw.Reddit(
    client_id=os.getenv("REDDIT_CLIENT_ID"),
    client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
    user_agent=os.getenv("REDDIT_USER_AGENT"),
    check_for_async=False,
)
reddit.read_only = True

# Test call
print("\nFetching a single subreddit title...")
sub = reddit.subreddit("wallstreetbets")
print("✅ Connected! Subreddit title:", sub.title)

print("\nFetching a few latest posts...")
for submission in sub.new(limit=3):
    print("-", submission.title)

#test
