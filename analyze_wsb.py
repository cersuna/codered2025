from scraper import fetch_wsb_posts
from sentiment import run_sentiment

if __name__ == "__main__":
    print("🔹 Fetching fresh posts from r/wallstreetbets...")
    fetch_wsb_posts(limit=50)

    print("\n🔹 Running sentiment analysis...")
    run_sentiment()

    print("\n✅ Done! Check 'posts.json' and 'sentiment_results.json'.")