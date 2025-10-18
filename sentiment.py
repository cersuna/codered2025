import json
import spacy
from nltk.sentiment import SentimentIntensityAnalyzer
from nltk.corpus import stopwords
import nltk
import emoji as emoji_lib
import re

# Ensure VADER + stopwords are available
nltk.download("vader_lexicon", quiet=True)
nltk.download("stopwords", quiet=True)

# --- Helper: simple ticker extractor ---
import re

# Prefer cashtags, but also allow plain symbols if they are whitelisted
CASH_TAG = re.compile(r'(?<!\w)\$([A-Z]{1,5})(?![A-Za-z])')
PLAIN_TICKER = re.compile(r'(?<![\w\./])([A-Z]{1,5})(?![\w\./])')  # tighter boundaries, avoids URLs and paths

# Minimal demo whitelist — add more as you need
WHITELIST = {
    "HIMS","AAPL","TSLA","NVDA","AMD","GME","MSFT","AMZN","META","PLTR","SPY","QQQ",
    "INTC","NFLX","SOFI","RIVN","COIN","SHOP","BABA","SNAP","UBER","LYFT","AVGO",
}

# Strong stoplist of English words and common noise seen on WSB
STOPLIST = {
    "A","AN","AND","ARE","AS","ALL","ALSO","AFTER","AGO","AGAIN","BE","BEST","BIG","BIT","BUT","BY","CALL","CALLS",
    "CEO","COM","COULD","COVER","DD","DAYS","DO","DON","DROP","DRUG","ETC","FIRST","FOR","FROM","GET","GG","GOOD",
    "HI","HTTPS","IN","INTO","ITS","JOIN","JUST","LET","LOSS","LOWER","ME","MID","MIGHT","NEWS","NEXT","OF","ON",
    "OTHER","OVER","PLAY","POINT","PRE","PUSH","RE","RUN","SEE","SEEMS","SEEN","SELF","SELL","SHORT","STOCK",
    "TAKE","TEST","THEN","THINK","THIS","TO","TODAY","TOTAL","TWO","UP","USER","WAS","WE","WEEKS","WHICH","WILL",
    "WITH","WSB","WWW","YEARS","YOU","YOUR",
}

def _is_urlish(text: str, start: int) -> bool:
    # quick check: if the match is part of http(s):// or www.
    prefix = text[max(0, start-8):start].lower()
    return ("http" in prefix) or ("www." in prefix) or ("://" in prefix)

def extract_tickers(text: str):
    """
    Priority:
      1) Cashtags like $HIMS → always accept (strip $).
      2) Plain tokens (HIMS) → accept only if in WHITELIST.
    Filters:
      - Drop STOPLIST words.
      - Ignore matches inside URLs/paths.
    """
    found = []
    seen = set()

    # 1) cashtags (most reliable)
    for m in CASH_TAG.finditer(text):
        sym = m.group(1).upper()
        if sym not in STOPLIST and not _is_urlish(text, m.start()):
            if sym not in seen:
                seen.add(sym); found.append(sym)

    # 2) plain tickers (whitelist-gated)
    for m in PLAIN_TICKER.finditer(text):
        sym = m.group(1).upper()
        if sym in seen:  # already added as cashtag
            continue
        if sym in WHITELIST and sym not in STOPLIST and not _is_urlish(text, m.start()):
            seen.add(sym); found.append(sym)

    return found

# --- Sentiment model class ---
class BasicSentiment:
    """Simple VADER + spaCy sentiment analysis class."""

    def __init__(self):
        self.nlp = spacy.load("en_core_web_sm", disable=["ner", "parser"])
        self.vader = SentimentIntensityAnalyzer()
        self.stops = set(stopwords.words("english"))

    def analyze(self, text: str):
        # Tokenize and clean
        doc = self.nlp(text)
        lemmas = [t.lemma_.lower() for t in doc if not t.is_stop and not t.is_punct]
        emoji_count = emoji_lib.demojize(text).count(":") // 2
        caps_ratio = sum(1 for t in text.split() if len(t) > 2 and t.isupper()) / max(len(text.split()), 1)

        # VADER sentiment
        scores = self.vader.polarity_scores(text)
        compound = scores["compound"]

        if compound > 0.05:
            label = "bullish"
        elif compound < -0.05:
            label = "bearish"
        else:
            label = "neutral"

        tickers = extract_tickers(text)

        return {
            "label": label,
            "compound": round(compound, 4),
            "pos": scores["pos"],
            "neu": scores["neu"],
            "neg": scores["neg"],
            "tickers": tickers,
            "features": {
                "emoji_count": emoji_count,
                "caps_ratio": round(caps_ratio, 3),
                "len_tokens": len(lemmas)
            }
        }

# --- Run sentiment analysis on scraped posts ---
def run_sentiment():
    """Read posts.json → analyze → save sentiment_results.json."""
    with open("posts.json", "r", encoding="utf-8") as f:
        posts = json.load(f)

    model = BasicSentiment()
    results = []

    for post in posts:
        res = model.analyze(post["text"])
        res["id"] = post["id"]
        res["title"] = post["title"]
        res["permalink"] = post["permalink"]
        results.append(res)
        print(f"{post['title'][:60]}... → {res['label']} ({res['compound']}) | Tickers: {res['tickers']}")

    with open("sentiment_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print("✅ Sentiment results saved to sentiment_results.json")

if __name__ == "__main__":
    run_sentiment()
