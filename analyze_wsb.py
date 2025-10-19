from scraper import fetch_wsb_posts
from sentiment_simple import run_sentiment

if __name__ == "__main__":
    print("Fetching fresh posts from r/wallstreetbets...")
    fetch_wsb_posts(limit=50)

    print("\nRunning sentiment analysis...")
    run_sentiment()

    print("\nDone! Check 'posts.json' and 'sentiment_results.json'.")