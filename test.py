from dotenv import load_dotenv; load_dotenv()
import os
print("ID:", os.getenv("REDDIT_CLIENT_ID"))
print("Secret (len):", len(os.getenv("REDDIT_CLIENT_SECRET") or ""))
print("UA:", os.getenv("REDDIT_USER_AGENT"))
