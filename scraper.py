# scraper.py
import os, json, time, random
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
import praw
import prawcore

load_dotenv()

def make_client():
    reddit = praw.Reddit(
        client_id=os.getenv("REDDIT_CLIENT_ID"),
        client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
        user_agent=os.getenv("REDDIT_USER_AGENT"),
        check_for_async=False,
    )
    reddit.read_only = True
    return reddit

def fetch_wsb_posts(limit=1000, only_dd=False, comments_per_post=0, source="new"):
    """
    Fetch up to `limit` posts from r/wallstreetbets.
    - only_dd: keep only posts whose flair contains 'dd' (case-insensitive)
    - comments_per_post=0 initially to reduce rate pressure while debugging
    - source: 'new' | 'hot' | 'top'
    """
    reddit = make_client()
    sr = reddit.subreddit("wallstreetbets")

    # pick a listing source
    if source == "hot":
        listing = sr.hot(limit=limit * 10)
    elif source == "top":
        listing = sr.top("day", limit=limit * 10)
    else:
        listing = sr.new(limit=limit * 10)

    kept, skipped = [], {"stickied": 0, "flair": 0, "empty": 0}

    for submission in listing:
        time.sleep(1.5 + random.random())  # polite pacing 1.5–2.5s

        if getattr(submission, "stickied", False):
            skipped["stickied"] += 1
            continue

        flair = (submission.link_flair_text or "").strip()
        if only_dd and ("dd" not in flair.lower()):
            skipped["flair"] += 1
            continue

        # comments off for now to avoid rate issues while counting posts
        top_comments = []
        if comments_per_post > 0:
            try:
                submission.comments.replace_more(limit=0)
                top_comments = [
                    c.body for c in submission.comments[:comments_per_post]
                    if getattr(c, "body", None)
                ]
            except prawcore.exceptions.ResponseException:
                # If rate-limited on comments, just skip comments gracefully
                top_comments = []

        # Build text. If body/comments are empty, keep TITLE-ONLY so we don't lose the post.
        parts = [submission.title or "", submission.selftext or "", *top_comments]
        text = " ".join(p for p in parts if p).strip()

        if not text:
            # fallback to title only (as a last resort)
            title = (submission.title or "").strip()
            if not title:
                skipped["empty"] += 1
                continue
            text = title

        kept.append({
            "id": submission.id,
            "title": submission.title or "",
            "flair": flair,
            "text": text,
            "permalink": f"https://www.reddit.com{submission.permalink}",
            "score": submission.score,
            "num_comments": submission.num_comments,
        })

        if len(kept) >= limit:
            break

    # Save with a timestamped filename so you can inspect it
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    out = Path(f"posts_{ts}.json")
    out.write_text(json.dumps(kept, indent=2, ensure_ascii=False), encoding="utf-8")

    # Also refresh the canonical posts.json pointer for your sentiment script
    Path("posts.json").write_text(json.dumps(kept, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"Saved {len(kept)} posts -> {out.resolve()}")
    print(f"   Skipped: {skipped}")
    return kept
