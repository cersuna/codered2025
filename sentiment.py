import json
import spacy
from nltk.sentiment import SentimentIntensityAnalyzer
from nltk.corpus import stopwords
import nltk
import emoji as emoji_lib

# Ensure VADER + stopwords are available
nltk.download("vader_lexicon", quiet=True)
nltk.download("stopwords", quiet=True)

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

        return {
            "label": label,
            "compound": round(compound, 4),
            "pos": scores["pos"],
            "neu": scores["neu"],
            "neg": scores["neg"],
            "features": {
                "emoji_count": emoji_count,
                "caps_ratio": round(caps_ratio, 3),
                "len_tokens": len(lemmas)
            }
        }

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
        print(f"{post['title'][:60]}... → {res['label']} ({res['compound']})")

    with open("sentiment_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print("✅ Sentiment results saved to sentiment_results.json")

if __name__ == "__main__":
    run_sentiment()
